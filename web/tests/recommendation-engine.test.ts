import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { evaluateSystemRecommendations } from "../src/lib/recommendation-engine";
import { SystemHardwareInput, BenchmarkInput } from "../src/lib/types";

describe("Recommendation Rule Engine Unit Tests", () => {
  const cleanSystem: SystemHardwareInput = {
    cpu: {
      name: "AMD Ryzen 5 5600",
      cores: 6,
      threads: 12,
      baseClockMhz: 3500,
      boostClockMhz: 4400,
      cacheL3Mb: 32,
    },
    gpu: {
      name: "NVIDIA GeForce RTX 3060",
      vendor: "NVIDIA",
      vramMb: 12288,
      driverVersion: "560.94",
      clockMhz: 1777,
    },
    ram: {
      totalGb: 16,
      speedMhz: 3200,
      channels: 2,
      xmpEnabled: true,
    },
    storage: {
      model: "Samsung SSD 980",
      type: "NVME_SSD",
    },
    display: {
      resolution: "1920x1080",
      refreshRate: 144,
    },
    os: {
      name: "Windows 11",
      version: "23H2",
      powerPlan: "High Performance",
      gameModeEnabled: true,
      hagsEnabled: true,
    },
  };

  test("Phát hiện luật RAM Single Channel", () => {
    const singleChannelSys: SystemHardwareInput = {
      ...cleanSystem,
      ram: {
        ...cleanSystem.ram,
        channels: 1, // Single Channel
      },
    };

    const recs = evaluateSystemRecommendations(singleChannelSys);
    const hasRule = recs.some((r) => r.ruleCode === "REC_RAM_SINGLE_CHANNEL");
    assert.equal(hasRule, true, "Phải kích hoạt luật REC_RAM_SINGLE_CHANNEL");

    const found = recs.find((r) => r.ruleCode === "REC_RAM_SINGLE_CHANNEL");
    assert.equal(found?.impact, "HIGH", "Tác động phải là HIGH");
    assert.ok(found?.steps.length && found.steps.length > 0, "Phải có các bước hướng dẫn");
  });

  test("Phát hiện luật XMP chưa bật", () => {
    const xmpOffSys: SystemHardwareInput = {
      ...cleanSystem,
      ram: {
        ...cleanSystem.ram,
        xmpEnabled: false,
        speedMhz: 2400, // Chạy tốc độ JEDEC thấp
      },
    };

    const recs = evaluateSystemRecommendations(xmpOffSys);
    const hasRule = recs.some((r) => r.ruleCode === "REC_XMP_DISABLED");
    assert.equal(hasRule, true, "Phải kích hoạt luật REC_XMP_DISABLED");
  });

  test("Phát hiện luật Windows Power Saver", () => {
    const powerSaverSys: SystemHardwareInput = {
      ...cleanSystem,
      os: {
        ...cleanSystem.os,
        powerPlan: "Power Saver (Tiết kiệm pin)",
      },
    };

    const recs = evaluateSystemRecommendations(powerSaverSys);
    const hasRule = recs.some((r) => r.ruleCode === "REC_POWER_PLAN_SAVER");
    assert.equal(hasRule, true, "Phải kích hoạt luật REC_POWER_PLAN_SAVER");
  });

  test("Phát hiện luật Windows Game Mode chưa bật", () => {
    const noGameModeSys: SystemHardwareInput = {
      ...cleanSystem,
      os: {
        ...cleanSystem.os,
        gameModeEnabled: false,
      },
    };

    const recs = evaluateSystemRecommendations(noGameModeSys);
    const hasRule = recs.some((r) => r.ruleCode === "REC_GAME_MODE_DISABLED");
    assert.equal(hasRule, true, "Phải kích hoạt luật REC_GAME_MODE_DISABLED");
  });

  test("Phát hiện luật HAGS chưa bật trên GPU NVIDIA", () => {
    const noHagsSys: SystemHardwareInput = {
      ...cleanSystem,
      os: {
        ...cleanSystem.os,
        hagsEnabled: false,
      },
    };

    const recs = evaluateSystemRecommendations(noHagsSys);
    const hasRule = recs.some((r) => r.ruleCode === "REC_HAGS_DISABLED");
    assert.equal(hasRule, true, "Phải kích hoạt luật REC_HAGS_DISABLED");
  });

  test("Phát hiện luật Quá nhiệt CPU (Thermal Throttling)", () => {
    const benchHotCpu: BenchmarkInput = {
      cpuSingleScore: 1200,
      cpuMultiScore: 8000,
      gpuScore: 8500,
      ramBandwidthMbPerSec: 42000,
      diskReadMbPerSec: 3000,
      diskWriteMbPerSec: 2500,
      maxCpuTempC: 92.5, // Rất nóng
      maxGpuTempC: 68.0,
      cpuThermalThrottled: true,
      gpuThermalThrottled: false,
      bottleneckRatio: 1.0,
    };

    const recs = evaluateSystemRecommendations(cleanSystem, benchHotCpu);
    const hasRule = recs.some((r) => r.ruleCode === "REC_THERMAL_CPU");
    assert.equal(hasRule, true, "Phải kích hoạt luật REC_THERMAL_CPU");
    const found = recs.find((r) => r.ruleCode === "REC_THERMAL_CPU");
    assert.equal(found?.category, "THERMAL");
  });

  test("Phát hiện luật Nghẽn cổ chai CPU (CPU-Bound)", () => {
    const benchCpuBound: BenchmarkInput = {
      cpuSingleScore: 800,
      cpuMultiScore: 5000,
      gpuScore: 12000,
      ramBandwidthMbPerSec: 38000,
      diskReadMbPerSec: 2500,
      diskWriteMbPerSec: 2000,
      maxCpuTempC: 65.0,
      maxGpuTempC: 64.0,
      cpuThermalThrottled: false,
      gpuThermalThrottled: false,
      bottleneckRatio: 0.72, // Rõ ràng bị CPU-bound
    };

    const recs = evaluateSystemRecommendations(cleanSystem, benchCpuBound);
    const hasRule = recs.some((r) => r.ruleCode === "REC_BOTTLENECK_CPU");
    assert.equal(hasRule, true, "Phải kích hoạt luật REC_BOTTLENECK_CPU");
  });

  test("Nạp đầy đủ các khuyến nghị tinh chỉnh riêng cho game (CS2, Valorant...)", () => {
    const recs = evaluateSystemRecommendations(cleanSystem);
    const cs2Tweak = recs.some((r) => r.ruleCode.includes("CS2"));
    const valTweak = recs.some((r) => r.ruleCode.includes("VALORANT"));

    assert.equal(cs2Tweak, true, "Phải nạp khuyến nghị riêng cho CS2");
    assert.equal(valTweak, true, "Phải nạp khuyến nghị riêng cho Valorant");
  });
});
