import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Đang khởi tạo dữ liệu mẫu (Seeding database)...");

  // Xóa dữ liệu cũ nếu có
  await prisma.recommendationLog.deleteMany();
  await prisma.fpsRecord.deleteMany();
  await prisma.benchmarkResult.deleteMany();
  await prisma.linkSession.deleteMany();
  await prisma.systemProfile.deleteMany();

  // Tạo Profile mẫu 1: Máy cấu hình khá (Ryzen 5 5600 + RTX 3060)
  const profile1 = await prisma.systemProfile.create({
    data: {
      cpuName: "AMD Ryzen 5 5600 6-Core Processor",
      cpuCores: 6,
      cpuThreads: 12,
      cpuBaseClockMhz: 3500,
      cpuBoostClockMhz: 4400,
      cpuCacheL3Mb: 32.0,

      gpuName: "NVIDIA GeForce RTX 3060",
      gpuVendor: "NVIDIA",
      gpuVramMb: 12288,
      gpuDriverVersion: "560.94",
      gpuClockMhz: 1777,

      ramTotalGb: 16.0,
      ramSpeedMhz: 3200,
      ramChannels: 2,
      ramXmpEnabled: true,

      diskModel: "Samsung SSD 980 1TB",
      diskType: "NVME_SSD",
      displayResolution: "1920x1080",
      displayRefreshRate: 144,

      osName: "Windows 11 Pro 64-bit",
      osVersion: "23H2",
      powerPlan: "High Performance",
      gameModeEnabled: true,
      hagsEnabled: true,
    },
  });

  // Benchmark cho Profile 1
  await prisma.benchmarkResult.create({
    data: {
      systemProfileId: profile1.id,
      cpuSingleScore: 1480,
      cpuMultiScore: 11200,
      gpuScore: 8750,
      ramBandwidthMbPerSec: 46200.0,
      diskReadMbPerSec: 3450.0,
      diskWriteMbPerSec: 2980.0,
      maxCpuTempC: 71.5,
      maxGpuTempC: 67.2,
      cpuThermalThrottled: false,
      gpuThermalThrottled: false,
      bottleneckRatio: 0.96, // Cân bằng tốt
    },
  });

  // Kết quả đo thực tế PresentMon mẫu
  await prisma.fpsRecord.createMany({
    data: [
      {
        systemProfileId: profile1.id,
        gameKey: "cs2",
        resolution: "1080p",
        graphicPreset: "High",
        source: "ACTUAL_PRESENTMON",
        avgFps: 202.4,
        low1PercentFps: 124.6,
        low01PercentFps: 88.2,
        frametimeMs: 4.9,
        durationSeconds: 180,
        bottleneckType: "BALANCED",
      },
      {
        systemProfileId: profile1.id,
        gameKey: "valorant",
        resolution: "1080p",
        graphicPreset: "High",
        source: "ACTUAL_PRESENTMON",
        avgFps: 312.8,
        low1PercentFps: 188.5,
        low01PercentFps: 132.0,
        frametimeMs: 3.2,
        durationSeconds: 240,
        bottleneckType: "CPU_BOUND",
      },
    ],
  });

  // Khuyến nghị mẫu
  await prisma.recommendationLog.createMany({
    data: [
      {
        systemProfileId: profile1.id,
        ruleCode: "REC_GAME_CS2_LAUNCH_OPTIONS",
        category: "GAME_SETTING",
        title: "[Counter-Strike 2] Tối ưu Launch Options CS2",
        explanation: "Thêm tham số tickrate và giảm sleep trễ vòng lặp của engine Source 2",
        steps: JSON.stringify([
          "Mở Steam -> Thư viện game -> Nhấp chuột phải vào Counter-Strike 2 -> Properties",
          "Tại mục Launch Options, dán lệnh: -nojoy +engine_low_latency_sleep_after_client_tick true",
        ]),
        impact: "MEDIUM",
        difficulty: "EASY",
        estimatedFpsGain: "+5% ~ +10% 1% Low FPS",
      },
      {
        systemProfileId: profile1.id,
        ruleCode: "REC_GAME_VALORANT_VAL_RAWINPUT_BUFFER",
        category: "GAME_SETTING",
        title: "[Valorant] Bật RawInputBuffer",
        explanation: "Xử lý trực tiếp buffer chuột qua Windows API để giảm giật khung hình khi vẩy chuột nhanh",
        steps: JSON.stringify([
          "Vào Cài đặt Valorant -> General",
          "Kéo xuống mục Other -> Chuyển RawInputBuffer sang On",
        ]),
        impact: "LOW",
        difficulty: "EASY",
        estimatedFpsGain: "Giảm trễ input lag",
      },
    ],
  });

  // Tạo sẵn mã liên kết mẫu "TEST01" để kiểm tra ngay
  await prisma.linkSession.create({
    data: {
      code: "TEST01",
      status: "LINKED",
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 năm
      linkedAt: new Date(),
      systemProfileId: profile1.id,
    },
  });

  console.log("Seeding hoàn tất!");
  console.log(`Mã liên kết test đã tạo: 'TEST01' trỏ tới profileId: ${profile1.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
