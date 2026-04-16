<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/security.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true, 'message' => 'Preflight OK']);
}

// 🛡️ Bảo vệ DDoS: Auth endpoint - 30 request / phút / IP
applyDDoSProtection(rateLimit: 30, rateMinutes: 1, endpoint: 'auth_me');

$userId = requireAuth();
$oid    = toObjectId($userId);
if (!$oid) {
    jsonResponse(['success' => false, 'message' => 'Token không hợp lệ.'], 401);
}

$users = getCollection('users');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $user = $users->findOne(['_id' => $oid]);

    if (!$user) {
        jsonResponse(['success' => false, 'message' => 'Không tìm thấy người dùng'], 404);
    }

    $arr = docToArray($user);
    unset($arr['password']);

    jsonResponse(['success' => true, 'data' => $arr]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        jsonResponse(['success' => false, 'message' => 'Dữ liệu không hợp lệ.'], 400);
    }

    $updateFields = [];

    if (!empty($input['name'])) {
        $updateFields['name'] = trim($input['name']);
    }
    if (!empty($input['phone'])) {
        $updateFields['phone'] = trim($input['phone']);
    }
    // Đổi mật khẩu (tùy chọn)
    if (!empty($input['new_password'])) {
        if (empty($input['current_password'])) {
            jsonResponse(['success' => false, 'message' => 'Vui lòng nhập mật khẩu hiện tại.'], 400);
        }
        $user = $users->findOne(['_id' => $oid]);
        if (!$user || !password_verify($input['current_password'], $user['password'])) {
            jsonResponse(['success' => false, 'message' => 'Mật khẩu hiện tại không đúng.'], 400);
        }
        $updateFields['password'] = password_hash($input['new_password'], PASSWORD_DEFAULT);
    }

    if (empty($updateFields)) {
        jsonResponse(['success' => false, 'message' => 'Không có thông tin nào để cập nhật.'], 400);
    }

    $updateFields['updated_at'] = new \MongoDB\BSON\UTCDateTime();
    $users->updateOne(['_id' => $oid], ['$set' => $updateFields]);

    jsonResponse(['success' => true, 'message' => 'Cập nhật thông tin thành công.']);

} else {
    methodNotAllowed('GET, PUT, OPTIONS');
}
