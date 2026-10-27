import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGameProfileByKey } from "@/lib/game-loader";
import { calculateEstimatedFps, SystemMetrics } from "@/lib/fps-estimator";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const gameKey = params.key;
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    const game = getGameProfileByKey(gameKey);
    if (!game) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy hồ sơ game '${gameKey}'` },
        { status: 404 }
      );
    }

    // Thiết lập metrics mặc định (nếu chưa có profileId liên kết)
    let metrics: SystemMetrics = {
      cpuSingleScore: game.referenceBaseline.hardware.cpuSingleScoreBaseline,
      cpuMultiScore: game.referenceBaseline.hardware.cpuMultiScoreBaseline,
      gpuScore: game.referenceBaseline.hardware.gpuScoreBaseline,
      ramGb: 16,
      ramChannels: 2,
      gpuVramMb: 8192,
      cpuThermalThrottled: false,
      gpuThermalThrottled: false,
    };

    let actualRecords: any[] = [];

    if (profileId) {
      const profile = await prisma.systemProfile.findUnique({
        where: { id: profileId },
        include: {
          benchmarkResult: true,
          fpsRecords: {
            where: { gameKey: gameKey.toLowerCase() },
          },
        },
      });

      if (profile) {
        actualRecords = profile.fpsRecords;

        // Nếu có benchmark thực tế thì lấy điểm thực tế
        if (profile.benchmarkResult) {
          metrics = {
            cpuSingleScore: profile.benchmarkResult.cpuSingleScore,
            cpuMultiScore: profile.benchmarkResult.cpuMultiScore,
            gpuScore: profile.benchmarkResult.gpuScore,
            ramGb: profile.ramTotalGb,
            ramChannels: profile.ramChannels,
            gpuVramMb: profile.gpuVramMb,
            cpuThermalThrottled: profile.benchmarkResult.cpuThermalThrottled,
            gpuThermalThrottled: profile.benchmarkResult.gpuThermalThrottled,
          };
        } else {
          // Chưa chạy benchmark tổng hợp: ước lượng sơ bộ điểm số từ thông số phần cứng
          const estSingle = Math.min(1800, profile.cpuBoostClockMhz * 0.35);
          const estMulti = estSingle * profile.cpuThreads * 0.7;
          const estGpu = profile.gpuVramMb >= 8192 ? 8000 : 4500;
          metrics = {
            cpuSingleScore: Math.round(estSingle),
            cpuMultiScore: Math.round(estMulti),
            gpuScore: estGpu,
            ramGb: profile.ramTotalGb,
            ramChannels: profile.ramChannels,
            gpuVramMb: profile.gpuVramMb,
            cpuThermalThrottled: false,
            gpuThermalThrottled: false,
          };
        }
      }
    }

    const resolutions = ["1080p", "1440p", "4k"];
    const presets = ["Low", "Medium", "High", "Ultra"];

    const calculations: any[] = [];

    for (const res of resolutions) {
      for (const preset of presets) {
        const est = calculateEstimatedFps(game, metrics, res, preset);
        if (est) {
          // Tìm xem có bản ghi đo thực tế PresentMon không
          const actual = actualRecords.find(
            (r) =>
              r.resolution.toLowerCase() === res.toLowerCase() &&
              r.graphicPreset.toLowerCase() === preset.toLowerCase()
          );

          calculations.push({
            resolution: res,
            preset,
            estimate: est,
            actual: actual
              ? {
                  avgFps: actual.avgFps,
                  low1PercentFps: actual.low1PercentFps,
                  low01PercentFps: actual.low01PercentFps,
                  frametimeMs: actual.frametimeMs,
                  durationSeconds: actual.durationSeconds,
                  source: "ACTUAL_PRESENTMON",
                }
              : null,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      game: {
        gameId: game.gameId,
        displayName: game.displayName,
        developer: game.developer,
        engine: game.engine,
        antiCheat: game.antiCheat,
        specificTweaks: game.specificTweaks,
      },
      calculations,
    });
  } catch (error) {
    console.error("Lỗi khi ước tính FPS:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tính toán FPS" },
      { status: 500 }
    );
  }
}
