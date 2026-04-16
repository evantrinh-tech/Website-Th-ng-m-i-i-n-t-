# Tài Liệu Hệ Thống - Website Thương Mại Điện Tử Kính Xanh

> Tài liệu kỹ thuật đầy đủ. Cập nhật lần cuối: 2026 (sau khi hoàn thiện hệ thống).

---

## Mục Lục

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [Cấu Trúc Thư Mục](#2-cấu-trúc-thư-mục)
3. [Frontend](#3-frontend)
4. [Backend](#4-backend)
5. [Database](#5-database)
6. [Bảo Mật](#6-bảo-mật)
7. [Luồng Hoạt Động](#7-luồng-hoạt-động)
8. [Cấu Hình Môi Trường](#8-cấu-hình-môi-trường)
9. [Trạng Thái Hoàn Thiện](#9-trạng-thái-hoàn-thiện)

---

## 1. Tổng Quan Hệ Thống

**Kính Xanh** là website thương mại điện tử bán kính mắt cao cấp, xây dựng theo kiến trúc **Monolithic với tách biệt Frontend/Backend**.

| Thành phần | Công nghệ |
|---|---|
| Frontend | HTML5, Tailwind CSS, Vanilla JavaScript (ES6+) |
| Backend | PHP 8.x (thuần, không framework) |
| Database | MongoDB (chính) + MySQL schema (tham khảo) |
| Auth | Custom JWT (HMAC-SHA256, 24h TTL) |
| Bảo mật | DDoS Shield v2.0 tự xây dựng, Rate Limiting, IP Blacklist |

---

## 2. Cấu Trúc Thư Mục

```
Website-Th-ng-m-i-i-n-t--main/
│
├── 📄 index.html               # Trang chủ
├── 📄 products.html            # Danh sách sản phẩm + bộ lọc
├── 📄 product-detail.html      # Chi tiết sản phẩm
├── 📄 cart.html                # Giỏ hàng (kết nối API)
├── 📄 checkout.html            # Thanh toán (kết nối API, validate form)
├── 📄 order-success.html       # Xác nhận đơn hàng
├── 📄 login.html               # Đăng nhập (auth-api.js)
├── 📄 register.html            # Đăng ký (auth-api.js)
├── 📄 profile.html             # Hồ sơ người dùng (profile-api.js)
├── 📄 admin.html               # Trang quản trị (admin-api.js)
├── 📄 about.html               # Giới thiệu
├── 📄 brands.html              # Thương hiệu
├── 📄 stores.html              # Cửa hàng
├── 📄 guide.html               # Hướng dẫn
├── 📄 support.html             # Hỗ trợ
├── 📄 privacy.html             # Chính sách bảo mật
├── 📄 terms.html               # Điều khoản
├── 📄 404.html                 # Trang lỗi
│
├── 📁 css/
│   └── style.css               # CSS tùy chỉnh bổ sung Tailwind
│
├── 📁 js/
│   ├── main.js                 # Logic UI toàn cục + cart badge sync API
│   ├── auth-api.js             # Đăng nhập / đăng ký + redirect guard
│   ├── cart-api.js             # Giỏ hàng (load, xóa, đặt hàng)
│   ├── product-api.js          # Sản phẩm, bộ lọc, phân trang
│   ├── profile-api.js          # Hồ sơ: load/update user, đơn hàng, logout
│   ├── checkout-api.js         # Checkout: load cart, validate, submit order
│   ├── admin-api.js            # Admin: thống kê thực từ API, đơn hàng gần đây
│   └── tailwind-config.js      # Cấu hình Tailwind CSS
│
├── 📁 images/                  # Ảnh sản phẩm tĩnh
│
├── 📁 backend/
│   ├── 📁 api/
│   │   ├── products.php        # API danh sách sản phẩm
│   │   ├── product-detail.php  # API chi tiết sản phẩm
│   │   ├── 📁 auth/
│   │   │   ├── login.php       # POST – đăng nhập
│   │   │   ├── register.php    # POST – đăng ký
│   │   │   └── me.php          # GET – lấy thông tin / PUT – cập nhật user
│   │   ├── 📁 cart/
│   │   │   └── index.php       # GET/POST/DELETE – giỏ hàng
│   │   ├── 📁 orders/
│   │   │   └── index.php       # GET/POST – đơn hàng
│   │   ├── 📁 reviews/
│   │   │   └── index.php       # GET/POST – đánh giá sản phẩm
│   │   └── 📁 admin/
│   │       └── index.php       # GET – thống kê tổng quan (role_id=1)
│   │
│   ├── 📁 config/
│   │   └── database.php        # Kết nối MongoDB, helper functions
│   │
│   ├── 📁 lib/
│   │   ├── auth.php            # Tạo/xác thực JWT token
│   │   ├── response.php        # Helper trả về JSON response + CORS
│   │   └── security.php        # DDoS Shield – 6 lớp bảo vệ
│   │
│   └── 📁 vendor/              # Composer dependencies (mongodb/mongodb)
│
├── 📁 database/
│   ├── e-commerce.sql          # Schema MySQL (tham khảo thiết kế)
│   ├── kx_product_api.sql      # Schema bổ sung
│   └── seed_mongo.php          # Script seed dữ liệu vào MongoDB
│
├── � document/                # Tài liệu kỹ thuật
├── 📄 .env                     # Biến môi trường (không commit)
├── 📄 .env.example             # Mẫu biến môi trường
├── 📄 composer.json            # Khai báo dependencies PHP
├── 📄 start_server.bat         # Script khởi động server (Windows)
└── 📄 setup_mongodb.bat        # Script cài đặt MongoDB (Windows)
```

---

## 3. Frontend

### 3.1 Công Nghệ

- **HTML5** – Cấu trúc trang tĩnh, không dùng framework SPA
- **Tailwind CSS** – Utility-first CSS, cấu hình tùy chỉnh qua `tailwind-config.js`
- **Vanilla JavaScript (ES6+)** – Không dùng React/Vue, giao tiếp API qua `fetch()`
- **Material Symbols** – Icon font từ Google

### 3.2 Các File JavaScript

#### `main.js` – Logic UI Toàn Cục
- **Toast Notification System** – Thay thế `window.alert` bằng toast đẹp hơn
- **Cart Badge Sync** – `syncCartBadge()` gọi API thực để lấy số lượng sản phẩm trong giỏ
- **Favorite Button** – Toggle trái tim yêu thích (UI)
- **Countdown Timer** – Đếm ngược Flash Sale trên trang chủ
- **Product Detail UI** – Gallery ảnh, chọn màu, chọn tròng kính, tab mô tả

#### `auth-api.js` – Xác Thực Người Dùng
```
Redirect guard  → Nếu đã có token, tự redirect khỏi login/register
Đăng nhập       → POST /backend/api/auth/login.php
                → Lưu token vào localStorage['kx_auth_token']
                → Lưu user vào localStorage['kx_user']
Đăng ký         → POST /backend/api/auth/register.php
                → Tự động đăng nhập sau khi đăng ký thành công
AuthFetcher     → window.AuthFetcher(url, options)
                → Tự động đính kèm header Authorization: Bearer <token>
```

#### `profile-api.js` – Hồ Sơ Người Dùng (MỚI)
```
loadProfile()   → GET  /backend/api/auth/me.php  → điền form
saveProfile()   → PUT  /backend/api/auth/me.php  → cập nhật name, phone, password
loadOrders()    → GET  /backend/api/orders/index.php → hiển thị đơn hàng thực
logout()        → Xóa localStorage, redirect login.html
```
Bảo vệ: Nếu không có token → tự redirect về `login.html`.

#### `checkout-api.js` – Thanh Toán (MỚI)
```
loadCheckoutCart() → GET  /backend/api/cart/index.php → hiển thị sản phẩm + tính tiền
validateShipping() → Validate họ tên, SĐT (regex), địa chỉ trước khi submit
submitOrder()      → POST /backend/api/orders/index.php → tạo đơn hàng thực
```

#### `cart-api.js` – Giỏ Hàng
```
Tải giỏ hàng  → GET    /backend/api/cart/index.php
Xóa sản phẩm  → DELETE /backend/api/cart/index.php  { cart_item_id }
Đặt hàng      → POST   /backend/api/orders/index.php
```

#### `admin-api.js` – Quản Trị (MỚI)
```
loadAdminStats()    → GET /backend/api/admin/index.php
                    → Hiển thị: tổng doanh thu, đơn hàng, users, sản phẩm
                    → Nếu không phải admin (403) → redirect về trang chủ
loadRecentOrders()  → GET /backend/api/orders/index.php → bảng đơn hàng gần đây
```

#### `product-api.js` – Sản Phẩm
```
Danh sách  → GET /backend/api/products.php?q=&brand=&sort=&page=
Chi tiết   → GET /backend/api/product-detail.php?slug= hoặc ?id=
```

### 3.3 Quản Lý Trạng Thái

| Nơi lưu | Dữ liệu |
|---|---|
| `localStorage['kx_auth_token']` | JWT token |
| `localStorage['kx_user']` | Thông tin user cơ bản (id, name, email) |
| DOM | Trạng thái UI (active tab, selected color...) |

---

## 4. Backend

### 4.1 Kiến Trúc

Backend viết bằng **PHP thuần** (không Laravel/Symfony), theo mô hình **REST API**. Mỗi endpoint là một file PHP riêng biệt.

```
Request → PHP File → security.php (DDoS check) → auth.php (nếu cần) → database.php → Response JSON
```

### 4.2 Danh Sách API Endpoints

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/backend/api/auth/login.php` | Không | Đăng nhập |
| POST | `/backend/api/auth/register.php` | Không | Đăng ký |
| GET | `/backend/api/auth/me.php` | Có | Lấy thông tin user |
| PUT | `/backend/api/auth/me.php` | Có | Cập nhật name, phone, password |
| GET | `/backend/api/products.php` | Không | Danh sách sản phẩm (filter/sort/page) |
| GET | `/backend/api/product-detail.php` | Không | Chi tiết sản phẩm theo slug/id |
| GET | `/backend/api/cart/index.php` | Có | Lấy giỏ hàng (enrich variant+product) |
| POST | `/backend/api/cart/index.php` | Có | Thêm sản phẩm vào giỏ |
| DELETE | `/backend/api/cart/index.php` | Có | Xóa item hoặc toàn bộ giỏ |
| GET | `/backend/api/orders/index.php` | Có | Danh sách đơn hàng của user |
| POST | `/backend/api/orders/index.php` | Có | Tạo đơn hàng từ giỏ hàng |
| GET | `/backend/api/reviews/index.php` | Không | Lấy đánh giá theo product_id |
| POST | `/backend/api/reviews/index.php` | Có | Gửi đánh giá (cần có đơn hàng) |
| GET | `/backend/api/admin/index.php` | Có (Admin) | Thống kê: doanh thu, đơn, users, sản phẩm |

### 4.3 Rate Limit Theo Endpoint

| Endpoint | Giới hạn | Lý do |
|---|---|---|
| `auth_login` | 5 req/phút | Chống brute-force mật khẩu |
| `auth_register` | 3 req/phút | Chống tạo tài khoản hàng loạt |
| `auth_me` | 30 req/phút | Endpoint nhẹ |
| `cart` | 60 req/phút | Thao tác giỏ hàng thường xuyên |
| `orders` | 10 req/phút | Tạo đơn hàng, kiểm soát chặt |
| `products` | 120 req/phút | Public API, phục vụ nhiều user |
| `admin` | 30 req/phút | Endpoint quản trị |

### 4.4 Thư Viện Core (`/backend/lib/`)

#### `database.php` – Kết Nối MongoDB
```php
getMongoClient()     // MongoDB\Client (singleton)
getMongoDB()         // MongoDB\Database (singleton)
getCollection($name) // MongoDB\Collection
toObjectId($id)      // string → ObjectId (null nếu không hợp lệ)
docToArray($doc)     // MongoDB document → PHP array, map _id → id string
docsToArray($cursor) // Nhiều documents → array
```

#### `auth.php` – JWT Authentication
```php
generateToken($userId)   // Tạo: base64(payload).hmac_sha256
getUserIdFromToken()     // Đọc Authorization header → userId
requireAuth()            // Bắt buộc auth, tự trả 401 nếu không hợp lệ
```
Token format: `base64({"user_id":"...","exp":timestamp}).hmac_sha256_signature`
Thời hạn: **24 giờ** (86400 giây)

#### `response.php` – JSON Response Helper
```php
jsonResponse($payload, $statusCode)  // Trả JSON + CORS headers
methodNotAllowed($allowed)           // 405 Method Not Allowed
normalizeCsvParam($value)            // "a,b,c" → ["a","b","c"]
parsePositiveInt($value, $default)   // Parse số nguyên dương an toàn
```

---

## 5. Database

### 5.1 Công Nghệ Chính: MongoDB

| Collection | Mô tả |
|---|---|
| `users` | Tài khoản người dùng |
| `products` | Sản phẩm kính mắt |
| `product_variants` | Biến thể sản phẩm (màu, size, giá) |
| `product_images` | Ảnh sản phẩm |
| `carts` | Giỏ hàng (1 user = 1 cart) |
| `cart_items` | Sản phẩm trong giỏ hàng |
| `orders` | Đơn hàng (embedded items) |
| `reviews` | Đánh giá sản phẩm |
| `rate_limits` | Theo dõi request rate (bảo mật) |
| `ip_blacklist` | Danh sách IP bị chặn |
| `security_logs` | Log sự kiện bảo mật |

### 5.2 Schema Chi Tiết

#### Collection `users`
```json
{
  "_id": ObjectId,
  "name": "string",
  "email": "string (unique)",
  "password": "string (bcrypt hash)",
  "phone": "string",
  "role_id": 1 (admin) | null (user),
  "created_at": UTCDateTime,
  "updated_at": UTCDateTime,
  "deleted_at": UTCDateTime (soft delete)
}
```

#### Collection `products`
```json
{
  "_id": ObjectId,
  "sku": "string", "slug": "string (unique)",
  "name": "string", "brand": "string", "category": "string",
  "gender": "men|women|unisex",
  "frame_material": "string", "lens_type": "string",
  "price": number, "old_price": number, "discount_percent": number,
  "rating": number, "review_count": number, "sold_count": number,
  "badge": "string", "short_description": "string", "description": "string",
  "thumbnail_url": "string",
  "images": [{ "image_url": "...", "is_primary": bool }],
  "is_active": bool, "is_featured": bool,
  "created_at": UTCDateTime
}
```

#### Collection `orders`
```json
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "address_id": ObjectId | null,
  "items": [{ "product_variant_id": ObjectId, "product_name": "string", "price": number, "quantity": number }],
  "total_price": number,
  "status": "pending|confirmed|shipping|completed|cancelled",
  "created_at": UTCDateTime
}
```

### 5.3 Schema MySQL (Tham Khảo)

File `database/e-commerce.sql` chứa schema MySQL đầy đủ dùng để tham khảo thiết kế quan hệ. Hệ thống thực tế chạy trên MongoDB.

Các bảng: `roles`, `users`, `brands`, `categories`, `products`, `product_variants`, `product_images`, `cart`, `cart_items`, `addresses`, `orders`, `order_items`, `payments`, `reviews`, `wishlist`, `coupons`, `inventory_logs`.

---

## 6. Bảo Mật

### 6.1 DDoS Shield v2.0 – 6 Lớp Bảo Vệ

```
Request → [L1] IP Blacklist → [L2] Rate Limit → [L3] HTTP Headers
        → [L4] Payload Check → [L5] Vi phạm & Auto-ban → [L6] GC → Xử lý
```

| Lớp | Chức năng | Phản hồi khi vi phạm |
|---|---|---|
| 1 – IP Blacklist | Chặn IP đã bị ban | 403 Forbidden |
| 2 – Rate Limiting | Sliding window per IP+endpoint | 429 Too Many Requests |
| 3 – HTTP Headers | Kiểm tra User-Agent, Host header | 400 Bad Request |
| 4 – Payload | Body > 512KB, SQL/XSS injection | 400/413 |
| 5 – Auto-ban | Vi phạm ≥ 5 lần → ban vĩnh viễn | – |
| 6 – GC | Dọn dữ liệu cũ (xác suất 1%) | – |

### 6.2 JWT Authentication

```
Token = base64({"user_id":"...","exp":now+86400}) + "." + HMAC-SHA256(encoded, SECRET_KEY)
```
- Xác thực dùng `hash_equals()` chống timing attack
- Thời hạn 24 giờ

### 6.3 Bảo Mật Mật Khẩu

- Hash: `password_hash($password, PASSWORD_DEFAULT)` (bcrypt)
- Verify: `password_verify()` – không bao giờ so sánh plaintext
- Đổi mật khẩu: yêu cầu nhập mật khẩu hiện tại để xác nhận

### 6.4 Security Headers (tự động thêm)

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Access-Control-Allow-Origin: *
```

### 6.5 Phân Quyền Admin

Endpoint `/api/admin/index.php` kiểm tra `role_id == 1`. Frontend `admin-api.js` tự redirect về trang chủ nếu nhận 403.

---

## 7. Luồng Hoạt Động

### 7.1 Luồng Đăng Nhập

```
auth-api.js: Redirect guard → nếu đã có token, bỏ qua trang login
User nhập email/password → POST /auth/login.php
    → applyDDoSProtection(limit=5)
    → Tìm user MongoDB, password_verify()
    → generateToken(userId) → trả { token, user }
    → Lưu localStorage → redirect index.html
```

### 7.2 Luồng Cập Nhật Hồ Sơ

```
profile.html load → profile-api.js: GET /auth/me.php → điền form
User sửa → submit → PUT /auth/me.php { name, phone, [password] }
    → Validate mật khẩu hiện tại nếu đổi password
    → Cập nhật MongoDB → trả success
    → Cập nhật localStorage['kx_user']
```

### 7.3 Luồng Mua Hàng

```
Xem sản phẩm → GET /products.php (filter/sort/page)
    ↓
Xem chi tiết → GET /product-detail.php?slug=...
    ↓
Thêm vào giỏ → POST /cart/index.php { variant_id, quantity }
    ↓
Xem giỏ hàng → GET /cart/index.php (enrich variant + product)
    ↓
Checkout → checkout-api.js: load cart → validate form → POST /orders/index.php
    → Tạo order document với embedded items
    → Xóa cart_items → redirect order-success.html
```

### 7.4 Luồng Admin

```
admin.html load → admin-api.js: GET /admin/index.php
    → Nếu 403 → showToast + redirect index.html
    → Nếu OK → hiển thị: doanh thu, đơn hàng, users, sản phẩm
    → loadRecentOrders() → GET /orders/index.php → bảng đơn hàng
```

---

## 8. Cấu Hình Môi Trường

File `.env` (tạo từ `.env.example`):

```env
MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DB=kinh_xanh
SECRET_KEY=KinhXanhSecretKey2026   # PHẢI đổi khi deploy production
```

### Khởi Động (Windows)

```bat
setup_mongodb.bat    # Cài đặt MongoDB
start_server.bat     # Khởi động PHP built-in server
```

### Cài Đặt Dependencies

```bash
cd backend
composer install
```

### Seed Dữ Liệu Mẫu

```bash
php database/seed_mongo.php
# Admin: admin@kinhxanh.vn / Admin@123
# User:  user1@gmail.com   / User@123
```

---

## 9. Trạng Thái Hoàn Thiện

### Đã hoàn thiện

| Tính năng | File | Trạng thái |
|---|---|---|
| Đăng nhập / Đăng ký | `auth-api.js`, `login.php`, `register.php` | ✅ Hoàn chỉnh |
| Redirect guard (đã login) | `auth-api.js` | ✅ Hoàn chỉnh |
| Hồ sơ cá nhân – load từ API | `profile-api.js`, `me.php` (GET) | ✅ Hoàn chỉnh |
| Hồ sơ cá nhân – cập nhật | `profile-api.js`, `me.php` (PUT) | ✅ Hoàn chỉnh |
| Đổi mật khẩu | `profile-api.js`, `me.php` (PUT) | ✅ Hoàn chỉnh |
| Đơn hàng trong profile | `profile-api.js`, `orders/index.php` | ✅ Hoàn chỉnh |
| Đăng xuất | `profile-api.js` | ✅ Hoàn chỉnh |
| Checkout load giỏ hàng thực | `checkout-api.js`, `cart/index.php` | ✅ Hoàn chỉnh |
| Checkout validate form | `checkout-api.js` | ✅ Hoàn chỉnh |
| Checkout submit đơn hàng | `checkout-api.js`, `orders/index.php` | ✅ Hoàn chỉnh |
| Admin thống kê thực | `admin-api.js`, `admin/index.php` | ✅ Hoàn chỉnh |
| Admin bảng đơn hàng | `admin-api.js` | ✅ Hoàn chỉnh |
| Admin kiểm tra quyền | `admin-api.js` | ✅ Hoàn chỉnh |
| Cart badge đồng bộ API | `main.js` – `syncCartBadge()` | ✅ Hoàn chỉnh |
| Xóa fake login trong main.js | `main.js` | ✅ Hoàn chỉnh |
| Giỏ hàng | `cart-api.js`, `cart/index.php` | ✅ Hoàn chỉnh |
| Danh sách sản phẩm + bộ lọc | `product-api.js`, `products.php` | ✅ Hoàn chỉnh |
| Chi tiết sản phẩm | `product-api.js`, `product-detail.php` | ✅ Hoàn chỉnh |
| Đánh giá sản phẩm | `reviews/index.php` | ✅ Hoàn chỉnh |
| DDoS Shield 6 lớp | `security.php` | ✅ Hoàn chỉnh |
| JWT Authentication | `auth.php` | ✅ Hoàn chỉnh |

### Ngoài phạm vi (cần tích hợp bên thứ ba)

| Tính năng | Ghi chú |
|---|---|
| Thanh toán MoMo / ZaloPay | Cần tích hợp payment gateway API |
| Đăng nhập Google / Facebook | Cần OAuth2 client |
| Wishlist lưu database | Schema có, chưa có API endpoint |
| Mã giảm giá (coupon) | Schema có, chưa có API endpoint |
| Upload ảnh đơn thuốc | Cần file upload API |
| Quản lý sản phẩm trong admin | Cần CRUD API cho products |

---

*Tài liệu được tạo và cập nhật từ source code thực tế. © 2026 Kính Xanh Optical.*
