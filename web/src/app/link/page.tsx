"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle2, ShieldAlert, ArrowRight, Copy, Check } from "lucide-react";

export default function LinkPage() {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<"PENDING" | "LINKED" | "EXPIRED">("PENDING");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<any>(null);
  const [manualCode, setManualCode] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  // Tạo mã mới
  async function generateNewCode() {
    setLoading(true);
    setStatus("PENDING");
    setProfileId(null);
    setProfilePreview(null);
    try {
      const res = await fetch("/api/link/create", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCode(data.data.code);
        // Lưu tạm vào localStorage để các trang khác có thể tham chiếu profileId sau này
        localStorage.setItem("current_link_code", data.data.code);
      }
    } catch (err) {
      console.error("Lỗi tạo mã:", err);
    } finally {
      setLoading(false);
    }
  }

  // Tự động sinh mã khi vào trang lần đầu
  useEffect(() => {
    generateNewCode();
  }, []);

  // Polling kiểm tra trạng thái mỗi 3 giây nếu trạng thái là PENDING
  useEffect(() => {
    if (!code || status !== "PENDING") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/link/status?code=${code}`);
        const data = await res.json();
        if (data.success) {
          if (data.data.status === "LINKED") {
            setStatus("LINKED");
            setProfileId(data.data.systemProfileId);
            setProfilePreview(data.data.preview);
            if (data.data.systemProfileId) {
              localStorage.setItem("active_profile_id", data.data.systemProfileId);
            }
          } else if (data.data.status === "EXPIRED") {
            setStatus("EXPIRED");
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [code, status]);

  function copyToClipboard() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Kiểm tra mã thủ công
  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setManualError(null);
    if (!manualCode || manualCode.trim().length !== 6) {
      setManualError("Mã phải gồm đúng 6 ký tự");
      return;
    }
    const cleanCode = manualCode.trim().toUpperCase();
    try {
      const res = await fetch(`/api/link/status?code=${cleanCode}`);
      const data = await res.json();
      if (data.success && data.data.systemProfileId) {
        localStorage.setItem("active_profile_id", data.data.systemProfileId);
        router.push(`/profile/${data.data.systemProfileId}`);
      } else if (data.success && data.data.status === "PENDING") {
        setCode(cleanCode);
        setStatus("PENDING");
      } else {
        setManualError(data.error || "Mã không hợp lệ hoặc chưa liên kết");
      }
    } catch {
      setManualError("Không thể kết nối đến máy chủ");
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-white">Liên kết máy tính của bạn</h1>
        <p className="text-gray-400 text-sm mt-2 max-w-xl mx-auto">
          Mở phần mềm Desktop FPS Advisor trên máy tính Windows của bạn, sau đó nhập
          mã liên kết 6 ký tự bên dưới để đồng bộ dữ liệu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Khung tạo mã tự động */}
        <div className="p-8 rounded-2xl bg-gray-900 border border-gray-800 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
              Mã kết nối hiện tại
            </span>
            <button
              onClick={generateNewCode}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Đổi mã mới
            </button>
          </div>

          {/* Hiển thị Code */}
          <div className="flex justify-center items-center gap-2 sm:gap-3 my-6">
            {code ? (
              code.split("").map((char, idx) => (
                <div
                  key={idx}
                  className="w-12 h-16 sm:w-14 sm:h-20 rounded-xl bg-gray-800 border-2 border-indigo-500/40 flex items-center justify-center text-2xl sm:text-3xl font-black text-indigo-400 shadow-inner tracking-widest"
                >
                  {char}
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-sm py-6">Đang khởi tạo mã...</div>
            )}
          </div>

          {/* Nút copy */}
          {code && (
            <div className="flex justify-center mb-6">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-750 text-xs font-semibold text-gray-300 border border-gray-700 transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Đã sao chép: {code}
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-400" />
                    Sao chép mã {code}
                  </>
                )}
              </button>
            </div>
          )}

          {/* Trạng thái liên kết */}
          <div className="p-4 rounded-xl border bg-gray-950/60 transition-all">
            {status === "PENDING" && (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping shrink-0" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-300">Đang chờ Desktop App...</h4>
                  <p className="text-xs text-gray-400">
                    Vui lòng mở ứng dụng trên Windows và nhập mã {code}
                  </p>
                </div>
              </div>
            )}

            {status === "LINKED" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span className="font-bold text-sm">Đã liên kết thành công!</span>
                </div>
                {profilePreview && (
                  <div className="text-xs text-gray-300 bg-gray-900 p-2.5 rounded border border-gray-800">
                    <p>• CPU: {profilePreview.cpuName}</p>
                    <p>• GPU: {profilePreview.gpuName}</p>
                    <p>• RAM: {profilePreview.ramTotalGb} GB</p>
                  </div>
                )}
                <button
                  onClick={() => router.push(`/profile/${profileId}`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/30 transition-all"
                >
                  Xem hồ sơ & Chẩn đoán FPS ngay
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {status === "EXPIRED" && (
              <div className="text-center py-2">
                <p className="text-xs text-rose-400 font-semibold mb-2">
                  Mã này đã hết hạn sau 15 phút.
                </p>
                <button
                  onClick={generateNewCode}
                  className="px-3 py-1.5 rounded bg-gray-800 text-xs text-white hover:bg-gray-700"
                >
                  Tạo mã mới
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Khung hướng dẫn & Tra cứu mã cũ */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
            <h3 className="font-bold text-white text-base mb-4">Các bước thực hiện</h3>
            <ol className="text-xs text-gray-300 space-y-3 list-decimal list-inside leading-relaxed">
              <li>
                <strong className="text-white">Mở Desktop App:</strong> Khởi chạy phần mềm FPS Advisor trên Windows (chạy quyền Administrator để có đầy đủ thông số nhiệt độ).
              </li>
              <li>
                <strong className="text-white">Kiểm tra thông số:</strong> Bấm nút <em>"Quét cấu hình"</em> hoặc <em>"Chạy Benchmark"</em>.
              </li>
              <li>
                <strong className="text-white">Đồng ý chia sẻ:</strong> Bấm <em>"Gửi lên Website"</em>, chọn đồng ý chính sách quyền riêng tư và dán mã 6 ký tự trên vào ô.
              </li>
            </ol>
          </div>

          <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
            <h3 className="font-bold text-white text-base mb-2">Đã có mã từ trước?</h3>
            <p className="text-xs text-gray-400 mb-4">
              Nhập mã 6 ký tự của bạn để mở lại kết quả chẩn đoán đã lưu.
            </p>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                maxLength={6}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="Nhập 6 ký tự (VD: A7X9K2)"
                className="w-full px-3.5 py-2.5 rounded-lg bg-gray-950 border border-gray-700 text-white font-mono tracking-widest text-center uppercase focus:border-indigo-500 focus:outline-none"
              />
              {manualError && (
                <p className="text-xs text-rose-400">{manualError}</p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-semibold text-xs transition-colors"
              >
                Tra cứu hồ sơ máy
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
