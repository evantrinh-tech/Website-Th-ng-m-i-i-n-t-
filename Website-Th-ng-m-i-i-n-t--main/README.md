# 👓 Kính Xanh Optical — Nền tảng Thương mại Điện tử Kính mắt Cao cấp

> *"See the world in detail."* — Kính Xanh Optical

**Kính Xanh** là một dự án website thương mại điện tử chuyên nghiệp dành riêng cho ngành kính mắt thời trang cao cấp. Dự án được xây dựng hoàn toàn bằng HTML5, Vanilla JavaScript và Tailwind CSS — không cần framework backend hay build step phức tạp. Mục tiêu là cung cấp trải nghiệm mua sắm kính mắt tinh tế, đồng bộ giao diện và sẵn sàng tích hợp API.

---

## 📁 Cấu trúc Thư mục

```text
frontend/
├── index.html               # Trang chủ (Homepage)
├── products.html            # Danh sách sản phẩm & Bộ lọc 
├── product-detail.html      # Chi tiết sản phẩm
├── cart.html                # Giỏ hàng
├── checkout.html            # Thanh toán
├── order-success.html       # Xác nhận đặt hàng thành công
├── login.html               # Đăng nhập / Đăng ký tài khoản
├── profile.html             # Hồ sơ cá nhân & Đơn hàng của tôi
├── brands.html              # Giới thiệu các thương hiệu kính
├── about.html               # Giới thiệu về Kính Xanh
├── support.html             # Hỗ trợ khách hàng & FAQ
├── stores.html              # Hệ thống cửa hàng & Bản đồ
├── guide.html               # Cẩm nang chăm sóc mắt (Ophthalmology Guide)
├── privacy.html             # Chính sách bảo mật thông tin
├── terms.html               # Điều khoản dịch vụ
├── 404.html                 # Trang lỗi 404 (Không tìm thấy)
├── admin/
│   └── admin.html           # Trang quản trị (Admin Dashboard)
├── css/
│   └── style.css            # Custom CSS: Glassmorphism, Animation, Scrollbar, Grid
├── js/
│   ├── tailwind-config.js   # Design System: Màu sắc, Font, Border-radius
│   └── main.js              # Logic nghiệp vụ (1876 dòng): Cart, Filter, Toast...
└── images/                  # Thư mục hình ảnh tĩnh (tuỳ chọn)
```

---

## 🗂️ Mô tả Chi tiết Từng File HTML

###  `index.html` — Trang Chủ
Trang khởi đầu của website với đầy đủ các phần:
- **Thanh thông báo** (Announcement Bar): Hiển thị mã khuyến mãi `KINHXANH20`.
- **Header điều hướng**: Logo + Menu (Bộ sưu tập, Bán chạy, Khuyến mãi, Thương hiệu, Hỗ trợ) + Tìm kiếm + Giỏ hàng.
- **Hero Banner**: Thiết kế editorial với hình ảnh kính cao cấp và CTA chính.
- **Flash Sale Section**: Đếm ngược thời gian thực theo giờ/phút/giây.
- **Danh mục sản phẩm nổi bật**: Grid sản phẩm bán chạy.
- **Bảng xếp hạng Top 5**: Popup modal animated khi nhấn nút.
- **Thương hiệu**: Section Ray-Ban có modal khám phá bộ sưu tập.
- **Newsletter**: Form đăng ký email nhận tin.
- **Footer đầy đủ**: 4 cột (Giới thiệu, Khám phá, Hỗ trợ, Bản đồ) + Logo thanh toán (Visa, Mastercard, MoMo).

###  `products.html` — Danh Sách Sản Phẩm
- **Sidebar lọc chuyên nghiệp**:
  - Lọc theo Thương hiệu 
  - Lọc theo Khoảng giá 
  - Lọc theo Giới tính 
  - Lọc theo Chất liệu gọng.
  - Nút "Xóa tất cả bộ lọc".
- **Lưới sản phẩm**: Card sản phẩm với hình ảnh, giá, badge giảm giá, nút Thêm vào giỏ và Yêu thích.
- **Phân trang**: Có highlight trang đang chọn.
- **Sắp xếp**: Theo giá, theo mới nhất.
- **Mobile Drawer**: Bộ lọc trượt từ cạnh trên màn hình nhỏ.

###  `product-detail.html` — Chi Tiết Sản Phẩm
- **Bộ sưu tập hình ảnh**: Ảnh chính + 3 thumbnail click được (đổi ảnh chính).
- **Thông tin sản phẩm**: Tên, SKU, đánh giá sao, giá gốc & giá khuyến mãi, badge tính năng (UV400, Anti-blue light, Lightweight Titanium).
- **Lựa chọn tuỳ biến**:
  - Chọn màu gọng (Black / Gold / Silver) — cập nhật nhãn tức thì.
  - Chọn loại tròng kính (Tròng mẫu / Tròng cận loạn).
  - Upload đơn thuốc (toa kính) — mở hộp thoại chọn file thực.
- **Tab chi tiết**: Mô tả sản phẩm / Thông số kỹ thuật / Chế độ bảo hành / Đánh giá.
- **Thanh mua hàng cố định** (Sticky bar): Hiển thị thông tin đã chọn + nút "Thêm vào giỏ" phía dưới màn hình.
- **Sản phẩm liên quan**: Grid 4 sản phẩm gợi ý.

###  `cart.html` — Giỏ Hàng
- **Danh sách sản phẩm trong giỏ**: Hình ảnh, tên, màu sắc, số lượng (tăng/giảm động), nút xoá sản phẩm.
- **Tổng kết đơn hàng**: Tạm tính, VAT (8%), Phí vận chuyển (Miễn phí), Tổng cộng — tự động cập nhật khi thay đổi số lượng.
- **Nhập mã giảm giá**: Xác nhận mã và thông báo thành công.
- **Sản phẩm gợi ý thêm** (Upsells): 2 card sản phẩm đề xuất.
- **Nút Tiến hành thanh toán**: Chuyển sang `checkout.html`.

### `checkout.html` — Thanh Toán
- **Thông tin giao hàng**: Họ tên, Số điện thoại, Địa chỉ.
- **Thông tin toa kính** (Clinical Note): Textare ghi chú thông số kính mắt cho kỹ thuật viên Lab.
- **Phương thức thanh toán**:
  - COD — Thanh toán khi nhận hàng.
  - Chuyển khoản Ngân hàng.
  - Ví MoMo.
  - ZaloPay.
- **Tóm tắt đơn hàng**: Hiển thị sản phẩm đang thanh toán và tổng cộng từ giỏ hàng (localStorage).
- **Tín hiệu bảo mật**: SSL 256-bit, 30 ngày đổi trả, Chứng nhận Y khoa.
- **Nút Hoàn tất**: Xóa giỏ hàng và chuyển hướng đến `order-success.html`.

###  `order-success.html` — Đặt Hàng Thành Công
- Hiển thị mã đơn hàng, thông tin người nhận, thời gian giao hàng dự kiến.
- Nút "Về Trang Chủ" và "Tiếp Tục Mua Sắm".
- Hiệu ứng trang trí gradient nền.

### `login.html` — Đăng Nhập
- **Bố cục 2 cột**: Trái — hình ảnh thương hiệu editorial; Phải — form đăng nhập.
- **Đăng nhập nhanh**: Button Google OAuth & Facebook.
- **Form email/mật khẩu**: Validating và chuyển đến `profile.html` sau 800ms.
- **Liên kết**: Quên mật khẩu / Đăng ký ngay.
- Footer với Chính sách bảo mật, Điều khoản.

###  `profile.html` — Hồ Sơ Cá Nhân
- **Sidebar điều hướng**: Hồ sơ cá nhân / Quản lý đơn hàng / Sản phẩm yêu thích / Địa chỉ giao hàng / Đăng xuất.
- **Form chỉnh sửa thông tin**: Họ tên, Số điện thoại, Email — có nút "Lưu Thay Đổi".
- **Đơn hàng gần đây**: Hiển thị trạng thái đơn hàng (đang giao, đã giao...).

###  `brands.html` — Thương Hiệu
- Giới thiệu các thương hiệu kính cao cấp (Ray-Ban, Oakley, Gucci, Persol, Cartier, Prada...).
- Card thương hiệu với hình ảnh, mô tả và CTA "Khám phá".

###  `about.html` — Giới Thiệu
- Lịch sử hình thành và giá trị cốt lõi của Kính Xanh.
- Section đội ngũ, số liệu nổi bật, tầm nhìn thương hiệu.

### `support.html` — Hỗ Trợ Khách Hàng
- **Thông tin liên hệ trực tiếp**: Địa chỉ trụ sở, Hotline 1800 6688, Email hỗ trợ.
- **FAQ (Accordion)**: Bao lâu nhận kính? Chính sách bảo hành?
- **Form gửi yêu cầu**: Họ tên, SĐT, Nội dung — có xử lý submit với thông báo thành công.
- **Bản đồ**: Hình ảnh bản đồ TP.HCM.
- **Footer đầy đủ 4 cột** giống Homepage.

###  `stores.html` — Hệ Thống Cửa Hàng
- Danh sách 3 chi nhánh: Gò Vấp, Bình Thạnh, Cầu Giấy (Hà Nội).
- Nút "Chỉ Đường" mở Google Maps.
- Bản đồ minh họa tích hợp.

###  `guide.html` — Cẩm Nang Nhãn Khoa
- Hướng dẫn vệ sinh tròng kính đúng cách.
- Giải thích về ánh sáng xanh (Blue Light) và tròng lọc.
- CTA đặt lịch khám mắt.

###  `privacy.html` — Chính Sách Bảo Mật
- Mục đích thu thập thông tin, phạm vi thu thập.
- Thời gian lưu trữ và cam kết không chia sẻ dữ liệu.
- Mã hóa SSL/TLS.

### `terms.html` — Điều Khoản Dịch Vụ
- Quy định chung khi đặt hàng và mua kính.
- Chính sách thanh toán (COD, Ngân hàng, MoMo, ZaloPay, VNPay).
- Chính sách giải quyết khiếu nại (48h làm việc).

###  `404.html` — Trang Lỗi
- Thông báo lỗi
- Nút "Dẫn Tôi Về Trang Chủ".

###  `admin/admin.html` — Quản Trị Hệ Thống
- **Sidebar điều hướng tiếng Việt**: Tổng quan, Kho hàng, Đơn hàng, Khách hàng, Phân tích, Cài đặt, Đăng xuất.
- **Bento Grid thống kê**: Tổng doanh thu, Đơn hàng mới, Người dùng, Tồn kho SKU.
- **Biểu đồ xu hướng doanh thu** (Mock bar chart).
- **Cảnh báo tồn kho**: Thông báo bộ sưu tập dưới 10 đơn vị.
- **Bảng đơn hàng gần đây**: Mã đơn, Khách hàng, Loại tròng, Trạng thái, Số tiền.

---

##  Công Nghệ Sử Dụng

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| **HTML5** | — | Cấu trúc trang, Semantic markup |
| **JavaScript (ES6+)** | — | Logic nghiệp vụ toàn bộ site |
| **Tailwind CSS** | CDN (v3) | Utility-first styling |
| **AOS.js** | v2.3.1 | Animate On Scroll — hiệu ứng xuất hiện |
| **Google Material Symbols** | Latest | Hệ thống biểu tượng nhất quán |
| **Google Fonts** | — | Manrope (Headline) + Inter (Body/Label) |

---

## 🎨 Design System (`js/tailwind-config.js`)

Dự án sử dụng **Material Design 3 Color System** tuỳ biến cho thương hiệu Kính Xanh:

### Màu sắc Chủ đạo
| Token | Màu | Mô tả |
|---|---|---|
| `primary` | `#00113a` | Xanh navy đậm (thương hiệu chính) |
| `secondary` | `#785900` | Vàng nâu (điểm nhấn) |
| `secondary-container` | `#fdc003` | Vàng sáng (badge, CTA nổi bật) |
| `surface` | `#f8f9fa` | Nền trang chính |
| `on-primary` | `#ffffff` | Chữ trên nền primary |
| `error` | `#ba1a1a` | Cảnh báo / Xóa sản phẩm |

### Typography
- **`font-headline`**: `Manrope` — Tiêu đề, tên sản phẩm, logo.
- **`font-body`**: `Inter` — Nội dung văn bản thông thường.
- **`font-label`**: `Inter` — Nhãn, mã, số nhỏ.

### Hiệu ứng đặc trưng (`css/style.css`)
- **`.glass-nav`** / **`.glass-panel`**: Glassmorphism — blur 20px, nền trong suốt.
- **`.page-fade`**: Hiệu ứng fadeIn 0.6s khi chuyển trang (`translateY(10px)` → `0`).
- **`.ai-scanline`**: Animation quét AI dọc màn hình (4s loop).
- **`.bento-grid`**: Grid 4 cột cho dashboard.
- **Scrollbar tùy chỉnh**: Mảnh, tròn, màu outline-variant.

---

## ⚙️ Logic Nghiệp Vụ (`js/main.js` — 1876 dòng)

### Hệ thống Toast Thông báo (Global)
Thay thế hoàn toàn `window.alert` mặc định của trình duyệt. Mọi thông báo đều hiển thị dưới dạng toast đẹp, góc trên phải, tự tắt sau 3 giây.

```
✅ Thành công  — viền xanh lá, icon check_circle
❌ Lỗi         — viền đỏ,    icon error
ℹ️ Thông tin   — viền xanh dương, icon info
⚠️ Cảnh báo   — viền cam,   icon warning
```

### Giỏ hàng (LocalStorage)
- Lưu giỏ hàng vào `localStorage` với key `kx_cart` (dạng JSON).
- Đồng bộ số lượng badge giỏ hàng trên mọi trang tự động (`data-cart-count`).
- Animation nút "Thêm vào giỏ": chuyển sang ✅ "Đã thêm" trong 1.5 giây.
- Tính toán động: Tạm tính → VAT 8% → Tổng cộng.
- Checkout xóa sản phẩm đã thanh toán khỏi giỏ và cập nhật badge.

### Trang Sản phẩm (`products.html`)
- **Lọc Thương hiệu & Chất liệu**: Checkbox, toast thông báo mỗi lần chọn.
- **Lọc Khoảng giá**: Range slider, cập nhật hiển thị giá thời gian thực.
- **Lọc Giới tính**: Nút toggle, highlight trạng thái Active.
- **Xóa tất cả bộ lọc**: Reset toàn bộ checkbox.
- **Phân trang**: Highlight trang đang chọn.

### Trang Chi tiết Sản phẩm (`product-detail.html`)
- Gallery thumbnail click-to-change.
- Chọn màu gọng → cập nhật nhãn realtime.
- Chọn loại tròng → highlight lựa chọn.
- Upload toa kính → mở file picker thực.
- Tab (Mô tả / Thông số / Bảo hành / Đánh giá) → switch active.
- Sticky bar hiển thị màu + tròng đã chọn.

### Các tính năng Trang chủ
- **Countdown Flash Sale**: Đếm ngược realtime (giờ:phút:giây).
- **Modal Bảng xếp hạng Top 5**: Popup animated, có thể đóng bằng click ngoài.
- **Modal Ray-Ban Explorer**: Khám phá bộ sưu tập với nút thêm vào giỏ.
- **Virtual Try-On**: Toast "Đang kết nối AI Camera...".
- **Global Search**: Nhấn Enter → toast + redirect sang `products.html`.
- **Newsletter**: Validate email và thông báo đăng ký thành công.

### Luồng Đăng nhập
Form submit → spinner 800ms → redirect `profile.html`.

### Luồng Hỗ trợ (`support.html`)
Form gửi yêu cầu → xác thực → toast thành công / cảnh báo.

---

##  Luồng Người Dùng (User Flow)

```
index.html
    ↓ (Xem sản phẩm)
products.html → (Lọc, Sắp xếp, Tìm kiếm)
    ↓ (Click sản phẩm)
product-detail.html → (Chọn màu/tròng, Upload toa kính)
    ↓ (Thêm vào giỏ)
cart.html → (Điều chỉnh số lượng, Nhập mã giảm giá)
    ↓ (Tiến hành thanh toán)
checkout.html → (Điền thông tin, Chọn thanh toán)
    ↓ (Đặt hàng thành công)
order-success.html

Tài khoản:
login.html → profile.html (Xem đơn hàng, Chỉnh sửa thông tin)

Quản trị:
admin/admin.html (Dashboard, Kho hàng, Đơn hàng, Khách hàng)
```

---

##  Hướng dẫn Chạy Dự Án

Đây là dự án Web tĩnh — **không cần cài đặt, không cần build step**.

**Cách 1 — Mở trực tiếp:**
```
Nhấp đúp vào file index.html để mở trong trình duyệt.
```

**Cách 2 — Live Server (khuyến nghị):**
1. Cài extension **Live Server** trong VS Code.
2. Chuột phải vào `index.html` → **Open with Live Server**.
3. Trình duyệt tự động mở và đồng bộ khi sửa code.

**Lưu ý:** Giỏ hàng và dữ liệu người dùng được lưu trong `localStorage` của trình duyệt — không cần server hay database.

---

##  Lưu Ý Kỹ Thuật

- **Encoding**: Toàn bộ file HTML dùng **UTF-8** để hiển thị tiếng Việt chính xác.
- **Data Attributes**: Hệ thống lọc dùng `data-*` (ví dụ: `data-brand`, `data-price`) để dễ mở rộng dữ liệu sản phẩm.
- **LocalStorage Key**: `kx_cart` — lưu mảng JSON các sản phẩm trong giỏ.
- **Responsive**: Header có menu thu gọn trên mobile (≤ `xl` breakpoint).
- **Dark Mode**: Config Tailwind có `darkMode: "class"` — sẵn sàng bật Dark Mode bằng cách thêm class `dark` vào thẻ `<html>`.
- **SEO**: Mỗi trang có `<title>` riêng và `<meta name="description">` đầy đủ.
- **Chú thích code**: Toàn bộ file HTML có comment tiếng Việt phân đoạn rõ ràng và dòng mô tả file ở đầu mỗi file.

---

##  Định hướng Tiếp theo (Next Steps)

- [ ] Kết nối **REST API Backend** (Node.js / Django / Laravel) cho sản phẩm, đơn hàng, tài khoản.
- [ ] Tích hợp **Payment Gateway** thực (VNPay, MoMo, ZaloPay).
- [ ] Xây dựng tính năng **Virtual Try-On AR** thực sự bằng MediaPipe FaceMesh.
- [ ] Thêm trang **Đăng ký tài khoản** và luồng **Quên mật khẩu**.
- [ ] Triển khai **Dark Mode** hoàn chỉnh.
- [ ] Tối ưu **SEO nâng cao**: Open Graph, Schema.org Product markup.

---

<div align="center">

**Kính Xanh Optical** — *Hệ thống kính mắt cao cấp hàng đầu Việt Nam.*

🌐 © 2026 Kính Xanh Optical. All rights reserved.

</div>
