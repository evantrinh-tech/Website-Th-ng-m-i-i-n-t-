# 🗄️ Hướng Dẫn Chuyển Backend Sang MongoDB

## Tổng Quan

Backend đã được chuyển toàn bộ từ **MySQL/PDO** sang **MongoDB PHP Driver**.

| Cũ | Mới |
|---|---|
| MySQL / MariaDB | MongoDB >= 5.0 |
| PDO + SQL | `mongodb/mongodb` PHP library |
| `getPDO()` | `getCollection('tên_collection')` |
| Integer Auto-increment IDs | MongoDB `ObjectId` (string) |
| `.sql` schema file | Schema-less, seed bằng PHP script |

---

## 1. Cài Đặt Prerequisites

### 1.1 Cài PHP Extension MongoDB

```bash
# Với XAMPP (Windows) - tải DLL từ https://pecl.php.net/package/mongodb
# Thêm vào php.ini:
extension=mongodb

# Với Linux/Mac
pecl install mongodb
# Thêm vào php.ini: extension=mongodb.so
```

### 1.2 Cài Composer Package

```bash
cd backend
composer install
```

> Sẽ tải package `mongodb/mongodb ^1.17` vào `backend/vendor/`.

---

## 2. Cấu Hình `.env`

File `.env` đã được tạo ở thư mục gốc:

```ini
MONGO_URI=mongodb://127.0.0.1:27017
MONGO_DB=kinh_xanh
SECRET_KEY=KinhXanhSecretKey2026
```

**Dùng MongoDB Atlas (cloud)?** Đổi `MONGO_URI` thành:
```
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
```

---

## 3. Khởi Tạo Dữ Liệu Mẫu

```bash
# Chạy từ thư mục gốc dự án
php database/seed_mongo.php
```

Sẽ tạo các collections: `users`, `products`, `product_variants`, `carts`, `cart_items`, `orders`, `reviews`.

**Tài khoản mặc định sau seed:**
- Admin: `admin@kinhxanh.vn` / `Admin@123`
- User:  `user1@gmail.com`    / `User@123`

---

## 4. Collections Thay Thế Các Table MySQL

| MySQL Table | MongoDB Collection |
|---|---|
| `users` | `users` |
| `products` | `products` |
| `product_variants` | `product_variants` |
| `product_images` | `product_images` (hoặc embedded vào `products`) |
| `cart` | `carts` |
| `cart_items` | `cart_items` |
| `orders` + `order_items` | `orders` (items embedded) |
| `reviews` | `reviews` |

> **Order items** giờ được lưu embedded trong document `orders.items[]` thay vì bảng `order_items` riêng.

---

## 5. Các File Đã Thay Đổi

| File | Thay Đổi |
|---|---|
| `backend/config/database.php` | Thay PDO/MySQL → MongoDB Driver |
| `backend/lib/auth.php` | userId đổi từ `int` → `string` (ObjectId) |
| `backend/api/auth/login.php` | Dùng MongoDB query |
| `backend/api/auth/register.php` | Dùng MongoDB insertOne |
| `backend/api/auth/me.php` | Dùng MongoDB findOne |
| `backend/api/products.php` | Dùng MongoDB find + filter |
| `backend/api/product-detail.php` | Dùng MongoDB findOne |
| `backend/api/cart/index.php` | Dùng MongoDB |
| `backend/api/orders/index.php` | Dùng MongoDB (embedded items) |
| `backend/api/admin/index.php` | Dùng MongoDB aggregate |
| `backend/api/reviews/index.php` | Dùng MongoDB |
| `backend/composer.json` | Thêm `mongodb/mongodb` dependency |
| `.env` / `.env.example` | Đổi sang `MONGO_URI`, `MONGO_DB` |
| `database/seed_mongo.php` | Script seed dữ liệu mới |

---

## 6. Lưu Ý Quan Trọng

> [!IMPORTANT]
> PHP extension `mongodb` **phải được bật** trong `php.ini` trước khi chạy backend.

> [!WARNING]
> File `.env` chứa thông tin nhạy cảm — **KHÔNG commit lên Git**. Thêm `.env` vào `.gitignore`.

> [!TIP]
> Dùng **MongoDB Compass** (GUI miễn phí) để xem và quản lý data: https://www.mongodb.com/products/compass
