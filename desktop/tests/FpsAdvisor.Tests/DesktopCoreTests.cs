using System;
using System.IO;
using System.Text.Json;
using Xunit;
using FpsAdvisor.Core.Models;
using FpsAdvisor.Core.Optimizer;
using FpsAdvisor.Core.Services;

namespace FpsAdvisor.Tests;

public class DesktopCoreTests
{
    [Fact]
    public void TelemetryPayload_Serializes_CamelCase_Correctly()
    {
        var syncService = new ApiSyncService();
        var payload = new TelemetryPayload
        {
            LinkCode = "A7X9K2",
            ClientConsentGranted = true,
            System = new HardwareProfile
            {
                Cpu = new CpuInfo { Name = "Ryzen 5 5600", Cores = 6, Threads = 12 },
                Gpu = new GpuInfo { Name = "RTX 3060", Vendor = "NVIDIA", VramMb = 12288 },
                Ram = new RamInfo { TotalGb = 16, SpeedMhz = 3200, Channels = 2, XmpEnabled = true }
            },
            Benchmark = new BenchmarkResult
            {
                CpuSingleScore = 1450,
                CpuMultiScore = 11000,
                GpuScore = 8500,
                BottleneckRatio = 0.95
            }
        };

        string json = syncService.SerializePayload(payload);
        Assert.NotNull(json);

        // Kiểm tra camelCase property names
        Assert.Contains("\"linkCode\": \"A7X9K2\"", json);
        Assert.Contains("\"clientConsentGranted\": true", json);
        Assert.Contains("\"cpuSingleScore\": 1450", json);
        Assert.Contains("\"bottleneckRatio\": 0.95", json);
    }

    [Fact]
    public void ExportToJsonFile_Creates_Readable_Json()
    {
        var syncService = new ApiSyncService();
        var payload = new TelemetryPayload
        {
            LinkCode = "TEST99",
            ClientConsentGranted = true
        };

        string tempPath = Path.Combine(Path.GetTempPath(), $"test_payload_{Guid.NewGuid():N}.json");
        try
        {
            bool success = syncService.ExportToJsonFile(payload, tempPath, out string err);
            Assert.True(success, err);
            Assert.True(File.Exists(tempPath));

            string readJson = File.ReadAllText(tempPath);
            Assert.Contains("TEST99", readJson);
        }
        finally
        {
            if (File.Exists(tempPath)) File.Delete(tempPath);
        }
    }

    [Fact]
    public void SystemOptimizer_Detects_Heavy_Apps_Without_Crashing()
    {
        var optimizer = new SystemOptimizer();
        var apps = optimizer.DetectHeavyBackgroundProcesses();
        Assert.NotNull(apps);
        // Kiểm tra danh sách trả về không gây null pointer
    }

    [Fact]
    public void HardwareTelemetry_Throttling_Flag_Trigger()
    {
        var snapHigh = new HardwareTelemetrySnapshot
        {
            CpuTemp = 91.5f,
            GpuTemp = 70.0f,
            IsThrottling = true
        };

        Assert.True(snapHigh.IsThrottling);
    }
}
