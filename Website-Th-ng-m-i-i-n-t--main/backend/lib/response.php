<?php
declare(strict_types=1);

function jsonResponse(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

function methodNotAllowed(string $allowed = 'GET, POST, OPTIONS'): void
{
    jsonResponse([
        'success' => false,
        'message' => "Method không được hỗ trợ. Chỉ chấp nhận $allowed."
    ], 405);
}

function normalizeCsvParam(?string $value): array
{
    if ($value === null || trim($value) === '') {
        return [];
    }

    $parts = array_filter(array_map('trim', explode(',', $value)));
    return array_values(array_unique($parts));
}

function createNamedPlaceholders(array $values, string $prefix): array
{
    $placeholders = [];
    $bindings = [];

    foreach ($values as $index => $value) {
        $key = ':' . $prefix . $index;
        $placeholders[] = $key;
        $bindings[$key] = $value;
    }

    return [$placeholders, $bindings];
}

function parsePositiveInt(mixed $value, int $default): int
{
    $number = filter_var($value, FILTER_VALIDATE_INT);
    if ($number === false || $number <= 0) {
        return $default;
    }

    return $number;
}
