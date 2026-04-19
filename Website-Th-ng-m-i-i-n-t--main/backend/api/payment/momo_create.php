<?php
declare(strict_types=1);
header('Content-Type: application/json');

function execPostRequest($url, $data) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($data)
    ]);
    $result = curl_exec($ch);
    if (curl_errno($ch)) { curl_close($ch); return json_encode(["error" => true, "message" => curl_error($ch)]); }
    curl_close($ch);
    return $result;
}

$endpoint    = "https://test-payment.momo.vn/v2/gateway/api/create";
$partnerCode = "MOMOBKUN20180529";
$accessKey   = "klm05TvNBzhg7h7j";
$secretKey   = "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa";

$orderId     = $_POST['orderId']   ?? (string)time();
$amount      = (int)($_POST['amount']    ?? 0);
$orderInfo   = $_POST['orderInfo'] ?? "Thanh toán Kính Xanh";

$requestId   = (string)time();
$requestType = "captureWallet";   // sandbox chỉ hỗ trợ captureWallet → trả về payUrl có QR

$redirectUrl = "http://localhost/checkout-success.html";
$ipnUrl      = "http://localhost/backend/payment/momo_ipn.php";

$rawHash =
    "accessKey="   . $accessKey   .
    "&amount="     . $amount      .
    "&extraData="  .
    "&ipnUrl="     . $ipnUrl      .
    "&orderId="    . $orderId     .
    "&orderInfo="  . $orderInfo   .
    "&partnerCode=". $partnerCode .
    "&redirectUrl=". $redirectUrl .
    "&requestId="  . $requestId   .
    "&requestType=". $requestType;

$signature = hash_hmac("sha256", $rawHash, $secretKey);

$data = [
    "partnerCode" => $partnerCode,
    "partnerName" => "KinhXanh Store",
    "storeId"     => "KX_STORE_01",
    "requestId"   => $requestId,
    "amount"      => $amount,
    "orderId"     => $orderId,
    "orderInfo"   => $orderInfo,
    "redirectUrl" => $redirectUrl,
    "ipnUrl"      => $ipnUrl,
    "lang"        => "vi",
    "extraData"   => "",
    "requestType" => $requestType,
    "signature"   => $signature
];

$result     = execPostRequest($endpoint, json_encode($data));
$jsonResult = json_decode($result, true);

if (!empty($jsonResult['payUrl'])) {
    $qrData = $jsonResult['qrCodeUrl'] ?? $jsonResult['payUrl'];
    
    echo json_encode([
        "success"    => true,
        "payUrl"     => $jsonResult['payUrl'],
        "qrCodeUrl"  => "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" . urlencode($qrData),
        "orderId"    => $orderId
    ]);
} else {
    echo json_encode([
        "success" => false,
        "message" => "MoMo error",
        "raw"     => $jsonResult
    ]);
}