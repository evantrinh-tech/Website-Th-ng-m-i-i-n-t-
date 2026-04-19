<?php
// Load .env
$envPath = __DIR__ . '/../../../.env';
if (file_exists($envPath)) {
    foreach (parse_ini_file($envPath) as $k => $v) $_ENV[$k] = $v;
}

$googleAuthUrl = 'https://accounts.google.com/o/oauth2/auth?' . http_build_query([
    'client_id'     => $_ENV['GOOGLE_CLIENT_ID']    ?? '',
    'redirect_uri'  => $_ENV['GOOGLE_REDIRECT_URI'] ?? '',
    'response_type' => 'code',
    'scope'         => 'email profile',
    'access_type'   => 'online',
]);

header("Location: $googleAuthUrl");
exit();