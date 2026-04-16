<?php
declare(strict_types=1);

/**
 * Auth lib – thay thế int userId bằng string (MongoDB ObjectId dạng string).
 */

require_once __DIR__ . '/response.php';

function generateToken(string $userId): string
{
    $secret  = $_ENV['SECRET_KEY'] ?? 'KinhXanhSecretKey2026';
    $payload = json_encode(['user_id' => $userId, 'exp' => time() + 86400]);
    $encoded = base64_encode($payload);
    $sig     = hash_hmac('sha256', $encoded, $secret);
    return $encoded . '.' . $sig;
}

function getUserIdFromToken(): ?string
{
    $headers    = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

    if (!$authHeader || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return null;
    }

    $token = $matches[1];
    $parts = explode('.', $token);
    if (count($parts) !== 2) {
        return null;
    }

    $secret  = $_ENV['SECRET_KEY'] ?? 'KinhXanhSecretKey2026';
    $payload = base64_decode($parts[0]);

    $expectedSig = hash_hmac('sha256', $parts[0], $secret);
    if (!hash_equals($expectedSig, $parts[1])) {
        return null;
    }

    $data = json_decode($payload, true);
    if (!$data || !isset($data['user_id']) || $data['exp'] < time()) {
        return null;
    }

    return (string) $data['user_id'];
}

function requireAuth(): string
{
    $userId = getUserIdFromToken();
    if (!$userId) {
        jsonResponse(['success' => false, 'message' => 'Unauthorized. Vui lòng đăng nhập lại.'], 401);
    }
    return $userId;
}
