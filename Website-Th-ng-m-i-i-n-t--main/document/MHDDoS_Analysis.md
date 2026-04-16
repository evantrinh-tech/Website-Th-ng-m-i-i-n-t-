# Báo Cáo Phân Tích: Vì Sao Hệ Thống Không Sập Dưới Trọng Tải của MHDDoS?

## 1. Tóm Tắt Tình Hình Máy Chủ (Context)

Người dùng đã thực hiện một bài kiểm tra chịu tải (Stress Test) lên máy chủ cục bộ (local environment) sử dụng công cụ **MHDDoS** với phương thức `GET Flood`.

**Thông số từ Terminal của Tool:**
- **Target:** `http://127.0.0.1:8000/` (Local loopback)
- **CPU / RAM Server:** 12% / 220MB (Rất ổn định, không có dấu hiệu cạn kiệt bộ nhớ)
- **RPS (Request Per Second):** ~1,245 (Mức khá dồn dập nhưng máy chủ vẫn chịu được).
- **Trạng thái:** Vẫn "Sống" khỏe, hệ thống báo `Success: 98.7%`.
- **Đặc biệt lưu ý:** Tool báo `[INFO] Empty Proxy File, running flood without proxy` -> Tấn công TRỰC TIẾP từ 1 IP duy nhất (`127.0.0.1`) mà không có hệ thống tạo IP ảo / Proxy.

Mặc dù giao diện hiển thị 1000 Luồng (Threads) chạy liên tục tạo ra hàng ngàn request, website hoàn toàn **không sập**. Dưới đây là 4 lý do giải thích hiện tượng này một cách khoa học dựa trên Cấu trúc mạng và Mã nguồn của bạn:

---

## 2. Giải Mã: Tại Sao Website Vẫn Đứng Vững?

### 🛡️ Lý do 1: Hàng rào "Kính Xanh Shield" đã chặn đứng Tool ngay từ Cửa (Lớp 3)
Theo file `backend/lib/security.php` của bạn, hệ thống được cấu hình sẵn để chặn các tác nhân đáng ngờ dựa trên `User-Agent`.
MHDDoS khi chạy mặc định sẽ có chuỗi nhận diện riêng. File bảo mật của bạn có đoạn mã này:
```php
$maliciousUaPatterns = ['mhddos', 'loic', 'hoic', 'slowloris', ...];
```
Ngay ở request đầu tiên, Backend phát hiện Tool và lập tức trả về mã lỗi **403 Forbidden** hoặc **400 Bad Request**. Thay vì phải xử lý logic cực nhọc, gọi Database (SQL query), server chỉ tốn vài mili-giây để chối từ kết nối và ném "kẻ bị tình nghi" vào **Bảng phong thần (IP Blacklist)**.

### 🚫 Lý do 2: Lỗi chí mạng khi không dùng Proxy (Single-IP Attack)
Tool đã báo lỗi: `Empty Proxy File, running flood without proxy`.
Điều này biến cuộc tấn công DDoS (Tấn công từ chối dịch vụ PHÂN TÁN dồn lực từ nhiều máy) trở thành một trò DoS thông thường (Từ 1 máy đến 1 máy). 
Do toàn bộ mớ traffic này đến từ đúng cụm địa chỉ `127.0.0.1`, tính năng **Rate Limit (Lớp 2)** của bạn đã phát huy sức mạnh.
- Request 1 đến 60: Đi vào, đếm, xử lý.
- Request 61 trở đi: Ngay lập tức từ chối và trả về HTTP `429 Too Many Requests`.

Lúc này, vòng đời của Web Server chỉ quanh quẩn ở việc "Nhận Request - Thấy IP bị block - Trả 429 rồi ngắt kết nối". Quá trình rác này dĩ nhiên tốn rất ít CPU/RAM. 12% CPU là để làm việc này.

### 🛜 Lý do 3: Tấn công vào `127.0.0.1` qua môi trường Loopback
Bạn đang chạy kiểm thử trên máy tính của chính mình (Local). Mạng `127.0.0.1` (Lookback Interface) là một sợi cáp mạng "phương trình - ảo", kết nối phần cứng bên trong chứ không kết nối Internet ngoài rào. 
Băng thông của card mạng ảo này hoàn toàn lên tới 10 - 20 Gbps hoặc hơn thế. Sẽ chẳng có giới hạn đường truyền, không có mất mát gói tin (Packet drop). Do vậy, bạn không hề thấy khái niệm "Nghẽn băng thông". Hệ điều hành Windows tự bóp các request HTTP rác trong local memory stack với hiệu năng siêu khủng khiếp.

### 📈 Lý do 4: Cú lừa từ con số `Success: 98.7%` của Tool
Đừng nhìn vào chỉ số của Tool làm thước đo. Bạn cho rằng "Success" nghĩa là Web bị ăn mòn 98.7%? Không.
Trong thuật toán của MHDDoS, khi công cụ gửi 1 force request đến máy chủ, miễn là Web Server của bạn **phản hồi lại bất kỳ mã nào (200 OK, 403 Forbidden, 429 Too Many Request, hay thậm chí 500)** - công cụ đều coi đó là một "nhát đâm trúng mục tiêu thành công" (Success). 
Thực tế, máy chủ bạn chém trả lại dòng thông báo "Ngươi đã bị chặn" thay vì nằm im lìm dẫn đến quá dòng Timeout. Vì Server phản hồi cực nhanh, Tool thấy khoái chí và đo đếm là "Success". Nhưng về phía Application Web, thì đó là "Success trong việc chặn đánh hacker"!

---

## 3. Bài Học Rút Ra 

👉 **Hệ thống Server hiện tại phòng bị rất tốt đối với các thủ thuật Tấn Công Nghiệp Dư (DoS một nguồn hoặc BOT không giấu IP).**

⚠️ Tuy nhiên, đừng vội chủ quan. Nếu bạn tiến hành "Tấn công thật" bằng việc:
1. Gắn danh sách `proxy.txt` chứa một vạn Proxy còn sống.
2. Dùng method `BOT` thay vì `GET` thông thường, hoặc trỏ thẳng vào IP public của VPS.

Lúc đó, kịch bản sập Database do giới hạn xử lý kết nối đồng thời từ nhiều nguồn của PHP mới là thảm họa thực sự cần phòng vệ bằng Cloudflare.
