<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/security.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true, 'message' => 'Preflight OK']);
}

// 🛡️ Bảo vệ DDoS: Giới hạn 3 lần đăng ký / phút / IP
applyDDoSProtection(rateLimit: 3, rateMinutes: 1, endpoint: 'auth_register');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    methodNotAllowed('POST, OPTIONS');
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = $_POST;
    }

    $name     = trim($input['name']     ?? '');
    $email    = trim($input['email']    ?? '');
    $password = $input['password'] ?? '';
    $phone    = trim($input['phone']    ?? '');

    if (empty($name) || empty($email) || empty($password)) {
        jsonResponse(['success' => false, 'message' => 'Họ tên, email và mật khẩu là bắt buộc.'], 400);
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['success' => false, 'message' => 'Email không hợp lệ.'], 400);
    }

    $users = getCollection('users');

    // Kiểm tra email đã tồn tại chưa
    if ($users->findOne(['email' => $email])) {
        jsonResponse(['success' => false, 'message' => 'Email đã được sử dụng.'], 400);
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $result = $users->insertOne([
        'name'       => $name,
        'email'      => $email,
        'password'   => $hashedPassword,
        'phone'      => $phone,
        'role_id'    => null,
        'created_at' => new \MongoDB\BSON\UTCDateTime(),
    ]);

    $userId = (string) $result->getInsertedId();
    $token  = generateToken($userId);

    jsonResponse([
        'success' => true,
        'message' => 'Đăng ký thành công.',
        'data'    => [
            'user' => [
                'id'    => $userId,
                'name'  => $name,
                'email' => $email,
            ],
            'token' => $token,
        ],
    ]);
} catch (\Throwable $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Đăng ký thất bại.',
        'error'   => $e->getMessage(),
    ], 500);
}
