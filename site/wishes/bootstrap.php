<?php

declare(strict_types=1);

session_start();

function wishes_config_path(): string
{
    return __DIR__ . '/config.php';
}

function wishes_load_config(): array
{
    $path = wishes_config_path();

    if (!is_file($path)) {
        throw new RuntimeException('Missing wishes/config.php. Copy config.example.php and fill in your settings.');
    }

    $config = require $path;

    if (!is_array($config)) {
        throw new RuntimeException('Invalid wishes/config.php.');
    }

    return $config;
}

function wishes_json(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function wishes_html_error(string $message, int $status = 500): never
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>NA8 Wishes Setup</title><style>body{margin:0;padding:32px;font-family:Arial,sans-serif;background:#f5f2ea;color:#171717}main{max-width:720px;margin:0 auto;padding:24px;border:1px solid rgba(23,23,23,.12);border-radius:24px;background:#fff}h1{margin:0 0 12px;font-size:32px}p{line-height:1.6;color:#4d4d4d}</style></head><body><main><h1>Нужна настройка wishes</h1><p>' . htmlspecialchars($message, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</p></main></body></html>';
    exit;
}

function wishes_pdo(array $config): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $db = $config['db'] ?? [];
    $charset = $db['charset'] ?? 'utf8mb4';
    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=%s',
        $db['host'] ?? '127.0.0.1',
        (int)($db['port'] ?? 3306),
        $db['name'] ?? '',
        $charset
    );

    $pdo = new PDO(
        $dsn,
        (string)($db['user'] ?? ''),
        (string)($db['pass'] ?? ''),
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );

    return $pdo;
}

function wishes_require_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        wishes_json(['ok' => false, 'error' => 'Method not allowed'], 405);
    }
}

function wishes_is_admin(): bool
{
    return !empty($_SESSION['wishes_admin']);
}

function wishes_require_admin(): void
{
    if (!wishes_is_admin()) {
        header('Location: /wishes/admin.php');
        exit;
    }
}

function wishes_normalize_text(string $value): string
{
    $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');
    return $value;
}

