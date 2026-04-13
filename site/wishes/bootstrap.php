<?php

declare(strict_types=1);

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

function wishes_ensure_schema(PDO $pdo): void
{
    static $ready = false;

    if ($ready) {
        return;
    }

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS wishes (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          author VARCHAR(40) NOT NULL DEFAULT '',
          message VARCHAR(220) NOT NULL,
          status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
          image_path VARCHAR(255) NULL DEFAULT NULL,
          image_mime VARCHAR(32) NULL DEFAULT NULL,
          image_width INT UNSIGNED NULL DEFAULT NULL,
          image_height INT UNSIGNED NULL DEFAULT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          approved_at TIMESTAMP NULL DEFAULT NULL,
          PRIMARY KEY (id),
          KEY wishes_status_created_idx (status, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    );

    $columns = [
        'image_path' => "ALTER TABLE wishes ADD COLUMN image_path VARCHAR(255) NULL DEFAULT NULL AFTER status",
        'image_mime' => "ALTER TABLE wishes ADD COLUMN image_mime VARCHAR(32) NULL DEFAULT NULL AFTER image_path",
        'image_width' => "ALTER TABLE wishes ADD COLUMN image_width INT UNSIGNED NULL DEFAULT NULL AFTER image_mime",
        'image_height' => "ALTER TABLE wishes ADD COLUMN image_height INT UNSIGNED NULL DEFAULT NULL AFTER image_width",
    ];

    foreach ($columns as $column => $sql) {
        $stmt = $pdo->prepare("SHOW COLUMNS FROM wishes LIKE :column");
        $stmt->execute([':column' => $column]);
        if (!$stmt->fetch()) {
            $pdo->exec($sql);
        }
    }

    $ready = true;
}

function wishes_require_post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        wishes_json(['ok' => false, 'error' => 'Method not allowed'], 405);
    }
}

function wishes_admin_cookie_name(): string
{
    return 'na8waw_wishes_admin';
}

function wishes_admin_token(array $config): string
{
    return hash(
        'sha256',
        (string)($config['admin']['username'] ?? '') . '|' . (string)($config['admin']['password'] ?? '')
    );
}

function wishes_cookie_options(): array
{
    return [
        'expires' => time() + 60 * 60 * 12,
        'path' => '/wishes/',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax',
    ];
}

function wishes_login_admin(array $config): void
{
    setcookie(wishes_admin_cookie_name(), wishes_admin_token($config), wishes_cookie_options());
    $_COOKIE[wishes_admin_cookie_name()] = wishes_admin_token($config);
}

function wishes_logout_admin(): void
{
    setcookie(wishes_admin_cookie_name(), '', [
        'expires' => time() - 3600,
        'path' => '/wishes/',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    unset($_COOKIE[wishes_admin_cookie_name()]);
}

function wishes_is_admin(array $config): bool
{
    $cookie = (string)($_COOKIE[wishes_admin_cookie_name()] ?? '');
    return $cookie !== '' && hash_equals(wishes_admin_token($config), $cookie);
}

function wishes_require_admin(array $config): void
{
    if (!wishes_is_admin($config)) {
        header('Location: /wishes/admin.php');
        exit;
    }
}

function wishes_normalize_text(string $value): string
{
    $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');
    return $value;
}

function wishes_upload_dir(): string
{
    return __DIR__ . '/uploads';
}

function wishes_upload_web_path(string $filename): string
{
    return '/wishes/uploads/' . rawurlencode($filename);
}

function wishes_ensure_upload_dir(): string
{
    $dir = wishes_upload_dir();

    if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
        throw new RuntimeException('Не удалось создать папку для фотографий wishes.');
    }

    return $dir;
}

function wishes_parse_size_to_bytes(string $value): int
{
    $value = trim($value);

    if ($value === '') {
        return 0;
    }

    $unit = strtolower(substr($value, -1));
    $number = (float)$value;

    return match ($unit) {
        'g' => (int)($number * 1024 * 1024 * 1024),
        'm' => (int)($number * 1024 * 1024),
        'k' => (int)($number * 1024),
        default => (int)$number,
    };
}

function wishes_human_size(int $bytes): string
{
    if ($bytes >= 1024 * 1024) {
        return rtrim(rtrim(number_format($bytes / (1024 * 1024), 1, '.', ''), '0'), '.') . ' MB';
    }

    if ($bytes >= 1024) {
        return rtrim(rtrim(number_format($bytes / 1024, 1, '.', ''), '0'), '.') . ' KB';
    }

    return $bytes . ' B';
}
