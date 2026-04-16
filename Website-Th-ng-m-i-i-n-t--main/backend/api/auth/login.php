<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/response.php';
require_once __DIR__ . '/../../lib/auth.php';
require_once __DIR__ . '/../../lib/security.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    jsonResponse(['success' => true, 'message' => 'Preflight OK']);
}

// 🛡️ Chống brute-force / DDoS chặt chẽ nhất: 5 lần / phút / IP
applyDDoSProtection(rateLimit: 5, rateMinutes: 1, endpoint: 'auth_login');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    methodNotAllowed('POST, OPTIONS');
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = $_POST;
    }

    $email    = trim($input['email']    ?? '');
    $password = $input['password'] ?? '';

    if (empty($email) || empty($password)) {
        jsonResponse(['success' => false, 'message' => 'Email và mật khẩu là bắt buộc.'], 400);
    }

    $users = getCollection('users');

    // Tìm user theo email (chưa bị soft-delete)
    $user = $users->findOne([
        'email'      => $email,
        'deleted_at' => ['$exists' => false],
    ]);

    if (!$user || !password_verify($password, $user['password'])) {
        jsonResponse(['success' => false, 'message' => 'Email hoặc mật khẩu không chính xác.'], 401);
    }

    $userArr = docToArray($user);
    $token   = generateToken($userArr['id']);

    jsonResponse([
        'success' => true,
        'message' => 'Đăng nhập thành công.',
        'data'    => [
            'user' => [
                'id'      => $userArr['id'],
                'name'    => $userArr['name'],
                'email'   => $userArr['email'],
                'role_id' => $userArr['role_id'] ?? null,
            ],
            'token' => $token,
        ],
    ]);
} catch (\Throwable $e) {
    jsonResponse([
        'success' => false,
        'message' => 'Lỗi kết nối cơ sở dữ liệu.',
        'error'   => $e->getMessage(),
    ], 500);
}
