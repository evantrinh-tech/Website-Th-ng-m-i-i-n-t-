<?php
declare(strict_types=1);

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../lib/auth.php';

// Load .env
$envPath = __DIR__ . '/../../../.env';
if (file_exists($envPath)) {
    foreach (parse_ini_file($envPath) as $k => $v) $_ENV[$k] = $v;
}

$clientId     = $_ENV['GOOGLE_CLIENT_ID']     ?? '';
$clientSecret = $_ENV['GOOGLE_CLIENT_SECRET'] ?? '';
$redirectUri  = $_ENV['GOOGLE_REDIRECT_URI']  ?? '';

if (!isset($_GET['code'])) {
    header("Location: /login.html?error=no_code");
    exit();
}

// Đổi code lấy access_token
$ch = curl_init('https://oauth2.googleapis.com/token');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query([
        'code'          => $_GET['code'],
        'client_id'     => $clientId,
        'client_secret' => $clientSecret,
        'redirect_uri'  => $redirectUri,
        'grant_type'    => 'authorization_code',
    ]),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
]);
$token = json_decode(curl_exec($ch), true);
curl_close($ch);

$accessToken = $token['access_token'] ?? null;
if (!$accessToken) {
    header("Location: /login.html?error=token_failed");
    exit();
}

// Lấy thông tin user từ Google
$ch = curl_init('https://www.googleapis.com/oauth2/v2/userinfo');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ["Authorization: Bearer $accessToken"],
    CURLOPT_SSL_VERIFYPEER => false,
]);
$googleUser = json_decode(curl_exec($ch), true);
curl_close($ch);

$email = $googleUser['email'] ?? null;
$name  = $googleUser['name']  ?? 'Google User';

if (!$email) {
    header("Location: /login.html?error=no_email");
    exit();
}

// Tìm hoặc tạo user trong MongoDB
$users = getCollection('users');
$user  = $users->findOne([
    'email'      => $email,
    'deleted_at' => ['$exists' => false],
]);

if (!$user) {
    $insertResult = $users->insertOne([
        'name'       => $name,
        'email'      => $email,
        'password'   => '',
        'role_id'    => null,
        'provider'   => 'google',
        'created_at' => new \MongoDB\BSON\UTCDateTime(),
    ]);
    $user = $users->findOne(['_id' => $insertResult->getInsertedId()]);
}

$userArr = docToArray($user);
$userId  = (string)($userArr['id'] ?? $user['_id']);
$token   = generateToken($userId);

// Redirect về frontend kèm token
header("Location: /login.html?google_token=" . urlencode($token) . "&name=" . urlencode($userArr['name']));
exit();