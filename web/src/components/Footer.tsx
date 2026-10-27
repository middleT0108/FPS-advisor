import Link from "next/link";
import { ShieldCheck, Heart, Terminal } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950/70 text-gray-400 py-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-lg text-white">FPS Advisor</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30">
                v1.0.0
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Nền tảng chẩn đoán hiệu năng, dự đoán FPS chính xác và tư vấn tối ưu
              PC chuyên sâu cho game thủ eSports.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>100% An toàn Anti-Cheat (Vanguard, VAC, ACE)</span>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Tuyên bố minh bạch dữ liệu</h4>
            <ul className="text-xs space-y-2 text-gray-400">
              <li>
                <strong className="text-gray-300">• Ước tính từ Database:</strong> Dựa trên thông số phần cứng đối chiếu kho cấu hình chuẩn.
              </li>
              <li>
                <strong className="text-gray-300">• Ước tính từ Benchmark:</strong> Tính toán trực tiếp từ điểm CPU/GPU máy bạn đo được.
              </li>
              <li>
                <strong className="text-gray-300">• Đo thực tế (PresentMon):</strong> Ghi nhận qua ETW Kernel của Windows, độ chính xác tuyệt đối.
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Tài nguyên & Mã nguồn</h4>
            <div className="space-y-2 text-sm">
              <Link href="/link" className="block text-gray-400 hover:text-indigo-400 transition-colors">
                Liên kết máy qua mã 6 ký tự
              </Link>
              <Link href="/games" className="block text-gray-400 hover:text-indigo-400 transition-colors">
                Danh sách game hỗ trợ
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-gray-400 hover:text-indigo-400 transition-colors"
              >
                <Terminal className="w-4 h-4" />
                Mã nguồn mở trên GitHub (24/7 Deployment)
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-900 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500">
          <p>© {new Date().getFullYear()} FPS Advisor. Mọi thông số ước tính mang tính tham chiếu khoa học.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Xây dựng với <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" /> cho cộng đồng PC Gaming.
          </p>
        </div>
      </div>
    </footer>
  );
}
