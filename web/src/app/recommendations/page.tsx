"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Wrench,
  AlertCircle,
  TrendingUp,
  Sliders,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Thermometer,
} from "lucide-react";

function RecommendationsContent() {
  const searchParams = useSearchParams();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  useEffect(() => {
    const pId = searchParams.get("profileId") || localStorage.getItem("active_profile_id");
    if (pId) {
      setProfileId(pId);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchRecs() {
      if (!profileId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await fetch(`/api/recommendations?profileId=${profileId}`);
        const data = await res.json();
        if (data.success) {
          setRecommendations(data.data);
        }
      } catch (err) {
        console.error("Lỗi tải khuyến nghị:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecs();
  }, [profileId]);

  const filteredRecs = recommendations.filter((r) => {
    if (selectedFilter === "ALL") return true;
    return r.impact.toUpperCase() === selectedFilter;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Wrench className="w-8 h-8 text-indigo-400" />
            Khuyến nghị tối ưu hiệu năng
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Danh sách việc cần làm được sắp xếp theo mức độ tác động và độ khó.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2 bg-gray-900 p-1 rounded-xl border border-gray-800">
          {[
            { key: "ALL", label: "Tất cả" },
            { key: "HIGH", label: "Tác động Cao" },
            { key: "MEDIUM", label: "Trung bình" },
            { key: "LOW", label: "Thấp" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setSelectedFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedFilter === f.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-xs">Đang chạy bộ luật phân tích...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-gray-900 border border-gray-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">
            {profileId
              ? "Cấu hình của bạn đã được tối ưu rất tốt!"
              : "Chưa có dữ liệu máy tính để phân tích"}
          </h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
            {!profileId &&
              "Vui lòng tạo mã liên kết và chạy phần mềm Desktop để nhận các khuyến nghị chính xác cho máy bạn."}
          </p>
          {!profileId && (
            <a
              href="/link"
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-block"
            >
              Liên kết máy tính ngay
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecs.map((rec, idx) => {
            const isExpanded = expandedIndex === idx;
            return (
              <div
                key={rec.id || idx}
                className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden transition-all"
              >
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-gray-850"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          rec.impact === "HIGH"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : rec.impact === "MEDIUM"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        Tác động: {rec.impact === "HIGH" ? "Cao" : rec.impact === "MEDIUM" ? "Vừa" : "Thấp"}
                      </span>

                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                        Độ khó: {rec.difficulty === "EASY" ? "Dễ" : rec.difficulty === "MEDIUM" ? "Trung bình" : "Khó"}
                      </span>

                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {rec.estimatedFpsGain}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{rec.title}</h3>
                  </div>

                  <div className="text-gray-400 shrink-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-gray-800/60 bg-gray-950/40 space-y-4">
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Tại sao việc này giúp tăng FPS?
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {rec.explanation}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                        Các bước thực hiện chi tiết
                      </h4>
                      <ol className="text-xs text-gray-300 space-y-2 list-decimal list-inside bg-gray-900 p-4 rounded-xl border border-gray-800">
                        {rec.steps?.map((step: string, sIdx: number) => (
                          <li key={sIdx} className="leading-relaxed">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RecommendationsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-gray-400 text-xs">
          Đang nạp danh sách khuyến nghị...
        </div>
      }
    >
      <RecommendationsContent />
    </Suspense>
  );
}
