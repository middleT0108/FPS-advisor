import { GameProfile, BottleneckType } from "./types";

export interface SystemMetrics {
  cpuSingleScore: number;
  cpuMultiScore: number;
  gpuScore: number;
  ramGb: number;
  ramChannels: number; // 1 = Single, 2 = Dual
  gpuVramMb: number;
  cpuThermalThrottled?: boolean;
  gpuThermalThrottled?: boolean;
}

export interface FpsCalculationOutput {
  resolution: string;
  preset: string;
  cpuLimitedFps: number;
  gpuLimitedFps: number;
  predictedAvgFps: number;
  predicted1PercentLowFps: number;
  confidenceMarginPercent: number; // Ví dụ 8 nghĩa là ±8%
  bottleneck: BottleneckType;
  scalingBreakdown: {
    cpuRatio: number;
    gpuRatio: number;
    ramChannelMultiplier: number;
    vramPenaltyMultiplier: number;
    thermalPenaltyMultiplier: number;
  };
}

/**
 * Thuật toán nội suy và tính toán FPS dự đoán
 * Dựa trên cấu hình tham chiếu, trọng số game và các hệ số hiệu chỉnh
 */
export function calculateEstimatedFps(
  game: GameProfile,
  metrics: SystemMetrics,
  resolution: string = "1080p",
  preset: string = "High"
): FpsCalculationOutput | null {
  const baseData = game.referenceBaseline.fpsData[resolution]?.[preset];
  if (!baseData) {
    return null;
  }

  const baseHardware = game.referenceBaseline.hardware;

  // 1. Tỷ số sức mạnh CPU (kết hợp đơn nhân 70% + đa nhân 30% để phản ánh game hiện đại)
  const cpuSingleRatio =
    metrics.cpuSingleScore / baseHardware.cpuSingleScoreBaseline;
  const cpuMultiRatio =
    metrics.cpuMultiScore / baseHardware.cpuMultiScoreBaseline;
  const effectiveCpuRatio = cpuSingleRatio * 0.7 + cpuMultiRatio * 0.3;

  // 2. Tỷ số sức mạnh GPU
  const effectiveGpuRatio = metrics.gpuScore / baseHardware.gpuScoreBaseline;

  // 3. Hệ số hiệu chỉnh RAM (Dual channel vs Single channel)
  let ramChannelMultiplier = 1.0;
  if (metrics.ramChannels < 2 && baseHardware.ramDualChannel) {
    // Bị phạt hiệu năng nếu chạy single channel
    const penaltyPercent = game.characteristics.ramSensitivity.dualChannelBenefitPercent;
    ramChannelMultiplier = 1.0 - penaltyPercent / 100.0;
  }

  // 4. Hệ số phạt thiếu hụt VRAM
  let vramPenaltyMultiplier = 1.0;
  if (metrics.gpuVramMb < game.characteristics.vramSensitivity.minVramMb) {
    const penalty =
      game.characteristics.vramSensitivity.vramPenaltyUnderMinPercent;
    vramPenaltyMultiplier = 1.0 - penalty / 100.0;
  }

  // 5. Hệ số phạt nghẽn nhiệt độ (Thermal Throttling)
  let thermalPenaltyMultiplier = 1.0;
  if (metrics.cpuThermalThrottled) {
    thermalPenaltyMultiplier *= 0.82; // Giảm 18% do tụt xung CPU
  }
  if (metrics.gpuThermalThrottled) {
    thermalPenaltyMultiplier *= 0.85; // Giảm 15% do tụt xung GPU
  }

  // 6. Tính FPS trần theo CPU và GPU
  // Áp dụng trọng số game đặc thù
  const cpuLimitedFps =
    baseData.avgFps *
    effectiveCpuRatio *
    ramChannelMultiplier *
    (metrics.cpuThermalThrottled ? 0.82 : 1.0);

  const gpuLimitedFps =
    baseData.avgFps *
    effectiveGpuRatio *
    vramPenaltyMultiplier *
    (metrics.gpuThermalThrottled ? 0.85 : 1.0);

  // 7. FPS thực tế là min(CPU, GPU) kết hợp độ pha trộn trọng số
  // Formula: FPS = min(CPU_limit, GPU_limit)
  const predictedAvgFps = Math.round(
    Math.min(cpuLimitedFps, gpuLimitedFps)
  );

  // 8. Tính 1% Low FPS (chịu ảnh hưởng nặng từ CPU và Dual Channel RAM)
  const base1PercentRatio = baseData.low1PercentFps / baseData.avgFps;
  const low1Multiplier = ramChannelMultiplier * (metrics.cpuThermalThrottled ? 0.75 : 1.0);
  const predicted1PercentLowFps = Math.round(
    predictedAvgFps * base1PercentRatio * low1Multiplier
  );

  // 9. Xác định Bottleneck
  let bottleneck: BottleneckType = "BALANCED";
  const diffRatio = cpuLimitedFps / (gpuLimitedFps || 1);
  if (diffRatio < 0.88) {
    bottleneck = "CPU_BOUND"; // CPU yếu hơn GPU rõ rệt
  } else if (diffRatio > 1.15) {
    bottleneck = "GPU_BOUND"; // GPU yếu hơn CPU rõ rệt
  }

  // 10. Khoảng tin cậy ước tính (Confidence Interval)
  // Nếu có throttling hoặc sai khác cấu hình lớn thì khoảng sai số rộng hơn
  let confidenceMargin = 8; // ±8% mặc định
  if (metrics.ramChannels < 2 || metrics.cpuThermalThrottled || metrics.gpuThermalThrottled) {
    confidenceMargin = 12; // ±12%
  }

  return {
    resolution,
    preset,
    cpuLimitedFps: Math.round(cpuLimitedFps),
    gpuLimitedFps: Math.round(gpuLimitedFps),
    predictedAvgFps: Math.max(1, predictedAvgFps),
    predicted1PercentLowFps: Math.max(1, predicted1PercentLowFps),
    confidenceMarginPercent: confidenceMargin,
    bottleneck,
    scalingBreakdown: {
      cpuRatio: Number(effectiveCpuRatio.toFixed(2)),
      gpuRatio: Number(effectiveGpuRatio.toFixed(2)),
      ramChannelMultiplier: Number(ramChannelMultiplier.toFixed(2)),
      vramPenaltyMultiplier: Number(vramPenaltyMultiplier.toFixed(2)),
      thermalPenaltyMultiplier: Number(thermalPenaltyMultiplier.toFixed(2)),
    },
  };
}
