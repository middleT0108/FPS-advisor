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
  Zap,
  Download,
  Copy,
  Check,
  RotateCcw,
  Monitor,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

interface AutomatableAction {
  actionTitle: string;
  summary: string;
  description: string;
  restartRequired: boolean;
  powershellCmd: string;
  batScript: string;
  undoScript?: string;
}

function getAutomatableAction(rec: any): AutomatableAction | null {
  const code = (rec.ruleCode || "").toUpperCase();
  const title = (rec.title || "").toLowerCase();

  // 1. HAGS (Hardware-accelerated GPU Scheduling)
  if (code.includes("HAGS") || title.includes("hags") || title.includes("lập lịch gpu")) {
    return {
      actionTitle: "Bật Lập lịch GPU tăng tốc phần cứng (HAGS)",
      summary: "Ghi giá trị HwSchMode = 2 vào Windows Registry (HKLM GraphicsDrivers)",
      description:
        "HAGS cho phép GPU trực tiếp quản lý bộ nhớ VRAM thay vì phải thông qua CPU, giảm độ trễ khung hình (Input Latency) từ 3ms - 8ms và là điều kiện tiên quyết để kích hoạt DLSS 3 Frame Generation.",
      restartRequired: true,
      powershellCmd: `Set-ItemProperty -Path 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers' -Name 'HwSchMode' -Value 2 -Type DWord`,
      batScript: `@echo off
chcp 65001 >nul
title FPS Advisor - Bat Lap Lich GPU (HAGS)

:: Kiem tra va tu dong yeu cau quyen Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [FPS ADVISOR] Dang yeu cau quyen Administrator de chinh sua Registry...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ===================================================================
echo   FPS ADVISOR - TU DONG BAT LAP LICH GPU TANG TOC PHAN CUNG (HAGS)
echo ===================================================================
echo.
echo Dang ghi gia tri HwSchMode = 2 vao HKLM GraphicsDrivers...
reg add "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" /v "HwSchMode" /t REG_DWORD /d 2 /f >nul 2>&1

if %errorLevel% equ 0 (
    echo.
    echo [THANH CONG] Da kich hoat HAGS thanh cong vao he thong!
    echo.
    echo ===================================================================
    echo * QUAN TRONG: Vui long KHOI DONG LAI MAY TINH de Windows va GPU
    echo   nhan dien che do lap lich moi.
    echo ===================================================================
) else (
    echo.
    echo [THAT BAI] Khong the ghi Registry. Vui long chay voi quyen Run as Administrator.
)
echo.
pause
`,
      undoScript: `@echo off
chcp 65001 >nul
net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)
reg add "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" /v "HwSchMode" /t REG_DWORD /d 1 /f >nul 2>&1
echo [HOAN TAC] Da tat HAGS (khoi phuc mac dinh). Vui long khoi dong lai may.
pause
`,
    };
  }

  // 2. Windows Game Mode
  if (code.includes("GAME_MODE") || title.includes("game mode")) {
    return {
      actionTitle: "Kích hoạt Windows Game Mode",
      summary: "Bật chế độ Game Mode trong Registry (HKCU GameBar AutoGameModeEnabled = 1)",
      description:
        "Game Mode ưu tiên 100% tài nguyên CPU/GPU cho cửa sổ trò chơi, ngăn ngừa hiện tượng giật lag do Windows Update hoặc các tiến trình ngầm quấy rầy.",
      restartRequired: false,
      powershellCmd: `Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\GameBar' -Name 'AutoGameModeEnabled' -Value 1 -Type DWord`,
      batScript: `@echo off
chcp 65001 >nul
title FPS Advisor - Bat Windows Game Mode
echo ===================================================================
echo   FPS ADVISOR - TU DONG BAT WINDOWS GAME MODE
echo ===================================================================
echo.
reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\GameBar" /v "AutoGameModeEnabled" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\GameBar" /v "AllowAutoGameMode" /t REG_DWORD /d 1 /f >nul 2>&1
echo [THANH CONG] Windows Game Mode da duoc bat tuc thi!
echo.
pause
`,
      undoScript: `@echo off
chcp 65001 >nul
reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\GameBar" /v "AutoGameModeEnabled" /t REG_DWORD /d 0 /f >nul 2>&1
echo [HOAN TAC] Da tat Windows Game Mode.
pause
`,
    };
  }

  // 3. Power Plan Saver / Performance
  if (code.includes("POWER_PLAN") || title.includes("power") || title.includes("nguồn") || title.includes("hiệu năng")) {
    return {
      actionTitle: "Kích hoạt Chế độ Nguồn High Performance",
      summary: "Chuyển Power Scheme sang High Performance (8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c)",
      description:
        "Ngăn chặn CPU hạ xung đột ngột để tiết kiệm pin/điện. Giữ xung nhịp xử lý luôn ở mức Boost cao nhất khi vào trận.",
      restartRequired: false,
      powershellCmd: `powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c`,
      batScript: `@echo off
chcp 65001 >nul
title FPS Advisor - Kich hoat High Performance
echo ===================================================================
echo   FPS ADVISOR - CHUYEN CHE DO NGUON HIGH PERFORMANCE
echo ===================================================================
echo.
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c >nul 2>&1
if %errorLevel% neq 0 (
    echo Dang khoi tao scheme High Performance moi...
    powercfg -duplicatescheme 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c >nul 2>&1
    powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c >nul 2>&1
)
echo [THANH CONG] Da kich hoat High Performance Power Plan!
echo.
pause
`,
      undoScript: `@echo off
chcp 65001 >nul
powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e >nul 2>&1
echo [HOAN TAC] Da tra che do nguon ve Balanced (Can bang).
pause
`,
    };
  }

  // 4. Bottleneck CPU / GameDVR
  if (code.includes("BOTTLENECK_CPU") || title.includes("cpu-bound") || title.includes("nghẽn cổ chai tại cpu")) {
    return {
      actionTitle: "Tắt Xbox GameDVR ngầm & Tối ưu luồng CPU",
      summary: "Vô hiệu hóa tiến trình ghi video nền GameDVR ngốn 10-15% CPU",
      description:
        "Tắt hoàn toàn tính năng tự động quay video nền của Windows Xbox Game Bar, giúp giải phóng các luồng CPU bị chiếm dụng cho game chính.",
      restartRequired: false,
      powershellCmd: `Set-ItemProperty -Path 'HKCU:\\System\\GameConfigStore' -Name 'GameDVR_Enabled' -Value 0 -Type DWord; Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR' -Name 'AllowGameDVR' -Value 0 -Type DWord`,
      batScript: `@echo off
chcp 65001 >nul
title FPS Advisor - Toi uu CPU & Tat GameDVR
net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)
echo Dang tat tinh nang ghi hinh GameDVR nen...
reg add "HKEY_CURRENT_USER\\System\\GameConfigStore" /v "GameDVR_Enabled" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR" /v "AllowGameDVR" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" /v "AppCaptureEnabled" /t REG_DWORD /d 0 /f >nul 2>&1
echo [THANH CONG] Da giai phong CPU va tat GameDVR nen!
pause
`,
    };
  }

  // 5. CS2 Launch Options
  if (code.includes("CS2_LAUNCH") || title.includes("launch options cs2")) {
    return {
      actionTitle: "Áp dụng Launch Options CS2",
      summary: "Cấu hình tham số khởi động: -novid -high -threads 6 +fps_max 0 -nojoy",
      description:
        "Bỏ qua video mở đầu, ưu tiên mức tài nguyên High cho tiến trình CS2, vô hiệu hóa tay cầm joystick không dùng để tăng 5-10% 1% Low FPS.",
      restartRequired: false,
      powershellCmd: `Set-Clipboard -Value "-novid -high -threads 6 +fps_max 0 -nojoy"`,
      batScript: `@echo off
chcp 65001 >nul
title FPS Advisor - Launch Options CS2
echo ===================================================================
echo   THAM SO LAUNCH OPTIONS TOI UU CHO CS2
echo ===================================================================
echo.
echo Tham so duoc khuyen nghi:
echo   -novid -high -threads 6 +fps_max 0 -nojoy
echo.
echo Dang copy vao Clipboard bo nho dem cua ban...
powershell -Command "Set-Clipboard -Value '-novid -high -threads 6 +fps_max 0 -nojoy'"
echo.
echo [DA COPY] Hay mo Steam -> Chuot phai CS2 -> Properties -> Dan vao o Launch Options!
pause
`,
    };
  }

  return null;
}

function RecommendationsContent() {
  const searchParams = useSearchParams();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  // Modal State
  const [activeModalRec, setActiveModalRec] = useState<any | null>(null);
  const [isAllInOneModal, setIsAllInOneModal] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

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

  const automatableCount = recommendations.filter((r) => getAutomatableAction(r) !== null).length;

  function triggerDownload(content: string, filename: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadAllInOneScript() {
    const masterBat = `@echo off
chcp 65001 >nul
title FPS Advisor - Master Optimization Script

net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Dang yeu cau quyen Administrator de toi uu toan bo he thong...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ===================================================================
echo       FPS ADVISOR - TU DONG FIX TOAN BO KHUYEN NGHI KHA DUNG
echo ===================================================================
echo.

echo [1/4] Kich hoat Lap lich GPU tang toc phan cung (HAGS)...
reg add "HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" /v "HwSchMode" /t REG_DWORD /d 2 /f >nul 2>&1

echo [2/4] Kich hoat Windows Game Mode...
reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\GameBar" /v "AutoGameModeEnabled" /t REG_DWORD /d 1 /f >nul 2>&1
reg add "HKEY_CURRENT_USER\\Software\\Microsoft\\GameBar" /v "AllowAutoGameMode" /t REG_DWORD /d 1 /f >nul 2>&1

echo [3/4] Kich hoat Che do nguon High Performance...
powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c >nul 2>&1

echo [4/4] Giai phong CPU va tat ghi hinh GameDVR ngam...
reg add "HKEY_CURRENT_USER\\System\\GameConfigStore" /v "GameDVR_Enabled" /t REG_DWORD /d 0 /f >nul 2>&1
reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR" /v "AllowGameDVR" /t REG_DWORD /d 0 /f >nul 2>&1

echo.
echo ===================================================================
echo [HOAN TAT] Da tu dong sua va toi uu tat ca thiet lap Windows!
echo * LUU Y: Vui long KHOI DONG LAI MAY TINH de HAGS va Driver co hieu luc.
echo ===================================================================
pause
`;
    triggerDownload(masterBat, "FPS-Advisor-FixAll-Recommendations.bat");
  }

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
            Danh sách việc cần làm được sắp xếp theo mức độ tác động và hỗ trợ tự động hóa 1-Click.
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

      {/* Quick Auto-Fix Action Banner */}
      {!loading && recommendations.length > 0 && automatableCount > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-emerald-950/60 border border-indigo-500/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0 border border-indigo-500/30">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Tự động hóa &amp; Sửa lỗi thông minh
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {automatableCount} lỗi có thể tự động sửa
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1">
                Phần mềm có thể tự động bật HAGS, Game Mode, Power Plan và tắt các dịch vụ ngốn CPU mà không cần bạn chỉnh tay phức tạp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAllInOneModal(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Zap className="w-4 h-4" />
              Tự động sửa tất cả ({automatableCount})
            </button>
          </div>
        </div>
      )}

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
            const autoAction = getAutomatableAction(rec);

            return (
              <div
                key={rec.id || idx}
                className={`rounded-2xl bg-gray-900 border transition-all ${
                  autoAction ? "border-indigo-500/20 hover:border-indigo-500/40" : "border-gray-800"
                } overflow-hidden`}
              >
                <div
                  onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-gray-850"
                >
                  <div className="space-y-1.5 flex-1">
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

                      {autoAction ? (
                        <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5" /> Hỗ trợ tự động bật
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded">
                          Thao tác thủ công
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white">{rec.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    {autoAction && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveModalRec(rec);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5 text-yellow-300" />
                        Tự động bật
                      </button>
                    )}

                    <div className="text-gray-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-gray-800/60 bg-gray-950/40 space-y-4">
                    {/* Explanation */}
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Tại sao việc này giúp tăng FPS?
                      </h4>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        {rec.explanation}
                      </p>
                    </div>

                    {/* Auto-Action Highlight Box inside expanded card */}
                    {autoAction && (
                      <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            Tính năng Tự động hóa 1-Click
                          </div>
                          {autoAction.restartRequired && (
                            <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                              Cần khởi động lại máy sau khi bật
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-300">
                          {autoAction.summary}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            onClick={() => setActiveModalRec(rec)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            Tự động bật lỗi này ngay
                          </button>
                          <button
                            onClick={() =>
                              triggerDownload(
                                autoAction.batScript,
                                `TuDongBat_${rec.ruleCode || "Fix"}.bat`
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium flex items-center gap-1.5 transition-all"
                          >
                            <Download className="w-3.5 h-3.5 text-indigo-400" />
                            Tải file Script (.bat)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Manual Steps */}
                    <div>
                      <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                        Các bước thực hiện chi tiết (Nếu làm thủ công)
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

      {/* SINGLE FIX MODAL */}
      {activeModalRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Zap className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {getAutomatableAction(activeModalRec)?.actionTitle || "Tự động bật tính năng"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    Sửa nhanh cấu hình hệ thống an toàn &amp; chính xác
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveModalRec(null);
                  setCopiedCmd(false);
                }}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            {(() => {
              const action = getAutomatableAction(activeModalRec);
              if (!action) return null;

              return (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 text-xs text-gray-300 space-y-2">
                    <div className="font-semibold text-white">Cách thức phần mềm tự động hóa:</div>
                    <p className="leading-relaxed">{action.description}</p>
                    {action.restartRequired && (
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          Sau khi chạy file, vui lòng <strong>Khởi động lại máy tính (Restart PC)</strong> để Windows nạp driver GPU mới.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Option 1: One-Click .BAT */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-300">
                      Cách 1: Tải file tự động chạy (Khuyên dùng)
                    </div>
                    <button
                      onClick={() =>
                        triggerDownload(
                          action.batScript,
                          `TuDongBat_${activeModalRec.ruleCode || "Fix"}.bat`
                        )
                      }
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      Tải file Script Tự Động Bật (.bat)
                    </button>
                    <p className="text-[11px] text-gray-400 text-center">
                      * Tải về và nhấp đúp để chạy (Tự động yêu cầu quyền Admin an toàn).
                    </p>
                  </div>

                  {/* Option 2: Copy PowerShell */}
                  <div className="space-y-2 pt-2 border-t border-gray-800">
                    <div className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                      <span>Cách 2: Chạy trực tiếp qua PowerShell (Admin)</span>
                      {copiedCmd && (
                        <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                          <Check className="w-3 h-3" /> Đã sao chép!
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={action.powershellCmd}
                        className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-300 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(action.powershellCmd);
                          setCopiedCmd(true);
                          setTimeout(() => setCopiedCmd(false), 2000);
                        }}
                        className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Sao chép
                      </button>
                    </div>
                  </div>

                  {/* Option 3: Undo script if available */}
                  {action.undoScript && (
                    <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Muốn khôi phục về mặc định?</span>
                      <button
                        onClick={() =>
                          triggerDownload(action.undoScript!, `HoanTac_${activeModalRec.ruleCode || "Fix"}.bat`)
                        }
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Tải Script Hoàn tác (Undo)
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ALL-IN-ONE MASTER FIX MODAL */}
      {isAllInOneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Tự động sửa tất cả ({automatableCount}) khuyến nghị
                  </h3>
                  <p className="text-xs text-gray-400">
                    Gói tối ưu toàn diện chỉ trong 1 lần chạy duy nhất
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAllInOneModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-950 border border-gray-800 space-y-2.5">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Các mục sẽ được tự động kích hoạt:
                </div>
                <ul className="text-xs text-gray-300 space-y-1.5 list-disc list-inside">
                  <li><strong>Lập lịch GPU (HAGS):</strong> Bật HwSchMode = 2 cho GPU NVIDIA/AMD.</li>
                  <li><strong>Windows Game Mode:</strong> Kích hoạt ưu tiên tài nguyên CPU/GPU cho Game.</li>
                  <li><strong>Power Plan:</strong> Chuyển sang High Performance scheme.</li>
                  <li><strong>Xbox GameDVR:</strong> Tắt tiến trình ghi hình nền gây hao tổn CPU.</li>
                </ul>
              </div>

              <button
                onClick={downloadAllInOneScript}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Download className="w-4 h-4 text-yellow-300" />
                Tải Script Tự Động Sửa Tất Cả (.bat)
              </button>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Sau khi file chạy xong, hãy <strong>Khởi động lại máy tính</strong> để GPU áp dụng HAGS và đạt FPS tối đa!
                </span>
              </div>
            </div>
          </div>
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
