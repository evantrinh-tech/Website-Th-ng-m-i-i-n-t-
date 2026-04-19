<?php
/**
 * Seed toàn bộ sản phẩm từ website vào MongoDB
 * Chạy: php database/seed_mongo.php
 */
declare(strict_types=1);

$envPath = __DIR__ . '/../.env';
if (!file_exists($envPath)) $envPath = __DIR__ . '/../.env.example';
if (file_exists($envPath)) {
    foreach (parse_ini_file($envPath) as $k => $v) $_ENV[$k] = $v;
}

$autoload = __DIR__ . '/../backend/vendor/autoload.php';
if (!file_exists($autoload)) die("❌ Chưa cài mongodb/mongodb. Chạy: cd backend && composer install\n");
require_once $autoload;

$uri    = $_ENV['MONGO_URI'] ?? 'mongodb://127.0.0.1:27017';
$dbName = $_ENV['MONGO_DB']  ?? 'kinh_xanh';
$client = new \MongoDB\Client($uri);
$db     = $client->selectDatabase($dbName);

echo "🚀 Kết nối: $uri / $dbName\n";
echo "⚠️  Xóa dữ liệu cũ...\n";

foreach (['users','products','product_variants','product_images','carts','cart_items','orders','reviews'] as $col) {
    $db->dropCollection($col);
}
echo "✅ Đã xóa.\n\n";

// ── USERS ────────────────────────────────────────────────────
$usersCol = $db->users;
$usersCol->createIndex(['email' => 1], ['unique' => true]);

$adminId = $usersCol->insertOne([
    'name'       => 'Admin Kính Xanh',
    'email'      => 'admin@kinhxanh.vn',
    'password'   => password_hash('Admin@123', PASSWORD_DEFAULT),
    'phone'      => '0901234567',
    'role_id'    => 1,
    'created_at' => new \MongoDB\BSON\UTCDateTime(),
])->getInsertedId();

$userId1 = $usersCol->insertOne([
    'name'       => 'Nguyễn Văn A',
    'email'      => 'user1@gmail.com',
    'password'   => password_hash('User@123', PASSWORD_DEFAULT),
    'phone'      => '0987654321',
    'role_id'    => null,
    'created_at' => new \MongoDB\BSON\UTCDateTime(),
])->getInsertedId();

echo "✅ Users: 2\n";

// ── PRODUCTS ─────────────────────────────────────────────────
$productsCol = $db->products;
$productsCol->createIndex(['slug' => 1], ['unique' => true]);
$variantsCol = $db->product_variants;

$now = new \MongoDB\BSON\UTCDateTime();

// Helper: insert product + variant, trả về [productId, variantId]
function insertProduct(\MongoDB\Collection $pc, \MongoDB\Collection $vc, array $p, array $v): array {
    $pid = $pc->insertOne($p)->getInsertedId();
    $v['product_id'] = $pid;
    $vid = $vc->insertOne($v)->getInsertedId();
    return [$pid, $vid];
}

$products = [];

// ── products.html – 3 card tĩnh ──────────────────────────────

[$p1, $v1] = insertProduct($productsCol, $variantsCol, [
    'sku'               => 'GM-MILAN01-TIT',
    'slug'              => 'gentle-monster-milan-01-titanium',
    'name'              => 'Milan 01 Titanium',
    'brand'             => 'Gentle Monster',
    'category'          => 'Kính cận',
    'gender'            => 'unisex',
    'frame_material'    => 'Titanium',
    'lens_type'         => 'Anti-blue light',
    'price'             => 1200000,
    'old_price'         => 1500000,
    'discount_percent'  => 20,
    'rating'            => 4.8,
    'review_count'      => 124,
    'sold_count'        => 310,
    'badge'             => '-30%',
    'short_description' => 'Gọng Titan siêu nhẹ, kháng khuẩn',
    'description'       => 'Gọng kính Titanium cao cấp từ Gentle Monster, siêu nhẹ chỉ 8g, kháng khuẩn tự nhiên. Tròng chống ánh sáng xanh bảo vệ mắt tối ưu khi làm việc với màn hình.',
    'thumbnail_url'     => 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80&fit=crop',
    'is_active'         => true,
    'is_featured'       => true,
    'created_at'        => $now,
], [
    'sku'   => 'GM-MILAN01-TIT-BLK-52',
    'price' => 1200000,
    'stock' => 25,
    'color' => 'Black',
    'size'  => '52mm',
]);
$products['gentle-monster-milan-01-titanium'] = [$p1, $v1];

[$p2, $v2] = insertProduct($productsCol, $variantsCol, [
    'sku'               => 'RB3025-AVIATOR-GLD',
    'slug'              => 'ray-ban-aviator-classic-gold',
    'name'              => 'Ray-Ban Aviator Classic Gold',
    'brand'             => 'Ray-Ban',
    'category'          => 'Kính mát',
    'gender'            => 'unisex',
    'frame_material'    => 'Kim loại',
    'lens_type'         => 'UV400 / HMC',
    'price'             => 3200000,
    'old_price'         => null,
    'discount_percent'  => 0,
    'rating'            => 4.9,
    'review_count'      => 256,
    'sold_count'        => 540,
    'badge'             => 'Bestseller',
    'short_description' => 'Phủ lớp chống phản quang HMC',
    'description'       => 'Kính mát phi công cổ điển Ray-Ban Aviator, khung mạ vàng 18K, tròng G-15 phân cực chống tia UV400. Biểu tượng thời trang vượt thời gian.',
    'thumbnail_url'     => 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80&fit=crop',
    'is_active'         => true,
    'is_featured'       => true,
    'created_at'        => $now,
], [
    'sku'   => 'RB3025-GLD-58',
    'price' => 3200000,
    'stock' => 20,
    'color' => 'Gold',
    'size'  => '58mm',
]);
$products['ray-ban-aviator-classic-gold'] = [$p2, $v2];

[$p3, $v3] = insertProduct($productsCol, $variantsCol, [
    'sku'               => 'OAK-ROUND-TORT',
    'slug'              => 'oakley-round-classic-tortoise',
    'name'              => 'Oakley Round Classic Tortoise',
    'brand'             => 'Oakley',
    'category'          => 'Kính cận',
    'gender'            => 'women',
    'frame_material'    => 'Acetate',
    'lens_type'         => 'Anti-blue / UV400',
    'price'             => 1950000,
    'old_price'         => 2450000,
    'discount_percent'  => 20,
    'rating'            => 4.7,
    'review_count'      => 89,
    'sold_count'        => 198,
    'badge'             => '-20%',
    'short_description' => 'Chất liệu nhựa Acetate tự nhiên',
    'description'       => 'Gọng kính tròn cổ điển Oakley chất liệu Acetate cao cấp, màu đồi mồi sang trọng. Tròng chống ánh sáng xanh và UV400 bảo vệ mắt toàn diện.',
    'thumbnail_url'     => 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=80&fit=crop',
    'is_active'         => true,
    'is_featured'       => true,
    'created_at'        => $now,
], [
    'sku'   => 'OAK-ROUND-TORT-54',
    'price' => 1950000,
    'stock' => 15,
    'color' => 'Tortoise',
    'size'  => '54mm',
]);
$products['oakley-round-classic-tortoise'] = [$p3, $v3];

// ── index.html – Flash Sale 4 sản phẩm ───────────────────────

[$p4, $v4] = insertProduct($productsCol, $variantsCol, [
    'sku'               => 'RB2140-WAYFARER-BLK',
    'slug'              => 'ray-ban-classic-wayfarer',
    'name'              => 'Ray-Ban Classic Wayfarer',
    'brand'             => 'Ray-Ban',
    'category'          => 'Kính mát',
    'gender'            => 'unisex',
    'frame_material'    => 'Acetate',
    'lens_type'         => 'UV400',
    'price'             => 1450000,
    'old_price'         => 2230000,
    'discount_percent'  => 35,
    'rating'            => 4.8,
    'review_count'      => 312,
    'sold_count'        => 720,
    'badge'             => '-35%',
    'short_description' => 'Gọng Acetate đen cổ điển, tròng UV400',
    'description'       => 'Ray-Ban Wayfarer – mẫu kính mát bán chạy nhất mọi thời đại. Gọng Acetate đen bóng, tròng chống tia UV400, phù hợp mọi khuôn mặt.',
    'thumbnail_url'     => 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_V3Xiu1TbquWhmxXfz3azP0M0E66qHnPcXeQtUQWlqCHtJKzauLrP2Lil9XToLuyn3R_EAYDPrzKQhTOAysTkBhE3yY7efJq4BKg0sIEmz_enTUGVGC4YUJR0VRJ41Dr2auSbigdqLHncVaYmkKw-qwx7NJDrhUfOJmIpdx4Olq9o0gUntQ1DoGej5dEEEthxbw6EoqgpemRclTkWUIGpss8BuNNu1gqQI0U-tjCNMyLJS7QKmbS22j6xB0asuDUVwTc_Czf_Yzs',
    'is_active'         => true,
    'is_featured'       => true,
    'created_at'        => $now,
], [
    'sku'   => 'RB2140-BLK-50',
    'price' => 1450000,
    'stock' => 30,
    'color' => 'Black',
    'size'  => '50mm',
]);
$products['ray-ban-classic-wayfarer'] = [$p4, $v4];

[$p5, $v5] = insertProduct($productsCol, $variantsCol, [
    'sku'               => 'GC-GEOMETRIC-RG',
    'slug'              => 'gucci-geometric-frame',
    'name'              => 'Gucci Geometric Frame',
    'brand'             => 'Gucci',
    'category'          => 'Kính cận',
    'gender'            => 'women',
    'frame_material'    => 'Kim loại',
    'lens_type'         => 'Anti-UV',
    'price'             => 4800000,
    'old_price'         => 6000000,
    'discount_percent'  => 20,
    'rating'            => 4.9,
    'review_count'      => 67,
    'sold_count'        => 145,
    'badge'             => '-20%',
    'short_description' => 'Gọng kim loại Rose Gold hình học',
    'description'       => 'Gucci Geometric Frame – gọng kính hình học độc đáo, chất liệu kim loại Rose Gold cao cấp. Thiết kế thời trang dành cho phái nữ hiện đại.',
    'thumbnail_url'     => 'https://lh3.googleusercontent.com/aida-public/AB6AXuD0pb9FsTSrn2s6c-IyUoFCNEG3P7O0YtYxZg0Ra4avbtNvdVnok-0afLFr9Z0dr5Zv9_BN6MP3BjTY1n81tFovVOekzqq_Xexa-14VJcJcL-cClTZx2wPbV1bDWW_XRlsWBz7h0ifI9bzODHRuiLFC5LFYN4_8m7Cclg2GWNAePz8F_vJ8t4xC_EhIcb76LQ05Oy0gFP8FZr05imCbmCzKkvVabKpo2gy2A2N_CSuyMnlsUfV5XUVtlytcQEQim749dqhsAZkhv3Q',
    'is_active'         => true,
    'is_featured'       => true,
    'created_at'        => $now,
], [
    'sku'   => 'GC-GEO-RG-52',
    'price' => 4800000,
    'stock' => 12,
    'color' => 'Rose Gold',
    'size'  => '52mm',
]);
$products['gucci-geometric-frame'] = [$p5, $v5];

[$p6, $v6] = insertProduct($productsCol, $variantsCol, [
    'sku'               => 'OAK-HOLBROOK-PRIZM',
    'slug'              => 'oakley-holbrook-tortoise',
    'name'              => 'Oakley Holbrook Tortoise',
    'brand'             => 'Oakley',
    'category'          => 'Kính mát',
    'gender'            => 'men',
    'frame_material'    => 'Nhựa',
    'lens_type'         => 'Prizm',
    'price'             => 2900000,
    'old_price'         => 3500000,
    'discount_percent'  => 17,
    'rating'            => 4.7,
    'review_count'      => 95,
    'sold_count'        => 312,
    'badge'             => 'Hot',
    'short_description' => 'Tròng Prizm tăng cường màu sắc, chống UV',
    'description'       => 'Oakley Holbrook với tròng Prizm độc quyền tăng cường độ tương phản màu sắc. Gọng nhựa cao cấp màu đồi mồi, phù hợp thể thao và dạo phố.',
    'thumbnail_url'     => 'https://lh3.googleusercontent.com/aida-public/AB6AXuCzc_0Op1NmjGRvbsQLJgIkbiF6c8cHQnawHDdcEQPF8V1QCqSwHaXbsVl9Gt-qmKbSf44W9ctFEqBOHy3Qkq1koDR4O6G1zsKTmp_AI0AKGWEXRd1SP4-W3wtNLDsaEkQ-TKBCqDJkpnsb6kZyvp5aLoOHHcSIlDYthSsR-RhzvcCXDOx8R8ofMvlCcfHxllqAB8omzUNAL5M7vwxD3G8r7xz2aZIokLqm-gKVAJ2OrmUJEuONMfWEciJJQ1xzO4FUBaNGM15VRhk',
    'is_active'         => true,
    'is_featured'       => true,
    'created_at'        => $now,
], [
    'sku'   => 'OAK-HOLB-TOR-55',
    'price' => 2900000,
    'stock' => 18,
    'color' => 'Tortoise',
    'size'  => '55mm',
]);
$products['oakley-holbrook-tortoise'] = [$p6, $v6];

[$p7, $v7] = insertProduct($productsCol, $variantsCol, [
    'sku'               => 'PRADA-HERITAGE-BLK',
    'slug'              => 'prada-heritage-black',
    'name'              => 'Prada Heritage Black',
    'brand'             => 'Prada',
    'category'          => 'Kính cận',
    'gender'            => 'unisex',
    'frame_material'    => 'Titanium',
    'lens_type'         => 'Anti-UV',
    'price'             => 2400000,
    'old_price'         => 4800000,
    'discount_percent'  => 50,
    'rating'            => 4.8,
    'review_count'      => 143,
    'sold_count'        => 267,
    'badge'             => '-50%',
    'short_description' => 'Gọng Titanium không viền, siêu nhẹ',
    'description'       => 'Prada Heritage Black – gọng kính Titanium không viền tối giản, siêu nhẹ chỉ 6g. Thiết kế di sản Prada kết hợp công nghệ hiện đại.',
    'thumbnail_url'     => 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8CW2DrJm8w0LUIxF33frg3qZPy08HQUxhXk1I1zzcngLkpi3nLpwGbzO2qyF6wQHB7KHI3o28nZn6e5DMOeLV87eaZaYjqtk2iEbovGHopQcBYmITb6NK5aOTpwPJr2LEEjYPtUFUgAtC9m6dVOVHllDOLYvdub0DNXgpG03Y7QU2dUCZSKMGJ56OMDYepfDP4G3Q3tBhI9yPzOW_WQLSEp06Iy2qNGMPXKH9GE1dLRWnut_nYkcwActUP3nD9E-40TmvnuUecWA',
    'is_active'         => true,
    'is_featured'       => true,
    'created_at'        => $now,
], [
    'sku'   => 'PRADA-HER-BLK-54',
    'price' => 2400000,
    'stock' => 10,
    'color' => 'Black',
    'size'  => '54mm',
]);
$products['prada-heritage-black'] = [$p7, $v7];

// ── Thêm sản phẩm bổ sung ────────────────────────────────────

[$p8, $v8] = insertProduct($productsCol, $variantsCol, [
    'sku'               => 'GC-ELEGANTE-BLK',
    'slug'              => 'gucci-elegante-black',
    'name'              => 'Gucci Elegante Black',
    'brand'             => 'Gucci',
    'category'          => 'Kính cận',
    'gender'            => 'women',
    'frame_material'    => 'Acetate',
    'lens_type'         => 'Anti-UV',
    'price'             => 5500000,
    'old_price'         => 6200000,
    'discount_percent'  => 11,
    'rating'            => 4.9,
    'review_count'      => 67,
    'sold_count'        => 198,
    'badge'             => 'Premium',
    'short_description' => 'Gọng kính thời trang cao cấp Gucci, màu đen bóng',
    'description'       => 'Gucci Elegante Black – gọng Acetate Ý cao cấp màu đen bóng. Thiết kế thanh lịch, sang trọng dành cho phái nữ hiện đại.',
    'thumbnail_url'     => 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80&fit=crop',
    'is_active'         => true,
    'is_featured'       => false,
    'created_at'        => $now,
], [
    'sku'   => 'GC-ELEG-BLK-52',
    'price' => 5500000,
    'stock' => 10,
    'color' => 'Black',
    'size'  => '52mm',
]);
$products['gucci-elegante-black'] = [$p8, $v8];

echo "✅ Products: " . count($products) . "\n";
echo "✅ Variants: " . count($products) . "\n";

// ── CẬP NHẬT data-slug trong products.html ───────────────────
// Gắn slug đúng cho 3 card tĩnh
// Card 1: Milan 01 Titanium → gentle-monster-milan-01-titanium
// Card 2: Aviator Optics Gold → ray-ban-aviator-classic-gold
// Card 3: Round Classic Tortoise → oakley-round-classic-tortoise

// ── REVIEWS ──────────────────────────────────────────────────
$reviewsCol = $db->reviews;
$reviewsCol->insertMany([
    ['user_id' => $userId1, 'product_id' => $p2, 'rating' => 5, 'comment' => 'Kính rất đẹp, chất lượng xuất sắc!', 'created_at' => $now],
    ['user_id' => $userId1, 'product_id' => $p6, 'rating' => 4, 'comment' => 'Tròng Prizm rất rõ nét, khuyên dùng!', 'created_at' => $now],
    ['user_id' => $userId1, 'product_id' => $p4, 'rating' => 5, 'comment' => 'Wayfarer classic không bao giờ lỗi mốt!', 'created_at' => $now],
]);
echo "✅ Reviews: 3\n";

// ── ORDER MẪU ────────────────────────────────────────────────
$db->orders->insertOne([
    'user_id'     => $userId1,
    'address_id'  => null,
    'items'       => [
        ['product_variant_id' => $v2, 'product_name' => 'Ray-Ban Aviator Classic Gold', 'price' => 3200000, 'quantity' => 1],
    ],
    'total_price' => 3200000,
    'status'      => 'completed',
    'created_at'  => $now,
]);
echo "✅ Orders: 1\n\n";

echo "🎉 Seed hoàn tất! " . count($products) . " sản phẩm đã được thêm vào database.\n";
echo "─────────────────────────────────────────────────────────\n";
echo "📌 Admin : admin@kinhxanh.vn / Admin@123\n";
echo "📌 User  : user1@gmail.com   / User@123\n";
echo "📌 DB    : $dbName\n\n";
echo "📦 Danh sách sản phẩm:\n";
foreach ($products as $slug => [$pid, $vid]) {
    echo "   - $slug\n";
}
// ── THÊM VARIANTS MÀU CHO MỖI SẢN PHẨM ─────────────────────
$colorSets = [
    ['color' => 'Black',     'color_hex' => '#1a1a1a'],
    ['color' => 'Gold',      'color_hex' => '#D4AF37'],
    ['color' => 'Silver',    'color_hex' => '#C0C0C0'],
    ['color' => 'Tortoise',  'color_hex' => '#8B4513'],
    ['color' => 'Rose Gold', 'color_hex' => '#B76E79'],
    ['color' => 'Navy',      'color_hex' => '#003153'],
];

// Map màu gốc → hex
$colorHexMap = array_column($colorSets, 'color_hex', 'color');

$variantCount = 0;
foreach ($products as $slug => [$pid, $vid]) {
    $existing = $variantsCol->findOne(['_id' => $vid]);
    if (!$existing) continue;

    $existingColor = $existing['color'] ?? '';
    $basePrice     = $existing['price'] ?? 0;
    $baseSize      = $existing['size']  ?? '52mm';

    // Update color_hex cho variant gốc
    $variantsCol->updateOne(
        ['_id' => $vid],
        ['$set' => ['color_hex' => $colorHexMap[$existingColor] ?? '#ccc']]
    );

    // Lấy 2 màu khác
    $otherColors = array_values(array_filter($colorSets, fn($c) => $c['color'] !== $existingColor));
    $picked = array_slice($otherColors, 0, 2);

    foreach ($picked as $i => $c) {
        $skuParts = explode('-', $existing['sku'] ?? '');
        $skuBase  = implode('-', array_slice($skuParts, 0, 2));

        $variantsCol->insertOne([
            'product_id' => $pid,
            'sku'        => $skuBase . '-' . strtoupper(str_replace(' ', '', $c['color'])) . '-' . ($i + 2),
            'price'      => $basePrice,
            'stock'      => rand(5, 20),
            'color'      => $c['color'],
            'color_hex'  => $c['color_hex'],
            'size'       => $baseSize,
        ]);
        $variantCount++;
    }
}
echo "✅ Thêm $variantCount variants màu mới.\n";