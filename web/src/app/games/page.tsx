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
} from "lucide-react";

function GamesFpsContent() {
  const searchParams = useSearchParams();
  const [profileId, setProfileId] = useState<string | null>(null);

  const [games, setGames] = useState<any[]>([]);
  const [selectedGameKey, setSelectedGameKey] = useState<string>("valorant");
  const [selectedResolution, setSelectedResolution] = useState<string>("1080p");
  const [estimateData, setEstimateData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pId = searchParams.get("profileId") || localStorage.getItem("active_profile_id");
    if (pId) {
      setProfileId(pId);
    }
  }, [searchParams]);

  // Load danh sách game
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

  // Khi chọn game hoặc profileId đổi thì tải tính toán FPS
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Gamepad2 className="w-8 h-8 text-indigo-400" />
            Dự đoán & Đo lường FPS theo Game
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

                <div className="mt-6 pt-4 border-t border-gray-800 text-xs">
                  <div className="flex items-center justify-between text-gray-400 mb-1">
                    <span>Trần CPU:</span>
                    <span className="text-gray-200">{est.cpuLimitedFps} FPS</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-400 mb-2">
                    <span>Trần GPU:</span>
                    <span className="text-gray-200">{est.gpuLimitedFps} FPS</span>
                  </div>
                  <div className="text-[11px] font-medium text-gray-400">
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
