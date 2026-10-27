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

    // Kiểm tra hoặc tự động tạo session mã liên kết
    let session = await prisma.linkSession.findUnique({
      where: { code },
    });

    if (!session) {
      session = await prisma.linkSession.create({
        data: {
          code,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
    }

    if (new Date() > session.expiresAt) {
      await prisma.linkSession.update({
        where: { id: session.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { success: false, error: "Mã liên kết đã hết hạn (quá 15 phút)" },
        { status: 410 }
      );
    }

    const { system, benchmark, actualFpsRecords } = body;

    // 1. Tạo SystemProfile
    const profile = await prisma.systemProfile.create({
      data: {
        cpuName: system.cpu.name || "Unknown CPU",
        cpuCores: system.cpu.cores || 4,
        cpuThreads: system.cpu.threads || 8,
        cpuBaseClockMhz: system.cpu.baseClockMhz || 3000,
        cpuBoostClockMhz: system.cpu.boostClockMhz || 4000,
        cpuCacheL3Mb: system.cpu.cacheL3Mb || 16.0,

        gpuName: system.gpu.name || "Integrated Graphics",
        gpuVendor: system.gpu.vendor || "UNKNOWN",
        gpuVramMb: system.gpu.vramMb || 2048,
        gpuDriverVersion: system.gpu.driverVersion || "Standard",
        gpuClockMhz: system.gpu.clockMhz || 1000,

        ramTotalGb: system.ram.totalGb || 8.0,
        ramSpeedMhz: system.ram.speedMhz || 2666,
        ramChannels: system.ram.channels || 1,
        ramXmpEnabled: system.ram.xmpEnabled || false,

        diskModel: system.storage?.model || "Standard Storage",
        diskType: system.storage?.type || "SSD",
        displayResolution: system.display?.resolution || "1920x1080",
        displayRefreshRate: system.display?.refreshRate || 60,

        osName: system.os?.name || "Windows 11",
        osVersion: system.os?.version || "Unknown",
        powerPlan: system.os?.powerPlan || "Balanced",
        gameModeEnabled: system.os?.gameModeEnabled || false,
        hagsEnabled: system.os?.hagsEnabled || false,
      },
    });

    // 2. Lưu Benchmark nếu có
    if (benchmark) {
      await prisma.benchmarkResult.create({
        data: {
          systemProfileId: profile.id,
          cpuSingleScore: benchmark.cpuSingleScore || 1000,
          cpuMultiScore: benchmark.cpuMultiScore || 5000,
          gpuScore: benchmark.gpuScore || 4000,
          ramBandwidthMbPerSec: benchmark.ramBandwidthMbPerSec || 25000,
          diskReadMbPerSec: benchmark.diskReadMbPerSec || 1500,
          diskWriteMbPerSec: benchmark.diskWriteMbPerSec || 1000,
          maxCpuTempC: benchmark.maxCpuTempC || 60,
          maxGpuTempC: benchmark.maxGpuTempC || 60,
          cpuThermalThrottled: benchmark.cpuThermalThrottled || false,
          gpuThermalThrottled: benchmark.gpuThermalThrottled || false,
          bottleneckRatio: benchmark.bottleneckRatio || 1.0,
        },
      });
    }

    // 3. Lưu Actual FPS Records từ PresentMon nếu có
    if (actualFpsRecords && actualFpsRecords.length > 0) {
      for (const rec of actualFpsRecords) {
        await prisma.fpsRecord.create({
          data: {
            systemProfileId: profile.id,
            gameKey: rec.gameKey.toLowerCase(),
            resolution: rec.resolution,
            graphicPreset: rec.graphicPreset,
            source: "ACTUAL_PRESENTMON",
            avgFps: rec.avgFps,
            low1PercentFps: rec.low1PercentFps,
            low01PercentFps: rec.low01PercentFps || null,
            frametimeMs: rec.frametimeMs,
            durationSeconds: rec.durationSeconds,
            bottleneckType: rec.bottleneckType || "BALANCED",
          },
        });
      }
    }

    // 4. Chạy Rule Engine tự động để tạo khuyến nghị
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

    // 5. Cập nhật LinkSession liên kết thành công
    await prisma.linkSession.update({
      where: { id: session.id },
      data: {
        status: "LINKED",
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
  } catch (error) {
    console.error("Lỗi khi xử lý submit telemetry:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ khi lưu trữ dữ liệu phần cứng" },
      { status: 500 }
    );
  }
}
