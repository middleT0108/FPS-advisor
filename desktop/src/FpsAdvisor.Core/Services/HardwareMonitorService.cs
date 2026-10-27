using System;
using System.Diagnostics;
using LibreHardwareMonitor.Hardware;

namespace FpsAdvisor.Core.Services;

public class HardwareTelemetrySnapshot
{
    public float CpuTemp { get; set; }
    public float GpuTemp { get; set; }
    public float CpuClockMhz { get; set; }
    public float GpuClockMhz { get; set; }
    public float CpuLoadPercent { get; set; }
    public float GpuLoadPercent { get; set; }
    public bool IsThrottling { get; set; }
}

public class HardwareMonitorService : IDisposable
{
    private readonly Computer _computer;
    private bool _isOpen = false;

    public HardwareMonitorService()
    {
        _computer = new Computer
        {
            IsCpuEnabled = true,
            IsGpuEnabled = true,
            IsMemoryEnabled = true,
            IsMotherboardEnabled = false,
            IsControllerEnabled = false,
            IsNetworkEnabled = false,
            IsStorageEnabled = false
        };

        try
        {
            _computer.Open();
            _isOpen = true;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Không thể mở LibreHardwareMonitor (cần quyền Admin?): {ex.Message}");
            _isOpen = false;
        }
    }

    public HardwareTelemetrySnapshot ReadSnapshot()
    {
        var snapshot = new HardwareTelemetrySnapshot();
        if (!_isOpen) return snapshot;

        try
        {
            foreach (var hardware in _computer.Hardware)
            {
                hardware.Update();

                if (hardware.HardwareType == HardwareType.Cpu)
                {
                    foreach (var sensor in hardware.Sensors)
                    {
                        if (sensor.SensorType == SensorType.Temperature)
                        {
                            if (sensor.Name.Contains("Package", StringComparison.OrdinalIgnoreCase) ||
                                sensor.Name.Contains("Core (Tctl/Tdie)", StringComparison.OrdinalIgnoreCase) ||
                                sensor.Name.Contains("Total", StringComparison.OrdinalIgnoreCase))
                            {
                                snapshot.CpuTemp = sensor.Value ?? snapshot.CpuTemp;
                            }
                            else if (snapshot.CpuTemp == 0 && sensor.Value.HasValue)
                            {
                                snapshot.CpuTemp = sensor.Value.Value;
                            }
                        }
                        else if (sensor.SensorType == SensorType.Clock && sensor.Name.Contains("Core #1", StringComparison.OrdinalIgnoreCase))
                        {
                            snapshot.CpuClockMhz = sensor.Value ?? snapshot.CpuClockMhz;
                        }
                        else if (sensor.SensorType == SensorType.Load && sensor.Name.Contains("Total", StringComparison.OrdinalIgnoreCase))
                        {
                            snapshot.CpuLoadPercent = sensor.Value ?? snapshot.CpuLoadPercent;
                        }
                    }
                }
                else if (hardware.HardwareType == HardwareType.GpuNvidia ||
                         hardware.HardwareType == HardwareType.GpuAmd ||
                         hardware.HardwareType == HardwareType.GpuIntel)
                {
                    foreach (var sensor in hardware.Sensors)
                    {
                        if (sensor.SensorType == SensorType.Temperature &&
                            (sensor.Name.Contains("Core", StringComparison.OrdinalIgnoreCase) || sensor.Name.Contains("GPU", StringComparison.OrdinalIgnoreCase)))
                        {
                            snapshot.GpuTemp = sensor.Value ?? snapshot.GpuTemp;
                        }
                        else if (sensor.SensorType == SensorType.Clock && sensor.Name.Contains("Core", StringComparison.OrdinalIgnoreCase))
                        {
                            snapshot.GpuClockMhz = sensor.Value ?? snapshot.GpuClockMhz;
                        }
                        else if (sensor.SensorType == SensorType.Load && sensor.Name.Contains("Core", StringComparison.OrdinalIgnoreCase))
                        {
                            snapshot.GpuLoadPercent = sensor.Value ?? snapshot.GpuLoadPercent;
                        }
                    }
                }
            }

            // Phát hiện quá nhiệt
            if (snapshot.CpuTemp >= 89.0f || snapshot.GpuTemp >= 86.0f)
            {
                snapshot.IsThrottling = true;
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Lỗi khi đọc sensor: {ex.Message}");
        }

        return snapshot;
    }

    public void Dispose()
    {
        try
        {
            if (_isOpen)
            {
                _computer.Close();
                _isOpen = false;
            }
        }
        catch { }
    }
}
