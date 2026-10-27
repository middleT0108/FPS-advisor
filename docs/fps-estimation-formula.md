# PHƯƠNG PHÁP LUẬN & CÔNG THỨC ƯỚC TÍNH FPS (FPS ADVISOR FORMULA)

Tài liệu này mô tả chi tiết cơ sở toán học, các giả định kỹ thuật và phương pháp hiệu chỉnh được sử dụng trong công cụ ước tính FPS của FPS Advisor.

---

## 1. NGUYÊN LÝ CỐT LÕI

Trong kiến trúc máy tính gaming, một khung hình (frame) muốn hiển thị lên màn hình phải trải qua 2 giai đoạn nối tiếp:
1. **Giai đoạn CPU (Simulation & Draw Call Generation):** CPU tính toán logic game, vật lý, chuyển động nhân vật, âm thanh và gửi các lệnh vẽ (Draw calls) sang cho GPU.
2. **Giai đoạn GPU (Rasterization & Shading):** GPU nhận các lệnh vẽ, tính toán đổ bóng pixel, ánh sáng, xử lý texture và ghi vào frame buffer để xuất ra màn hình.

Vì hai giai đoạn này phụ thuộc lẫn nhau, tốc độ khung hình (FPS) của toàn bộ hệ thống bị chặn bởi thành phần chậm nhất:
$$\text{FPS}_{\text{Dự đoán}} = \min(\text{FPS}_{\text{CPU\_Limit}}, \text{FPS}_{\text{GPU\_Limit}})$$

---

## 2. CÔNG THỨC CHI TIẾT

### Bước 1: Tính tỷ số sức mạnh vi xử lý (Effective CPU Ratio)
Game hiện đại đòi hỏi cả xung nhịp đơn nhân cao lẫn khả năng đa luồng tốt. Tỷ số sức mạnh CPU so với hệ thống tham chiếu mốc ($S_{\text{single\_base}}, S_{\text{multi\_base}}$) được tính theo trọng số $70\% - 30\%$:
$$R_{\text{cpu}} = 0.70 \times \left(\frac{S_{\text{cpu\_single}}}{S_{\text{single\_base}}}\right) + 0.30 \times \left(\frac{S_{\text{cpu\_multi}}}{S_{\text{multi\_base}}}\right)$$

### Bước 2: Tính tỷ số sức mạnh đồ họa (Effective GPU Ratio)
Tỷ số sức mạnh GPU dựa trên điểm tính toán quy chuẩn:
$$R_{\text{gpu}} = \frac{S_{\text{gpu}}}{S_{\text{gpu\_base}}}$$

### Bước 3: Các hệ số hiệu chỉnh phần cứng (Penalty Multipliers)
* **Hệ số RAM Kênh đơn (Single Channel):**
  Nếu máy chỉ chạy 1 thanh RAM hoặc chạy Single Channel trong khi game có độ nhạy $P_{\text{dual}}$ (% lợi ích khi dùng Dual Channel):
  $$M_{\text{ram}} = 1.0 - \frac{P_{\text{dual}}}{100.0}$$
  *(Ví dụ với Valorant có $P_{\text{dual}} = 22\%$, nếu chạy Single Channel thì $M_{\text{ram}} = 0.78$)*.
* **Hệ số Phạt thiếu VRAM:**
  Nếu dung lượng VRAM thực tế ($V_{\text{actual}}$) nhỏ hơn mức tối thiểu khuyến nghị của game ($V_{\text{min}}$):
  $$M_{\text{vram}} = 1.0 - \frac{P_{\text{vram}}}{100.0}$$
* **Hệ số Phạt tụt xung do Quá nhiệt (Thermal Throttling):**
  - Khi CPU bị quá nhiệt ($\ge 89^\circ\text{C}$ hoặc thermal throttling): $M_{\text{cpu\_thermal}} = 0.82$ (giảm $18\%$ do CPU tự hạ xung base).
  - Khi GPU bị quá nhiệt ($\ge 86^\circ\text{C}$): $M_{\text{gpu\_thermal}} = 0.85$ (giảm $15\%$ xung boost clock).

### Bước 4: Tính toán FPS trần (Limits) và FPS Dự đoán
Cho mỗi mức đồ họa (Preset) và độ phân giải (Resolution) với FPS mốc $\text{FPS}_{\text{base}}$:
$$\text{FPS}_{\text{CPU\_Limit}} = \text{FPS}_{\text{base}} \times R_{\text{cpu}} \times M_{\text{ram}} \times M_{\text{cpu\_thermal}}$$
$$\text{FPS}_{\text{GPU\_Limit}} = \text{FPS}_{\text{base}} \times R_{\text{gpu}} \times M_{\text{vram}} \times M_{\text{gpu\_thermal}}$$
$$\text{Predicted Avg FPS} = \text{round}\Big(\min(\text{FPS}_{\text{CPU\_Limit}}, \text{FPS}_{\text{GPU\_Limit}})\Big)$$

### Bước 5: Tính 1% Low FPS (Độ ổn định khung hình)
1% Low FPS chịu ảnh hưởng rất lớn từ băng thông RAM và độ ổn định của CPU:
$$\text{Predicted 1\% Low FPS} = \text{round}\left(\text{Predicted Avg FPS} \times \left(\frac{\text{Low1\%}_{\text{base}}}{\text{AvgFPS}_{\text{base}}}\right) \times M_{\text{ram}} \times (M_{\text{cpu\_thermal}} < 1 ? 0.75 : 1.0)\right)$$

### Bước 6: Đánh giá Bottleneck và Khoảng tin cậy
* **Xác định Bottleneck:**
  - Nếu $\frac{\text{FPS}_{\text{CPU\_Limit}}}{\text{FPS}_{\text{GPU\_Limit}}} < 0.88$: Kết luận **CPU_BOUND** (CPU không đủ nhanh để cấp dữ liệu cho GPU).
  - Nếu $\frac{\text{FPS}_{\text{CPU\_Limit}}}{\text{FPS}_{\text{GPU\_Limit}}} > 1.15$: Kết luận **GPU_BOUND** (GPU đạt 100% tải, thiếu công suất render).
  - Nếu nằm trong khoảng $0.88 \sim 1.15$: Kết luận **BALANCED** (Hệ thống cân bằng tối ưu).
* **Khoảng tin cậy (Confidence Interval):**
  - Cấu hình thông thường: $\pm 8\%$.
  - Cấu hình chạy Single Channel hoặc bị Thermal Throttling: $\pm 12\%$.

---

## 3. LƯU Ý MINH BẠCH VỀ DỮ LIỆU THAM CHIẾU
Dữ liệu tham chiếu ban đầu được định chuẩn dựa trên cấu hình:
* **CPU:** AMD Ryzen 5 5600 6-Core ($S_{\text{single}} = 1450, S_{\text{multi}} = 11000$).
* **GPU:** NVIDIA GeForce RTX 3060 12GB ($S_{\text{gpu}} = 8500$).
* **RAM:** 16GB DDR4-3200 Dual Channel.

Các số liệu này là **dữ liệu mẫu chuẩn hóa**. Khi game có các bản cập nhật lớn hoặc driver mới, các file JSON trong `web/src/data/games/` có thể được cập nhật độc lập mà không cần biên dịch lại mã nguồn của ứng dụng.
