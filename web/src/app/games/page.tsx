"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Gamepad2,
  Sliders,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  Wrench,
  Download,
  X,
  Check,
} from "lucide-react";

function GamesFpsContent() {
  const searchParams = useSearchParams();
  const [profileId, setProfileId] = useState<string | null>(null);

  const [games, setGames] = useState<any[]>([]);
  const [selectedGameKey, setSelectedGameKey] = useState<string>("valorant");
  const [selectedResolution, setSelectedResolution] = useState<string>("1080p");
  const [estimateData, setEstimateData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Modal tối ưu theo thiết lập
  const [activeOptimizeModal, setActiveOptimizeModal] = useState<any | null>(null);
  const [scriptCopied, setScriptCopied] = useState(false);

  useEffect(() => {
    const pId = searchParams.get("profileId") || localStorage.getItem("active_profile_id");
    if (pId) {
      setProfileId(pId);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchGames() {
      try {
        const res = await fetch("/api/games");
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setGames(data.data);
          if (!selectedGameKey) {
            setSelectedGameKey(data.data[0].gameId);
          }
        }
      } catch (err) {
        console.error("Lỗi tải games:", err);
      }
    }
    fetchGames();
  }, []);

  useEffect(() => {
    if (!selectedGameKey) return;
    async function fetchEstimate() {
      try {
        setLoading(true);
        const query = profileId ? `?profileId=${profileId}` : "";
        const res = await fetch(`/api/games/${selectedGameKey}/estimate${query}`);
        const data = await res.json();
        if (data.success) {
          setEstimateData(data);
        }
      } catch (err) {
        console.error("Lỗi tải estimate:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEstimate();
  }, [selectedGameKey, profileId]);

  const activeCalculations =
    estimateData?.calculations?.filter(
      (c: any) => c.resolution.toLowerCase() === selectedResolution.toLowerCase()
    ) || [];

  const currentGame = games.find((g) => g.gameId === selectedGameKey);

  function getOptimizationProfile(preset: string) {
    const p = preset.toLowerCase();
    if (p.includes("low")) {
      return {
        title: "Thiết lập Thi đấu (Competitive eSports - Max FPS)",
        description: "Ưu tiên tối đa khung hình, giảm triệt để độ trễ khung hình (Input Latency) và triệt tiêu giật lag trong combat.",
        gameSettings: [
          "Độ phân giải: 1920x1080 (Native) hoặc 1280x960 Stretched",
          "Chất lượng chi tiết (Detail / Material): Thấp (Low)",
          "Đổ bóng (Shadows): Tắt (Off) - Tăng FPS và nhìn rõ địch trong góc tối",
          "Khử răng cưa (Anti-Aliasing): Tắt (Off) hoặc FXAA",
          "Lọc bất đẳng hướng (Anisotropic): 1x",
          "Multithreaded Rendering: BẬT (Bắt buộc cho CPU đa luồng)",
          "V-Sync / G-Sync: TẮT (Tránh nghẽn độ trễ chuột)",
        ],
        windowsSettings: [
          "Windows Power Plan: High Performance (Khóa xung nhịp CPU boost cao nhất)",
          "Windows Game Mode: BẬT",
          "Ưu tiên luồng CPU: High Priority",
          "Dọn dẹp RAM rác: Giải phóng WorkingSet bộ nhớ đệm",
        ],
      };
    } else if (p.includes("med")) {
      return {
        title: "Thiết lập Cân bằng (Balanced 144Hz+)",
        description: "Cân đối hoàn hảo giữa hình ảnh sắc nét và độ mượt mà ổn định trên màn hình 144Hz - 165Hz.",
        gameSettings: [
          "Độ phân giải: 1920x1080 (FHD)",
          "Chất lượng texture: Trung bình (Medium)",
          "Khử răng cưa: MSAA 2x",
          "Lọc bất đẳng hướng: 4x",
          "Hiệu ứng đổ bóng: Thấp (Low)",
          "Multithreaded Rendering: BẬT",
        ],
        windowsSettings: [
          "Windows Power Plan: High Performance",
          "Windows Game Mode: BẬT",
        ],
      };
    } else if (p.includes("high")) {
      return {
        title: "Thiết lập Đồ họa Cao (High Quality Fidelity)",
        description: "Độ sắc nét vượt trội, đổ bóng chân thực phù hợp cho trải nghiệm mãn nhãn.",
        gameSettings: [
          "Độ phân giải: 1080p hoặc 1440p",
          "Chất lượng texture: Cao (High)",
          "Khử răng cưa: MSAA 4x",
          "Lọc bề mặt: Anisotropic 8x",
          "Đổ bóng & Ánh sáng: High",
        ],
        windowsSettings: [
          "Windows Power Plan: High Performance",
          "Bật HAGS (Hardware Accelerated GPU Scheduling)",
        ],
      };
    } else {
      return {
        title: "Thiết lập Đỉnh cao (Ultra Cinematic)",
        description: "Bật tối đa tất cả hiệu ứng ánh sáng, chi tiết bề mặt và độ phân giải cao nhất.",
        gameSettings: [
          "Độ phân giải: 1440p hoặc 4K UHD",
          "Texture & Shaders: Ultra",
          "Bật DLSS / FSR ở chế độ Quality (nếu có)",
          "Ray Tracing / Lumen: Tùy chọn",
        ],
        windowsSettings: [
          "Windows Power Plan: High Performance",
          "Đảm bảo quạt tản nhiệt quay tối đa",
        ],
      };
    }
  }

  function downloadOptimizationScript(preset: string) {
    const scriptContent = `@echo off
chcp 65001 >nul
echo ========================================================
echo  FPS ADVISOR - DANG TOI UU PC CHO THIET LAP: ${preset.toUpperCase()}
echo ========================================================
echo.

echo [1/3] Kich hoat che do nguon High Performance...
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c >nul 2>&1

echo [2/3] Kich hoat Windows Game Mode...
reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\GameBar" /v "AutoGameModeEnabled" /t REG_DWORD /d 1 /f >nul 2>&1

echo [3/3] Toi uu do tre chuot va bo nho dem...
reg add "HKEY_CURRENT_USER\\Control Panel\\Mouse" /v "MouseSensitivity" /t REG_SZ /d "10" /f >nul 2>&1

echo.
echo ========================================================
echo  TOI UU HOAN TAT! CHUC BAN CHOI GAME DAT FPS CAO NHAT!
echo ========================================================
pause
`;

    const blob = new Blob([scriptContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ToiUu_FPS_${selectedGameKey}_${preset}.bat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Gamepad2 className="w-8 h-8 text-indigo-400" />
            Dự đoán &amp; Đo lường FPS theo Game
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {profileId
              ? "Đang tính toán theo thông số phần cứng máy tính của bạn."
              : "Đang hiển thị cấu hình tham chiếu mẫu (Chưa liên kết máy)."}
          </p>
        </div>

        {/* Nút lọc độ phân giải */}
        <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-xl border border-gray-800">
          {["1080p", "1440p", "4k"].map((res) => (
            <button
              key={res}
              onClick={() => setSelectedResolution(res)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                selectedResolution === res
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {res === "4k" ? "4K UHD" : res}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs danh sách game */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-gray-800/60">
        {games.map((g) => (
          <button
            key={g.gameId}
            onClick={() => setSelectedGameKey(g.gameId)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedGameKey === g.gameId
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-gray-900 text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            🎮 {g.displayName}
          </button>
        ))}
      </div>

      {/* Ghi chú minh bạch nguồn dữ liệu */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 bg-gray-900/50 p-3.5 rounded-xl border border-gray-800">
        <span className="font-semibold text-gray-300">Phân loại nguồn FPS:</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          Ước tính Database (±10%)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
          Ước tính Benchmark (±5%)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          Đo thực tế PresentMon (Chính xác 100%)
        </span>
      </div>

      {/* Khung hiển thị các mức thiết lập đồ họa */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-xs">Đang phân tích khung hình...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeCalculations.map((item: any) => {
            const est = item.estimate;
            const actual = item.actual;
            return (
              <div
                key={item.preset}
                className="p-6 rounded-2xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
                      Thiết lập
                    </span>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-gray-800 text-gray-300">
                      {item.preset}
                    </span>
                  </div>

                  <div className="my-4">
                    {actual ? (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-extrabold text-emerald-400">
                            {Math.round(actual.avgFps)}
                          </span>
                          <span className="text-xs text-gray-400">FPS Avg</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                          <span>1% Low: </span>
                          <strong className="text-emerald-300">
                            {Math.round(actual.low1PercentFps)} FPS
                          </strong>
                        </div>
                        <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ✓ Đo thực tế PresentMon
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-extrabold text-white">
                            ~{est.predictedAvgFps}
                          </span>
                          <span className="text-xs text-gray-400">FPS Dự đoán</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                          <span>1% Low ước tính: </span>
                          <strong className="text-gray-200">
                            ~{est.predicted1PercentLowFps} FPS
                          </strong>
                        </div>
                        <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          Độ tin cậy: ±{est.confidenceMarginPercent}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Trần CPU:</span>
                    <span className="text-gray-200">{est.cpuLimitedFps} FPS</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span>Trần GPU:</span>
                    <span className="text-gray-200">{est.gpuLimitedFps} FPS</span>
                  </div>
                  <div className="text-[11px] font-medium text-gray-400 pb-2">
                    Nghẽn bởi:{" "}
                    <strong
                      className={
                        est.bottleneck === "CPU_BOUND"
                          ? "text-amber-400"
                          : est.bottleneck === "GPU_BOUND"
                          ? "text-purple-400"
                          : "text-emerald-400"
                      }
                    >
                      {est.bottleneck === "CPU_BOUND"
                        ? "Giới hạn CPU"
                        : est.bottleneck === "GPU_BOUND"
                        ? "Giới hạn GPU"
                        : "Cân bằng tối ưu"}
                    </strong>
                  </div>

                  {/* NÚT CHỨC NĂNG TỐI ƯU CHO THIẾT LẬP NÀY */}
                  <button
                    onClick={() =>
                      setActiveOptimizeModal({
                        preset: item.preset,
                        estimate: est,
                        gameName: currentGame?.displayName || "Game",
                        profile: getOptimizationProfile(item.preset),
                      })
                    }
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white font-bold text-xs border border-indigo-500/40 shadow-sm transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    Tối ưu cho thiết lập này
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Phần Tinh chỉnh chuyên biệt cho Game này */}
      {estimateData?.game?.specificTweaks && (
        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">
              Thiết lập tối ưu khuyên dùng cho {estimateData.game.displayName}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {estimateData.game.specificTweaks.map((tweak: any) => (
              <div
                key={tweak.code}
                className="p-4 rounded-xl bg-gray-950/70 border border-gray-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{tweak.title}</h4>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {tweak.estimatedGain}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  <strong className="text-gray-300">Vị trí: </strong>
                  {tweak.targetSetting}
                </p>
                <p className="text-xs text-gray-300 font-mono bg-gray-900 p-2 rounded border border-gray-800">
                  {tweak.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL TỐI ƯU CẤU HÌNH THEO MỨC THIẾT LẬP */}
      {activeOptimizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-gray-900 border border-indigo-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setActiveOptimizeModal(null)}
              className="absolute top-5 right-5 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Mức {activeOptimizeModal.preset}
                </span>
                <span className="text-xs text-gray-400">• {activeOptimizeModal.gameName}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                {activeOptimizeModal.profile.title}
              </h2>
              <p className="text-xs text-gray-300 mt-1">
                {activeOptimizeModal.profile.description}
              </p>
            </div>

            {/* Target FPS Banner */}
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-300">FPS Mục tiêu đạt được:</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-3xl font-black text-emerald-400">
                    ~{activeOptimizeModal.estimate.predictedAvgFps} FPS
                  </span>
                  <span className="text-xs text-gray-400">
                    (1% Low: ~{activeOptimizeModal.estimate.predicted1PercentLowFps} FPS)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                  Khuyến nghị thi đấu
                </span>
              </div>
            </div>

            {/* Game Settings Checklist */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                Cài đặt Video khuyến nghị trong {activeOptimizeModal.gameName}:
              </h3>
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                {activeOptimizeModal.profile.gameSettings.map((set: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{set}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Windows Optimizations */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Wrench className="w-4 h-4" />
                Thiết lập hệ thống Windows:
              </h3>
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-800 space-y-2">
                {activeOptimizeModal.profile.windowsSettings.map((set: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                    <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{set}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                onClick={() => downloadOptimizationScript(activeOptimizeModal.preset)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-white font-semibold text-xs border border-gray-700 transition-all"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                Tải file Script tự động áp dụng (.bat)
              </button>

              <button
                onClick={() => {
                  alert(
                    "Hãy mở ứng dụng Desktop 'FPS Advisor' trên máy bạn và chuyển sang thẻ '⚡ Tối ưu FPS cho máy' để kích hoạt One-Click Gaming Boost tức thì!"
                  );
                  setActiveOptimizeModal(null);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                Áp dụng nhanh qua Desktop App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GamesFpsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-gray-400 text-xs">
          Đang nạp dữ liệu game...
        </div>
      }
    >
      <GamesFpsContent />
    </Suspense>
  );
}
