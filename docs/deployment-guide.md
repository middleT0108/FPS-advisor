# HƯỚNG DẪN TRIỂN KHAI GITHUB & VẬN HÀNH 24/7 (DEPLOYMENT GUIDE)

Tài liệu này hướng dẫn chi tiết cách đưa toàn bộ hệ thống FPS Advisor lên **GitHub** và thiết lập để hệ thống tự động chạy **24/7 online hoàn toàn miễn phí** hoặc trên VPS cá nhân.

---

## 1. ĐẨY MÃ NGUỒN LÊN GITHUB

Mở PowerShell tại thư mục gốc của dự án (`FPS-advisor`):

```powershell
# 1. Khởi tạo Git repository (nếu chưa có)
git init

# 2. Thêm tất cả các file vào Git (.gitignore sẽ tự động loại bỏ node_modules, bin, obj, database)
git add .

# 3. Tạo commit đầu tiên
git commit -m "feat: complete initial release of FPS Advisor (Web + Desktop + Engine + Tests)"

# 4. Đổi tên nhánh chính sang main
git branch -M main

# 5. Liên kết với repository trên GitHub của bạn
# (Thay your-username và FPS-advisor bằng link repo GitHub của bạn)
git remote add origin https://github.com/your-username/FPS-advisor.git

# 6. Đẩy code lên GitHub
git push -u origin main
```

---

## 2. TRIỂN KHAI WEBSITE 24/7 (HOÀN TOÀN MIỄN PHÍ)

### Phương án A: Vercel + Neon PostgreSQL (Khuyên dùng - 100% Free)
Phương án này giúp Website online 24/7 trên hạ tầng toàn cầu của Vercel mà không tốn 1 đồng chi phí máy chủ.

1. **Tạo Database PostgreSQL miễn phí trên [Neon.tech](https://neon.tech):**
   - Đăng ký tài khoản Neon (đăng nhập bằng GitHub).
   - Tạo Project mới (chọn Region Singapore hoặc Tokyo để tốc độ về Việt Nam nhanh nhất).
   - Sao chép chuỗi kết nối `DATABASE_URL` (dạng `postgresql://user:password@ep-cool.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`).
2. **Deploy lên [Vercel](https://vercel.com):**
   - Đăng nhập Vercel bằng tài khoản GitHub.
   - Bấm **Add New** -> **Project** -> Chọn repository `FPS-advisor`.
   - Tại mục **Root Directory**, chọn thư mục `web`.
   - Tại mục **Environment Variables**, thêm biến:
     - `DATABASE_URL`: Dán chuỗi kết nối PostgreSQL từ Neon ở bước 1.
   - Tại file `web/prisma/schema.prisma`, khi deploy lên PostgreSQL, đổi `provider = "sqlite"` thành `provider = "postgresql"`.
   - Bấm **Deploy**. Sau 1-2 phút, bạn sẽ có link web dạng `https://fps-advisor.vercel.app` chạy 24/7!

---

### Phương án B: Docker Compose trên VPS cá nhân (Ubuntu / Debian / Oracle Free Tier)
Nếu bạn có VPS riêng (ví dụ Oracle Cloud Free Tier, DigitalOcean, Hetzner...):

1. Clone code về VPS:
   ```bash
   git clone https://github.com/your-username/FPS-advisor.git
   cd FPS-advisor
   ```
2. Khởi chạy 24/7 bằng Docker Compose:
   ```bash
   docker compose up -d --build
   ```
3. Website sẽ chạy liên tục trên cổng `3000`. Dữ liệu database được lưu persistent trong volume `web-data`.

---

## 3. PHÂN PHỐI DESKTOP APP 24/7 QUA GITHUB RELEASES

Hệ thống đã được cài đặt sẵn GitHub Actions workflow tại:
[`.github/workflows/desktop-release.yml`](file:///c:/Users/ghuol/Documents/GitHub/FPS-adivisor/.github/workflows/desktop-release.yml)

### Cách tạo bản phát hành tự động:
Mỗi khi bạn muốn xuất bản phiên bản Desktop App mới cho người dùng tải về:

```powershell
# Tạo tag phiên bản mới
git tag v1.0.0

# Đẩy tag lên GitHub
git push origin v1.0.0
```

**Điều gì sẽ xảy ra?**
1. GitHub Actions sẽ tự động kích hoạt máy chủ Windows ảo của GitHub.
2. Biên dịch mã nguồn .NET 8 WPF ở chế độ Release tối ưu (`win-x64`).
3. Đóng gói thành file zip: `FpsAdvisor-Desktop-win-x64.zip`.
4. Tự động tạo bản phát hành trên trang **Releases** của GitHub repository.
5. Người dùng trên toàn cầu có thể tải trực tiếp file zip về giải nén và chạy ngay lập tức 24/7 với băng thông cực nhanh của GitHub.

---

## 4. KẾT NỐI DESKTOP APP VỚI WEBSITE 24/7

Khi Website đã online (ví dụ tại `https://fps-advisor.vercel.app`):
1. Người dùng mở file `appsettings.json` trong thư mục Desktop App:
   ```json
   {
     "ApiBaseUrl": "https://fps-advisor.vercel.app"
   }
   ```
2. Hoặc người dùng chỉ cần gõ trực tiếp địa chỉ web vào ô **"Địa chỉ Website API"** ở thẻ **"5. Liên kết Website"** trên giao diện Desktop App.
3. Nhập mã 6 ký tự hiển thị trên web $\to$ Bấm **"Gửi lên Website ngay"**. Dữ liệu sẽ đồng bộ xuyên lục địa trong vòng dưới 1 giây.
