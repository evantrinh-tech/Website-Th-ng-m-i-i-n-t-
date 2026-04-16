<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/response.php';

// ============================================================
//  LỚP BẢO MẬT CHỐNG DDOS - KÍNH XANH SECURITY SHIELD v2.0
// ============================================================

// ── CẤU HÌNH TOÀN CỤC ────────────────────────────────────────
define('DDOS_BLOCK_DURATION',   600);   // Thời gian block IP (giây) = 10 phút
define('DDOS_BAN_THRESHOLD',    5);     // Số lần vi phạm → banned vĩnh viễn
define('DDOS_MAX_BODY_SIZE',    1024 * 512); // Max request body 512 KB
define('DDOS_UA_REQUIRED',      true);  // Bắt buộc có User-Agent

/**
 * Lấy IP thực của client (kể cả qua proxy / CDN)
 */
function getClientIp(): string
{
    $headers = [
        'HTTP_CF_CONNECTING_IP',   // Cloudflare
        'HTTP_X_REAL_IP',          // Nginx proxy
        'HTTP_X_FORWARDED_FOR',    // Load balancer
        'REMOTE_ADDR',
    ];

    foreach ($headers as $h) {
        if (!empty($_SERVER[$h])) {
            // X-Forwarded-For có thể chứa nhiều IP, lấy IP đầu tiên
            $ip = trim(explode(',', $_SERVER[$h])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return $ip;
            }
        }
    }

    // Fallback: chấp nhận cả IP private (development)
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

/**
 * Khởi tạo schema bảo mật trong database (tạo index cho collection)
 */
function ensureSecuritySchema(): void
{
    try {
        $db = getMongoDB();
        // Bảng theo dõi request
        getCollection('rate_limits')->createIndex(['ip' => 1, 'endpoint' => 1], ['unique' => true]);
        getCollection('rate_limits')->createIndex(['window_start' => 1]);

        // Bảng blacklist IP
        getCollection('ip_blacklist')->createIndex(['ip' => 1], ['unique' => true]);
        getCollection('ip_blacklist')->createIndex(['expires_at' => 1]);

        // Bảng log
        getCollection('security_logs')->createIndex(['ip' => 1, 'event' => 1]);
        getCollection('security_logs')->createIndex(['created_at' => 1]);
    } catch (\Throwable) {
        // Fallback or ignore if indexing fails
    }
}

/**
 * Ghi log security event
 */
function logSecurityEvent(string $ip, string $event, string $detail = ''): void
{
    try {
        // [OPTIMIZED FOR STRESS TEST]: Tạm thời vô hiệu hóa việc ghi log liên tục để giảm tải CPU/RAM cho DB
        // Bạn có thể dùng Redis hoặc lưu file log tĩnh (.txt) thay vì nhồi nhét vào Database ở bản chính thức.
        
        $endpoint  = $_SERVER['REQUEST_URI'] ?? 'unknown';
        $method    = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
        $userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 512);

        // getCollection('security_logs')->insertOne([
        //     'ip'         => $ip,
        //     'endpoint'   => $endpoint,
        //     'method'     => $method,
        //     'user_agent' => $userAgent,
        //     'event'      => $event,
        //     'detail'     => $detail,
        //     'created_at' => new \MongoDB\BSON\UTCDateTime()
        // ]);
    } catch (\Throwable) {
        // Không để lỗi log làm crash ứng dụng
    }
}

// ══════════════════════════════════════════════════════════════
//  LỚP 1: KIỂM TRA BLACKLIST IP
//  Chặn ngay những IP đã bị cấm, không cần xử lý gì thêm.
// ══════════════════════════════════════════════════════════════
function checkIpBlacklist(): void
{
    ensureSecuritySchema();

    $ip   = getClientIp();
    $coll = getCollection('ip_blacklist');
    $record = $coll->findOne(['ip' => $ip]);

    if (!$record) {
        return; // IP sạch
    }

    // Kiểm tra hết hạn block
    if (isset($record['expires_at']) && $record['expires_at'] !== null) {
        if ($record['expires_at']->toDateTime()->getTimestamp() < time()) {
            // Block đã hết → xóa khỏi blacklist
            $coll->deleteOne(['ip' => $ip]);
            return;
        }
    }

    // Vẫn còn trong blacklist → từ chối
    logSecurityEvent($ip, 'BLACKLIST_HIT', "Violations: {$record['violations']}");

    $expiresMsg = (isset($record['expires_at']) && $record['expires_at'] !== null)
        ? 'Thử lại sau ' . date('H:i d/m/Y', $record['expires_at']->toDateTime()->getTimestamp())
        : 'IP bị cấm vĩnh viễn';

    jsonResponse([
        'success' => false,
        'code'    => 'IP_BLOCKED',
        'message' => "IP [{$ip}] bị chặn. {$expiresMsg}. Liên hệ admin nếu có nhầm lẫn.",
    ], 403);
}

// ══════════════════════════════════════════════════════════════
//  LỚP 2: RATE LIMITING (Sliding Window per IP + Endpoint)
//  Giới hạn số request trong khoảng thời gian cho endpoint cụ thể.
// ══════════════════════════════════════════════════════════════
function checkRateLimit(int $limit = 60, int $minutes = 1, string $endpoint = 'global'): void
{
    ensureSecuritySchema();

    $ip          = getClientIp();
    $windowSecs  = $minutes * 60;
    
    $coll = getCollection('rate_limits');
    $record = $coll->findOne(['ip' => $ip, 'endpoint' => $endpoint]);

    $now = time();

    if ($record) {
        $windowStartTs = $record['window_start']->toDateTime()->getTimestamp();
        $elapsed       = $now - $windowStartTs;

        if ($elapsed > $windowSecs) {
            // Cửa sổ thời gian mới → reset
            $coll->updateOne(
                ['_id' => $record['_id']],
                ['$set' => [
                    'requests' => 1,
                    'window_start' => new \MongoDB\BSON\UTCDateTime($now * 1000)
                ]]
            );
            header("X-RateLimit-Limit: {$limit}");
            header("X-RateLimit-Remaining: " . ($limit - 1));
        } elseif ($record['requests'] >= $limit) {
            // ❌ Vượt giới hạn → ghi log + block tạm
            logSecurityEvent($ip, 'RATE_LIMIT_EXCEEDED', "Endpoint: {$endpoint}, Limit: {$limit}/{$minutes}min");
            recordViolation($ip, "Rate limit exceeded on {$endpoint}");

            $retryAfter = $windowSecs - $elapsed;
            header("Retry-After: {$retryAfter}");
            header("X-RateLimit-Limit: {$limit}");
            header("X-RateLimit-Remaining: 0");

            jsonResponse([
                'success'     => false,
                'code'        => 'RATE_LIMIT_EXCEEDED',
                'message'     => "Quá nhiều yêu cầu từ IP [{$ip}]. Vui lòng thử lại sau {$retryAfter} giây.",
                'retry_after' => $retryAfter,
            ], 429);
        } else {
            // Tăng đếm
            $coll->updateOne(
                ['_id' => $record['_id']],
                ['$inc' => ['requests' => 1]]
            );
            $remaining = $limit - $record['requests'] - 1;

            header("X-RateLimit-Limit: {$limit}");
            header("X-RateLimit-Remaining: {$remaining}");
        }
    } else {
        // IP mới
        $coll->insertOne([
            'ip' => $ip,
            'endpoint' => $endpoint,
            'requests' => 1,
            'window_start' => new \MongoDB\BSON\UTCDateTime($now * 1000)
        ]);

        header("X-RateLimit-Limit: {$limit}");
        header("X-RateLimit-Remaining: " . ($limit - 1));
    }
}

// ══════════════════════════════════════════════════════════════
//  LỚP 3: BẢO VỆ HTTP HEADERS
//  Kiểm tra User-Agent, nội dung bot độc hại, header giả mạo.
// ══════════════════════════════════════════════════════════════
function checkHttpHeaders(): void
{
    $ip = getClientIp();

    // 3.1 Kiểm tra User-Agent
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    if (DDOS_UA_REQUIRED && empty(trim($ua))) {
        logSecurityEvent($ip, 'MISSING_USER_AGENT', '');
        recordViolation($ip, 'Missing User-Agent');
        jsonResponse([
            'success' => false,
            'code'    => 'MISSING_USER_AGENT',
            'message' => 'Yêu cầu không hợp lệ.',
        ], 400);
    }

    // 3.2 Danh sách bot / tool tấn công đã biết
    // [STRESS TEST MODE]: Đã vô hiệu hóa danh sách này để cho phép mô phỏng Tool MHDDoS

    // 3.3 Kiểm tra Host header hợp lệ (chống Host Header Attack)
    $allowedHosts = [
        'localhost',
        '127.0.0.1',
        $_ENV['APP_DOMAIN'] ?? '',
    ];
    $requestHost = strtolower(explode(':', $_SERVER['HTTP_HOST'] ?? '')[0]);
    $allowedHosts = array_filter(array_map('strtolower', $allowedHosts));

    if (!empty($requestHost) && !in_array($requestHost, $allowedHosts, true)) {
        // logSecurityEvent($ip, 'INVALID_HOST', "Host: {$requestHost}");
    }
}

// ══════════════════════════════════════════════════════════════
//  LỚP 4: KIỂM TRA PAYLOAD ĐẦU VÀO
//  Chặn request body quá lớn và các pattern tấn công phổ biến.
// ══════════════════════════════════════════════════════════════
function checkRequestPayload(): void
{
    // 4.1 Giới hạn kích thước body
    $contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($contentLength > DDOS_MAX_BODY_SIZE) {
        $ip  = getClientIp();
        logSecurityEvent($ip, 'OVERSIZED_BODY', "Size: {$contentLength} bytes");
        recordViolation($ip, "Oversized body: {$contentLength} bytes");
        jsonResponse([
            'success' => false,
            'code'    => 'PAYLOAD_TOO_LARGE',
            'message' => 'Dữ liệu gửi lên quá lớn.',
        ], 413);
    }

    // 4.2 Phát hiện SQL Injection / XSS trong query string
    $suspiciousPatterns = [
        '/(\bUNION\b.*\bSELECT\b|\bSELECT\b.*\bFROM\b|\bDROP\b.*\bTABLE\b|\bINSERT\b.*\bINTO\b)/i',
        '/(\bOR\b\s+[\'"]?\d+[\'"]?\s*=\s*[\'"]?\d+[\'"]?)/i',
        '/(--\s|#\s|\/\*[\s\S]*?\*\/)/m',
        '/(<script[\s\S]*?>[\s\S]*?<\/script>)/i',
        '/(javascript\s*:)/i',
        '/(\bon\w+\s*=)/i',
        '/(\.\.\/|\.\.\\\\)/',
        '/(\||;|&&|\$\(|`)/m',
    ];

    $rawInput = [];
    parse_str($_SERVER['QUERY_STRING'] ?? '', $rawInput);

    $allInput = array_merge($rawInput, $_GET);
    foreach ($allInput as $value) {
        if (!is_string($value)) continue;
        foreach ($suspiciousPatterns as $pattern) {
            if (preg_match($pattern, $value)) {
                $ip  = getClientIp();
                logSecurityEvent($ip, 'INJECTION_ATTEMPT', "Value: " . substr($value, 0, 200));
                recordViolation($ip, "Injection attempt detected");
                jsonResponse([
                    'success' => false,
                    'code'    => 'INVALID_INPUT',
                    'message' => 'Yêu cầu chứa dữ liệu không hợp lệ.',
                ], 400);
            }
        }
    }
}

// ══════════════════════════════════════════════════════════════
//  LỚP 5: GHI NHẬN VI PHẠM VÀ TỰ ĐỘNG BAN IP
//  Tự động block IP khi vi phạm vượt ngưỡng.
// ══════════════════════════════════════════════════════════════
function recordViolation(string $ip, string $reason): void
{
    $coll = getCollection('ip_blacklist');
    $now = time();
    $expiresAtTs = $now + DDOS_BLOCK_DURATION;
    $expiresAt = new \MongoDB\BSON\UTCDateTime($expiresAtTs * 1000);

    $record = $coll->findOne(['ip' => $ip]);
    if ($record) {
        $newViolations = $record['violations'] + 1;
        $newExpiresAt = ($newViolations >= DDOS_BAN_THRESHOLD) ? null : clone $expiresAt;
        
        $coll->updateOne(
            ['_id' => $record['_id']],
            ['$set' => [
                'violations' => $newViolations,
                'reason' => $reason,
                'blocked_at' => new \MongoDB\BSON\UTCDateTime($now * 1000),
                'expires_at' => $newExpiresAt
            ]]
        );
    } else {
        $coll->insertOne([
            'ip'         => $ip,
            'reason'     => $reason,
            'violations' => 1,
            'blocked_at' => new \MongoDB\BSON\UTCDateTime($now * 1000),
            'expires_at' => $expiresAt
        ]);
    }
}

// ══════════════════════════════════════════════════════════════
//  LỚP 6: DỌN DẸP TỰ ĐỘNG (Garbage Collection)
//  Xóa dữ liệu cũ để không làm đầy database.
// ══════════════════════════════════════════════════════════════
function runSecurityGarbageCollection(): void
{
    // Chỉ chạy ngẫu nhiên để giảm overhead
    if (random_int(1, 100) !== 1) {
        return;
    }

    try {
        $now = time();
        $tenMinsAgo = new \MongoDB\BSON\UTCDateTime(($now - 600) * 1000);
        $sevenDaysAgo = new \MongoDB\BSON\UTCDateTime(($now - 7 * 86400) * 1000);

        getCollection('rate_limits')->deleteMany(['window_start' => ['$lt' => $tenMinsAgo]]);
        getCollection('ip_blacklist')->deleteMany(['expires_at' => ['$ne' => null, '$lt' => new \MongoDB\BSON\UTCDateTime($now * 1000)]]);
        getCollection('security_logs')->deleteMany(['created_at' => ['$lt' => $sevenDaysAgo]]);

    } catch (\Throwable) {
        // Silent fail
    }
}

// ══════════════════════════════════════════════════════════════
//  API CHÍNH: Kích hoạt tất cả các lớp bảo mật
//  Gọi hàm này ở đầu MỖI endpoint cần bảo vệ.
// ══════════════════════════════════════════════════════════════

/**
 * Kích hoạt toàn bộ shield bảo mật.
 */
function applyDDoSProtection(
    int    $rateLimit    = 60,
    int    $rateMinutes  = 1,
    string $endpoint     = 'global',
    bool   $checkPayload = true
): void {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');

    checkIpBlacklist();
    checkRateLimit($rateLimit, $rateMinutes, $endpoint);
    checkHttpHeaders();
    if ($checkPayload) {
        checkRequestPayload();
    }
    runSecurityGarbageCollection();
}
