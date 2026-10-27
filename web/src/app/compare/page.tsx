"use client";

import { useEffect, useState } from "react";
import { GitCompare, Cpu, Monitor, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ComparePage() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Baseline tham chiếu chuẩn của hệ thống
  const baseline = {
    name: "Cấu hình chuẩn eSports (Tham chiếu)",
    cpuName: "AMD Ryzen 5 5600 6-Core",
    gpuName: "NVIDIA GeForce RTX 3060 12GB",
    ramText: "16 GB DDR4-3200 (Dual Channel)",
    cpuSingleScore: 1450,
    cpuMultiScore: 11000,
    gpuScore: 8500,
    ramBandwidthGb: 48.0,
  };

  useEffect(() => {
    const pId = localStorage.getItem("active_profile_id");
    if (pId) {
      setProfileId(pId);
      fetch(`/api/profile/${pId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setProfile(data.data);
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const userBench = profile?.benchmarkResult;
  const userCpuSingle = userBench ? userBench.cpuSingleScore : 1200;
  const userCpuMulti = userBench ? userBench.cpuMultiScore : 8500;
  const userGpu = userBench ? userBench.gpuScore : 6500;
  const userRam = userBench ? userBench.ramBandwidthMbPerSec / 1024 : 32.0;

  function renderBar(current: number, base: number, unit = "") {
    const ratio = Math.round((current / base) * 100);
    const diff = ratio - 100;
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">
            {current} {unit} so với {base} {unit}
          </span>
          <span
            className={`font-bold ${
              diff >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {diff >= 0 ? `+${diff}%` : `${diff}%`}
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-gray-800 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              diff >= 0 ? "bg-emerald-500" : "bg-indigo-500"
            }`}
            style={{ width: `${Math.min(100, Math.max(10, ratio))}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-gray-800">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <GitCompare className="w-8 h-8 text-indigo-400" />
          So sánh cấu hình & Điểm chuẩn
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Đối chiếu trực quan sức mạnh máy tính của bạn với cấu hình máy gaming chuẩn eSports.
        </p>
      </div>

      {!profile && (
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-between">
          <p className="text-xs text-indigo-300">
            Bạn chưa liên kết máy tính. Dưới đây là bảng minh họa số liệu so sánh mẫu.
          </p>
          <Link
            href="/link"
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold whitespace-nowrap"
          >
            Liên kết máy của bạn
          </Link>
        </div>
      )}

      {/* Grid Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Máy của bạn */}
        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Máy của bạn
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">
              {profile ? "Dữ liệu thực tế" : "Dữ liệu mẫu"}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">
              {profile ? profile.cpuName : "Intel Core i5-10400F"}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              GPU: {profile ? profile.gpuName : "NVIDIA GeForce GTX 1660 Super"}
            </p>
            <p className="text-xs text-gray-400">
              RAM: {profile ? `${profile.ramTotalGb}GB (${profile.ramChannels === 2 ? "Dual" : "Single"} Channel)` : "16GB (Single Channel)"}
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-800">
            <div>
              <span className="text-xs text-gray-300 font-semibold block mb-1">
                Điểm CPU Đơn nhân
              </span>
              {renderBar(userCpuSingle, baseline.cpuSingleScore)}
            </div>

            <div>
              <span className="text-xs text-gray-300 font-semibold block mb-1">
                Điểm CPU Đa nhân
              </span>
              {renderBar(userCpuMulti, baseline.cpuMultiScore)}
            </div>

            <div>
              <span className="text-xs text-gray-300 font-semibold block mb-1">
                Điểm GPU Compute
              </span>
              {renderBar(userGpu, baseline.gpuScore)}
            </div>

            <div>
              <span className="text-xs text-gray-300 font-semibold block mb-1">
                Băng thông RAM (GB/s)
              </span>
              {renderBar(Math.round(userRam), baseline.ramBandwidthGb, "GB/s")}
            </div>
          </div>
        </div>

        {/* Cấu hình chuẩn tham chiếu */}
        <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Cấu hình chuẩn Baseline
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Mốc tham chiếu chuẩn
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">{baseline.cpuName}</h3>
            <p className="text-xs text-gray-400 mt-0.5">GPU: {baseline.gpuName}</p>
            <p className="text-xs text-gray-400">RAM: {baseline.ramText}</p>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-800">
            <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 text-xs flex justify-between">
              <span className="text-gray-400">Điểm đơn nhân mốc:</span>
              <strong className="text-white">{baseline.cpuSingleScore} pts</strong>
            </div>

            <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 text-xs flex justify-between">
              <span className="text-gray-400">Điểm đa nhân mốc:</span>
              <strong className="text-white">{baseline.cpuMultiScore} pts</strong>
            </div>

            <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 text-xs flex justify-between">
              <span className="text-gray-400">Điểm GPU Compute mốc:</span>
              <strong className="text-white">{baseline.gpuScore} pts</strong>
            </div>

            <div className="p-3 rounded-xl bg-gray-950/60 border border-gray-800 text-xs flex justify-between">
              <span className="text-gray-400">Băng thông RAM chuẩn Dual:</span>
              <strong className="text-white">{baseline.ramBandwidthGb} GB/s</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
