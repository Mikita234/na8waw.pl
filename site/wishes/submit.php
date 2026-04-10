<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

header('Access-Control-Allow-Origin: *');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

wishes_require_post();

try {
    $config = wishes_load_config();
    $pdo = wishes_pdo($config);
} catch (Throwable $e) {
    wishes_json(['ok' => false, 'error' => 'Wish service is not configured yet'], 503);
}

$maxLength = (int)($config['public']['max_length'] ?? 220);
$maxNameLength = (int)($config['public']['max_name_length'] ?? 40);

$author = wishes_normalize_text((string)($_POST['author'] ?? ''));
$message = wishes_normalize_text((string)($_POST['message'] ?? ''));

if ($message === '') {
    wishes_json(['ok' => false, 'error' => 'Напиши пожелание перед отправкой'], 422);
}

if (mb_strlen($message) > $maxLength) {
    wishes_json(['ok' => false, 'error' => "Слишком длинное пожелание. Максимум {$maxLength} символов."], 422);
}

if (mb_strlen($author) > $maxNameLength) {
    wishes_json(['ok' => false, 'error' => "Подпись слишком длинная. Максимум {$maxNameLength} символов."], 422);
}

$stmt = $pdo->prepare('INSERT INTO wishes (author, message, status) VALUES (:author, :message, :status)');
$stmt->execute([
    ':author' => $author,
    ':message' => $message,
    ':status' => 'pending',
]);

wishes_json([
    'ok' => true,
    'message' => 'Пожелание отправлено. После проверки оно появится на экране.',
]);
