<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../lib/response.php';
require_once __DIR__ . '/../lib/security.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true, 'message' => 'Preflight OK']);
}

// 🛡️ Bảo vệ DDoS: Public API - 120 request / phút
applyDDoSProtection(rateLimit: 120, rateMinutes: 1, endpoint: 'products', checkPayload: false);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    methodNotAllowed();
}

try {
    $products = getCollection('products');

    $search    = trim((string) ($_GET['q']         ?? ''));
    $brands    = normalizeCsvParam($_GET['brand']    ?? null);
    $genders   = normalizeCsvParam($_GET['gender']   ?? null);
    $materials = normalizeCsvParam($_GET['material'] ?? null);
    $lensTypes = normalizeCsvParam($_GET['lens_type']?? null);
    $minPrice  = isset($_GET['min_price']) && $_GET['min_price'] !== '' ? (int) $_GET['min_price'] : null;
    $maxPrice  = isset($_GET['max_price']) && $_GET['max_price'] !== '' ? (int) $_GET['max_price'] : null;
    $featured  = isset($_GET['featured']) ? (int) $_GET['featured'] : null;

    $page   = parsePositiveInt($_GET['page']  ?? 1, 1);
    $limit  = min(parsePositiveInt($_GET['limit'] ?? 6, 6), 50);
    $offset = ($page - 1) * $limit;

    $sort  = (string) ($_GET['sort'] ?? 'newest');
    $sortMap = [
        'newest'      => ['created_at' => -1, '_id' => -1],
        'price_asc'   => ['price' => 1,  '_id' => -1],
        'price_desc'  => ['price' => -1, '_id' => -1],
        'best_seller' => ['sold_count' => -1, '_id' => -1],
        'rating_desc' => ['rating' => -1, '_id' => -1],
        'featured'    => ['is_featured' => -1, 'created_at' => -1],
        'name_asc'    => ['name' => 1],
        'name_desc'   => ['name' => -1],
    ];
    $sortOrder = $sortMap[$sort] ?? $sortMap['newest'];

    // --- Build filter ---
    $filter = ['is_active' => true];

    if ($search !== '') {
        $filter['$or'] = [
            ['name'              => new \MongoDB\BSON\Regex($search, 'i')],
            ['brand'             => new \MongoDB\BSON\Regex($search, 'i')],
            ['sku'               => new \MongoDB\BSON\Regex($search, 'i')],
            ['short_description' => new \MongoDB\BSON\Regex($search, 'i')],
        ];
    }

    if (!empty($brands)) {
        $filter['brand'] = ['$in' => $brands];
    }
    if (!empty($genders)) {
        $filter['gender'] = ['$in' => $genders];
    }
    if (!empty($materials)) {
        $filter['frame_material'] = ['$in' => $materials];
    }
    if (!empty($lensTypes)) {
        $filter['lens_type'] = ['$in' => $lensTypes];
    }

    $priceFilter = [];
    if ($minPrice !== null) $priceFilter['$gte'] = $minPrice;
    if ($maxPrice !== null) $priceFilter['$lte'] = $maxPrice;
    if (!empty($priceFilter)) {
        $filter['price'] = $priceFilter;
    }

    if ($featured !== null) {
        $filter['is_featured'] = (bool) $featured;
    }

    // --- Count + paginate ---
    $totalItems = $products->countDocuments($filter);

    $projection = [
        'id'                => 0, // MongoDB _id sẽ được map bởi docToArray
        'sku'               => 1,
        'slug'              => 1,
        'name'              => 1,
        'brand'             => 1,
        'category'          => 1,
        'gender'            => 1,
        'frame_material'    => 1,
        'lens_type'         => 1,
        'price'             => 1,
        'old_price'         => 1,
        'discount_percent'  => 1,
        'rating'            => 1,
        'review_count'      => 1,
        'badge'             => 1,
        'short_description' => 1,
        'is_featured'       => 1,
        'sold_count'        => 1,
        'created_at'        => 1,
        'thumbnail_url'     => 1,
    ];

    $cursor  = $products->find($filter, [
        'sort'       => $sortOrder,
        'skip'       => $offset,
        'limit'      => $limit,
        'projection' => $projection,
    ]);
    $data = docsToArray($cursor);

    jsonResponse([
        'success' => true,
        'message' => 'Lấy danh sách sản phẩm thành công.',
        'filters' => [
            'q'         => $search,
            'brand'     => $brands,
            'gender'    => $genders,
            'material'  => $materials,
            'lens_type' => $lensTypes,
            'min_price' => $minPrice,
            'max_price' => $maxPrice,
            'sort'      => $sort,
            'featured'  => $featured,
        ],
        'pagination' => [
            'page'        => $page,
            'limit'       => $limit,
            'total_items' => (int) $totalItems,
            'total_pages' => (int) ceil($totalItems / $limit),
        ],
        'data' => $data,
    ]);
} catch (\Throwable $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Không thể tải danh sách sản phẩm.',
        'error'   => $e->getMessage(),
    ], 500);
}
