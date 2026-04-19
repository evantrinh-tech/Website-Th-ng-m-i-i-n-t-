<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/security.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true, 'message' => 'Preflight OK']);
    exit;
}

// 🛡️ Rate limit
applyDDoSProtection(rateLimit: 60, rateMinutes: 1, endpoint: 'cart');

// 🔐 AUTH
$userId = requireAuth();

$userOid = toObjectId($userId);
if (!$userOid) {
    jsonResponse(['success' => false, 'message' => 'Token không hợp lệ'], 401);
}

$carts     = getCollection('carts');
$cartItems = getCollection('cart_items');
$variants  = getCollection('product_variants');
$products  = getCollection('products');


// =========================
// GET OR CREATE CART
// =========================
function getCartOid($carts, $userOid)
{
    $cart = $carts->findOne([
        '$or' => [
            ['user_id' => $userOid],
            ['user_id' => (string)$userOid]
        ]
    ]);

    if ($cart) return $cart['_id'];

    $res = $carts->insertOne([
        'user_id'    => $userOid,
        'created_at' => new MongoDB\BSON\UTCDateTime()
    ]);

    return $res->getInsertedId();
}

$cartOid = getCartOid($carts, $userOid);
$method  = $_SERVER['REQUEST_METHOD'];


// =========================
// GET CART
// =========================
if ($method === 'GET') {

 error_log("USER ID raw: " . $userId);
    error_log("userOid: " . (string)$userOid);
    error_log("cartOid from getCartOid: " . (string)$cartOid);
    // DEBUG TẠM
    $debugAll = docsToArray($cartItems->find([]));
    error_log("TOTAL cart_items in DB: " . count($debugAll));
    error_log("cartOid: " . (string)$cartOid . " | type: " . get_class($cartOid));

    $debugStr = docsToArray($cartItems->find(['cart_id' => (string)$cartOid]));
    error_log("BY STRING: " . count($debugStr));

    $debugOid = docsToArray($cartItems->find(['cart_id' => $cartOid]));
    error_log("BY OBJECTID: " . count($debugOid));
    // END DEBUG

    // 🔥 FIX QUAN TRỌNG: hỗ trợ cả ObjectId và string
    $items = docsToArray(
        $cartItems->find([
            '$or' => [
                ['cart_id' => $cartOid],
                ['cart_id' => (string)$cartOid]
            ]
        ])
    );

    $total = 0;

    foreach ($items as &$item) {

        $variantId = $item['product_variant_id'] ?? null;

        $vOid = ($variantId instanceof MongoDB\BSON\ObjectId)
            ? $variantId
            : toObjectId($variantId);

        if (!$vOid) continue;

        $variant = $variants->findOne(['_id' => $vOid]);
        if (!$variant) continue;

        $vArr = docToArray($variant);

        $item['sku']   = $vArr['sku'] ?? '';
        $item['price'] = (float)($vArr['price'] ?? 0);
        $item['color'] = $vArr['color'] ?? '';
        $item['size']  = $vArr['size'] ?? '';

        // product info
        $pOid = $vArr['product_id'] ?? null;
        $pOid = ($pOid instanceof MongoDB\BSON\ObjectId)
            ? $pOid
            : toObjectId($pOid);

        if ($pOid) {
            $product = $products->findOne(['_id' => $pOid]);

            if ($product) {
                $pArr = docToArray($product);

                $item['product_id']   = (string)$pArr['_id'];
                $item['product_name'] = $pArr['name'] ?? '';
                $item['slug']         = $pArr['slug'] ?? '';
                $item['thumbnail_url'] = $pArr['thumbnail_url'] ?? '';
            }
        }

        $qty = (int)($item['quantity'] ?? 1);
        $total += $qty * (float)$item['price'];
    }

    unset($item);

    jsonResponse([
        'success' => true,
        'data' => [
            'cart_id'     => (string)$cartOid,
            'items'       => array_values($items),
            'total_price' => $total
        ]
    ]);
}


// =========================
// POST ADD TO CART
// =========================
if ($method === 'POST') {

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $variantId = trim($input['variant_id'] ?? '');
    $quantity  = max(1, (int)($input['quantity'] ?? 1));

     // DEBUG
    error_log("POST CART - variantId: " . $variantId);
    error_log("POST CART - cartOid: " . (string)$cartOid);

    $vOid = toObjectId($variantId);
    error_log("POST CART - vOid: " . ($vOid ? (string)$vOid : "NULL"));

    if (!$vOid) {
        jsonResponse(['success' => false, 'message' => 'Variant không hợp lệ'], 400);
    }

    if (!$variants->findOne(['_id' => $vOid])) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy sản phẩm'], 404);
    }

    $existing = $cartItems->findOne([
        'cart_id' => $cartOid,
        'product_variant_id' => $vOid
    ]);

    if ($existing) {
        $cartItems->updateOne(
            ['_id' => $existing['_id']],
            ['$set' => ['quantity' => $existing['quantity'] + $quantity]]
        );
    } else {
        $cartItems->insertOne([
            'cart_id' => $cartOid,
            'product_variant_id' => $vOid,
            'quantity' => $quantity
        ]);
    }

    jsonResponse(['success' => true, 'message' => 'Đã thêm vào giỏ hàng']);
}


// =========================
// PUT UPDATE QTY
// =========================
if ($method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    
    error_log("PUT input: " . json_encode($input));
    error_log("itemOid: " . ($input['cart_item_id'] ?? 'NULL'));
    error_log("qty: " . ($input['quantity'] ?? 'NULL'));

 // DEBUG
    error_log("PUT CART input: " . json_encode($input));
    error_log("cart_item_id: " . ($input['cart_item_id'] ?? 'NULL'));
    error_log("quantity: " . ($input['quantity'] ?? 'NULL'));

    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    $itemId = $input['cart_item_id'] ?? '';
    $qty    = (int)($input['quantity'] ?? 1);

    $itemOid = toObjectId($itemId);

    if (!$itemOid || $qty < 1) {
        jsonResponse(['success' => false, 'message' => 'Dữ liệu không hợp lệ'], 400);
    }

    $cartItems->updateOne(
        ['_id' => $itemOid, 'cart_id' => $cartOid],
        ['$set' => ['quantity' => $qty]]
    );

    jsonResponse(['success' => true, 'message' => 'Đã cập nhật']);
}


// =========================
// DELETE ITEM
// =========================
if ($method === 'DELETE') {

    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    $itemId = $input['cart_item_id'] ?? '';

    if ($itemId) {
        $itemOid = toObjectId($itemId);

        if ($itemOid) {
            $cartItems->deleteOne([
                '_id' => $itemOid,
                'cart_id' => $cartOid
            ]);
        }

        jsonResponse(['success' => true, 'message' => 'Đã xóa sản phẩm']);
    }

    $cartItems->deleteMany(['cart_id' => $cartOid]);

    jsonResponse(['success' => true, 'message' => 'Đã xóa giỏ hàng']);
}

methodNotAllowed('GET, POST, PUT, DELETE, OPTIONS');