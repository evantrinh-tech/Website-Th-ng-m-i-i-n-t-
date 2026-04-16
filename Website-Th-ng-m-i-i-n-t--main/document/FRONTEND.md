# Tài Liệu Frontend – Kính Xanh Optical

> Mô tả kiến trúc, các trang HTML, file JavaScript và luồng tương tác người dùng.

---

## 1. Công Nghệ Sử Dụng

| Công nghệ | Mục đích |
|---|---|
| HTML5 | Cấu trúc trang tĩnh |
| Tailwind CSS (CDN) | Styling utility-first, cấu hình qua `tailwind-config.js` |
| Vanilla JavaScript ES6+ | Logic tương tác, gọi API qua `fetch()` |
| Material Symbols (Google) | Icon font |
| AOS.js | Hiệu ứng scroll animation |

Không dùng framework SPA (React/Vue). Mỗi trang là file HTML độc lập.

---

## 2. Danh Sách Trang HTML

| File | Mô tả | JS đi kèm |
|---|---|---|
| `index.html` | Trang chủ: hero banner, flash sale, bestsellers | `main.js`, `add-to-cart.js` |
| `products.html` | Danh sách sản phẩm + bộ lọc sidebar | `main.js`, `product-api.js`, `add-to-cart.js` |
| `product-detail.html` | Chi tiết sản phẩm, gallery ảnh, chọn màu/tròng | `main.js`, `product-api.js`, `add-to-cart.js` |
| `cart.html` | Giỏ hàng: xem, xóa, cập nhật số lượng | `main.js`, `add-to-cart.js`, `cart-api.js` |
| `checkout.html` | Thanh toán: form giao hàng, chọn PTTT, tóm tắt đơn | `main.js`, `checkout-api.js` |
| `order-success.html` | Xác nhận đặt hàng thành công | `main.js` |
| `login.html` | Đăng nhập tài khoản | `main.js`, `auth-api.js` |
| `register.html` | Đăng ký tài khoản mới | `main.js`, `auth-api.js` |
| `profile.html` | Hồ sơ cá nhân, đổi mật khẩu, lịch sử đơn hàng | `main.js`, `profile-api.js` |
| `admin.html` | Dashboard quản trị: thống kê, đơn hàng gần đây | `main.js`, `admin-api.js` |
| `about.html`, `brands.html`, `stores.html`, `guide.html`, `support.html`, `privacy.html`, `terms.html`, `404.html` | Trang tĩnh nội dung | `main.js` |

---

## 3. Các File JavaScript

### `main.js` – Logic UI Toàn Cục
Chạy trên mọi trang, xử lý:

- **Toast Notification** – `window.showToast(message, type)` thay thế `window.alert`
- **Cart Badge** – `ensureCartBadges()` tạo badge số lượng trên icon giỏ hàng ở header
- **Favorite Button** – Toggle trái tim yêu thích (UI only)
- **Countdown Timer** – Đếm ngược Flash Sale trên trang chủ
- **Product Detail UI** – Gallery ảnh thumbnail, chọn màu gọng, chọn loại tròng, tab mô tả
- **Filter UI** – Bộ lọc sản phẩm, range slider giá, lọc giới tính

```js
// Ví dụ dùng toast
window.showToast('Đã thêm vào giỏ hàng!', 'success');
window.showToast('Vui lòng đăng nhập.', 'warning');
window.showToast('Lỗi kết nối.', 'error');
```

---

### `auth-api.js` – Xác Thực Người Dùng

**Redirect guard** – Nếu đã có token, tự redirect khỏi `login.html` / `register.html`.

```
Đăng nhập  → POST /backend/api/auth/login.php
           → Lưu localStorage['kx_auth_token'] + localStorage['kx_user']
           → Redirect index.html

Đăng ký    → POST /backend/api/auth/register.php
           → Tự động đăng nhập sau khi thành công

window.AuthFetcher(url, options)
           → Tự đính kèm Authorization: Bearer <token>
```

---

### `add-to-cart.js` – Thêm Vào Giỏ Hàng

Xử lý tất cả nút `[data-cart-action="add-to-cart"]` trên toàn site.

**Luồng xử lý:**
1. Nếu nút có `data-variant-id` → gọi API thêm trực tiếp
2. Nếu nút/thẻ cha có `data-slug` → gọi `/product-variants.php?slug=...` lấy variant ID → thêm vào giỏ
3. Không có gì → hiện toast hướng dẫn

```html
<!-- Cách gắn vào HTML -->
<button data-cart-action="add-to-cart" data-product-slug="ray-ban-aviator-classic-gold">
  Thêm vào giỏ
</button>

<!-- Hoặc trên thẻ cha -->
<div data-slug="ray-ban-aviator-classic-gold">
  <button data-cart-action="add-to-cart">Thêm vào giỏ</button>
</div>
```

Export global: `window.bindAddToCartButtons()`, `window.addToCartAPI()`, `window.refreshCartBadge()`

---

### `cart-api.js` – Giỏ Hàng

```
Tải giỏ hàng  → GET    /backend/api/cart/index.php
Xóa item      → DELETE /backend/api/cart/index.php  { cart_item_id }
Cập nhật qty  → PUT    /backend/api/cart/index.php  { cart_item_id, quantity }
Đặt hàng      → POST   /backend/api/orders/index.php
```

Tính toán: Tạm tính + VAT 8% + Tổng thanh toán hiển thị real-time.

---

### `product-api.js` – Sản Phẩm

```
Danh sách  → GET /backend/api/products.php?q=&brand=&sort=&page=&limit=
Chi tiết   → GET /backend/api/product-detail.php?slug= hoặc ?id=
```

**Data attributes để kết nối HTML:**
```html
<input data-search-input />           <!-- Ô tìm kiếm -->
<select data-sort-select>             <!-- Dropdown sắp xếp -->
<input data-filter="brand" />         <!-- Checkbox lọc thương hiệu -->
<input data-filter="gender" />        <!-- Checkbox lọc giới tính -->
<input data-min-price />              <!-- Giá tối thiểu -->
<div data-product-grid></div>         <!-- Grid render sản phẩm -->
<div data-pagination></div>           <!-- Phân trang -->
<section data-product-detail-root>    <!-- Chi tiết sản phẩm -->
```

---

### `profile-api.js` – Hồ Sơ Người Dùng

```
loadProfile()  → GET /backend/api/auth/me.php  → điền form
saveProfile()  → PUT /backend/api/auth/me.php  → cập nhật name, phone, password
loadOrders()   → GET /backend/api/orders/index.php → hiển thị đơn hàng
logout()       → Xóa localStorage → redirect login.html
```

Bảo vệ: Không có token → tự redirect `login.html`.

---

### `checkout-api.js` – Thanh Toán

```
loadCheckoutCart()  → GET  /backend/api/cart/index.php → hiển thị sản phẩm + tính tiền
validateShipping()  → Validate họ tên, SĐT (regex 0/+84), địa chỉ
submitOrder()       → POST /backend/api/orders/index.php → tạo đơn hàng
```

---

### `admin-api.js` – Quản Trị

```
loadAdminStats()    → GET /backend/api/admin/index.php
                    → Hiển thị: tổng doanh thu, đơn hàng, users, sản phẩm
                    → Nếu 403 → showToast + redirect index.html
loadRecentOrders()  → GET /backend/api/orders/index.php → bảng đơn hàng
```

---

## 4. Quản Lý Trạng Thái

Không dùng state management library. Trạng thái lưu tại:

| Nơi lưu | Key | Dữ liệu |
|---|---|---|
| `localStorage` | `kx_auth_token` | JWT token (24h) |
| `localStorage` | `kx_user` | `{ id, name, email, role_id }` |
| DOM | `data-cart-count` | Số lượng sản phẩm trong giỏ |

---

## 5. Cấu Trúc Thư Mục Frontend

```
/
├── index.html
├── products.html
├── product-detail.html
├── cart.html
├── checkout.html
├── login.html
├── register.html
├── profile.html
├── admin.html
├── css/
│   └── style.css          # CSS tùy chỉnh bổ sung Tailwind
├── js/
│   ├── main.js            # UI toàn cục
│   ├── tailwind-config.js # Cấu hình Tailwind
│   ├── auth-api.js        # Đăng nhập / đăng ký
│   ├── add-to-cart.js     # Thêm giỏ hàng
│   ├── cart-api.js        # Giỏ hàng
│   ├── product-api.js     # Sản phẩm
│   ├── profile-api.js     # Hồ sơ
│   ├── checkout-api.js    # Thanh toán
│   └── admin-api.js       # Quản trị
└── images/                # Ảnh sản phẩm tĩnh
```

---

## 6. Thứ Tự Load Script

Mỗi trang cần load `main.js` trước, sau đó mới đến các file chức năng:

```html
<!-- Bắt buộc trên mọi trang -->
<script src="js/main.js"></script>

<!-- Trang sản phẩm -->
<script src="js/product-api.js"></script>
<script src="js/add-to-cart.js"></script>

<!-- Trang giỏ hàng -->
<script src="js/add-to-cart.js"></script>
<script src="js/cart-api.js"></script>

<!-- Trang thanh toán -->
<script src="js/checkout-api.js"></script>

<!-- Trang hồ sơ -->
<script src="js/profile-api.js"></script>

<!-- Trang admin -->
<script src="js/admin-api.js"></script>

<!-- Trang đăng nhập/đăng ký -->
<script src="js/auth-api.js"></script>
```

---

*© 2026 Kính Xanh Optical – Tài liệu Frontend*
