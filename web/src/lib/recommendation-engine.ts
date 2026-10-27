import { SystemHardwareInput, BenchmarkInput, BottleneckType } from "./types";
import { getAllGameProfiles } from "./game-loader";

export interface GeneratedRecommendation {
  ruleCode: string;
  category: "HARDWARE_UPGRADE" | "WINDOWS_SETTING" | "GAME_SETTING" | "THERMAL";
  title: string;
  explanation: string;
  steps: string[];
  impact: "HIGH" | "MEDIUM" | "LOW";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  estimatedFpsGain: string;
}

export function evaluateSystemRecommendations(
  system: SystemHardwareInput,
  benchmark?: BenchmarkInput,
  predominantBottleneck?: BottleneckType
): GeneratedRecommendation[] {
  const recommendations: GeneratedRecommendation[] = [];

  // 1. Luật RAM Single Channel
  if (system.ram.channels < 2) {
    recommendations.push({
      ruleCode: "REC_RAM_SINGLE_CHANNEL",
      category: "HARDWARE_UPGRADE",
      title: "RAM đang chạy Single Channel (Kênh đơn)",
      explanation:
        "Băng thông bộ nhớ bị giảm 50% do chỉ cắm 1 thanh RAM hoặc cắm sai khe cắm (slot 1-2 thay vì 2-4). Các game eSports như CS2, Valorant rất nhạy cảm với băng thông RAM.",
      steps: [
        "Kiểm tra bo mạch chủ: nếu có 4 khe, đảm bảo cắm vào khe A2 và B2 (khe 2 và 4 tính từ CPU sang).",
        "Nếu hiện tại chỉ có 1 thanh RAM, hãy mua thêm 1 thanh cùng dung lượng và bus để kích hoạt Dual Channel.",
      ],
      impact: "HIGH",
      difficulty: "MEDIUM",
      estimatedFpsGain: "+15% ~ +25% 1% Low FPS, giảm hiện tượng giật cục (micro-stutter)",
    });
  }

  // 2. Luật XMP / EXPO chưa bật
  if (!system.ram.xmpEnabled && system.ram.speedMhz <= 2666) {
    recommendations.push({
      ruleCode: "REC_XMP_DISABLED",
      category: "HARDWARE_UPGRADE",
      title: "Cấu hình XMP / EXPO chưa được kích hoạt trong BIOS",
      explanation:
        `RAM của bạn đang chạy ở xung nhịp cơ bản (${system.ram.speedMhz} MHz) thay vì mức xung tối đa của nhà sản xuất (3200MHz - 3600MHz+).`,
      steps: [
        "Khởi động lại máy tính và nhấn phím Del hoặc F2 liên tục để vào BIOS/UEFI.",
        "Tìm mục 'XMP' (Intel) hoặc 'DOCP / EXPO' (AMD).",
        "Chọn Profile 1 (hoặc mức xung định danh cao nhất).",
        "Nhấn F10 để lưu cấu hình và khởi động lại vào Windows.",
      ],
      impact: "MEDIUM",
      difficulty: "MEDIUM",
      estimatedFpsGain: "+5% ~ +12% FPS trung bình",
    });
  }

  // 3. Luật Windows Power Plan
  if (system.os.powerPlan.toLowerCase().includes("saver") || system.os.powerPlan.toLowerCase().includes("tiết kiệm")) {
    recommendations.push({
      ruleCode: "REC_POWER_PLAN_SAVER",
      category: "WINDOWS_SETTING",
      title: "Chế độ nguồn Windows đang đặt ở Power Saver",
      explanation:
        "Chế độ Tiết kiệm pin/điện giới hạn xung nhịp tối đa của CPU và đưa GPU vào trạng thái ngủ nhanh hơn, gây tụt FPS nghiêm trọng khi vào giao tranh.",
      steps: [
        "Mở Windows Settings (Win + I) -> System -> Power & battery.",
        "Tại mục 'Power mode', chuyển sang 'Best performance' (Hiệu năng cao nhất).",
        "Hoặc dùng tính năng 'Tối ưu hệ thống' trên FPS Advisor Desktop App với 1 click.",
      ],
      impact: "HIGH",
      difficulty: "EASY",
      estimatedFpsGain: "+20% ~ +40% FPS ổn định",
    });
  }

  // 4. Luật Windows Game Mode
  if (!system.os.gameModeEnabled) {
    recommendations.push({
      ruleCode: "REC_GAME_MODE_DISABLED",
      category: "WINDOWS_SETTING",
      title: "Windows Game Mode chưa được bật",
      explanation:
        "Game Mode giúp Windows ưu tiên tài nguyên CPU/GPU cho tiến trình game và tạm dừng các tác vụ chạy ngầm như Windows Update.",
      steps: [
        "Mở Windows Settings (Win + I).",
        "Chọn thẻ Gaming -> Game Mode.",
        "Gạt công tắc sang 'On'.",
      ],
      impact: "LOW",
      difficulty: "EASY",
      estimatedFpsGain: "+3% ~ +5% FPS, giảm spike lag",
    });
  }

  // 5. Luật HAGS (Hardware-Accelerated GPU Scheduling)
  if (!system.os.hagsEnabled && system.gpu.vendor.toUpperCase() === "NVIDIA") {
    recommendations.push({
      ruleCode: "REC_HAGS_DISABLED",
      category: "WINDOWS_SETTING",
      title: "Chưa bật Lập lịch GPU tăng tốc phần cứng (HAGS)",
      explanation:
        "HAGS cho phép GPU trực tiếp quản lý bộ nhớ VRAM thay vì phải qua trung gian CPU, giảm độ trễ input và cần thiết để bật DLSS 3 Frame Generation.",
      steps: [
        "Nhấp chuột phải vào màn hình Desktop -> Display settings.",
        "Kéo xuống chọn Graphics -> Change default graphics settings.",
        "Bật 'Hardware-accelerated GPU scheduling' sang On và khởi động lại máy.",
      ],
      impact: "MEDIUM",
      difficulty: "EASY",
      estimatedFpsGain: "Giảm độ trễ khung hình (Input Latency) từ 3ms - 8ms",
    });
  }

  // 6. Luật Quá nhiệt CPU (Thermal Throttling)
  if (benchmark && (benchmark.cpuThermalThrottled || benchmark.maxCpuTempC >= 88)) {
    recommendations.push({
      ruleCode: "REC_THERMAL_CPU",
      category: "THERMAL",
      title: `CPU đang bị quá nhiệt nghiêm trọng (${benchmark.maxCpuTempC.toFixed(1)}°C)`,
      explanation:
        "Nhiệt độ vượt ngưỡng an toàn khiến vi xử lý tự động hạ xung nhịp (Thermal Throttling) để chống cháy chip, gây ra hiện tượng tụt FPS (FPS drop) liên tục.",
      steps: [
        "Vệ sinh bụi bẩn bám trên cánh quạt tản nhiệt và lưới lọc bụi của case.",
        "Tháo tản nhiệt, lau sạch keo cũ và tra keo tản nhiệt chất lượng cao (như Arctic MX-4, Noctua NT-H1).",
        "Kiểm tra lại độ tiếp xúc của đế tản nhiệt và tốc độ quay của quạt trong BIOS.",
      ],
      impact: "HIGH",
      difficulty: "HARD",
      estimatedFpsGain: "Khôi phục lại 20% ~ 35% hiệu năng bị mất do tụt xung",
    });
  }

  // 7. Luật Quá nhiệt GPU (Thermal Throttling)
  if (benchmark && (benchmark.gpuThermalThrottled || benchmark.maxGpuTempC >= 86)) {
    recommendations.push({
      ruleCode: "REC_THERMAL_GPU",
      category: "THERMAL",
      title: `Card màn hình (GPU) quá nóng (${benchmark.maxGpuTempC.toFixed(1)}°C)`,
      explanation:
        "VRAM và nhân đồ họa bị quá nhiệt khiến driver hạ xung nhịp boost clock.",
      steps: [
        "Đảm bảo luồng khí trong thùng máy thông thoáng (tối thiểu 2 quạt hút phía trước và 1 quạt thổi phía sau).",
        "Dùng MSI Afterburner chỉnh đường cong quạt (Fan Curve) quay mạnh hơn khi nhiệt độ vượt 70°C.",
      ],
      impact: "HIGH",
      difficulty: "MEDIUM",
      estimatedFpsGain: "+10% ~ +18% FPS ổn định",
    });
  }

  // 8. Luật Bottleneck (CPU-bound vs GPU-bound)
  const isCpuBound =
    predominantBottleneck === "CPU_BOUND" ||
    (benchmark && benchmark.bottleneckRatio < 0.85);

  const isGpuBound =
    predominantBottleneck === "GPU_BOUND" ||
    (benchmark && benchmark.bottleneckRatio > 1.2);

  if (isCpuBound) {
    recommendations.push({
      ruleCode: "REC_BOTTLENECK_CPU",
      category: "GAME_SETTING",
      title: "Hệ thống đang bị nghẽn cổ chai tại CPU (CPU-Bound)",
      explanation:
        "GPU của bạn mạnh nhưng CPU không kịp dựng và gửi lệnh vẽ (Draw calls), khiến GPU không phát huy được 100% công suất.",
      steps: [
        "Trong cài đặt Game: Giảm Draw Distance (Tầm nhìn xa), tắt Shadow Quality (Chất lượng đổ bóng).",
        "Đóng các ứng dụng chạy ngầm ngốn CPU như Chrome nhiều tab, Discord Hardware Acceleration, hoặc phần mềm antivirus quét nền.",
        "Cân nhắc nâng cấp CPU tương thích với bo mạch chủ hiện tại.",
      ],
      impact: "HIGH",
      difficulty: "MEDIUM",
      estimatedFpsGain: "+15% ~ +30% FPS trong các pha giao tranh đông người",
    });
  } else if (isGpuBound) {
    recommendations.push({
      ruleCode: "REC_BOTTLENECK_GPU",
      category: "GAME_SETTING",
      title: "Hệ thống đang bị nghẽn tại Card đồ họa (GPU-Bound)",
      explanation:
        "Nhân đồ họa đang hoạt động ở mức 99%-100% công suất, không còn dư địa để xử lý thêm khung hình ở độ phân giải hoặc mức thiết lập hiện tại.",
      steps: [
        "Giảm độ phân giải render hoặc bật các công nghệ siêu lấy mẫu thông minh (NVIDIA DLSS, AMD FSR, Intel XeSS).",
        "Hạ các thiết lập tiêu tốn nhiều GPU: Volumetric Lighting, Shaders, Ambient Occlusion, Motion Blur.",
      ],
      impact: "HIGH",
      difficulty: "EASY",
      estimatedFpsGain: "+25% ~ +50% FPS khi kích hoạt Upscaling",
    });
  }

  // 9. Nạp thêm các khuyến nghị chuyên biệt từ từng Game profile
  const gameProfiles = getAllGameProfiles();
  for (const game of gameProfiles) {
    for (const tweak of game.specificTweaks) {
      recommendations.push({
        ruleCode: `REC_GAME_${game.gameId.toUpperCase()}_${tweak.code}`,
        category: "GAME_SETTING",
        title: `[${game.displayName}] ${tweak.title}`,
        explanation: `Vị trí: ${tweak.targetSetting}. ${tweak.recommendation}`,
        steps: [
          `Khởi động ${game.displayName}.`,
          `Tìm đến mục: ${tweak.targetSetting}.`,
          `Thiết lập: ${tweak.recommendation}.`,
        ],
        impact: "MEDIUM",
        difficulty: "EASY",
        estimatedFpsGain: tweak.estimatedGain,
      });
    }
  }

  return recommendations;
}
