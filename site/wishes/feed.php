<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

header('Access-Control-Allow-Origin: *');

try {
    $config = wishes_load_config();
    $pdo = wishes_pdo($config);
} catch (Throwable $e) {
    wishes_json(['ok' => false, 'items' => [], 'error' => 'Wish service is not configured yet'], 503);
}

$stmt = $pdo->query("SELECT id, author, message, approved_at, created_at FROM wishes WHERE status = 'approved' ORDER BY COALESCE(approved_at, created_at) DESC LIMIT 60");
$items = array_map(
    static fn(array $row): array => [
        'id' => (int)$row['id'],
        'author' => (string)$row['author'],
        'message' => (string)$row['message'],
        'approvedAt' => (string)($row['approved_at'] ?? $row['created_at']),
    ],
    $stmt->fetchAll()
);

wishes_json([
    'ok' => true,
    'items' => $items,
    'pollSeconds' => (int)($config['public']['poll_seconds'] ?? 6),
]);
