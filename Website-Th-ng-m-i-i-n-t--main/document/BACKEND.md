# Tài Liệu Backend – Kính Xanh Optical

> Mô tả kiến trúc API, các endpoint, thư viện core và luồng xử lý request.

---

## 1. Công Nghệ Sử Dụng

| Công nghệ | Mục đích |
|---|---|
| PHP 8.x (thuần) | Xử lý API, không dùng framework |
| MongoDB PHP Driver (`mongodb/mongodb`) | Kết nối và truy vấn MongoDB |
| Composer | Quản lý dependencies PHP |
| PHP Built-in Server | Chạy local development |

---

## 2. Kiến Trúc Tổng Quan

```
Request HTTP
    │
    ▼
PHP File (endpoint)
    │
    ├── security.php  → Kiểm tra DDoS, rate limit, blacklist IP
    │
    ├── auth.php      → Xác thực JWT (nếu endpoint yêu cầu)
    │
    ├── database.php  → Kết nối MongoDB, helper functions
    │
    └── Response JSON (jsonResponse)
```

Mỗi endpoint là **một file PHP riêng biệt**, không có router trung tâm.

---

## 3. Cấu Trúc Thư Mục Backend

```
backend/
├── api/
│   ├── products.php           # GET – danh sách sản phẩm
│   ├── product-detail.php     # GET – chi tiết sản phẩm
│   ├── product-variants.php   # GET – variants theo slug/product_id
│   ├── debug.php              # GET – kiểm tra trạng thái DB (xóa khi deploy)
│   ├── auth/
│   │   ├── login.php          # POST – đăng nhập
│   │   ├── register.php       # POST – đăng ký
│   │   └── me.php             # GET/PUT – thông tin user
│   ├── cart/
│   │   └── index.php          # GET/POST/PUT/DELETE – giỏ hàng
│   ├── orders/
│   │   └── index.php          # GET/POST – đơn hàng
│   ├── reviews/
│   │   └── index.php          # GET/POST – đánh giá
│   └── admin/
│       └── index.php          # GET – thống kê (role_id=1)
├── config/
│   └── database.php           # Kết nối MongoDB + helper functions
├── lib/
│   ├── auth.php               # JWT: tạo và xác thực token
│   ├── response.php           # Helper: jsonResponse, methodNotAllowed
│   └── security.php           # DDoS Shield 6 lớp
└── vendor/                    # Composer packages
```

---

## 4. Danh Sách API Endpoints

### Auth

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/backend/api/auth/login.php` | Không | Đăng nhập, trả về JWT token |
| POST | `/backend/api/auth/register.php` | Không | Đăng ký tài khoản mới |
| GET | `/backend/api/auth/me.php` | Có | Lấy thông tin user hiện tại |
| PUT | `/backend/api/auth/me.php` | Có | Cập nhật name, phone, password |

### Sản Phẩm

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/backend/api/products.php` | Không | Danh sách sản phẩm, hỗ trợ filter/sort/page |
| GET | `/backend/api/product-detail.php` | Không | Chi tiết theo `?slug=` hoặc `?id=` (không có DDoS protection) |
| GET | `/backend/api/product-variants.php` | Không | Variants theo `?slug=` hoặc `?product_id=` (không có DDoS protection) |

### Giỏ Hàng

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/backend/api/cart/index.php` | Có | Lấy giỏ hàng (enrich variant + product) |
| POST | `/backend/api/cart/index.php` | Có | Thêm sản phẩm `{ variant_id, quantity }` |
| PUT | `/backend/api/cart/index.php` | Có | Cập nhật số lượng `{ cart_item_id, quantity }` |
| DELETE | `/backend/api/cart/index.php` | Có | Xóa item `{ cart_item_id }` hoặc xóa toàn bộ |

### Đơn Hàng

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/backend/api/orders/index.php` | Có | Danh sách đơn hàng của user |
| POST | `/backend/api/orders/index.php` | Có | Tạo đơn từ giỏ hàng, xóa cart sau khi tạo |

### Đánh Giá

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/backend/api/reviews/index.php` | Không | Lấy đánh giá theo `?product_id=` |
| POST | `/backend/api/reviews/index.php` | Có | Gửi đánh giá (cần có đơn hàng) |

> **Lưu ý:** Endpoint reviews hiện **không áp dụng DDoS protection** (`applyDDoSProtection` chưa được gọi trong file này).

### Admin

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | `/backend/api/admin/index.php` | Có (role_id=1) | Thống kê: doanh thu, đơn, users, sản phẩm |

---

## 5. Rate Limit Theo Endpoint

| Endpoint | Giới hạn | Lý do |
|---|---|---|
| `auth_login` | 5 req/phút | Chống brute-force mật khẩu |
| `auth_register` | 3 req/phút | Chống tạo tài khoản hàng loạt |
| `auth_me` | 30 req/phút | Endpoint nhẹ |
| `cart` | 60 req/phút | Thao tác thường xuyên |
| `orders` | 10 req/phút | Kiểm soát tạo đơn |
| `products` | 120 req/phút | Public API |
| `admin` | 30 req/phút | Endpoint quản trị |

---

## 6. Thư Viện Core

### `database.php` – Kết Nối MongoDB

```php
getMongoClient()     // MongoDB\Client (singleton)
getMongoDB()         // MongoDB\Database (singleton)
getCollection($name) // MongoDB\Collection theo tên
toObjectId($id)      // string → ObjectId (null nếu không hợp lệ)
docToArray($doc)     // Document → PHP array, map _id → id string
docsToArray($cursor) // Nhiều documents → array
```

**Cách dùng:**
```php
$products = getCollection('products');
$product  = $products->findOne(['slug' => 'ray-ban-aviator-classic-gold']);
$arr      = docToArray($product); // $arr['id'] là string ObjectId
```

---

### `auth.php` – JWT Authentication

```php
generateToken($userId)   // Tạo token: base64(payload).hmac_sha256
getUserIdFromToken()     // Đọc Authorization header → userId string
requireAuth()            // Bắt buộc auth, tự trả 401 nếu không hợp lệ
```

**Token format:**
```
base64({"user_id":"...","exp":timestamp}) + "." + HMAC-SHA256(encoded, SECRET_KEY)
```

Thời hạn: **24 giờ** (86400 giây). Dùng `hash_equals()` chống timing attack.

---

### `response.php` – JSON Response Helper

```php
jsonResponse($payload, $statusCode)  // Trả JSON + CORS headers + exit
methodNotAllowed($allowed)           // 405 Method Not Allowed
normalizeCsvParam($value)            // "a,b,c" → ["a","b","c"]
parsePositiveInt($value, $default)   // Parse số nguyên dương an toàn
```

**CORS headers tự động thêm:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Content-Type: application/json; charset=utf-8
```

---

## 7. Cấu Trúc Response JSON

Tất cả response đều theo format chuẩn:

```json
// Thành công
{
  "success": true,
  "message": "Mô tả kết quả",
  "data": { ... }
}

// Thất bại
{
  "success": false,
  "message": "Mô tả lỗi",
  "code": "ERROR_CODE"
}
```

---

## 8. Xử Lý CORS Preflight

Mọi endpoint đều xử lý OPTIONS request ở đầu file:

```php
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true, 'message' => 'Preflight OK']);
}
```

---

## 9. Luồng Xử Lý Điển Hình

### Thêm vào giỏ hàng (POST /cart)

```
1. OPTIONS check → trả Preflight OK nếu là OPTIONS
2. applyDDoSProtection(limit=60, endpoint='cart')
3. requireAuth() → lấy userId từ JWT
4. toObjectId(userId) → userOid
5. getCartOid(carts, userOid) → tạo cart nếu chưa có
6. Đọc body: { variant_id, quantity }
7. Kiểm tra variant tồn tại trong DB
8. Kiểm tra đã có trong giỏ chưa → update qty hoặc insert mới
9. jsonResponse({ success: true, message: '...' })
```

### Tạo đơn hàng (POST /orders)

```
1. requireAuth() → userId
2. Lấy cart của user
3. Lấy cart_items → lookup variants + products
4. Tính total_price
5. insertOne vào orders (embedded items)
6. deleteMany cart_items
7. jsonResponse({ order_id: '...' })
```

---

## 10. Khởi Động Server

```bat
# Windows – chạy file bat
start_server.bat

# Hoặc thủ công
C:\xampp\php\php.exe -S 127.0.0.1:8000 -t "D:\path\to\project"
```

Truy cập: `http://localhost:8000`
API base: `http://localhost:8000/backend/api/`

---

*© 2026 Kính Xanh Optical – Tài liệu Backend*
