<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/security.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true, 'message' => 'Preflight OK']);
}

// 🛡️ Bảo vệ DDoS: Admin endpoint - 30 request / phút
applyDDoSProtection(rateLimit: 30, rateMinutes: 1, endpoint: 'admin');

$userId  = requireAuth();
$userOid = toObjectId($userId);
if (!$userOid) {
    jsonResponse(['success' => false, 'message' => 'Token không hợp lệ.'], 401);
}

$users    = getCollection('users');
$orders   = getCollection('orders');
$products = getCollection('products');

// Kiểm tra quyền Admin (role_id = 1)
$user = $users->findOne(['_id' => $userOid]);
if (!$user || ($user['role_id'] ?? null) != 1) {
    jsonResponse(['success' => false, 'message' => 'Bạn không có quyền truy cập.'], 403);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $totalOrders   = $orders->countDocuments();
    $totalUsers    = $users->countDocuments();
    $totalProducts = $products->countDocuments();

    // Tính doanh thu từ các đơn "completed"
    $revPipeline = [
        ['$match'  => ['status' => 'completed']],
        ['$group'  => ['_id' => null, 'total' => ['$sum' => '$total_price']]],
    ];
    $revResult = $orders->aggregate($revPipeline)->toArray();
    $revenue   = (float) ($revResult[0]['total'] ?? 0);

    jsonResponse([
        'success' => true,
        'data'    => [
            'total_orders'   => (int) $totalOrders,
            'total_users'    => (int) $totalUsers,
            'total_products' => (int) $totalProducts,
            'total_revenue'  => $revenue,
        ],
    ]);
} else {
    methodNotAllowed('GET, OPTIONS');
}
