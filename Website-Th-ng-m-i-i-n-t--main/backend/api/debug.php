<?php
/**
 * DEBUG ENDPOINT – Kiểm tra trạng thái hệ thống
 * Truy cập: http://localhost:8000/backend/api/debug.php
 * XÓA FILE NÀY TRƯỚC KHI DEPLOY LÊN PRODUCTION
 */
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';

try {
    $db = getMongoDB();

    $counts = [];
    foreach (['products', 'product_variants', 'users', 'carts', 'cart_items', 'orders'] as $col) {
        $counts[$col] = (int) getCollection($col)->countDocuments();
    }

    // Lấy 3 sản phẩm đầu tiên
    $sampleProducts = docsToArray(getCollection('products')->find([], ['limit' => 3, 'projection' => ['name' => 1, 'slug' => 1]]));

    // Lấy 3 variants đầu tiên
    $sampleVariants = docsToArray(getCollection('product_variants')->find([], ['limit' => 3, 'projection' => ['sku' => 1, 'price' => 1, 'product_id' => 1]]));

    $needsSeed = $counts['products'] === 0;

    jsonResponse([
        'success'       => true,
        'needs_seed'    => $needsSeed,
        'message'       => $needsSeed
            ? '⚠️ Database trống! Chạy: php database/seed_mongo.php'
            : '✅ Database có dữ liệu.',
        'counts'        => $counts,
        'sample_products' => $sampleProducts,
        'sample_variants' => $sampleVariants,
        'mongo_uri'     => MONGO_URI,
        'mongo_db'      => MONGO_DB,
    ]);
} catch (\Throwable $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Lỗi kết nối MongoDB: ' . $e->getMessage(),
        'tip'     => 'Đảm bảo MongoDB đang chạy và đã cài mongodb extension cho PHP.',
    ], 500);
}
