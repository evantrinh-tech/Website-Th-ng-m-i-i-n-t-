-- =========================================================
-- CSDL mẫu cho module API sản phẩm - Kính Xanh Optical
-- Tác giả phần việc: Võ Thành Tài
-- Công nghệ: MySQL 8.0+
-- =========================================================

CREATE DATABASE IF NOT EXISTS kinh_xanh CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kinh_xanh;

DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(150) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Mắt kính cận',
    gender VARCHAR(20) NOT NULL,
    frame_material VARCHAR(100) NOT NULL,
    lens_type VARCHAR(100) NOT NULL,
    price INT NOT NULL,
    old_price INT DEFAULT NULL,
    discount_percent TINYINT DEFAULT 0,
    rating DECIMAL(2,1) NOT NULL DEFAULT 4.5,
    review_count INT NOT NULL DEFAULT 0,
    badge VARCHAR(50) DEFAULT NULL,
    short_description VARCHAR(255) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    thumbnail_url VARCHAR(500) DEFAULT NULL,
    sold_count INT NOT NULL DEFAULT 0,
    is_featured TINYINT(1) NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255) DEFAULT NULL,
    is_primary TINYINT(1) NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 1,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

INSERT INTO products
(sku, slug, name, brand, category, gender, frame_material, lens_type, price, old_price, discount_percent, rating, review_count, badge, short_description, description, thumbnail_url, sold_count, is_featured)
VALUES
('KX-1001', 'milan-01-titanium', 'Milan 01 Titanium', 'Gentle Monster', 'Mắt kính cận', 'Unisex', 'Titanium', 'Chống ánh sáng xanh', 1200000, 1500000, 20, 4.8, 124, 'Hot', 'Gọng Titan siêu nhẹ, kháng khuẩn', 'Thiết kế thanh lịch, trọng lượng nhẹ, phù hợp sử dụng cả ngày trong môi trường học tập và văn phòng.', 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80', 180, 1),
('KX-1002', 'aviator-optics-gold', 'Aviator Optics Gold', 'Ray-Ban', 'Mắt kính cận', 'Nam', 'Kim loại', 'Chống tia UV', 1850000, NULL, 0, 4.9, 256, 'Bestseller', 'Phủ lớp chống phản quang HMC', 'Dáng Aviator cổ điển kết hợp lớp phủ HMC giúp cải thiện trải nghiệm nhìn trong nhiều điều kiện ánh sáng.', 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=900&q=80', 320, 1),
('KX-1003', 'round-classic-tortoise', 'Round Classic Tortoise', 'Oakley', 'Mắt kính cận', 'Nữ', 'Acetate', 'Chống ánh sáng xanh', 1950000, 2450000, 20, 4.7, 89, 'Sale', 'Chất liệu nhựa Acetate tự nhiên', 'Thiết kế tròn cổ điển, gọng bền chắc, phù hợp người dùng thích phong cách vintage hiện đại.', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80', 140, 0),
('KX-1004', 'urban-square-black', 'Urban Square Black', 'Prada', 'Mắt kính cận', 'Unisex', 'Nhựa cao cấp', 'Chống tia UV', 2400000, 2800000, 14, 4.8, 102, 'Premium', 'Phong cách tối giản, hiện đại', 'Mẫu kính vuông dành cho người dùng yêu thích sự tối giản, dễ phối trang phục công sở.', 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=900&q=80', 110, 1),
('KX-1005', 'titanium-luxe-kx8801', 'KX-8801 Titanium Luxe', 'Kính Xanh', 'Mắt kính cận', 'Nam', 'Titanium', 'Tròng mẫu', 1200000, 1500000, 20, 4.9, 128, 'New', 'Chất liệu Titanium nguyên khối', 'Sản phẩm nổi bật với đệm mũi silicone y tế và càng kính linh hoạt, phù hợp sử dụng lâu dài.', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80', 275, 1),
('KX-1006', 'retro-circular-gold', 'Retro Circular Gold', 'Ray-Ban', 'Mắt kính cận', 'Unisex', 'Kim loại', 'Chống ánh sáng xanh', 1450000, NULL, 0, 4.6, 73, NULL, 'Kiểu dáng tròn thanh mảnh', 'Sản phẩm phù hợp với khách hàng yêu thích phong cách cổ điển nhẹ nhàng.', 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=900&q=80', 90, 0),
('KX-1007', 'titanium-slim-silver', 'Titanium Slim Silver', 'Kính Xanh', 'Mắt kính cận', 'Nữ', 'Titanium', 'Chống tia UV', 1200000, NULL, 0, 4.7, 67, NULL, 'Gọng mảnh, thanh thoát', 'Gọng titan màu bạc tạo cảm giác sang trọng và thoải mái khi đeo trong thời gian dài.', 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=900&q=80', 95, 0),
('KX-1008', 'holbrook-office-blue', 'Holbrook Office Blue', 'Oakley', 'Mắt kính cận', 'Nam', 'Nhựa cao cấp', 'Chống ánh sáng xanh', 3120000, 3670000, 15, 4.8, 150, 'Office', 'Phù hợp dân văn phòng, làm việc máy tính', 'Mẫu kính tối ưu cho người thường xuyên sử dụng máy tính và thiết bị số.', 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=900&q=80', 200, 1),
('KX-1009', 'heritage-black-prada', 'Heritage Black', 'Prada', 'Mắt kính cận', 'Nữ', 'Nhựa cao cấp', 'Chống tia UV', 2400000, 4800000, 50, 4.9, 188, 'Flash Sale', 'Tông đen sang trọng, cá tính', 'Thiết kế phù hợp phong cách thời trang cao cấp, nổi bật ở khả năng phối trang phục linh hoạt.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80', 260, 1),
('KX-1010', 'wayfarer-classic', 'Classic Wayfarer', 'Ray-Ban', 'Mắt kính cận', 'Unisex', 'Acetate', 'Chống tia UV', 1450000, 2230000, 35, 4.8, 211, 'Sale', 'Mẫu kính bán chạy quanh năm', 'Biểu tượng thời trang vượt thời gian, phù hợp nhiều dáng mặt và nhiều hoàn cảnh sử dụng.', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=900&q=80', 310, 1);

INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) VALUES
(1, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80', 'Milan 01 Titanium - ảnh chính', 1, 1),
(1, 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=900&q=80', 'Milan 01 Titanium - góc nghiêng', 0, 2),
(1, 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80', 'Milan 01 Titanium - cận cảnh', 0, 3),

(2, 'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=900&q=80', 'Aviator Optics Gold - ảnh chính', 1, 1),
(2, 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=900&q=80', 'Aviator Optics Gold - cận cảnh', 0, 2),

(3, 'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80', 'Round Classic Tortoise - ảnh chính', 1, 1),

(4, 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=900&q=80', 'Urban Square Black - ảnh chính', 1, 1),

(5, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=80', 'KX-8801 Titanium Luxe - ảnh chính', 1, 1),
(5, 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=900&q=80', 'KX-8801 Titanium Luxe - ảnh 2', 0, 2),
(5, 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80', 'KX-8801 Titanium Luxe - ảnh 3', 0, 3),

(6, 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=900&q=80', 'Retro Circular Gold - ảnh chính', 1, 1),

(7, 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=900&q=80', 'Titanium Slim Silver - ảnh chính', 1, 1),

(8, 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=900&q=80', 'Holbrook Office Blue - ảnh chính', 1, 1),

(9, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80', 'Heritage Black - ảnh chính', 1, 1),

(10, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=900&q=80', 'Classic Wayfarer - ảnh chính', 1, 1);
