# DANH SÁCH CÁC HẠN CHẾ ĐÃ BIẾT & GIẢI PHÁP XỬ LÝ (KNOWN LIMITATIONS & MITIGATIONS)

Tài liệu này công khai minh bạch tất cả các giới hạn kỹ thuật đã biết của hệ thống FPS Advisor, nguyên nhân gốc rễ và cơ chế xử lý dự phòng (fallback) đã được lập trình sẵn.

---

## 1. YÊU CẦU QUYỀN ADMINISTRATOR ĐỂ ĐỌC CẢM BIẾN NHIỆT ĐỘ
* **Hiện tượng:** Khi người dùng chạy ứng dụng Desktop ở chế độ quyền người dùng thông thường (Standard User), cảm biến nhiệt độ CPU/GPU của `LibreHardwareMonitor` có thể hiển thị `-- °C`.
* **Nguyên nhân:** Trên hệ điều hành Windows, việc truy cập các thanh ghi phần cứng MSR (Model-Specific Registers) của CPU và bus I2C/SMBus của bo mạch chủ đòi hỏi driver tầng kernel (Ring 0), bắt buộc phải có quyền UAC Administrator.
* **Giải pháp xử lý đã tích hợp:** 
  - Phần mềm thiết kế cơ chế **Graceful Fallback**: Nếu không có quyền Admin, ứng dụng vẫn hoạt động bình thường, quét cấu hình qua WMI, chạy benchmark, đo FPS PresentMon mà không bị crash.
  - Khi cần giám sát nhiệt độ và hiện tượng tụt xung (Thermal Throttling), người dùng chỉ cần nhấp chuột phải vào file `.exe` và chọn **Run as administrator**.

---

## 2. TRÀN SỐ 32-BIT CỦA WMI ADAPTERRAM TRÊN GPU CÓ VRAM > 4GB
* **Hiện tượng:** Truy vấn WMI `SELECT AdapterRAM FROM Win32_VideoController` có thể trả về giá trị âm hoặc giá trị sai lệch (ví dụ card 12GB chỉ báo 4GB hoặc số âm).
* **Nguyên nhân:** Lớp WMI nguyên bản của Windows thiết kế trường `AdapterRAM` dạng số nguyên 32-bit có dấu (`uint32`), giới hạn tối đa là $4\,\text{GB}$ ($4,294,967,295\,\text{bytes}$).
* **Giải pháp xử lý đã tích hợp:**
  - Trong [`WmiHardwareScanner.cs`](file:///c:/Users/ghuol/Documents/GitHub/FPS-adivisor/desktop/src/FpsAdvisor.Core/Services/WmiHardwareScanner.cs), hệ thống đã xây dựng bộ từ điển nhận diện phần cứng tự động theo chuỗi định danh GPU (RTX 3060, 4060, 3070, 4070, 4080, 4090...) để gán đúng dung lượng VRAM thực tế nếu giá trị WMI bị tràn số.

---

## 3. KHÁC BIỆT GIỮA BENCHMARK TỔNG HỢP VÀ GIAO TRANH THỰC TẾ
* **Hiện tượng:** Điểm benchmark tổng hợp cao nhưng trong một số pha giao tranh lớn (5v5 combat tổng trong LMHT hoặc nhiều quả bom khói trong CS2) FPS có thể tụt sâu hơn ước tính.
* **Nguyên nhân:** Benchmark tổng hợp kiểm tra sức mạnh tính toán thuần túy (Compute & SIMD). Tuy nhiên trong game thực tế, các engine game phải xử lý thêm logic mạng (Network tickrate), nạp texture động từ ổ đĩa khi người chơi quay góc nhìn đột ngột, và shader phức tạp.
* **Giải pháp xử lý đã tích hợp:**
  - Hệ thống bổ sung tính toán **1% Low FPS** (thay vì chỉ dựa vào Average FPS) để phản ánh chính xác độ giật cục trong các pha combat.
  - Cung cấp tính năng **Đo FPS thực tế (ETW PresentMon)** để người dùng đo đạc trực tiếp trong trận đấu thật thay vì chỉ dựa vào benchmark tổng hợp.

---

## 4. CHẾ ĐỘ HIỂN THỊ: FULLSCREEN EXCLUSIVE VS BORDERLESS WINDOWED
* **Hiện tượng:** FPS đo được khi chơi ở chế độ Không viền (Borderless Windowed) có thể thấp hơn từ $3\% \sim 7\%$ so với Toàn màn hình độc quyền (Exclusive Fullscreen).
* **Nguyên nhân:** Ở chế độ Borderless, khung hình phải đi qua trình tổng hợp màn hình DWM (Desktop Window Manager) của Windows, làm tăng thêm 1 frame độ trễ bộ đệm.
* **Khuyến nghị:** Đối với các tựa game eSports bắn súng nhạy cảm độ trễ như Valorant và CS2, luôn ưu tiên chọn chế độ **Fullscreen Exclusive** trong cài đặt đồ họa của game.

---

## 5. BIẾN THỂ CỦA POWER PLAN GUID TRÊN CÁC BẢN WINDOWS
* **Hiện tượng:** Một số bản Windows 11 Home hoặc laptop văn phòng có thể bị khóa (ẩn) gói nguồn High Performance nguyên bản (`8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c`).
* **Giải pháp xử lý đã tích hợp:**
  - [`SystemOptimizer.cs`](file:///c:/Users/ghuol/Documents/GitHub/FPS-adivisor/desktop/src/FpsAdvisor.Core/Optimizer/SystemOptimizer.cs) luôn sao lưu GUID của Power Plan hiện tại trước khi thay đổi.
  - Nếu lệnh chuyển power plan gặp lỗi, hệ thống bắt ngoại lệ an toàn và thông báo rõ ràng cho người dùng mà không làm thay đổi các thiết lập khác.
