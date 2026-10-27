"use client";

import Link from "next/link";
import {
  Download,
  ShieldAlert,
  Zap,
  BarChart3,
  Sliders,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const games = [
    { name: "Valorant", engine: "Unreal Engine 4", antiCheat: "Riot Vanguard" },
    { name: "Counter-Strike 2", engine: "Source 2", antiCheat: "Valve Anti-Cheat" },
    { name: "Liên Minh Huyền Thoại", engine: "Proprietary", antiCheat: "Riot Vanguard" },
    { name: "Delta Force", engine: "Unreal Engine 5", antiCheat: "ACE Anti-Cheat" },
  ];

  return (
    <div className="space-y-24 py-12">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5" />
          Phiên bản 1.0.0 - Sẵn sàng triển khai 24/7
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Biết trước FPS của bạn.{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Tối ưu hiệu năng PC an toàn tuyệt đối.
          </span>
        </h1>

        <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Phần mềm Desktop quét thông số phần cứng, chạy benchmark tổng hợp và đo
          FPS thực tế qua PresentMon (ETW), đồng bộ lên Website với mã liên kết 6 ký tự.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/downloads/FpsAdvisor-Desktop-win-x64.zip"
            download="FpsAdvisor-Desktop-win-x64.zip"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <Download className="w-5 h-5" />
            Tải Desktop App (.zip)
          </a>

          <a
            href="/downloads/FpsAdvisor.Desktop.exe"
            download="FpsAdvisor.Desktop.exe"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-base shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02]"
          >
            <Download className="w-5 h-5" />
            Tải file chạy trực tiếp (.exe)
          </a>

          <Link
            href="/link"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold text-base border border-gray-700 transition-all"
          >
            Nhập mã liên kết 6 ký tự
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Anti-cheat Banner */}
        <div className="mt-12 max-w-2xl mx-auto p-4 rounded-xl bg-gray-900/60 border border-emerald-500/30 flex items-start sm:items-center gap-3 text-left">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-xs text-gray-300 leading-normal">
            <strong className="text-emerald-400 font-semibold">100% An toàn Anti-Cheat: </strong>
            Phần mềm CHỈ ĐỌC thông số qua WMI và ETW kernel. Tuyệt đối không hook,
            không inject DLL, không đọc bộ nhớ game của Vanguard, VAC hay ACE.
          </p>
        </div>
      </section>

      {/* 3 Nguồn FPS minh bạch */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Minh bạch nguồn gốc dữ liệu FPS
          </h2>
          <p className="text-gray-400 text-sm mt-2">
            FPS Advisor nói KHÔNG với các con số tự bịa. Mọi số liệu đều được phân loại rõ ràng.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 hover:border-blue-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold mb-4">
              A
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Ước tính từ Database</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Đối chiếu thông số phần cứng (CPU, GPU, RAM Dual/Single channel, VRAM)
              với cơ sở dữ liệu mẫu đã kiểm chứng theo từng game profile JSON.
            </p>
            <span className="text-xs text-blue-400 font-medium bg-blue-500/10 px-2.5 py-1 rounded">
              Sai số tham chiếu: ±10%
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 hover:border-purple-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold mb-4">
              B
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Ước tính từ Benchmark</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Dựa trên điểm số đo được từ bài test CPU đa luồng, GPU compute shader,
              băng thông RAM và kiểm tra throttling nhiệt độ thực tế của máy.
            </p>
            <span className="text-xs text-purple-400 font-medium bg-purple-500/10 px-2.5 py-1 rounded">
              Độ chính xác cao: ±5%
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-4">
              C
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Đo thực tế (PresentMon)</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Ghi nhận trực tiếp khi bạn đang trong trận đấu qua Event Tracing for Windows.
              Cung cấp chi tiết Avg FPS, 1% Low, 0.1% Low và biểu đồ Frametime.
            </p>
            <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded">
              Số liệu thực tế 100%
            </span>
          </div>
        </div>
      </section>

      {/* Games hỗ trợ ban đầu */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">4 Tựa game eSports hỗ trợ</h2>
            <p className="text-sm text-gray-400 mt-1">
              Kiến trúc JSON module cho phép thêm bất kỳ game nào mà không cần sửa code web.
            </p>
          </div>
          <Link
            href="/games"
            className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 mt-4 sm:mt-0"
          >
            Xem bảng FPS chi tiết <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {games.map((g) => (
            <div
              key={g.name}
              className="p-5 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-indigo-500/50 transition-all group"
            >
              <div className="h-28 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center font-bold text-lg text-gray-300 group-hover:text-white transition-colors">
                🎮 {g.name}
              </div>
              <h3 className="font-bold text-white text-base mt-4">{g.name}</h3>
              <p className="text-xs text-gray-400 mt-1">Engine: {g.engine}</p>
              <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
                <span className="text-gray-500">Anti-Cheat:</span>
                <span className="text-gray-300 font-medium">{g.antiCheat}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow 3 bước */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
            Cách thức hoạt động
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black mx-auto text-lg">
                1
              </div>
              <h3 className="font-bold text-white text-lg">Tạo mã liên kết</h3>
              <p className="text-sm text-gray-400">
                Truy cập trang Liên kết trên web để lấy mã 6 ký tự (Ví dụ: A7X9K2).
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black mx-auto text-lg">
                2
              </div>
              <h3 className="font-bold text-white text-lg">Chạy Desktop App</h3>
              <p className="text-sm text-gray-400">
                Mở ứng dụng Windows, bấm Quét cấu hình / Chạy Benchmark và nhập mã 6 ký tự.
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black mx-auto text-lg">
                3
              </div>
              <h3 className="font-bold text-white text-lg">Xem chẩn đoán & Khuyến nghị</h3>
              <p className="text-sm text-gray-400">
                Website ngay lập tức hiển thị FPS từng game, phát hiện nghẽn cổ chai và hướng dẫn tối ưu từng bước.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
