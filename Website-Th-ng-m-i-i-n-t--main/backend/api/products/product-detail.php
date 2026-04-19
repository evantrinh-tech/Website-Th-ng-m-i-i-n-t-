<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true, 'message' => 'Preflight OK']);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    methodNotAllowed();
}

try {
    $products = getCollection('products');

    $id   = isset($_GET['id'])   ? trim($_GET['id'])   : null;
    $slug = isset($_GET['slug']) ? trim($_GET['slug'])  : '';

    if ((!$id) && $slug === '') {
        jsonResponse(['success' => false, 'message' => 'Thiếu tham số id hoặc slug.'], 422);
    }

    // Tìm sản phẩm
    $filter = ['is_active' => true];
    if ($id) {
        $oid = toObjectId($id);
        if (!$oid) {
            jsonResponse(['success' => false, 'message' => 'ID sản phẩm không hợp lệ.'], 422);
        }
        $filter['_id'] = $oid;
    } else {
        $filter['slug'] = $slug;
    }

    $product = $products->findOne($filter);
    if (!$product) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy sản phẩm.'], 404);
    }
    $productArr = docToArray($product);

    // Lấy ảnh sản phẩm (lưu trong embedded array hoặc collection riêng)
    // Ưu tiên: nếu product có field 'images' thì dùng luôn
    $images = [];
    if (!empty($productArr['images']) && is_array($productArr['images'])) {
        $images = $productArr['images'];
    } else {
        // Lấy từ collection product_images nếu có
        $imgCollection = getCollection('product_images');
        $productOid    = toObjectId($productArr['id']);
        if ($productOid) {
            $imgCursor = $imgCollection->find(
                ['product_id' => $productOid],
                ['sort' => ['is_primary' => -1, 'sort_order' => 1, '_id' => 1]]
            );
            $images = docsToArray($imgCursor);
        }
    }

    // Lấy sản phẩm liên quan (cùng brand hoặc category, tối đa 4)
    $relatedFilter = [
        'is_active' => true,
        '_id'       => ['$ne' => $product['_id']],
        '$or'       => [
            ['brand'    => $productArr['brand']    ?? ''],
            ['category' => $productArr['category'] ?? ''],
        ],
    ];
    $relatedCursor = $products->find($relatedFilter, [
        'sort'  => ['rating' => -1, 'sold_count' => -1],
        'limit' => 4,
        'projection' => [
            'sku'              => 1,
            'slug'             => 1,
            'name'             => 1,
            'brand'            => 1,
            'price'            => 1,
            'old_price'        => 1,
            'rating'           => 1,
            'discount_percent' => 1,
            'thumbnail_url'    => 1,
        ],
    ]);
    $relatedProducts = docsToArray($relatedCursor);

    // Lấy main_image từ danh sách ảnh
    $mainImage = $productArr['thumbnail_url'] ?? '';
    foreach ($images as $img) {
        if (!empty($img['is_primary'])) {
            $mainImage = $img['image_url'] ?? $mainImage;
            break;
        }
    }
    $productArr['main_image'] = $mainImage;
    unset($productArr['images']);

     $variants = getCollection('product_variants');
    $productOid = toObjectId($productArr['id']);
    if ($productOid) {
        $firstVariant = $variants->findOne(
            ['product_id' => $productOid],
            ['sort' => ['_id' => 1]]
        );
        if ($firstVariant) {
            $productArr['first_variant_id'] = (string)$firstVariant['_id'];
        }
    }

    jsonResponse([
        'success' => true,
        'message' => 'Lấy chi tiết sản phẩm thành công.',
        'data'    => [
            'product'          => $productArr,
            'images'           => $images,
            'related_products' => $relatedProducts,
        ],
    ]);
} catch (\Throwable $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Không thể tải chi tiết sản phẩm.',
        'error'   => $e->getMessage(),
    ], 500);
}