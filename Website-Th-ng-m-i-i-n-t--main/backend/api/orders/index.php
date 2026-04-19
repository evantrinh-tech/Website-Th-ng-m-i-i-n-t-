<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/security.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true, 'message' => 'Preflight OK']);
}

// chống spam API
applyDDoSProtection(rateLimit: 10, rateMinutes: 1, endpoint: 'orders');

$userId = requireAuth();

try {
    $userOid = new MongoDB\BSON\ObjectId($userId);
} catch (Exception $e) {
    jsonResponse(['success' => false, 'message' => 'User ID không hợp lệ'], 401);
}

$orders    = getCollection('orders');
$carts     = getCollection('carts');
$cartItems = getCollection('cart_items');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {

    $cursor = $orders->find(
        ['user_id' => $userOid],
        ['sort' => ['created_at' => -1]]
    );

    jsonResponse([
        'success' => true,
        'data' => docsToArray($cursor)
    ]);
}

/* =========================
   CREATE ORDER
========================= */
if ($method === 'POST') {

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) $input = $_POST;

    $addressId = trim($input['address_id'] ?? '');

    // 1. lấy cart
    $cart = $carts->findOne([
        'user_id' => $userOid
    ]);

    if (!$cart) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy giỏ hàng'], 400);
    }

    $cartId = $cart['_id'];

    // 2. FIX QUAN TRỌNG: hỗ trợ cả ObjectId + string
    $itemsCursor = $cartItems->find([
        '$or' => [
            ['cart_id' => $cartId],
            ['cart_id' => (string)$cartId]
        ]
    ]);

    $items = docsToArray($itemsCursor);

    if (empty($items)) {
        jsonResponse([
            'success' => false,
            'message' => 'Giỏ hàng trống (cart_items = 0)'
        ], 400);
    }

    $products = getCollection('products');
    $variants = getCollection('product_variants');

    $orderItems = [];
    $totalPrice = 0;

    foreach ($items as $item) {

        $variantId = $item['product_variant_id'] ?? null;

        if (!$variantId) continue;

        try {
            $variantOid = new MongoDB\BSON\ObjectId((string)$variantId);
        } catch (Exception $e) {
            continue;
        }

        $variant = $variants->findOne(['_id' => $variantOid]);
        if (!$variant) continue;

        $product = $products->findOne([
            '_id' => $variant['product_id']
        ]);

        $price = (float)($variant['price'] ?? 0);
        $qty   = (int)($item['quantity'] ?? 1);

        $totalPrice += $price * $qty;

        $orderItems[] = [
            'product_variant_id' => $variantOid,
            'product_name' => $product['name'] ?? 'Sản phẩm',
            'price' => $price,
            'quantity' => $qty
        ];
    }

    if (empty($orderItems)) {
        jsonResponse([
            'success' => false,
            'message' => 'Không có sản phẩm hợp lệ trong giỏ'
        ], 400);
    }

    // 3. create order
    $insert = $orders->insertOne([
        'user_id' => $userOid,
        'address_id' => $addressId ? new MongoDB\BSON\ObjectId($addressId) : null,
        'items' => $orderItems,
        'total_price' => $totalPrice,
        'status' => 'pending',
        'created_at' => new MongoDB\BSON\UTCDateTime()
    ]);

    // 4. clear cart items
    $cartItems->deleteMany([
        '$or' => [
            ['cart_id' => $cartId],
            ['cart_id' => (string)$cartId]
        ]
    ]);

    jsonResponse([
        'success' => true,
        'message' => 'Tạo đơn hàng thành công',
        'data' => [
            'order_id' => (string)$insert->getInsertedId(),
            'total_price' => $totalPrice
        ]
    ]);
}

methodNotAllowed('GET, POST, OPTIONS');