using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using Microsoft.Win32;
using FpsAdvisor.Core.Benchmark;
using FpsAdvisor.Core.Models;
using FpsAdvisor.Core.Monitor;
using FpsAdvisor.Core.Optimizer;
using FpsAdvisor.Core.Services;

namespace FpsAdvisor.Desktop;

public partial class MainWindow : Window
{
    private readonly WmiHardwareScanner _scanner = new();
    private readonly SyntheticBenchmarkRunner _benchmarkRunner = new();
    private readonly PresentMonTracker _fpsTracker = new();
    private readonly SystemOptimizer _optimizer = new();
    private readonly ApiSyncService _syncService = new();

    private HardwareProfile? _currentProfile;
    private BenchmarkResult? _currentBenchmark;
    private readonly List<PresentMonRecord> _actualFpsRecords = new();

    private CancellationTokenSource? _benchCts;
    private CancellationTokenSource? _fpsCts;

    public MainWindow()
    {
        InitializeComponent();
        Loaded += MainWindow_Loaded;
    }

    private void MainWindow_Loaded(object sender, RoutedEventArgs e)
    {
        LoadAppConfig();
        PerformHardwareScan();
        RefreshBackgroundApps();
    }

    private void LoadAppConfig()
    {
        try
        {
            string configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "appsettings.json");
            if (File.Exists(configPath))
            {
                string json = File.ReadAllText(configPath);
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("ApiBaseUrl", out var urlProp))
                {
                    TxtServerUrl.Text = urlProp.GetString() ?? "http://localhost:3000";
                }
            }
        }
        catch { }
    }

    private void PerformHardwareScan()
    {
        TxtBottomStatus.Text = "Đang quét cấu hình hệ thống...";
        try
        {
            _currentProfile = _scanner.ScanCompleteHardware();

            // Hiển thị CPU
            TxtCpuName.Text = _currentProfile.Cpu.Name;
            TxtCpuDetails.Text = $"{_currentProfile.Cpu.Cores} Nhân / {_currentProfile.Cpu.Threads} Luồng • Boost: {_currentProfile.Cpu.BoostClockMhz} MHz • L3: {_currentProfile.Cpu.CacheL3Mb} MB";

            // Hiển thị GPU
            TxtGpuName.Text = _currentProfile.Gpu.Name;
            TxtGpuDetails.Text = $"VRAM: {(_currentProfile.Gpu.VramMb / 1024.0):F1} GB • Driver: {_currentProfile.Gpu.DriverVersion} • Hãng: {_currentProfile.Gpu.Vendor}";

            // Hiển thị RAM
            TxtRamTotal.Text = $"{_currentProfile.Ram.TotalGb} GB @ {_currentProfile.Ram.SpeedMhz} MHz";
            string channelText = _currentProfile.Ram.Channels == 2 ? "Dual Channel (Tốt)" : "Single Channel (Cần nâng)";
            string xmpText = _currentProfile.Ram.XmpEnabled ? "XMP/EXPO Bật" : "XMP/EXPO Tắt";
            TxtRamDetails.Text = $"{channelText} • {xmpText} ({_currentProfile.Ram.StickCount} thanh)";

            // Hiển thị Storage
            TxtDiskModel.Text = _currentProfile.Storage.Model;
            TxtDiskType.Text = $"Loại ổ: {_currentProfile.Storage.Type} • Dung lượng: {_currentProfile.Storage.SizeGb} GB";

            // Hiển thị Màn hình
            TxtDisplayRes.Text = _currentProfile.Display.Resolution;
            TxtDisplayRefresh.Text = $"Tần số quét: {_currentProfile.Display.RefreshRate} Hz";

            // Hiển thị Windows
            TxtOsName.Text = _currentProfile.Os.Name;
            TxtOsSettings.Text = $"Power: {_currentProfile.Os.PowerPlan} • Game Mode: {(_currentProfile.Os.GameModeEnabled ? "Bật" : "Tắt")} • HAGS: {(_currentProfile.Os.HagsEnabled ? "Bật" : "Tắt")}";

            TxtBottomStatus.Text = "Quét thông số phần cứng hoàn tất thành công.";
        }
        catch (Exception ex)
        {
            TxtBottomStatus.Text = $"Lỗi khi quét phần cứng: {ex.Message}";
        }
    }

    private void RefreshBackgroundApps()
    {
        try
        {
            var heavy = _optimizer.DetectHeavyBackgroundProcesses();
            ListHeavyProcesses.ItemsSource = heavy;
        }
        catch { }
    }

    private void BtnRescan_Click(object sender, RoutedEventArgs e)
    {
        PerformHardwareScan();
        RefreshBackgroundApps();
    }

    #region Benchmark Logic
    private async void BtnStartBenchmark_Click(object sender, RoutedEventArgs e)
    {
        BtnStartBenchmark.IsEnabled = false;
        BtnCancelBenchmark.IsEnabled = true;
        PbBenchmark.Value = 0;
        BorderBenchResults.Visibility = Visibility.Collapsed;
        _benchCts = new CancellationTokenSource();

        var progress = new Progress<BenchmarkProgress>(p =>
        {
            PbBenchmark.Value = p.Percent;
            TxtBenchStage.Text = $"[{p.Percent}%] {p.CurrentStage}";
            if (p.CpuTemp > 0) TxtLiveCpuTemp.Text = $"{p.CpuTemp:F1} °C";
            if (p.GpuTemp > 0) TxtLiveGpuTemp.Text = $"{p.GpuTemp:F1} °C";
            if (p.CpuLoad > 0) TxtLiveCpuLoad.Text = $"{p.CpuLoad:F0} %";
            if (p.GpuLoad > 0) TxtLiveGpuLoad.Text = $"{p.GpuLoad:F0} %";
        });

        try
        {
            TxtBottomStatus.Text = "Đang chạy bài kiểm tra Benchmark tổng hợp...";
            _currentBenchmark = await _benchmarkRunner.RunBenchmarkAsync(progress, _benchCts.Token);

            // Cập nhật kết quả lên UI
            TxtResCpuSingle.Text = _currentBenchmark.CpuSingleScore.ToString();
            TxtResCpuMulti.Text = _currentBenchmark.CpuMultiScore.ToString();
            TxtResGpu.Text = _currentBenchmark.GpuScore.ToString();
            TxtResRam.Text = $"{(_currentBenchmark.RamBandwidthMbPerSec / 1024.0):F1} GB/s";
            TxtResMaxCpuTemp.Text = $"{_currentBenchmark.MaxCpuTempC:F1} °C";

            string bText = _currentBenchmark.BottleneckRatio < 0.88
                ? "Nghẽn CPU (CPU-Bound)"
                : _currentBenchmark.BottleneckRatio > 1.15
                ? "Nghẽn GPU (GPU-Bound)"
                : "Cân bằng tối ưu";
            TxtResBottleneck.Text = $"{bText} (Ratio: {_currentBenchmark.BottleneckRatio:F2})";

            BorderBenchResults.Visibility = Visibility.Visible;
            TxtBottomStatus.Text = "Benchmark hoàn tất thành công!";
        }
        catch (OperationCanceledException)
        {
            TxtBenchStage.Text = "Đã hủy bỏ benchmark theo yêu cầu của bạn.";
            TxtBottomStatus.Text = "Benchmark đã bị hủy.";
        }
        catch (Exception ex)
        {
            TxtBenchStage.Text = $"Lỗi: {ex.Message}";
            TxtBottomStatus.Text = $"Lỗi trong quá trình benchmark: {ex.Message}";
        }
        finally
        {
            BtnStartBenchmark.IsEnabled = true;
            BtnCancelBenchmark.IsEnabled = false;
            _benchCts?.Dispose();
            _benchCts = null;
        }
    }

    private void BtnCancelBenchmark_Click(object sender, RoutedEventArgs e)
    {
        _benchCts?.Cancel();
    }
    #endregion

    #region Safe FPS Monitor Logic
    private async void BtnStartFpsMonitor_Click(object sender, RoutedEventArgs e)
    {
        if (BtnStartFpsMonitor.Content.ToString() == "Dừng ghi nhận FPS")
        {
            _fpsCts?.Cancel();
            return;
        }

        string gameKey = "valorant";
        string processName = "VALORANT-Win64-Shipping";

        if (CboGameList.SelectedItem is ComboBoxItem item)
        {
            gameKey = item.Tag?.ToString() ?? "valorant";
            processName = gameKey switch
            {
                "cs2" => "cs2",
                "league-of-legends" => "League of Legends",
                "delta-force" => "DeltaForceClient-Win64",
                _ => "VALORANT-Win64-Shipping"
            };
        }

        int duration = (int)SliderDuration.Value;
        _fpsCts = new CancellationTokenSource();

        BtnStartFpsMonitor.Content = "Dừng ghi nhận FPS";
        TxtFpsStatus.Text = $"Đang ghi nhận FPS cho tiến trình [{processName}] trong {duration} giây. Hãy chuyển sang game chơi bình thường...";

        var progress = new Progress<FpsLiveUpdate>(u =>
        {
            TxtLiveFps.Text = $"{u.CurrentFps:F0} FPS";
            TxtLiveAvgFps.Text = $"{u.AvgFps:F0} FPS";
            TxtLive1LowFps.Text = $"{u.Low1PercentFps:F0} FPS";
            TxtLiveFrametime.Text = $"{u.FrametimeMs:F1} ms";
            TxtFpsStatus.Text = $"Đã đo: {u.SecondsElapsed}/{duration}s • Frametime: {u.FrametimeMs:F1}ms";
        });

        try
        {
            var record = await _fpsTracker.TrackGameFpsAsync(gameKey, processName, duration, progress, _fpsCts.Token);
            _actualFpsRecords.RemoveAll(r => r.GameKey == gameKey);
            _actualFpsRecords.Add(record);

            TxtFpsStatus.Text = $"✓ Hoàn tất đo! Avg: {record.AvgFps:F0} FPS | 1% Low: {record.Low1PercentFps:F0} FPS | Frametime: {record.FrametimeMs}ms";
        }
        catch (OperationCanceledException)
        {
            TxtFpsStatus.Text = "Đã dừng phiên đo FPS.";
        }
        catch (Exception ex)
        {
            TxtFpsStatus.Text = $"Lỗi đo FPS: {ex.Message}";
        }
        finally
        {
            BtnStartFpsMonitor.Content = "Bắt đầu ghi nhận FPS";
            _fpsCts?.Dispose();
            _fpsCts = null;
        }
    }
    #endregion

    #region Optimization & Undo
    private void BtnApplyOptimizations_Click(object sender, RoutedEventArgs e)
    {
        var result = MessageBox.Show(
            "Bạn có xác nhận thực hiện các tối ưu sau?\n\n" +
            "1. Kích hoạt Windows Game Mode (Ưu tiên luồng CPU/GPU cho game)\n" +
            "2. Chuyển Windows Power Plan sang High Performance\n\n" +
            "Bạn có thể bấm nút 'Hoàn tác / Khôi phục ban đầu' bất cứ lúc nào.",
            "Xác nhận thay đổi hệ thống",
            MessageBoxButton.YesNo,
            MessageBoxImage.Question);

        if (result != MessageBoxResult.Yes) return;

        bool gmSuccess = true;
        bool ppSuccess = true;
        string err = "";

        if (ChkGameMode.IsChecked == true)
        {
            gmSuccess = _optimizer.EnableGameMode(out err);
        }
        if (ChkPowerPlan.IsChecked == true)
        {
            ppSuccess = _optimizer.SetHighPerformancePowerPlan(out err);
        }

        if (gmSuccess && ppSuccess)
        {
            BtnUndoOptimizations.IsEnabled = true;
            MessageBox.Show("Đã áp dụng các tối ưu hệ thống thành công!", "Thông báo", MessageBoxButton.OK, MessageBoxImage.Information);
            PerformHardwareScan();
        }
        else
        {
            MessageBox.Show($"Không thể áp dụng một số thiết lập: {err}", "Cảnh báo", MessageBoxButton.OK, MessageBoxImage.Warning);
        }
    }

    private void BtnUndoOptimizations_Click(object sender, RoutedEventArgs e)
    {
        bool gmUndo = _optimizer.UndoGameMode(out string err1);
        bool ppUndo = _optimizer.UndoPowerPlan(out string err2);

        if (gmUndo && ppUndo)
        {
            BtnUndoOptimizations.IsEnabled = false;
            MessageBox.Show("Đã hoàn tác toàn bộ thiết lập hệ thống về trạng thái ban đầu!", "Đã khôi phục", MessageBoxButton.OK, MessageBoxImage.Information);
            PerformHardwareScan();
        }
        else
        {
            MessageBox.Show($"Lỗi hoàn tác: {err1} {err2}", "Lỗi", MessageBoxButton.OK, MessageBoxImage.Error);
        }
    }
    #endregion

    #region Web Sync & Export
    private TelemetryPayload BuildPayload()
    {
        if (_currentProfile == null)
        {
            PerformHardwareScan();
        }

        return new TelemetryPayload
        {
            LinkCode = TxtLinkCode.Text.Trim().ToUpper(),
            ClientConsentGranted = ChkConsent.IsChecked == true,
            System = _currentProfile ?? new HardwareProfile(),
            Benchmark = _currentBenchmark,
            ActualFpsRecords = _actualFpsRecords
        };
    }

    private void BtnHeaderSync_Click(object sender, RoutedEventArgs e)
    {
        // Chuyển sang Tab 5 (Index 4)
        if (VisualTreeHelper.GetChild(this, 0) is Grid rootGrid)
        {
            foreach (var child in rootGrid.Children)
            {
                if (child is TabControl tabs)
                {
                    tabs.SelectedIndex = 4;
                    TxtLinkCode.Focus();
                    break;
                }
            }
        }
    }

    private void BtnPreviewJson_Click(object sender, RoutedEventArgs e)
    {
        var payload = BuildPayload();
        string json = _syncService.SerializePayload(payload);
        TxtJsonPreview.Text = json;
        TxtJsonPreview.Visibility = TxtJsonPreview.Visibility == Visibility.Visible ? Visibility.Collapsed : Visibility.Visible;
    }

    private async void BtnSubmitToServer_Click(object sender, RoutedEventArgs e)
    {
        string code = TxtLinkCode.Text.Trim().ToUpper();
        if (code.Length != 6)
        {
            MessageBox.Show("Vui lòng nhập đúng mã liên kết gồm 6 ký tự!", "Mã không hợp lệ", MessageBoxButton.OK, MessageBoxImage.Warning);
            TxtLinkCode.Focus();
            return;
        }

        if (ChkConsent.IsChecked != true)
        {
            MessageBox.Show("Vui lòng tích đồng ý điều khoản chia sẻ cấu hình phần cứng!", "Yêu cầu sự đồng ý", MessageBoxButton.OK, MessageBoxImage.Warning);
            return;
        }

        BtnSubmitToServer.IsEnabled = false;
        BorderSyncStatus.Visibility = Visibility.Visible;
        TxtSyncStatus.Text = "Đang gửi dữ liệu lên máy chủ...";

        var payload = BuildPayload();
        string serverUrl = TxtServerUrl.Text.Trim();

        var result = await _syncService.SubmitToServerAsync(serverUrl, payload);

        if (result.Success)
        {
            TxtSyncStatus.Text = $"✓ {result.Message}\nĐã tạo {result.RecommendationCount} khuyến nghị tối ưu trên Website.";
            TxtSyncStatus.Foreground = (SolidColorBrush)FindResource("SuccessBrush");

            var askOpen = MessageBox.Show(
                $"{result.Message}\n\nBạn có muốn mở ngay Dashboard hồ sơ trên trình duyệt không?",
                "Liên kết thành công",
                MessageBoxButton.YesNo,
                MessageBoxImage.Information);

            if (askOpen == MessageBoxResult.Yes && !string.IsNullOrEmpty(result.SystemProfileId))
            {
                string webUrl = $"{serverUrl.TrimEnd('/')}/profile/{result.SystemProfileId}";
                try
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = webUrl,
                        UseShellExecute = true
                    });
                }
                catch { }
            }
        }
        else
        {
            TxtSyncStatus.Text = $"✗ {result.Message}";
            TxtSyncStatus.Foreground = (SolidColorBrush)FindResource("DangerBrush");
        }

        BtnSubmitToServer.IsEnabled = true;
    }

    private void BtnExportOfflineJson_Click(object sender, RoutedEventArgs e)
    {
        var sfd = new SaveFileDialog
        {
            Filter = "JSON Files (*.json)|*.json",
            FileName = $"fps_advisor_profile_{DateTime.Now:yyyyMMdd_HHmm}.json"
        };

        if (sfd.ShowDialog() == true)
        {
            var payload = BuildPayload();
            if (_syncService.ExportToJsonFile(payload, sfd.FileName, out string err))
            {
                MessageBox.Show($"Đã xuất file thành công tại:\n{sfd.FileName}", "Xuất file hoàn tất", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            else
            {
                MessageBox.Show($"Lỗi xuất file: {err}", "Lỗi", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }
    }
    #endregion
}
