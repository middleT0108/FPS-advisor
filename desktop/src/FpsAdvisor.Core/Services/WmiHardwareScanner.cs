using System;
using System.Diagnostics;
using System.Management;
using System.Runtime.InteropServices;
using Microsoft.Win32;
using FpsAdvisor.Core.Models;

namespace FpsAdvisor.Core.Services;

public class WmiHardwareScanner
{
    [DllImport("user32.dll")]
    private static extern int GetSystemMetrics(int nIndex);

    [DllImport("user32.dll")]
    private static extern bool EnumDisplaySettings(string? deviceName, int modeNum, ref DEVMODE devMode);

    [StructLayout(LayoutKind.Sequential)]
    private struct DEVMODE
    {
        private const int CCHDEVICENAME = 32;
        private const int CCHFORMNAME = 32;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = CCHDEVICENAME)]
        public string dmDeviceName;
        public short dmSpecVersion;
        public short dmDriverVersion;
        public short dmSize;
        public short dmDriverExtra;
        public int dmFields;
        public int dmPositionX;
        public int dmPositionY;
        public int dmDisplayOrientation;
        public int dmDisplayFixedOutput;
        public short dmColor;
        public short dmDuplex;
        public short dmYResolution;
        public short dmTTOption;
        public short dmCollate;
        [MarshalAs(UnmanagedType.ByValTStr, SizeConst = CCHFORMNAME)]
        public string dmFormName;
        public short dmLogPixels;
        public int dmBitsPerPel;
        public int dmPelsWidth;
        public int dmPelsHeight;
        public int dmDisplayFlags;
        public int dmDisplayFrequency;
    }

    public HardwareProfile ScanCompleteHardware()
    {
        var profile = new HardwareProfile
        {
            Cpu = ScanCpu(),
            Gpu = ScanGpu(),
            Ram = ScanRam(),
            Storage = ScanStorage(),
            Display = ScanDisplay(),
            Os = ScanOs()
        };

        return profile;
    }

    private CpuInfo ScanCpu()
    {
        var cpu = new CpuInfo();
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Name, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed, L3CacheSize FROM Win32_Processor");
            foreach (var obj in searcher.Get())
            {
                cpu.Name = obj["Name"]?.ToString()?.Trim() ?? cpu.Name;
                if (int.TryParse(obj["NumberOfCores"]?.ToString(), out int cores))
                    cpu.Cores = cores;
                if (int.TryParse(obj["NumberOfLogicalProcessors"]?.ToString(), out int threads))
                    cpu.Threads = threads;
                if (int.TryParse(obj["MaxClockSpeed"]?.ToString(), out int clock))
                {
                    cpu.BoostClockMhz = clock;
                    cpu.BaseClockMhz = (int)(clock * 0.85); // Ước tính nếu không đọc được base clock
                }
                if (double.TryParse(obj["L3CacheSize"]?.ToString(), out double l3Kb))
                {
                    // L3CacheSize trong WMI thường trả về KB
                    cpu.CacheL3Mb = l3Kb > 0 ? Math.Round(l3Kb / 1024.0, 1) : 16.0;
                }
                break; // Thường chỉ có 1 CPU socket chính
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Lỗi quét CPU: {ex.Message}");
        }

        return cpu;
    }

    private GpuInfo ScanGpu()
    {
        var gpu = new GpuInfo();
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Name, AdapterRAM, DriverVersion FROM Win32_VideoController");
            long maxVram = -1;

            foreach (var obj in searcher.Get())
            {
                string name = obj["Name"]?.ToString()?.Trim() ?? "";
                if (string.IsNullOrEmpty(name)) continue;

                // Bỏ qua card ảo như Remote Desktop, Citrix, VirtualBox
                if (name.Contains("Virtual", StringComparison.OrdinalIgnoreCase) ||
                    name.Contains("Basic Display", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                long vramBytes = 0;
                if (obj["AdapterRAM"] != null && long.TryParse(obj["AdapterRAM"].ToString(), out long bytes))
                {
                    vramBytes = bytes;
                }

                // Ưu tiên card rời (NVIDIA / AMD) hoặc card có VRAM lớn nhất
                bool isDiscrete = name.Contains("NVIDIA", StringComparison.OrdinalIgnoreCase) ||
                                  name.Contains("GeForce", StringComparison.OrdinalIgnoreCase) ||
                                  name.Contains("Radeon", StringComparison.OrdinalIgnoreCase) ||
                                  name.Contains("Arc", StringComparison.OrdinalIgnoreCase);

                if (isDiscrete || vramBytes > maxVram)
                {
                    maxVram = vramBytes;
                    gpu.Name = name;
                    gpu.DriverVersion = obj["DriverVersion"]?.ToString() ?? "Standard";

                    if (name.Contains("NVIDIA", StringComparison.OrdinalIgnoreCase))
                        gpu.Vendor = "NVIDIA";
                    else if (name.Contains("AMD", StringComparison.OrdinalIgnoreCase) || name.Contains("Radeon", StringComparison.OrdinalIgnoreCase))
                        gpu.Vendor = "AMD";
                    else if (name.Contains("Intel", StringComparison.OrdinalIgnoreCase))
                        gpu.Vendor = "INTEL";

                    // Chuyển bytes sang MB (lưu ý AdapterRAM trong WMI đôi khi bị tràn số 32-bit cho card > 4GB)
                    int vramMb = (int)(vramBytes / (1024 * 1024));
                    if (vramMb <= 0)
                    {
                        // Fallback VRAM theo tên card phổ biến nếu WMI trả về số âm
                        if (name.Contains("3060", StringComparison.OrdinalIgnoreCase)) vramMb = 12288;
                        else if (name.Contains("4060", StringComparison.OrdinalIgnoreCase)) vramMb = 8192;
                        else if (name.Contains("3070", StringComparison.OrdinalIgnoreCase)) vramMb = 8192;
                        else if (name.Contains("3080", StringComparison.OrdinalIgnoreCase)) vramMb = 10240;
                        else if (name.Contains("4070", StringComparison.OrdinalIgnoreCase)) vramMb = 12288;
                        else if (name.Contains("4080", StringComparison.OrdinalIgnoreCase)) vramMb = 16384;
                        else if (name.Contains("4090", StringComparison.OrdinalIgnoreCase)) vramMb = 24576;
                        else vramMb = 4096;
                    }
                    gpu.VramMb = vramMb;
                }
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Lỗi quét GPU: {ex.Message}");
        }

        return gpu;
    }

    private RamInfo ScanRam()
    {
        var ram = new RamInfo();
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Capacity, Speed, DeviceLocator FROM Win32_PhysicalMemory");
            long totalBytes = 0;
            int maxSpeed = 0;
            int sticks = 0;

            foreach (var obj in searcher.Get())
            {
                if (long.TryParse(obj["Capacity"]?.ToString(), out long cap))
                {
                    totalBytes += cap;
                    sticks++;
                }

                if (int.TryParse(obj["Speed"]?.ToString(), out int speed) && speed > maxSpeed)
                {
                    maxSpeed = speed;
                }
            }

            ram.StickCount = sticks;
            ram.TotalGb = Math.Round(totalBytes / (1024.0 * 1024.0 * 1024.0), 1);
            ram.SpeedMhz = maxSpeed > 0 ? maxSpeed : 2666;
            ram.Channels = sticks >= 2 ? 2 : 1;

            // Kiểm tra XMP/EXPO: Nếu DDR4 chạy > 2666MHz hoặc DDR5 chạy > 4800MHz thì chắc chắn đã bật XMP
            if (ram.SpeedMhz >= 3000)
            {
                ram.XmpEnabled = true;
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Lỗi quét RAM: {ex.Message}");
        }

        return ram;
    }

    private StorageInfo ScanStorage()
    {
        var storage = new StorageInfo();
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Model, MediaType, InterfaceType, Size FROM Win32_DiskDrive");
            foreach (var obj in searcher.Get())
            {
                string model = obj["Model"]?.ToString() ?? "";
                string iface = obj["InterfaceType"]?.ToString() ?? "";
                string media = obj["MediaType"]?.ToString() ?? "";

                if (long.TryParse(obj["Size"]?.ToString(), out long sizeBytes))
                {
                    storage.SizeGb = sizeBytes / (1024 * 1024 * 1024);
                }

                storage.Model = model;

                if (model.Contains("NVMe", StringComparison.OrdinalIgnoreCase) ||
                    iface.Contains("NVMe", StringComparison.OrdinalIgnoreCase))
                {
                    storage.Type = "NVME_SSD";
                }
                else if (media.Contains("SSD", StringComparison.OrdinalIgnoreCase) ||
                         model.Contains("SSD", StringComparison.OrdinalIgnoreCase))
                {
                    storage.Type = "SATA_SSD";
                }
                else
                {
                    storage.Type = "HDD";
                }
                break; // Lấy ổ đĩa hệ thống đầu tiên
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Lỗi quét ổ cứng: {ex.Message}");
        }

        return storage;
    }

    private DisplayInfo ScanDisplay()
    {
        var display = new DisplayInfo();
        try
        {
            int width = GetSystemMetrics(0);  // SM_CXSCREEN
            int height = GetSystemMetrics(1); // SM_CYSCREEN
            display.Resolution = $"{width}x{height}";

            var devMode = new DEVMODE();
            devMode.dmSize = (short)Marshal.SizeOf(devMode);
            if (EnumDisplaySettings(null, -1, ref devMode)) // ENUM_CURRENT_SETTINGS
            {
                display.RefreshRate = devMode.dmDisplayFrequency;
            }
            if (display.RefreshRate <= 0) display.RefreshRate = 60;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Lỗi quét màn hình: {ex.Message}");
        }

        return display;
    }

    private OsInfo ScanOs()
    {
        var os = new OsInfo();
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Caption, Version FROM Win32_OperatingSystem");
            foreach (var obj in searcher.Get())
            {
                os.Name = obj["Caption"]?.ToString()?.Trim() ?? os.Name;
                os.Version = obj["Version"]?.ToString()?.Trim() ?? os.Version;
                break;
            }

            // Đọc Game Mode từ Registry
            using var gameBarKey = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\GameBar");
            if (gameBarKey != null)
            {
                var val = gameBarKey.GetValue("AutoGameModeEnabled");
                if (val is int intVal) os.GameModeEnabled = intVal == 1;
            }

            // Đọc HAGS (Hardware-Accelerated GPU Scheduling) từ Registry
            using var hagsKey = Registry.LocalMachine.OpenSubKey(@"SYSTEM\CurrentControlSet\Control\GraphicsDrivers");
            if (hagsKey != null)
            {
                var val = hagsKey.GetValue("HwSchMode");
                if (val is int hagsVal) os.HagsEnabled = hagsVal == 2;
            }

            // Đọc Power Plan hiện tại
            os.PowerPlan = DetectActivePowerPlan();
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Lỗi quét OS: {ex.Message}");
        }

        return os;
    }

    private string DetectActivePowerPlan()
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
                string output = proc.StandardOutput.ReadToEnd();
                proc.WaitForExit(1000);
                if (output.Contains("High performance", StringComparison.OrdinalIgnoreCase) ||
                    output.Contains("Hiệu năng cao", StringComparison.OrdinalIgnoreCase))
                {
                    return "High Performance";
                }
                if (output.Contains("Ultimate Performance", StringComparison.OrdinalIgnoreCase))
                {
                    return "Ultimate Performance";
                }
                if (output.Contains("Power saver", StringComparison.OrdinalIgnoreCase) ||
                    output.Contains("Tiết kiệm", StringComparison.OrdinalIgnoreCase))
                {
                    return "Power Saver";
                }
            }
        }
        catch { }
        return "Balanced";
    }
}
