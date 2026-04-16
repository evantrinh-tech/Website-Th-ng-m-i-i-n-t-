<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/security.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true, 'message' => 'Preflight OK']);
}

// 🛡️ Bảo vệ DDoS: Giới hạn 60 request / phút / IP
applyDDoSProtection(rateLimit: 60, rateMinutes: 1, endpoint: 'cart');

$userId  = requireAuth();
$userOid = toObjectId($userId);
if (!$userOid) {
    jsonResponse(['success' => false, 'message' => 'Token không hợp lệ.'], 401);
}

$carts     = getCollection('carts');
$cartItems = getCollection('cart_items');
$variants  = getCollection('product_variants');
$products  = getCollection('products');

/**
 * Lấy hoặc tạo mới giỏ hàng cho user.
 * @return \MongoDB\BSON\ObjectId
 */
function getCartOid(\MongoDB\Collection $carts, \MongoDB\BSON\ObjectId $userOid): \MongoDB\BSON\ObjectId
{
    $cart = $carts->findOne(['user_id' => $userOid]);
    if ($cart) {
        return $cart['_id'];
    }
    $result = $carts->insertOne([
        'user_id'    => $userOid,
        'created_at' => new \MongoDB\BSON\UTCDateTime(),
    ]);
    return $result->getInsertedId();
}

$cartOid = getCartOid($carts, $userOid);
$method  = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $items = docsToArray($cartItems->find(['cart_id' => $cartOid]));

    // Enrich với thông tin variant + product
    $total = 0;
    foreach ($items as &$item) {
        $vOid    = toObjectId($item['product_variant_id'] ?? '');
        $variant = $vOid ? $variants->findOne(['_id' => $vOid]) : null;
        if ($variant) {
            $vArr            = docToArray($variant);
            $item['sku']     = $vArr['sku']   ?? '';
            $item['price']   = $vArr['price']  ?? 0;
            $item['color']   = $vArr['color']  ?? '';
            $item['size']    = $vArr['size']   ?? '';

            $pOid    = toObjectId($vArr['product_id'] ?? '');
            $product = $pOid ? $products->findOne(['_id' => $pOid]) : null;
            if ($product) {
                $pArr                  = docToArray($product);
                $item['product_id']    = $pArr['id'];
                $item['product_name']  = $pArr['name']  ?? '';
                $item['slug']          = $pArr['slug']  ?? '';
            }
        }
        $total += ($item['quantity'] ?? 1) * ($item['price'] ?? 0);
    }
    unset($item);

    jsonResponse([
        'success' => true,
        'data'    => [
            'cart_id'     => (string) $cartOid,
            'items'       => $items,
            'total_price' => $total,
        ],
    ]);

} elseif ($method === 'POST') {
    // Thêm vào giỏ
    $input     = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) $input = $_POST;

    $variantId = trim($input['variant_id'] ?? '');
    $quantity  = max(1, (int) ($input['quantity'] ?? 1));

    $vOid = toObjectId($variantId);
    if (!$vOid) {
        jsonResponse(['success' => false, 'message' => 'Dữ liệu không hợp lệ'], 400);
    }

    // Kiểm tra variant tồn tại
    if (!$variants->findOne(['_id' => $vOid])) {
        jsonResponse(['success' => false, 'message' => 'Sản phẩm không tồn tại'], 404);
    }

    // Kiểm tra đã có trong giỏ chưa
    $existing = $cartItems->findOne(['cart_id' => $cartOid, 'product_variant_id' => $vOid]);
    if ($existing) {
        $newQty = (int) ($existing['quantity'] ?? 1) + $quantity;
        $cartItems->updateOne(
            ['_id' => $existing['_id']],
            ['$set' => ['quantity' => $newQty]]
        );
    } else {
        $cartItems->insertOne([
            'cart_id'            => $cartOid,
            'product_variant_id' => $vOid,
            'quantity'           => $quantity,
        ]);
    }

    jsonResponse(['success' => true, 'message' => 'Đã thêm vào giỏ hàng']);

} elseif ($method === 'PUT') {
    // Cập nhật số lượng
    $input  = json_decode(file_get_contents('php://input'), true);
    $itemId = trim($input['cart_item_id'] ?? '');
    $qty    = (int) ($input['quantity'] ?? 1);

    $itemOid = toObjectId($itemId);
    if (!$itemOid || $qty < 1) {
        jsonResponse(['success' => false, 'message' => 'Dữ liệu không hợp lệ'], 400);
    }

    $cartItems->updateOne(
        ['_id' => $itemOid, 'cart_id' => $cartOid],
        ['$set' => ['quantity' => $qty]]
    );
    jsonResponse(['success' => true, 'message' => 'Đã cập nhật số lượng']);

} elseif ($method === 'DELETE') {
    $input  = json_decode(file_get_contents('php://input'), true);
    $itemId = trim($input['cart_item_id'] ?? '');

    if ($itemId !== '') {
        $itemOid = toObjectId($itemId);
        if ($itemOid) {
            $cartItems->deleteOne(['_id' => $itemOid, 'cart_id' => $cartOid]);
        }
        jsonResponse(['success' => true, 'message' => 'Đã xóa sản phẩm khỏi giỏ hàng']);
    } else {
        // Xóa toàn bộ
        $cartItems->deleteMany(['cart_id' => $cartOid]);
        jsonResponse(['success' => true, 'message' => 'Đã xóa toàn bộ giỏ hàng']);
    }
} else {
    methodNotAllowed('GET, POST, PUT, DELETE, OPTIONS');
}
