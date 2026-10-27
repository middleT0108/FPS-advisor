using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using Microsoft.Win32;

namespace FpsAdvisor.Core.Optimizer;

public class HeavyProcessInfo
{
    public int Pid { get; set; }
    public string Name { get; set; } = string.Empty;
    public double MemoryMb { get; set; }
    public string Recommendation { get; set; } = string.Empty;
}

public class OptimizationBackupState
{
    public string PreviousPowerPlanGuid { get; set; } = string.Empty;
    public int PreviousGameModeState { get; set; } = 0;
    public bool PowerPlanModified { get; set; }
    public bool GameModeModified { get; set; }
}

public class SystemOptimizer
{
    private static readonly OptimizationBackupState _backup = new();

    public static OptimizationBackupState CurrentBackup => _backup;

    /// <summary>
    /// Liệt kê các ứng dụng nền đang chiếm nhiều RAM/CPU.
    /// TUYỆT ĐỐI KHÔNG TỰ ĐỘNG TẮT, chỉ gợi ý cho người dùng.
    /// </summary>
    public List<HeavyProcessInfo> DetectHeavyBackgroundProcesses()
    {
        var heavyList = new List<HeavyProcessInfo>();
        var candidates = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "chrome", "msedge", "firefox", "brave", "opera",
            "discord", "spotify", "steamwebhelper", "epicgameslauncher",
            "battle.net", "riotclientux", "onedrive", "dropbox"
        };

        try
        {
            var processes = Process.GetProcesses();
            foreach (var p in processes)
            {
                try
                {
                    if (candidates.Contains(p.ProcessName))
                    {
                        double memMb = p.WorkingSet64 / (1024.0 * 1024.0);
                        if (memMb > 150) // Trên 150MB
                        {
                            heavyList.Add(new HeavyProcessInfo
                            {
                                Pid = p.Id,
                                Name = p.ProcessName,
                                MemoryMb = Math.Round(memMb, 1),
                                Recommendation = "Chiếm nhiều RAM/CPU nền. Khuyên đóng trước khi vào trận."
                            });
                        }
                    }
                }
                catch { }
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Lỗi quét process: {ex.Message}");
        }

        return heavyList.OrderByDescending(p => p.MemoryMb).ToList();
    }

    /// <summary>
    /// Kích hoạt Windows Game Mode (Lưu trạng thái cũ để hoàn tác).
    /// </summary>
    public bool EnableGameMode(out string error)
    {
        error = string.Empty;
        try
        {
            using var key = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\GameBar");
            if (key != null)
            {
                var currentVal = key.GetValue("AutoGameModeEnabled");
                _backup.PreviousGameModeState = currentVal is int i ? i : 0;
                key.SetValue("AutoGameModeEnabled", 1, RegistryValueKind.DWord);
                _backup.GameModeModified = true;
                return true;
            }
        }
        catch (Exception ex)
        {
            error = ex.Message;
        }
        return false;
    }

    /// <summary>
    /// Hoàn tác cài đặt Windows Game Mode về trạng thái ban đầu.
    /// </summary>
    public bool UndoGameMode(out string error)
    {
        error = string.Empty;
        if (!_backup.GameModeModified) return true;

        try
        {
            using var key = Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\GameBar");
            if (key != null)
            {
                key.SetValue("AutoGameModeEnabled", _backup.PreviousGameModeState, RegistryValueKind.DWord);
                _backup.GameModeModified = false;
                return true;
            }
        }
        catch (Exception ex)
        {
            error = ex.Message;
        }
        return false;
    }

    /// <summary>
    /// Chuyển Power Plan sang High Performance (GUID: 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c).
    /// </summary>
    public bool SetHighPerformancePowerPlan(out string error)
    {
        error = string.Empty;
        try
        {
            // 1. Sao lưu active power plan hiện tại
            string currentScheme = GetActivePowerPlanGuid();
            if (!string.IsNullOrEmpty(currentScheme))
            {
                _backup.PreviousPowerPlanGuid = currentScheme;
            }

            // 2. Kích hoạt High Performance (8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c)
            var psi = new ProcessStartInfo
            {
                FileName = "powercfg",
                Arguments = "/setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c",
                UseShellExecute = false,
                CreateNoWindow = true
            };
            using var proc = Process.Start(psi);
            proc?.WaitForExit(2000);

            _backup.PowerPlanModified = true;
            return true;
        }
        catch (Exception ex)
        {
            error = ex.Message;
            return false;
        }
    }

    /// <summary>
    /// Hoàn tác khôi phục Power Plan về chế độ trước đó.
    /// </summary>
    public bool UndoPowerPlan(out string error)
    {
        error = string.Empty;
        if (!_backup.PowerPlanModified || string.IsNullOrEmpty(_backup.PreviousPowerPlanGuid))
        {
            return true;
        }

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "powercfg",
                Arguments = $"/setactive {_backup.PreviousPowerPlanGuid}",
                UseShellExecute = false,
                CreateNoWindow = true
            };
            using var proc = Process.Start(psi);
            proc?.WaitForExit(2000);

            _backup.PowerPlanModified = false;
            return true;
        }
        catch (Exception ex)
        {
            error = ex.Message;
            return false;
        }
    }

    private string GetActivePowerPlanGuid()
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "powercfg",
                Arguments = "/getactivescheme",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            using var proc = Process.Start(psi);
            if (proc != null)
            {
                string text = proc.StandardOutput.ReadToEnd();
                proc.WaitForExit(1000);
                // Định dạng output: "Power Scheme GUID: 381b4222-f694-41f0-9685-ff5bb260df2e  (Balanced)"
                var match = System.Text.RegularExpressions.Regex.Match(text, @"[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}");
                if (match.Success)
                {
                    return match.Value;
                }
            }
        }
        catch { }
        return "381b4222-f694-41f0-9685-ff5bb260df2e"; // Balanced GUID fallback
    }
}
