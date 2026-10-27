"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Cpu,
  Monitor,
  HardDrive,
  Flame,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
} from "lucide-react";

export default function ProfileDetailPage() {
  const params = useParams();
  const profileId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        setLoading(true);
        const res = await fetch(`/api/profile/${profileId}`);
        const data = await res.json();
        if (data.success) {
          setProfile(data.data);
          localStorage.setItem("active_profile_id", profileId);
        } else {
          setError(data.error || "Không tìm thấy hồ sơ");
        }
      } catch {
        setError("Lỗi kết nối khi tải hồ sơ");
      } finally {
        setLoading(false);
      }
    }
    if (profileId) {
      fetchProfile();
    }
  }, [profileId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Đang nạp hồ sơ phần cứng...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Không tìm thấy hồ sơ máy</h2>
        <p className="text-sm text-gray-400 mb-6">{error}</p>
        <Link
          href="/link"
          className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
        >
          Tạo mã liên kết mới
        </Link>
      </div>
    );
  }

  const bench = profile.benchmarkResult;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Đã đồng bộ
            </span>
            <span className="text-xs text-gray-400">
              Mã máy: {profile.id.substring(0, 8)}...
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {profile.cpuName} • {profile.gpuName}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Quét lúc: {new Date(profile.createdAt).toLocaleString("vi-VN")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/games?profileId=${profile.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30"
          >
            Dự đoán FPS các game
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/recommendations?profileId=${profile.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-xs border border-gray-700"
          >
            Khuyến nghị tối ưu ({profile.recommendations?.length || 0})
          </Link>
        </div>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Card */}
        <div className="p-5 rounded-xl bg-gray-900 border border-gray-800">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-3">
            <Cpu className="w-4 h-4" />
            VI XỬ LÝ (CPU)
          </div>
          <h3 className="font-bold text-white text-sm mb-1">{profile.cpuName}</h3>
          <p className="text-xs text-gray-400">
            {profile.cpuCores} Nhân / {profile.cpuThreads} Luồng
          </p>
          <div className="mt-4 pt-3 border-t border-gray-800 text-xs space-y-1 text-gray-300">
            <p>• Base / Boost: {profile.cpuBaseClockMhz} / {profile.cpuBoostClockMhz} MHz</p>
            <p>• L3 Cache: {profile.cpuCacheL3Mb} MB</p>
          </div>
        </div>

        {/* GPU Card */}
        <div className="p-5 rounded-xl bg-gray-900 border border-gray-800">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold mb-3">
            <Monitor className="w-4 h-4" />
            ĐỒ HỌA (GPU)
          </div>
          <h3 className="font-bold text-white text-sm mb-1">{profile.gpuName}</h3>
          <p className="text-xs text-gray-400">
            VRAM: {(profile.gpuVramMb / 1024).toFixed(1)} GB GDDR
          </p>
          <div className="mt-4 pt-3 border-t border-gray-800 text-xs space-y-1 text-gray-300">
            <p>• Driver: {profile.gpuDriverVersion}</p>
            <p>• Hãng: {profile.gpuVendor}</p>
          </div>
        </div>

        {/* RAM Card */}
        <div className="p-5 rounded-xl bg-gray-900 border border-gray-800">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-3">
            <Layers className="w-4 h-4" />
            BỘ NHỚ RAM
          </div>
          <h3 className="font-bold text-white text-sm mb-1">
            {profile.ramTotalGb} GB @ {profile.ramSpeedMhz} MHz
          </h3>
          <p className="text-xs text-gray-400">
            Kênh: {profile.ramChannels === 2 ? "Dual Channel (Tốt)" : "Single Channel (Cần nâng)"}
          </p>
          <div className="mt-4 pt-3 border-t border-gray-800 text-xs space-y-1 text-gray-300">
            <p>• XMP / EXPO: {profile.ramXmpEnabled ? "Đã bật (Tối ưu)" : "Chưa bật"}</p>
          </div>
        </div>

        {/* System & OS Card */}
        <div className="p-5 rounded-xl bg-gray-900 border border-gray-800">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-3">
            <HardDrive className="w-4 h-4" />
            LƯU TRỮ & HỆ ĐIỀU HÀNH
          </div>
          <h3 className="font-bold text-white text-sm mb-1">{profile.diskModel}</h3>
          <p className="text-xs text-gray-400">Chuẩn: {profile.diskType}</p>
          <div className="mt-4 pt-3 border-t border-gray-800 text-xs space-y-1 text-gray-300">
            <p>• {profile.osName}</p>
            <p>• Game Mode: {profile.gameModeEnabled ? "Bật" : "Tắt"}</p>
            <p>• Power: {profile.powerPlan}</p>
          </div>
        </div>
      </div>

      {/* Benchmark & Thermals Section */}
      {bench ? (
        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Kết quả Synthetic Benchmark</h2>
            </div>
            <span className="text-xs text-gray-400">
              Đo độc lập bằng Desktop Engine (Không ảnh hưởng Anti-cheat)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            <div className="p-4 rounded-xl bg-gray-950/70 border border-gray-800">
              <span className="text-xs text-gray-400">CPU Đơn nhân</span>
              <p className="text-xl font-bold text-indigo-400 mt-1">{bench.cpuSingleScore}</p>
              <span className="text-[10px] text-gray-500">Điểm quy chuẩn</span>
            </div>
            <div className="p-4 rounded-xl bg-gray-950/70 border border-gray-800">
              <span className="text-xs text-gray-400">CPU Đa nhân</span>
              <p className="text-xl font-bold text-indigo-400 mt-1">{bench.cpuMultiScore}</p>
              <span className="text-[10px] text-gray-500">Điểm quy chuẩn</span>
            </div>
            <div className="p-4 rounded-xl bg-gray-950/70 border border-gray-800">
              <span className="text-xs text-gray-400">GPU Compute</span>
              <p className="text-xl font-bold text-purple-400 mt-1">{bench.gpuScore}</p>
              <span className="text-[10px] text-gray-500">Điểm quy chuẩn</span>
            </div>
            <div className="p-4 rounded-xl bg-gray-950/70 border border-gray-800">
              <span className="text-xs text-gray-400">Băng thông RAM</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">
                {(bench.ramBandwidthMbPerSec / 1024).toFixed(1)} GB/s
              </p>
              <span className="text-[10px] text-gray-500">Tốc độ đọc/ghi</span>
            </div>
            <div className="p-4 rounded-xl bg-gray-950/70 border border-gray-800">
              <span className="text-xs text-gray-400">Nhiệt độ CPU Max</span>
              <p
                className={`text-xl font-bold mt-1 ${
                  bench.maxCpuTempC >= 85 ? "text-rose-400" : "text-gray-200"
                }`}
              >
                {bench.maxCpuTempC.toFixed(1)}°C
              </p>
              <span className="text-[10px] text-gray-500">
                {bench.cpuThermalThrottled ? "Tụt xung do quá nhiệt!" : "Ổn định"}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-gray-950/70 border border-gray-800">
              <span className="text-xs text-gray-400">Nhiệt độ GPU Max</span>
              <p
                className={`text-xl font-bold mt-1 ${
                  bench.maxGpuTempC >= 85 ? "text-rose-400" : "text-gray-200"
                }`}
              >
                {bench.maxGpuTempC.toFixed(1)}°C
              </p>
              <span className="text-[10px] text-gray-500">
                {bench.gpuThermalThrottled ? "Tụt xung GPU!" : "Ổn định"}
              </span>
            </div>
          </div>

          {/* Phân tích nghẽn cổ chai Bottleneck */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider">
                Đánh giá cân bằng cấu hình
              </span>
              <h4 className="font-bold text-white text-base mt-0.5">
                {bench.bottleneckRatio < 0.88
                  ? "⚠️ Hệ thống đang bị nghẽn cổ chai ở CPU (CPU-Bound)"
                  : bench.bottleneckRatio > 1.15
                  ? "⚠️ Hệ thống đang bị nghẽn cổ chai ở GPU (GPU-Bound)"
                  : "✅ Hệ thống hoạt động cân bằng tối ưu giữa CPU và GPU"}
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                Tỷ số hiệu năng tính toán: {bench.bottleneckRatio.toFixed(2)} (Chuẩn cân bằng: 0.90 ~ 1.10)
              </p>
            </div>
            <Link
              href={`/recommendations?profileId=${profile.id}`}
              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white whitespace-nowrap"
            >
              Xem giải pháp khắc phục
            </Link>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800 text-center py-10">
          <Activity className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <h3 className="font-bold text-white text-base">Chưa có dữ liệu Benchmark</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto mt-1 mb-4">
            Hãy mở Desktop App và bấm "Chạy Benchmark tổng hợp" (30-60 giây) để đo nhiệt độ và điểm số thực tế.
          </p>
        </div>
      )}
    </div>
  );
}
