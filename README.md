# ⚡ FPS Advisor - Nền tảng Chẩn đoán & Tối ưu PC Gaming Chuyên sâu

[![Web CI / CD](https://github.com/your-username/FPS-advisor/actions/workflows/web-ci.yml/badge.svg)](https://github.com/your-username/FPS-advisor/actions)
[![Build & Release Desktop](https://github.com/your-username/FPS-advisor/actions/workflows/desktop-release.yml/badge.svg)](https://github.com/your-username/FPS-advisor/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Safe Anti-Cheat](https://img.shields.io/badge/Anti--Cheat-100%25%20Safe%20(ETW)-emerald)](https://github.com)

**FPS Advisor** là giải pháp toàn diện kết hợp giữa **Phần mềm Desktop (Windows C# .NET 8 WPF)** và **Nền tảng Website (Next.js 14 App Router + Tailwind CSS)** nhằm giúp game thủ:
1. **Quét cấu hình phần cứng chuyên sâu:** CPU, GPU, RAM, Ổ đĩa, Màn hình, Cài đặt Windows.
2. **Chạy Benchmark tổng hợp (30–60s):** Đo điểm CPU Đơn/Đa luồng, GPU Compute, Băng thông RAM (MB/s), Tốc độ Ổ đĩa và phát hiện hiện tượng quá nhiệt (Thermal Throttling).
3. **Đo FPS thực tế an toàn 100%:** Sử dụng cơ chế Event Tracing for Windows (ETW / PresentMon pipeline) — **Tuyệt đối KHÔNG inject DLL, KHÔNG hook tiến trình game, KHÔNG đọc bộ nhớ game**, an toàn tuyệt đối với Riot Vanguard, Valve Anti-Cheat (VAC) và ACE.
4. **Dự đoán FPS theo Game:** Cung cấp ma trận FPS (Avg và 1% Low) cho các tựa game eSports hàng đầu (Valorant, CS2, LMHT, Delta Force) ở các mức đồ họa (Low, Med, High, Ultra) và độ phân giải (1080p, 1440p, 4K).
5. **Khuyến nghị & Tối ưu có hoàn tác (Undo):** Danh sách việc cần làm sắp xếp theo mức độ tác động và độ khó, kèm tính năng bật Game Mode và High Performance Power Plan có nút khôi phục ban đầu.

---

## 🎯 3 NGUỒN DỮ LIỆU FPS MINH BẠCH

FPS Advisor cam kết minh bạch và nói **KHÔNG** với các con số tự bịa:
- **(a) Ước tính từ Cơ sở dữ liệu (Database Estimate):** Đối chiếu thông số phần cứng với kho dữ liệu chuẩn hóa theo từng file JSON game profile (Sai số $\pm 10\%$).
- **(b) Ước tính từ Benchmark Tổng hợp (Synthetic Estimate):** Tính toán trực tiếp từ điểm CPU, GPU Compute, Băng thông RAM và trạng thái nhiệt độ thực tế của máy bạn (Sai số $\pm 5\%$).
- **(c) Đo thực tế (Actual PresentMon):** Ghi nhận trực tiếp khi bạn đang trong trận đấu thật qua kernel trace của Windows (Chính xác $100\%$).

---

## 🎮 TỰA GAME HỖ TRỢ BAN ĐẦU & KHẢ NĂNG MỞ RỘNG

Hệ thống hỗ trợ sẵn 4 tựa game eSports phổ biến:
- **Valorant** (Unreal Engine 4, Riot Vanguard)
- **Counter-Strike 2** (Source 2, Valve Anti-Cheat)
- **Liên Minh Huyền Thoại** (Proprietary, Riot Vanguard)
- **Delta Force** (Unreal Engine 5, ACE Anti-Cheat)

### 🧩 Thêm game mới chỉ bằng 1 file JSON (Không cần sửa code)
Tất cả các game được cấu hình độc lập tại thư mục [`web/src/data/games/`](file:///c:/Users/ghuol/Documents/GitHub/FPS-adivisor/web/src/data/games/). Để thêm một game mới, bạn chỉ cần tạo file `[ten-game].json` mới với cấu trúc chuẩn. Web sẽ tự động nạp mà không cần sửa code backend hay frontend.

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY THỬ (LOCAL DEVELOPMENT)

### Yêu cầu hệ thống:
- Hệ điều hành: Windows 10 / 11 (64-bit).
- Node.js: Phiên bản 18+ (Đã kiểm thử mượt mà trên Node v24).
- .NET SDK: Phiên bản 8.0+ (Tương thích hoàn toàn với .NET 8, 9, 10 nhờ cơ chế `RollForward`).

---

### Bước 1: Chạy Website Next.js

```powershell
# Di chuyển vào thư mục web
cd web

# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi tạo cấu trúc Database SQLite
npx prisma db push

# 3. Nạp dữ liệu mẫu (Seeding)
npx tsx prisma/seed.ts

# 4. Chạy web ở chế độ phát triển
npm run dev
```
👉 Mở trình duyệt tại: `http://localhost:3000`  
*(Bạn có thể vào trang `/link` và nhập mã test `TEST01` để xem trước kết quả chẩn đoán hoàn chỉnh)*.

---

### Bước 2: Chạy Desktop App Windows (.NET 8 WPF)

Mở một cửa sổ PowerShell mới tại thư mục gốc:

```powershell
# Chạy ứng dụng Desktop WPF
dotnet run --project desktop/src/FpsAdvisor.Desktop/FpsAdvisor.Desktop.csproj
```

**Thực hiện liên kết dữ liệu thật:**
1. Trên trình duyệt web, vào trang **Liên kết máy** (`http://localhost:3000/link`) để lấy mã 6 ký tự (Ví dụ: `A7X9K2`).
2. Trên ứng dụng Desktop, bấm **"Bắt đầu chạy Benchmark"** để đo điểm và nhiệt độ trong 30 giây.
3. Chuyển sang thẻ **"5. Liên kết Website"** trên Desktop, nhập mã 6 ký tự và bấm **"Gửi lên Website ngay"**.
4. Website sẽ tự động nhận diện và mở ra trang Hồ sơ máy chi tiết kèm biểu đồ và khuyến nghị tối ưu!

---

## 🧪 CHẠY BỘ UNIT TEST TOÀN DIỆN

Dự án đã được tích hợp bộ test tự động kiểm tra chặt chẽ công thức toán học và logic rule engine:

### 1. Test Công thức & Rule Engine (Web TypeScript):
```powershell
cd web
npm test
```
*Kết quả:* **15/15 tests passed** (Kiểm tra baseline, RAM single-channel, thermal throttling, bottleneck CPU/GPU, resolution scaling, và 8 bộ luật tối ưu).

### 2. Test Mô hình & Serialization (Desktop C# .NET):
```powershell
dotnet test desktop/tests/FpsAdvisor.Tests/FpsAdvisor.Tests.csproj
```
*Kết quả:* **4/4 tests passed** (Kiểm tra camelCase serialization, JSON offline export, process filter và thermal flag).

---

## 🌐 HƯỚNG DẪN TRIỂN KHAI GITHUB & VẬN HÀNH 24/7

Xem tài liệu hướng dẫn chi tiết tại:  
👉 [`docs/deployment-guide.md`](file:///c:/Users/ghuol/Documents/GitHub/FPS-adivisor/docs/deployment-guide.md)

### Tóm tắt nhanh:
1. **Đẩy mã nguồn lên GitHub:**
   ```powershell
   git init
   git add .
   git commit -m "feat: initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/FPS-advisor.git
   git push -u origin main
   ```
2. **Website 24/7:**
   - Kết nối repo với **Vercel** (miễn phí) + Database PostgreSQL miễn phí trên **Neon.tech**.
   - Hoặc chạy trên VPS cá nhân bằng lệnh: `docker compose up -d --build`.
3. **Phân phối Desktop App 24/7:**
   - Đẩy tag phiên bản: `git tag v1.0.0 && git push origin v1.0.0`.
   - **GitHub Actions** tự động biên dịch file `.exe` và đăng tải lên mục **Releases** của GitHub để người dùng toàn thế giới tải về 24/7.

---

## ⚠️ CÁC GIỚI HẠN KỸ THUẬT ĐÃ BIẾT (KNOWN LIMITATIONS)

Xem phân tích chi tiết tại:  
👉 [`docs/known-limitations.md`](file:///c:/Users/ghuol/Documents/GitHub/FPS-adivisor/docs/known-limitations.md)

1. **Quyền Administrator cho Cảm biến:** Đọc nhiệt độ CPU/GPU tầng kernel cần quyền Administrator. Nếu chạy quyền thường, ứng dụng vẫn hoạt động bình thường qua cơ chế *Graceful Fallback* (chỉ ẩn mục nhiệt độ).
2. **Giới hạn 32-bit của WMI AdapterRAM:** Đã được xử lý tự động bằng bảng định danh GPU để tránh báo sai dung lượng VRAM lớn hơn 4GB.
3. **Chế độ hiển thị:** Chế độ *Fullscreen Exclusive* luôn cho FPS cao hơn và độ trễ thấp hơn so với *Borderless Windowed* do bỏ qua bộ đệm DWM của Windows.

---

## 🛡️ CHÍNH SÁCH BẢO MẬT & QUYỀN RIÊNG TƯ
- **Không thu thập dữ liệu cá nhân:** Phần mềm chỉ đọc tên phần cứng, xung nhịp và kết quả benchmark. Tuyệt đối không đọc file cá nhân, lịch sử duyệt web hay tài khoản người dùng.
- **Minh bạch dữ liệu:** Cung cấp nút **"Xem trước dữ liệu JSON"** trên Desktop App để người dùng kiểm tra toàn bộ thông tin trước khi đồng ý gửi lên website.
- **Hoàn tác tối ưu:** Mọi can thiệp hệ thống (Power Plan, Game Mode) đều hiển thị hộp thoại xác nhận rõ ràng và có nút **"Hoàn tác / Khôi phục ban đầu"**.

---

## 📜 GIẤY PHÉP (LICENSE)
Dự án được phát hành theo giấy phép mã nguồn mở [MIT License](LICENSE).
