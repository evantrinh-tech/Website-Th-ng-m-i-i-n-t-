# Tài Liệu Database – Kính Xanh Optical

> Mô tả cấu trúc MongoDB, schema từng collection, indexes và script seed dữ liệu.

---

## 1. Công Nghệ

| Thành phần | Chi tiết |
|---|---|
| Database chính | MongoDB (NoSQL document store) |
| Driver PHP | `mongodb/mongodb` (Composer) |
| Database name | `kinh_xanh` |
| URI mặc định | `mongodb://127.0.0.1:27017` |
| Schema tham khảo | `database/e-commerce.sql` (MySQL, dùng để thiết kế) |

---

## 2. Danh Sách Collections

| Collection | Mô tả | Số lượng (sau seed) |
|---|---|---|
| `users` | Tài khoản người dùng | 2 |
| `products` | Sản phẩm kính mắt | 8 |
| `product_variants` | Biến thể sản phẩm (màu, size, giá) | 8 |
| `product_images` | Ảnh sản phẩm (nếu lưu riêng) | 0 |
| `carts` | Giỏ hàng (1 user = 1 cart) | – |
| `cart_items` | Sản phẩm trong giỏ | – |
| `orders` | Đơn hàng (embedded items) | – |
| `reviews` | Đánh giá sản phẩm | 3 |
| `rate_limits` | Theo dõi request rate (bảo mật) | – |
| `ip_blacklist` | IP bị chặn (bảo mật) | – |
| `security_logs` | Log sự kiện bảo mật | – |

---

## 3. Schema Chi Tiết

### Collection `users`

```json
{
  "_id":        ObjectId,
  "name":       "string",
  "email":      "string (unique)",
  "password":   "string (bcrypt hash)",
  "phone":      "string",
  "role_id":    1 (admin) | null (user thường),
  "created_at": UTCDateTime,
  "updated_at": UTCDateTime (khi cập nhật profile),
  "deleted_at": UTCDateTime (soft delete, không tồn tại = chưa xóa)
}
```

**Index:** `{ email: 1 }` unique

---

### Collection `products`

```json
{
  "_id":               ObjectId,
  "sku":               "string (mã sản phẩm)",
  "slug":              "string (unique, dùng cho URL)",
  "name":              "string",
  "brand":             "string",
  "category":          "string",
  "gender":            "men | women | unisex",
  "frame_material":    "string",
  "lens_type":         "string",
  "price":             number,
  "old_price":         number | null,
  "discount_percent":  number,
  "rating":            number (0-5),
  "review_count":      number,
  "sold_count":        number,
  "badge":             "string (nhãn hiển thị: -30%, Bestseller...)",
  "short_description": "string",
  "description":       "string (mô tả đầy đủ)",
  "thumbnail_url":     "string (URL ảnh đại diện)",
  "images": [
    { "image_url": "string", "is_primary": bool, "alt_text": "string" }
  ],
  "is_active":   bool,
  "is_featured": bool,
  "created_at":  UTCDateTime
}
```

**Index:** `{ slug: 1 }` unique

---

### Collection `product_variants`

```json
{
  "_id":        ObjectId,
  "product_id": ObjectId (ref products),
  "sku":        "string (unique)",
  "price":      number,
  "stock":      number,
  "color":      "string",
  "size":       "string"
}
```

---

### Collection `carts`

```json
{
  "_id":        ObjectId,
  "user_id":    ObjectId (ref users, unique),
  "created_at": UTCDateTime
}
```

Mỗi user chỉ có **1 cart**. Tự tạo khi user thêm sản phẩm lần đầu.

---

### Collection `cart_items`

```json
{
  "_id":                ObjectId,
  "cart_id":            ObjectId (ref carts),
  "product_variant_id": ObjectId (ref product_variants),
  "quantity":           number
}
```

---

### Collection `orders`

```json
{
  "_id":        ObjectId,
  "user_id":    ObjectId (ref users),
  "address_id": ObjectId | null,
  "items": [
    {
      "product_variant_id": ObjectId,
      "product_name":       "string (snapshot tại thời điểm đặt)",
      "price":              number,
      "quantity":           number
    }
  ],
  "total_price": number,
  "status":      "pending | confirmed | shipping | completed | cancelled",
  "created_at":  UTCDateTime
}
```

Items được **embed trực tiếp** vào order (không reference riêng) để giữ snapshot giá tại thời điểm đặt.

---

### Collection `reviews`

```json
{
  "_id":        ObjectId,
  "user_id":    ObjectId (ref users),
  "product_id": ObjectId (ref products),
  "rating":     number (1-5),
  "comment":    "string",
  "created_at": UTCDateTime
}
```

---

### Collections Bảo Mật

#### `rate_limits`
```json
{
  "_id":          ObjectId,
  "ip":           "string",
  "endpoint":     "string",
  "requests":     number,
  "window_start": UTCDateTime
}
```
**Index:** `{ ip: 1, endpoint: 1 }` unique, `{ window_start: 1 }`

#### `ip_blacklist`
```json
{
  "_id":        ObjectId,
  "ip":         "string (unique)",
  "reason":     "string",
  "violations": number,
  "blocked_at": UTCDateTime,
  "expires_at": UTCDateTime | null (null = vĩnh viễn)
}
```
**Index:** `{ ip: 1 }` unique, `{ expires_at: 1 }`

#### `security_logs`
```json
{
  "_id":        ObjectId,
  "ip":         "string",
  "endpoint":   "string",
  "method":     "string",
  "user_agent": "string",
  "event":      "string",
  "detail":     "string",
  "created_at": UTCDateTime
}
```
**Index:** `{ ip: 1, event: 1 }`, `{ created_at: 1 }`

---

## 4. Dữ Liệu Mẫu (Seed)

File: `database/seed_mongo.php`

**Chạy:**
```bash
# Windows với XAMPP
C:\xampp\php\php.exe database/seed_mongo.php

# Hoặc nếu PHP trong PATH
php database/seed_mongo.php
```

**Kết quả sau seed:**

| Collection | Số lượng |
|---|---|
| users | 2 (1 admin + 1 user) |
| products | 8 |
| product_variants | 8 |
| reviews | 3 |
| orders | 1 (mẫu, status: completed) |

**Tài khoản mẫu:**
```
Admin: admin@kinhxanh.vn  / Admin@123  (role_id: 1)
User:  user1@gmail.com    / User@123   (role_id: null)
```

**8 sản phẩm được seed:**

| Tên | Slug | Giá |
|---|---|---|
| Milan 01 Titanium | `gentle-monster-milan-01-titanium` | 1.200.000₫ |
| Ray-Ban Aviator Classic Gold | `ray-ban-aviator-classic-gold` | 3.200.000₫ |
| Oakley Round Classic Tortoise | `oakley-round-classic-tortoise` | 1.950.000₫ |
| Ray-Ban Classic Wayfarer | `ray-ban-classic-wayfarer` | 1.450.000₫ |
| Gucci Geometric Frame | `gucci-geometric-frame` | 4.800.000₫ |
| Oakley Holbrook Tortoise | `oakley-holbrook-tortoise` | 2.900.000₫ |
| Prada Heritage Black | `prada-heritage-black` | 2.400.000₫ |
| Gucci Elegante Black | `gucci-elegante-black` | 5.500.000₫ |

---

## 5. Kiểm Tra Trạng Thái DB

Truy cập endpoint debug (chỉ dùng khi development):

```
GET http://localhost:8000/backend/api/debug.php
```

Response mẫu:
```json
{
  "success": true,
  "needs_seed": false,
  "message": "✅ Database có dữ liệu.",
  "counts": {
    "products": 8,
    "product_variants": 8,
    "users": 2,
    "carts": 1,
    "cart_items": 2,
    "orders": 1
  },
  "mongo_uri": "mongodb://127.0.0.1:27017",
  "mongo_db": "kinh_xanh"
}
```

> **Lưu ý:** Xóa file `debug.php` trước khi deploy lên production.

---

## 6. Cấu Hình Kết Nối

File `.env` (tạo từ `.env.example`):

```env
MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DB=kinh_xanh
SECRET_KEY=KinhXanhSecretKey2026
```

**MongoDB Atlas (production):**
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/?retryWrites=true&w=majority
```

---

## 7. Schema MySQL Tham Khảo

File `database/e-commerce.sql` chứa schema MySQL đầy đủ dùng để tham khảo thiết kế quan hệ. Hệ thống thực tế chạy trên MongoDB.

Các bảng trong schema MySQL:
`roles`, `users`, `brands`, `categories`, `products`, `product_variants`, `product_images`, `cart`, `cart_items`, `addresses`, `orders`, `order_items`, `payments`, `reviews`, `wishlist`, `coupons`, `inventory_logs`

---

## 8. Garbage Collection Tự Động

Security collections được dọn dẹp tự động (xác suất 1% mỗi request):

| Collection | Điều kiện xóa |
|---|---|
| `rate_limits` | `window_start` cũ hơn 10 phút |
| `ip_blacklist` | `expires_at` đã qua (không xóa ban vĩnh viễn) |
| `security_logs` | `created_at` cũ hơn 7 ngày |

---

*© 2026 Kính Xanh Optical – Tài liệu Database*
