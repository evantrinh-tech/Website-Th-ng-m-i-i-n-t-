# Tài Liệu Bảo Mật – Kính Xanh Optical

> Mô tả toàn bộ cơ chế bảo mật: DDoS Shield, JWT, mật khẩu, CORS và phân quyền.

---

## 1. Tổng Quan

Hệ thống bảo mật được xây dựng tùy chỉnh trong `backend/lib/security.php`, không phụ thuộc thư viện bên ngoài. Gồm **6 lớp bảo vệ** kích hoạt qua hàm `applyDDoSProtection()`.

```
Request đến
    │
    ▼
[Lớp 1] IP Blacklist ────── Bị ban? → 403 Forbidden
    │
    ▼
[Lớp 2] Rate Limiting ───── Vượt giới hạn? → 429 Too Many Requests
    │
    ▼
[Lớp 3] HTTP Headers ────── User-Agent trống? → 400 Bad Request
    │
    ▼
[Lớp 4] Payload Check ───── Body > 512KB / Injection? → 400 / 413
    │
    ▼
[Lớp 5] Ghi Vi Phạm ─────── Tự động ban IP khi vượt ngưỡng
    │
    ▼
[Lớp 6] Garbage Collection ─ Dọn dữ liệu cũ (xác suất 1%)
    │
    ▼
Xử lý request bình thường
```

---

## 2. Cách Kích Hoạt

Gọi ở đầu mỗi endpoint cần bảo vệ:

```php
applyDDoSProtection(
    rateLimit:    60,       // Số request tối đa
    rateMinutes:  1,        // Trong khoảng thời gian (phút)
    endpoint:     'cart',   // Tên endpoint (dùng để phân biệt rate limit)
    checkPayload: true      // Có kiểm tra body không
);
```

**Các endpoint đã áp dụng DDoS protection:**

| Endpoint | Rate Limit |
|---|---|
| `auth/login.php` | 5 req/phút |
| `auth/register.php` | 3 req/phút |
| `auth/me.php` | 30 req/phút |
| `products.php` | 120 req/phút |
| `cart/index.php` | 60 req/phút |
| `orders/index.php` | 10 req/phút |
| `admin/index.php` | 30 req/phút |

**Các endpoint chưa áp dụng DDoS protection (cần bổ sung khi production):**
- `product-detail.php`
- `product-variants.php`
- `reviews/index.php`

---

## 3. Chi Tiết 6 Lớp Bảo Vệ

### Lớp 1 – IP Blacklist

Kiểm tra IP trong collection `ip_blacklist` trước khi xử lý bất kỳ thứ gì.

- Block tạm thời: **10 phút** (`DDOS_BLOCK_DURATION = 600`)
- Block vĩnh viễn: khi vi phạm ≥ **5 lần** (`DDOS_BAN_THRESHOLD = 5`)
- Hỗ trợ phát hiện IP thực qua proxy/CDN:

```
HTTP_CF_CONNECTING_IP  → Cloudflare
HTTP_X_REAL_IP         → Nginx proxy
HTTP_X_FORWARDED_FOR   → Load balancer
REMOTE_ADDR            → Fallback
```

**Response khi bị chặn:**
```json
{
  "success": false,
  "code": "IP_BLOCKED",
  "message": "IP [x.x.x.x] bị chặn. Thử lại sau HH:MM DD/MM/YYYY."
}
```
HTTP Status: `403 Forbidden`

---

### Lớp 2 – Rate Limiting (Sliding Window)

Theo dõi số request theo cặp `(IP, endpoint)` trong cửa sổ thời gian.

**Cơ chế:**
- Lần đầu: tạo record trong `rate_limits` với `requests = 1`
- Mỗi request tiếp theo: tăng `requests` lên 1
- Khi cửa sổ thời gian hết: reset về 1
- Khi vượt giới hạn: ghi vi phạm + trả 429

**Response headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
Retry-After: 38   (chỉ khi bị chặn)
```

**Response khi vượt giới hạn:**
```json
{
  "success": false,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Quá nhiều yêu cầu từ IP [x.x.x.x]. Vui lòng thử lại sau 38 giây.",
  "retry_after": 38
}
```
HTTP Status: `429 Too Many Requests`

---

### Lớp 3 – HTTP Header Validation

**3.1 User-Agent bắt buộc** (`DDOS_UA_REQUIRED = true`):
- Request không có User-Agent → ghi vi phạm → 400

**3.2 Host Header** (chống Host Header Attack):
- Chỉ chấp nhận: `localhost`, `127.0.0.1`, giá trị `APP_DOMAIN` trong `.env`

---

### Lớp 4 – Payload Inspection

**4.1 Giới hạn kích thước body:**
- Tối đa **512 KB** (`DDOS_MAX_BODY_SIZE = 1024 * 512`)
- Vượt quá → ghi vi phạm → 413

**4.2 Phát hiện injection trong query string:**

| Pattern | Loại tấn công |
|---|---|
| `UNION SELECT`, `DROP TABLE`, `INSERT INTO` | SQL Injection |
| `OR 1=1`, `--`, `/* */` | SQL Injection |
| `<script>`, `javascript:` | XSS |
| `onload=`, `onclick=` | XSS Event Handler |
| `../`, `..\` | Path Traversal |
| `\|`, `;`, `&&`, `$(`, `` ` `` | Command Injection |

---

### Lớp 5 – Ghi Vi Phạm & Tự Động Ban

```
Vi phạm lần 1-4: Block tạm 10 phút (expires_at = now + 600s)
Vi phạm lần 5+:  Block vĩnh viễn (expires_at = null)
```

Mỗi lần vi phạm cập nhật record trong `ip_blacklist`:
```json
{
  "ip": "x.x.x.x",
  "reason": "Rate limit exceeded on cart",
  "violations": 3,
  "blocked_at": "...",
  "expires_at": "..."
}
```

---

### Lớp 6 – Garbage Collection

Chạy ngẫu nhiên với xác suất **1%** mỗi request để giảm overhead:

```php
if (random_int(1, 100) !== 1) return; // 99% bỏ qua
```

Dọn dẹp:
- `rate_limits`: xóa records cũ hơn 10 phút
- `ip_blacklist`: xóa ban đã hết hạn (giữ lại ban vĩnh viễn)
- `security_logs`: xóa logs cũ hơn 7 ngày

---

## 4. Security Headers Tự Động

`applyDDoSProtection()` tự động thêm vào mọi response:

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 5. JWT Authentication

### Cấu Trúc Token

```
Token = base64(payload) + "." + HMAC-SHA256(base64(payload), SECRET_KEY)

Payload = {
  "user_id": "mongodb_object_id_string",
  "exp":     unix_timestamp + 86400
}
```

### Quy Trình Xác Thực

```
1. Đọc header: Authorization: Bearer <token>
2. Tách token thành [encoded, signature]
3. Tính lại HMAC-SHA256(encoded, SECRET_KEY)
4. So sánh bằng hash_equals() → chống timing attack
5. Decode payload, kiểm tra exp chưa hết hạn
6. Trả về user_id
```

### Bảo Mật Token

- Thời hạn: **24 giờ**
- Lưu phía client: `localStorage['kx_auth_token']`
- Không lưu trong cookie (tránh CSRF)
- Dùng `hash_equals()` thay vì `===` để chống timing attack

---

## 6. Bảo Mật Mật Khẩu

```php
// Hash khi đăng ký / đổi mật khẩu
$hash = password_hash($password, PASSWORD_DEFAULT); // bcrypt

// Xác thực khi đăng nhập
$ok = password_verify($plaintext, $hash);
```

- Thuật toán: **bcrypt** (PHP `PASSWORD_DEFAULT`)
- Không bao giờ lưu hoặc so sánh plaintext
- Đổi mật khẩu: yêu cầu nhập mật khẩu hiện tại để xác nhận

---

## 7. CORS

Tất cả response đều có:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

> **Lưu ý production:** Thay `*` bằng domain cụ thể để tăng bảo mật.

---

## 8. Phân Quyền

### Phân Loại User

| `role_id` | Loại | Quyền |
|---|---|---|
| `null` | User thường | Xem sản phẩm, giỏ hàng, đơn hàng của mình |
| `1` | Admin | Tất cả + xem thống kê tổng quan |

### Kiểm Tra Quyền Admin

```php
$user = $users->findOne(['_id' => $userOid]);
if (!$user || ($user['role_id'] ?? null) != 1) {
    jsonResponse(['message' => 'Bạn không có quyền truy cập.'], 403);
}
```

Frontend `admin-api.js` tự redirect về trang chủ khi nhận 403.

---

## 9. Soft Delete

User bị xóa không bị xóa khỏi DB mà được đánh dấu `deleted_at`:

```php
// Khi đăng nhập, bỏ qua user đã bị soft-delete
$user = $users->findOne([
    'email'      => $email,
    'deleted_at' => ['$exists' => false],
]);
```

---

## 10. Cấu Hình Bảo Mật

```php
// security.php
define('DDOS_BLOCK_DURATION', 600);    // Block tạm: 10 phút
define('DDOS_BAN_THRESHOLD',  5);      // Vi phạm → ban vĩnh viễn
define('DDOS_MAX_BODY_SIZE',  524288); // Max body: 512 KB
define('DDOS_UA_REQUIRED',    true);   // Bắt buộc User-Agent
```

```env
# .env
SECRET_KEY=KinhXanhSecretKey2026  # PHẢI đổi khi deploy production
```

---

## 11. Checklist Trước Khi Deploy Production

- [ ] Đổi `SECRET_KEY` trong `.env` thành chuỗi ngẫu nhiên mạnh (≥ 32 ký tự)
- [ ] Xóa file `backend/api/debug.php`
- [ ] Thay `Access-Control-Allow-Origin: *` bằng domain thực
- [ ] Bật HTTPS (SSL/TLS)
- [ ] Đổi `MONGO_URI` sang MongoDB Atlas hoặc server riêng
- [ ] Bật logging thực sự (bỏ comment trong `logSecurityEvent`)
- [ ] Cân nhắc dùng Redis thay MongoDB cho rate limiting (hiệu năng cao hơn)
- [ ] Đặt `DDOS_UA_REQUIRED = true` và bật lại danh sách bot độc hại
- [ ] Thêm `applyDDoSProtection()` vào `product-detail.php`, `product-variants.php`, `reviews/index.php`

---

*© 2026 Kính Xanh Optical – Tài liệu Bảo Mật*
