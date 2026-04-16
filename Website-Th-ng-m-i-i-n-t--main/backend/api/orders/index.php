<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/security.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true, 'message' => 'Preflight OK']);
}

// 🛡️ Bảo vệ DDoS: Orders endpoint - 10 request / phút / IP
applyDDoSProtection(rateLimit: 10, rateMinutes: 1, endpoint: 'orders');

$userId = requireAuth();
$userOid = toObjectId($userId);
if (!$userOid) {
    jsonResponse(['success' => false, 'message' => 'Token không hợp lệ.'], 401);
}

$orders    = getCollection('orders');
$carts     = getCollection('carts');
$cartItems = getCollection('cart_items');
$method    = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Lấy danh sách đơn hàng của user
    $cursor = $orders->find(
        ['user_id' => $userOid],
        ['sort' => ['created_at' => -1]]
    );
    $result = docsToArray($cursor);
    jsonResponse(['success' => true, 'data' => $result]);

} elseif ($method === 'POST') {
    // Tạo đơn hàng mới từ giỏ hàng
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) $input = $_POST;

    $addressId = trim($input['address_id'] ?? '');

    // 1. Lấy giỏ hàng
    $cart = $carts->findOne(['user_id' => $userOid]);
    if (!$cart) {
        jsonResponse(['success' => false, 'message' => 'Giỏ hàng trống'], 400);
    }
    $cartOid = $cart['_id'];

    // 2. Lấy items trong giỏ (lookup product_variants + products)
    $items = docsToArray($cartItems->find(['cart_id' => $cartOid]));
    if (empty($items)) {
        jsonResponse(['success' => false, 'message' => 'Giỏ hàng trống'], 400);
    }

    $products  = getCollection('products');
    $variants  = getCollection('product_variants');

    $orderItemDocs = [];
    $totalPrice    = 0;

    foreach ($items as $item) {
        $variantOid = toObjectId($item['product_variant_id'] ?? '');
        $variant = $variantOid ? $variants->findOne(['_id' => $variantOid]) : null;
        if (!$variant) continue;

        $productOid = $variant['product_id'] ?? null;
        $product    = $productOid ? $products->findOne(['_id' => $productOid]) : null;
        $pName      = $product ? ($product['name'] ?? '') : '';
        $price      = (float) ($variant['price'] ?? 0);
        $qty        = (int) ($item['quantity'] ?? 1);

        $totalPrice     += $qty * $price;
        $orderItemDocs[] = [
            'product_variant_id' => $variantOid,
            'product_name'       => $pName,
            'price'              => $price,
            'quantity'           => $qty,
        ];
    }

    if (empty($orderItemDocs)) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy sản phẩm hợp lệ'], 400);
    }

    $addressOid = $addressId ? toObjectId($addressId) : null;

    $insertResult = $orders->insertOne([
        'user_id'    => $userOid,
        'address_id' => $addressOid,
        'items'      => $orderItemDocs,
        'total_price'=> $totalPrice,
        'status'     => 'pending',
        'created_at' => new \MongoDB\BSON\UTCDateTime(),
    ]);

    $orderId = (string) $insertResult->getInsertedId();

    // Xóa giỏ hàng
    $cartItems->deleteMany(['cart_id' => $cartOid]);

    jsonResponse([
        'success' => true,
        'message' => 'Tạo đơn hàng thành công',
        'data'    => ['order_id' => $orderId],
    ]);
} else {
    methodNotAllowed('GET, POST, OPTIONS');
}
