import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calculateEstimatedFps, SystemMetrics } from "../src/lib/fps-estimator";
import { getGameProfileByKey, getAllGameProfiles } from "../src/lib/game-loader";

describe("FPS Estimator Engine Unit Tests", () => {
  const valorant = getGameProfileByKey("valorant");
  const cs2 = getGameProfileByKey("cs2");

  test("Đảm bảo game profiles nạp thành công", () => {
    assert.ok(valorant, "Hồ sơ Valorant phải tồn tại");
    assert.ok(cs2, "Hồ sơ CS2 phải tồn tại");
    const all = getAllGameProfiles();
    assert.equal(all.length >= 4, true, "Phải nạp được tối thiểu 4 game");
  });

  test("Hệ thống chuẩn Baseline cho kết quả trùng khớp với mốc FPS gốc", () => {
    if (!valorant) return;

    const baseMetrics: SystemMetrics = {
      cpuSingleScore: valorant.referenceBaseline.hardware.cpuSingleScoreBaseline,
      cpuMultiScore: valorant.referenceBaseline.hardware.cpuMultiScoreBaseline,
      gpuScore: valorant.referenceBaseline.hardware.gpuScoreBaseline,
      ramGb: 16,
      ramChannels: 2,
      gpuVramMb: 12288,
      cpuThermalThrottled: false,
      gpuThermalThrottled: false,
    };

    const res = calculateEstimatedFps(valorant, baseMetrics, "1080p", "High");
    assert.ok(res, "Kết quả tính toán không được null");

    const expectedAvg = valorant.referenceBaseline.fpsData["1080p"]["High"].avgFps;
    assert.equal(res.predictedAvgFps, expectedAvg, "FPS mốc phải khớp cấu hình chuẩn");
    assert.equal(res.confidenceMarginPercent, 8, "Cấu hình chuẩn có sai số ±8%");
    assert.equal(res.bottleneck, "BALANCED", "Cấu hình chuẩn phải cân bằng (BALANCED)");
  });

  test("RAM Single Channel làm tụt FPS và tăng khoảng tin cậy sai số", () => {
    if (!valorant) return;

    const singleRamMetrics: SystemMetrics = {
      cpuSingleScore: 1450,
      cpuMultiScore: 11000,
      gpuScore: 8500,
      ramGb: 16,
      ramChannels: 1, // Single channel
      gpuVramMb: 12288,
      cpuThermalThrottled: false,
      gpuThermalThrottled: false,
    };

    const res = calculateEstimatedFps(valorant, singleRamMetrics, "1080p", "High");
    assert.ok(res);

    // Valorant có ram penalty 22%, do đó FPS giới hạn bởi CPU sẽ giảm
    assert.ok(
      res.predictedAvgFps < 300,
      `FPS khi chạy single channel (${res.predictedAvgFps}) phải nhỏ hơn mức chuẩn 300 FPS`
    );
    assert.equal(res.confidenceMarginPercent, 12, "Single channel phải có sai số ±12%");
  });

  test("Quá nhiệt Thermal Throttling làm giảm FPS đáng kể", () => {
    if (!valorant) return;

    const normalMetrics: SystemMetrics = {
      cpuSingleScore: 1450,
      cpuMultiScore: 11000,
      gpuScore: 8500,
      ramGb: 16,
      ramChannels: 2,
      gpuVramMb: 12288,
      cpuThermalThrottled: false,
      gpuThermalThrottled: false,
    };

    const throttledMetrics: SystemMetrics = {
      ...normalMetrics,
      cpuThermalThrottled: true,
      gpuThermalThrottled: true,
    };

    const normalRes = calculateEstimatedFps(valorant, normalMetrics, "1080p", "High");
    const throttledRes = calculateEstimatedFps(valorant, throttledMetrics, "1080p", "High");

    assert.ok(normalRes && throttledRes);
    assert.ok(
      throttledRes.predictedAvgFps < normalRes.predictedAvgFps * 0.88,
      "Quá nhiệt cả CPU và GPU phải làm giảm ít nhất 12% FPS"
    );
  });

  test("Phát hiện chính xác CPU-Bound khi CPU yếu và GPU rất mạnh", () => {
    if (!cs2) return;

    const cpuBoundMetrics: SystemMetrics = {
      cpuSingleScore: 800, // Rất yếu
      cpuMultiScore: 4000,
      gpuScore: 18000,     // GPU cực mạnh (RTX 4080)
      ramGb: 32,
      ramChannels: 2,
      gpuVramMb: 16384,
      cpuThermalThrottled: false,
      gpuThermalThrottled: false,
    };

    const res = calculateEstimatedFps(cs2, cpuBoundMetrics, "1080p", "Low");
    assert.ok(res);
    assert.equal(res.bottleneck, "CPU_BOUND", "Hệ thống phải được kết luận là CPU_BOUND");
    assert.ok(
      res.cpuLimitedFps < res.gpuLimitedFps,
      "Trần FPS của CPU phải nhỏ hơn GPU"
    );
    assert.equal(
      res.predictedAvgFps,
      res.cpuLimitedFps,
      "Predicted FPS phải bằng CPU limit khi bị CPU-bound"
    );
  });

  test("Phát hiện chính xác GPU-Bound khi chạy độ phân giải 4K", () => {
    if (!cs2) return;

    const gpuBoundMetrics: SystemMetrics = {
      cpuSingleScore: 2200, // CPU rất mạnh (Ryzen 7800X3D)
      cpuMultiScore: 18000,
      gpuScore: 4000,       // GPU yếu (GTX 1650)
      ramGb: 16,
      ramChannels: 2,
      gpuVramMb: 4096,
      cpuThermalThrottled: false,
      gpuThermalThrottled: false,
    };

    const res = calculateEstimatedFps(cs2, gpuBoundMetrics, "4k", "High");
    assert.ok(res);
    assert.equal(res.bottleneck, "GPU_BOUND", "Hệ thống phải được kết luận là GPU_BOUND");
  });

  test("Kiểm tra tỷ lệ suy giảm khi tăng độ phân giải (1080p -> 1440p -> 4k)", () => {
    if (!valorant) return;

    const metrics: SystemMetrics = {
      cpuSingleScore: 1450,
      cpuMultiScore: 11000,
      gpuScore: 8500,
      ramGb: 16,
      ramChannels: 2,
      gpuVramMb: 12288,
    };

    const res1080 = calculateEstimatedFps(valorant, metrics, "1080p", "High");
    const res1440 = calculateEstimatedFps(valorant, metrics, "1440p", "High");
    const res4k = calculateEstimatedFps(valorant, metrics, "4k", "High");

    assert.ok(res1080 && res1440 && res4k);
    assert.ok(res1080.predictedAvgFps > res1440.predictedAvgFps, "1080p FPS phải cao hơn 1440p");
    assert.ok(res1440.predictedAvgFps > res4k.predictedAvgFps, "1440p FPS phải cao hơn 4K");
  });
});
