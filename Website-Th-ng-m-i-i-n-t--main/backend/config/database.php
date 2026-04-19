<?php
declare(strict_types=1);

error_reporting(E_ERROR | E_PARSE);

/**
 * Kết nối CSDL cho module API sản phẩm.
 * Công nghệ: PHP thuần + MongoDB PHP Driver (mongodb/mongodb).
 *
 * Yêu cầu:
 *   - PHP Extension: mongodb  (pecl install mongodb)
 *   - Composer Package: mongodb/mongodb  (composer require mongodb/mongodb)
 */

// Tải file .env từ thư mục gốc
$envPath = __DIR__ . '/../../.env';
if (file_exists($envPath)) {
    $envVariables = parse_ini_file($envPath);
    foreach ($envVariables as $key => $value) {
        $_ENV[$key] = $value;
    }
}

// Lấy thông tin kết nối từ .env
define('MONGO_URI',    $_ENV['MONGO_URI']    ?? 'mongodb://127.0.0.1:27017');
define('MONGO_DB',     $_ENV['MONGO_DB']     ?? 'kinh_xanh');

/**
 * Trả về MongoDB\Client (singleton).
 */
function getMongoClient(): \MongoDB\Client
{
    static $client = null;
    if ($client === null) {
        // Autoload Composer nếu chưa load
        $autoload = __DIR__ . '/../vendor/autoload.php';
        if (file_exists($autoload)) {
            require_once $autoload;
        }
        $client = new \MongoDB\Client(MONGO_URI);
    }
    return $client;
}

/**
 * Trả về MongoDB\Database (singleton).
 */
function getMongoDB(): \MongoDB\Database
{
    static $db = null;
    if ($db === null) {
        $db = getMongoClient()->selectDatabase(MONGO_DB);
    }
    return $db;
}

/**
 * Trả về một MongoDB\Collection theo tên.
 */
function getCollection(string $name): \MongoDB\Collection
{
    return getMongoDB()->selectCollection($name);
}

/**
 * Tạo ObjectId từ string id. Trả về null nếu id không hợp lệ.
 */
function toObjectId(string $id): ?\MongoDB\BSON\ObjectId
{
    try {
        return new \MongoDB\BSON\ObjectId($id);
    } catch (\Throwable) {
        return null;
    }
}

/**
 * Chuyển document MongoDB thành array PHP thuần (đệ quy),
 * đồng thời map _id => id dưới dạng string để tương thích với frontend cũ.
 */
function docToArray(mixed $doc): array
{
    if ($doc === null) return [];
    $arr = (array) $doc;

    // Chuẩn hoá _id thành string
    if (isset($arr['_id'])) {
        $arr['id'] = (string) $arr['_id'];
        unset($arr['_id']);
    }

    // Đệ quy cho mảng lồng nhau
    foreach ($arr as $k => $v) {
        if ($v instanceof \MongoDB\BSON\ObjectId) {
            $arr[$k] = (string) $v;
        } elseif ($v instanceof \MongoDB\BSON\UTCDateTime) {
            $arr[$k] = $v->toDateTime()->format('Y-m-d H:i:s');
        } elseif (is_object($v) || is_array($v)) {
            $arr[$k] = docToArray($v);
        }
    }

    return $arr;
}

/**
 * Chuyển nhiều documents thành mảng PHP thuần.
 */
function docsToArray(iterable $cursor): array
{
    $results = [];
    foreach ($cursor as $doc) {
        $results[] = docToArray($doc);
    }
    return $results;
}