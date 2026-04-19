<?php

echo "API OK";
declare(strict_types=1);

header("Content-Type: text/html; charset=utf-8");

function scanRoutes(string $baseDir, string $baseUrl = '/backend/api'): array {
    $routes = [];

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($baseDir)
    );

    foreach ($iterator as $file) {
        if (!$file->isFile()) continue;

        if ($file->getExtension() !== 'php') continue;

        $fullPath = $file->getPathname();

        // Convert path → URL
        $relativePath = str_replace($baseDir, '', $fullPath);
        $relativePath = str_replace('\\', '/', $relativePath);

        $url = $baseUrl . $relativePath;

        // Detect method (basic)
        $method = 'GET';
        $content = file_get_contents($fullPath);

        if (str_contains($content, "POST")) $method = 'POST';
        if (str_contains($content, "PUT")) $method = 'PUT';
        if (str_contains($content, "DELETE")) $method = 'DELETE';

        $routes[] = [
            'method' => $method,
            'url'    => $url,
            'file'   => $fullPath
        ];
    }

    return $routes;
}

$apiPath = __DIR__ . '/api';
$routes = scanRoutes($apiPath);

?>

<!DOCTYPE html>
<html>

<head>
    <title>Route List</title>
    <style>
    body {
        font-family: Arial;
        background: #0f172a;
        color: #e2e8f0;
        padding: 20px;
    }

    h1 {
        color: #38bdf8;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
    }

    th,
    td {
        padding: 10px;
        border-bottom: 1px solid #334155;
    }

    th {
        text-align: left;
        color: #94a3b8;
    }

    .GET {
        color: #22c55e;
    }

    .POST {
        color: #facc15;
    }

    .PUT {
        color: #38bdf8;
    }

    .DELETE {
        color: #ef4444;
    }

    tr:hover {
        background: #1e293b;
    }
    </style>
</head>

<body>

    <h1>🚀 Route List (PHP)</h1>

    <table>
        <thead>
            <tr>
                <th>Method</th>
                <th>URL</th>
                <th>File</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($routes as $route): ?>
            <tr>
                <td class="<?= $route['method'] ?>">
                    <?= $route['method'] ?>
                </td>
                <td>
                    <a href="<?= $route['url'] ?>" target="_blank" style="color:#38bdf8;">
                        <?= $route['url'] ?>
                    </a>
                </td>
                <td><?= $route['file'] ?></td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

</body>

</html>