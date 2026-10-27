export interface GameProfile {
  gameId: string;
  displayName: string;
  developer: string;
  engine: string;
  antiCheat: string;
  characteristics: {
    cpuWeight: number;
    gpuWeight: number;
    ramSensitivity: {
      dualChannelBenefitPercent: number;
      speedSensitivity: "LOW" | "MEDIUM" | "HIGH";
      recommendedMinGb: number;
    };
    vramSensitivity: {
      minVramMb: number;
      vramPenaltyUnderMinPercent: number;
    };
    l3CacheSensitive: boolean;
  };
  referenceBaseline: {
    hardware: {
      cpuName: string;
      cpuSingleScoreBaseline: number;
      cpuMultiScoreBaseline: number;
      gpuName: string;
      gpuScoreBaseline: number;
      ramGb: number;
      ramDualChannel: boolean;
    };
    fpsData: Record<
      string, // 1080p | 1440p | 4k
      Record<
        string, // Low | Medium | High | Ultra
        {
          avgFps: number;
          low1PercentFps: number;
        }
      >
    >;
  };
  specificTweaks: Array<{
    code: string;
    title: string;
    targetSetting: string;
    recommendation: string;
    estimatedGain: string;
  }>;
}

export type FpsSourceType =
  | "DATABASE_ESTIMATE"
  | "SYNTHETIC_ESTIMATE"
  | "ACTUAL_PRESENTMON";

export type BottleneckType = "CPU_BOUND" | "GPU_BOUND" | "BALANCED";

export interface SystemHardwareInput {
  cpu: {
    name: string;
    cores: number;
    threads: number;
    baseClockMhz: number;
    boostClockMhz: number;
    cacheL3Mb: number;
  };
  gpu: {
    name: string;
    vendor: string;
    vramMb: number;
    driverVersion: string;
    clockMhz: number;
  };
  ram: {
    totalGb: number;
    speedMhz: number;
    channels: number;
    xmpEnabled: boolean;
  };
  storage: {
    model: string;
    type: string;
  };
  display: {
    resolution: string;
    refreshRate: number;
  };
  os: {
    name: string;
    version: string;
    powerPlan: string;
    gameModeEnabled: boolean;
    hagsEnabled: boolean;
  };
}

export interface BenchmarkInput {
  cpuSingleScore: number;
  cpuMultiScore: number;
  gpuScore: number;
  ramBandwidthMbPerSec: number;
  diskReadMbPerSec: number;
  diskWriteMbPerSec: number;
  maxCpuTempC: number;
  maxGpuTempC: number;
  cpuThermalThrottled: boolean;
  gpuThermalThrottled: boolean;
  bottleneckRatio: number;
}

export interface ActualFpsRecordInput {
  gameKey: string;
  resolution: string;
  graphicPreset: string;
  avgFps: number;
  low1PercentFps: number;
  low01PercentFps?: number;
  frametimeMs: number;
  durationSeconds: number;
  bottleneckType: BottleneckType;
}

export interface TelemetrySubmitPayload {
  linkCode: string;
  clientConsentGranted: boolean;
  system: SystemHardwareInput;
  benchmark?: BenchmarkInput;
  actualFpsRecords?: ActualFpsRecordInput[];
}
