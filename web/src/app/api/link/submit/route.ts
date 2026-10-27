import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TelemetrySubmitPayload } from "@/lib/types";
import { evaluateSystemRecommendations } from "@/lib/recommendation-engine";

export async function POST(request: NextRequest) {
  try {
    const body: TelemetrySubmitPayload = await request.json();

    if (!body.clientConsentGranted) {
      return NextResponse.json(
        {
          success: false,
          error: "Yêu cầu sự đồng ý (consent) chia sẻ thông số phần cứng từ người dùng",
        },
        { status: 403 }
      );
    }

    const code = body.linkCode?.toUpperCase().trim();
    if (!code || code.length !== 6) {
      return NextResponse.json(
        { success: false, error: "Mã liên kết 6 ký tự không hợp lệ" },
        { status: 400 }
      );
    }

    // 1. Kiểm tra session hiện tại
    const existingSession = await prisma.linkSession.findUnique({
      where: { code },
    });

    // 2. Nếu đã có profile cũ liên kết với mã này, ngắt liên kết trước để tránh cascade delete
    if (existingSession?.systemProfileId) {
      const oldProfileId = existingSession.systemProfileId;
      try {
        await prisma.linkSession.update({
          where: { id: existingSession.id },
          data: { systemProfileId: null },
        });
        await prisma.systemProfile.delete({
          where: { id: oldProfileId },
        });
      } catch {
        // Bỏ qua lỗi dọn dẹp nếu profile cũ không tồn tại
      }
    }

    const { system, benchmark, actualFpsRecords } = body;

    const cpu = system?.cpu || ({} as any);
    const gpu = system?.gpu || ({} as any);
    const ram = system?.ram || ({} as any);
    const storage = system?.storage || ({} as any);
    const display = system?.display || ({} as any);
    const os = system?.os || ({} as any);

    // 3. Tạo SystemProfile mới với giá trị an toàn
    const profile = await prisma.systemProfile.create({
      data: {
        cpuName: String(cpu.name || "Unknown CPU"),
        cpuCores: Number(cpu.cores) || 4,
        cpuThreads: Number(cpu.threads) || 8,
        cpuBaseClockMhz: Math.round(Number(cpu.baseClockMhz)) || 3000,
        cpuBoostClockMhz: Math.round(Number(cpu.boostClockMhz)) || 4000,
        cpuCacheL3Mb: Number(cpu.cacheL3Mb) || 16.0,

        gpuName: String(gpu.name || "Integrated Graphics"),
        gpuVendor: String(gpu.vendor || "UNKNOWN"),
        gpuVramMb: Math.round(Number(gpu.vramMb)) || 2048,
        gpuDriverVersion: String(gpu.driverVersion || "Standard"),
        gpuClockMhz: Math.round(Number(gpu.clockMhz)) || 1000,

        ramTotalGb: Number(ram.totalGb) || 8.0,
        ramSpeedMhz: Math.round(Number(ram.speedMhz)) || 2666,
        ramChannels: Math.round(Number(ram.channels)) || 1,
        ramXmpEnabled: Boolean(ram.xmpEnabled),

        diskModel: String(storage.model || "Standard Storage"),
        diskType: String(storage.type || "SSD"),
        displayResolution: String(display.resolution || "1920x1080"),
        displayRefreshRate: Math.round(Number(display.refreshRate)) || 60,

        osName: String(os.name || "Windows 11"),
        osVersion: String(os.version || "Unknown"),
        powerPlan: String(os.powerPlan || "Balanced"),
        gameModeEnabled: Boolean(os.gameModeEnabled),
        hagsEnabled: Boolean(os.hagsEnabled),
      },
    });

    // 4. Lưu Benchmark nếu có
    if (benchmark) {
      await prisma.benchmarkResult.create({
        data: {
          systemProfileId: profile.id,
          cpuSingleScore: Math.round(Number(benchmark.cpuSingleScore)) || 1000,
          cpuMultiScore: Math.round(Number(benchmark.cpuMultiScore)) || 5000,
          gpuScore: Math.round(Number(benchmark.gpuScore)) || 4000,
          ramBandwidthMbPerSec: Number(benchmark.ramBandwidthMbPerSec) || 25000,
          diskReadMbPerSec: Number(benchmark.diskReadMbPerSec) || 1500,
          diskWriteMbPerSec: Number(benchmark.diskWriteMbPerSec) || 1000,
          maxCpuTempC: Number(benchmark.maxCpuTempC) || 60,
          maxGpuTempC: Number(benchmark.maxGpuTempC) || 60,
          cpuThermalThrottled: Boolean(benchmark.cpuThermalThrottled),
          gpuThermalThrottled: Boolean(benchmark.gpuThermalThrottled),
          bottleneckRatio: Number(benchmark.bottleneckRatio) || 1.0,
        },
      });
    }

    // 5. Lưu Actual FPS Records từ PresentMon nếu có
    if (actualFpsRecords && actualFpsRecords.length > 0) {
      for (const rec of actualFpsRecords) {
        await prisma.fpsRecord.create({
          data: {
            systemProfileId: profile.id,
            gameKey: String(rec.gameKey || "unknown").toLowerCase(),
            resolution: String(rec.resolution || "1080p"),
            graphicPreset: String(rec.graphicPreset || "High"),
            source: "ACTUAL_PRESENTMON",
            avgFps: Number(rec.avgFps) || 60,
            low1PercentFps: Number(rec.low1PercentFps) || 30,
            low01PercentFps: rec.low01PercentFps ? Number(rec.low01PercentFps) : null,
            frametimeMs: Number(rec.frametimeMs) || 16.6,
            durationSeconds: Math.round(Number(rec.durationSeconds)) || 60,
            bottleneckType: String(rec.bottleneckType || "BALANCED"),
          },
        });
      }
    }

    // 6. Chạy Rule Engine tự động để tạo khuyến nghị
    const recommendations = evaluateSystemRecommendations(
      system,
      benchmark,
      benchmark
        ? benchmark.bottleneckRatio < 0.88
          ? "CPU_BOUND"
          : benchmark.bottleneckRatio > 1.15
          ? "GPU_BOUND"
          : "BALANCED"
        : undefined
    );

    for (const r of recommendations) {
      await prisma.recommendationLog.create({
        data: {
          systemProfileId: profile.id,
          ruleCode: r.ruleCode,
          category: r.category,
          title: r.title,
          explanation: r.explanation,
          steps: JSON.stringify(r.steps),
          impact: r.impact,
          difficulty: r.difficulty,
          estimatedFpsGain: r.estimatedFpsGain,
        },
      });
    }

    // 7. Cập nhật hoặc tạo mới LinkSession với profile vừa tạo
    await prisma.linkSession.upsert({
      where: { code },
      update: {
        status: "LINKED",
        linkedAt: new Date(),
        systemProfileId: profile.id,
      },
      create: {
        code,
        status: "LINKED",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        linkedAt: new Date(),
        systemProfileId: profile.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Đã liên kết và phân tích dữ liệu máy tính thành công.",
      data: {
        systemProfileId: profile.id,
        recommendationCount: recommendations.length,
      },
    });
  } catch (error: any) {
    console.error("Lỗi khi xử lý submit telemetry:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Lỗi máy chủ khi lưu trữ dữ liệu phần cứng: ${error?.message || String(error)}`,
      },
      { status: 500 }
    );
  }
}
