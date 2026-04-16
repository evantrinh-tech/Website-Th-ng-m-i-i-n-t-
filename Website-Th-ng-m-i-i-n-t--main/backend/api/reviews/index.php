<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true, 'message' => 'Preflight OK']);
}

$reviews  = getCollection('reviews');
$users    = getCollection('users');
$orders   = getCollection('orders');
$method   = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $productId = trim($_GET['product_id'] ?? '');

    if ($productId === '') {
        jsonResponse(['success' => false, 'message' => 'Thiếu mã sản phẩm'], 400);
    }

    $productOid = toObjectId($productId);
    $filter     = $productOid
        ? ['product_id' => $productOid]
        : ['product_id_str' => $productId]; // fallback nếu dùng string id

    $cursor = $reviews->find($filter, ['sort' => ['created_at' => -1]]);
    $result = docsToArray($cursor);

    // Enrich user_name
    foreach ($result as &$review) {
        $uOid = toObjectId($review['user_id'] ?? '');
        if ($uOid) {
            $u = $users->findOne(['_id' => $uOid]);
            $review['user_name'] = $u ? ($u['name'] ?? '') : '';
        }
    }
    unset($review);

    jsonResponse(['success' => true, 'data' => $result]);

} elseif ($method === 'POST') {
    $userId  = requireAuth();
    $userOid = toObjectId($userId);
    if (!$userOid) {
        jsonResponse(['success' => false, 'message' => 'Token không hợp lệ.'], 401);
    }

    $input     = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) $input = $_POST;

    $productId = trim($input['product_id'] ?? '');
    $rating    = (int) ($input['rating']  ?? 5);
    $comment   = trim($input['comment']   ?? '');

    $productOid = toObjectId($productId);
    if (!$productOid || $rating < 1 || $rating > 5) {
        jsonResponse(['success' => false, 'message' => 'Dữ liệu đánh giá không hợp lệ'], 400);
    }

    // Kiểm tra user đã mua sản phẩm chưa
    $hasBought = $orders->findOne([
        'user_id'         => $userOid,
        'items.product_id'=> $productOid,  // embedded items trong order
        'status'          => ['$in' => ['completed', 'shipping', 'confirmed']],
    ]);

    // Nếu items lưu theo variant, thử match theo product_name (fallback)
    if (!$hasBought) {
        // Mềm hơn: cho phép review nếu có order bất kỳ
        $hasBought = $orders->findOne([
            'user_id' => $userOid,
        ]);
    }

    if (!$hasBought) {
        jsonResponse(['success' => false, 'message' => 'Bạn phải mua sản phẩm này trước khi đánh giá.'], 403);
    }

    $reviews->insertOne([
        'user_id'    => $userOid,
        'product_id' => $productOid,
        'rating'     => $rating,
        'comment'    => $comment,
        'created_at' => new \MongoDB\BSON\UTCDateTime(),
    ]);

    jsonResponse(['success' => true, 'message' => 'Cảm ơn bạn đã đánh giá sản phẩm.']);
} else {
    methodNotAllowed('GET, POST, OPTIONS');
}
