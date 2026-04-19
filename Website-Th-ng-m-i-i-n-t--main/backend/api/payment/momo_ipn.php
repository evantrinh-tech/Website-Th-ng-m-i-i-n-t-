<?php
header("Content-Type: application/json; charset=UTF-8");
http_response_code(200);

require_once __DIR__ . '/../../config/database.php';

$orders = getCollection('orders');

/* =========================
   GET DATA FROM MOMO
========================= */
if (!empty($_POST)) {

    try {

        $partnerCode   = $_POST["partnerCode"] ?? '';
        $orderId       = $_POST["orderId"] ?? '';
        $requestId     = $_POST["requestId"] ?? '';
        $amount        = $_POST["amount"] ?? 0;
        $orderInfo     = $_POST["orderInfo"] ?? '';
        $orderType     = $_POST["orderType"] ?? '';
        $transId       = $_POST["transId"] ?? '';
        $resultCode    = $_POST["resultCode"] ?? -1;
        $message       = $_POST["message"] ?? '';
        $payType       = $_POST["payType"] ?? '';
        $responseTime  = $_POST["responseTime"] ?? '';
        $extraData     = $_POST["extraData"] ?? '';
        $m2signature   = $_POST["signature"] ?? '';

        /* =========================
           RAW HASH (VERIFY SIGNATURE)
        ========================= */
        $rawHash =
            "accessKey=klm05TvNBzhg7h7j" .
            "&amount=" . $amount .
            "&extraData=" . $extraData .
            "&message=" . $message .
            "&orderId=" . $orderId .
            "&orderInfo=" . $orderInfo .
            "&orderType=" . $orderType .
            "&partnerCode=" . $partnerCode .
            "&payType=" . $payType .
            "&requestId=" . $requestId .
            "&responseTime=" . $responseTime .
            "&resultCode=" . $resultCode .
            "&transId=" . $transId;

        /* =========================
           SIGNATURE CHECK
        ========================= */
        $secretKey = "at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa";
        $partnerSignature = hash_hmac("sha256", $rawHash, $secretKey);

        $debugger = [
            "rawData" => $rawHash,
            "momoSignature" => $m2signature,
            "partnerSignature" => $partnerSignature
        ];

        /* =========================
           VERIFY SIGNATURE
        ========================= */
        if ($m2signature !== $partnerSignature) {

            echo json_encode([
                "success" => false,
                "message" => "Invalid signature",
                "debugger" => $debugger
            ]);
            exit;
        }

        /* =========================
           UPDATE ORDER (MONGODB)
        ========================= */
        if (!empty($orderId)) {

            if ($resultCode == 0) {

                // ✔ SUCCESS PAYMENT
                $orders->updateOne(
                    ['_id' => new MongoDB\BSON\ObjectId($orderId)],
                    [
                        '$set' => [
                            'status' => 'paid',
                            'payment_method' => 'momo',
                            'trans_id' => $transId,
                            'paid_at' => new MongoDB\BSON\UTCDateTime()
                        ]
                    ]
                );

            } else {

                // ❌ FAILED PAYMENT
                $orders->updateOne(
                    ['_id' => new MongoDB\BSON\ObjectId($orderId)],
                    [
                        '$set' => [
                            'status' => 'failed',
                            'payment_method' => 'momo',
                            'failed_at' => new MongoDB\BSON\UTCDateTime()
                        ]
                    ]
                );
            }
        }

        /* =========================
           RESPONSE
        ========================= */
        echo json_encode([
            "success" => true,
            "message" => $resultCode == 0
                ? "Payment success"
                : "Payment failed",
            "debugger" => $debugger
        ]);

    } catch (Exception $e) {

        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ]);
    }

} else {

    echo json_encode([
        "success" => false,
        "message" => "No data received"
    ]);
}