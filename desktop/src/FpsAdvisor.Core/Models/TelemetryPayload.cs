namespace FpsAdvisor.Core.Models;

public class BenchmarkResult
{
    public int CpuSingleScore { get; set; }
    public int CpuMultiScore { get; set; }
    public int GpuScore { get; set; }
    public double RamBandwidthMbPerSec { get; set; }
    public double DiskReadMbPerSec { get; set; }
    public double DiskWriteMbPerSec { get; set; }
    public double MaxCpuTempC { get; set; }
    public double MaxGpuTempC { get; set; }
    public bool CpuThermalThrottled { get; set; }
    public bool GpuThermalThrottled { get; set; }
    public double BottleneckRatio { get; set; } // < 0.88 CPU bound, > 1.15 GPU bound, 0.88 - 1.15 Balanced
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}

public class PresentMonRecord
{
    public string GameKey { get; set; } = string.Empty;
    public string Resolution { get; set; } = "1080p";
    public string GraphicPreset { get; set; } = "High";
    public double AvgFps { get; set; }
    public double Low1PercentFps { get; set; }
    public double? Low01PercentFps { get; set; }
    public double FrametimeMs { get; set; }
    public int DurationSeconds { get; set; }
    public string BottleneckType { get; set; } = "BALANCED"; // CPU_BOUND, GPU_BOUND, BALANCED
}

public class TelemetryPayload
{
    public string LinkCode { get; set; } = string.Empty;
    public bool ClientConsentGranted { get; set; } = false;
    public HardwareProfile System { get; set; } = new();
    public BenchmarkResult? Benchmark { get; set; }
    public List<PresentMonRecord> ActualFpsRecords { get; set; } = new();
}
