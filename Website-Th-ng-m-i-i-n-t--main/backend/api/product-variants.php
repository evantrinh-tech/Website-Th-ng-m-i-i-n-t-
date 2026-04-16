<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true, 'message' => 'Preflight OK']);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    methodNotAllowed('GET, OPTIONS');
}

// Lấy variant đầu tiên của sản phẩm theo slug hoặc product_id
$slug      = trim($_GET['slug']       ?? '');
$productId = trim($_GET['product_id'] ?? '');

if ($slug === '' && $productId === '') {
    jsonResponse(['success' => false, 'message' => 'Thiếu tham số slug hoặc product_id.'], 400);
}

try {
    $products = getCollection('products');
    $variants = getCollection('product_variants');

    // Tìm product
    if ($slug !== '') {
        $product = $products->findOne(['slug' => $slug, 'is_active' => true]);
    } else {
        $oid     = toObjectId($productId);
        $product = $oid ? $products->findOne(['_id' => $oid, 'is_active' => true]) : null;
    }

    if (!$product) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy sản phẩm.'], 404);
    }

    $productOid = $product['_id'];

    // Lấy tất cả variants của sản phẩm
    $cursor      = $variants->find(['product_id' => $productOid]);
    $variantList = docsToArray($cursor);

    if (empty($variantList)) {
        // Kiểm tra xem có sản phẩm nào trong DB không
        $totalProducts = getCollection('products')->countDocuments();
        if ($totalProducts === 0) {
            jsonResponse([
                'success' => false,
                'message' => 'Database chưa có dữ liệu. Vui lòng chạy: php database/seed_mongo.php',
                'code'    => 'NO_DATA',
            ], 404);
        }
        jsonResponse(['success' => false, 'message' => 'Sản phẩm chưa có biến thể.'], 404);
    }

    jsonResponse([
        'success'  => true,
        'data'     => $variantList,
        'first_id' => $variantList[0]['id'],
    ]);

} catch (\Throwable $e) {
    jsonResponse(['success' => false, 'message' => 'Lỗi server.', 'error' => $e->getMessage()], 500);
}
