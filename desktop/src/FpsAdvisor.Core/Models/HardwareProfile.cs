namespace FpsAdvisor.Core.Models;

public class CpuInfo
{
    public string Name { get; set; } = "Unknown CPU";
    public int Cores { get; set; } = 4;
    public int Threads { get; set; } = 8;
    public int BaseClockMhz { get; set; } = 3000;
    public int BoostClockMhz { get; set; } = 4000;
    public double CacheL3Mb { get; set; } = 16.0;
}

public class GpuInfo
{
    public string Name { get; set; } = "Unknown GPU";
    public string Vendor { get; set; } = "UNKNOWN"; // NVIDIA, AMD, INTEL
    public int VramMb { get; set; } = 2048;
    public string DriverVersion { get; set; } = "Standard";
    public int ClockMhz { get; set; } = 1000;
}

public class RamInfo
{
    public double TotalGb { get; set; } = 8.0;
    public int SpeedMhz { get; set; } = 2666;
    public int Channels { get; set; } = 1; // 1 = Single, 2 = Dual
    public bool XmpEnabled { get; set; } = false;
    public int StickCount { get; set; } = 1;
}

public class StorageInfo
{
    public string Model { get; set; } = "Standard Storage";
    public string Type { get; set; } = "SSD"; // NVME_SSD, SATA_SSD, HDD
    public long SizeGb { get; set; } = 512;
}

public class DisplayInfo
{
    public string Resolution { get; set; } = "1920x1080";
    public int RefreshRate { get; set; } = 60;
}

public class OsInfo
{
    public string Name { get; set; } = "Windows 11";
    public string Version { get; set; } = "23H2";
    public string PowerPlan { get; set; } = "Balanced";
    public bool GameModeEnabled { get; set; } = false;
    public bool HagsEnabled { get; set; } = false;
}

public class HardwareProfile
{
    public CpuInfo Cpu { get; set; } = new();
    public GpuInfo Gpu { get; set; } = new();
    public RamInfo Ram { get; set; } = new();
    public StorageInfo Storage { get; set; } = new();
    public DisplayInfo Display { get; set; } = new();
    public OsInfo Os { get; set; } = new();
    public DateTime ScannedAt { get; set; } = DateTime.UtcNow;
}
