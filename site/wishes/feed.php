<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

try {
    $config = wishes_load_config();
    $pdo = wishes_pdo($config);
    wishes_ensure_schema($pdo);
} catch (Throwable $e) {
    wishes_json(['ok' => false, 'items' => [], 'error' => 'Wish service is not configured yet'], 503);
}

$totalCleanMonths = (int)($pdo->query("SELECT COALESCE(SUM(clean_years * 12 + clean_months), 0) FROM wishes WHERE status = 'approved'")->fetchColumn() ?: 0);
$totalYears = intdiv($totalCleanMonths, 12);
$totalMonths = $totalCleanMonths % 12;
$stmt = $pdo->query("SELECT id, author, city, message, image_path, clean_years, clean_months, approved_at, created_at FROM wishes WHERE status = 'approved' ORDER BY COALESCE(approved_at, created_at) DESC LIMIT 60");
$items = array_map(
    static fn(array $row): array => [
        'id' => (int)$row['id'],
        'author' => (string)$row['author'],
        'city' => (string)$row['city'],
        'message' => (string)$row['message'],
        'imagePath' => (string)($row['image_path'] ?? ''),
        'cleanLabel' => wishes_clean_duration_label((int)($row['clean_years'] ?? 0), (int)($row['clean_months'] ?? 0), 'ru'),
        'approvedAt' => (string)($row['approved_at'] ?? $row['created_at']),
    ],
    $stmt->fetchAll()
);

wishes_json([
    'ok' => true,
    'items' => $items,
    'pollSeconds' => (int)($config['public']['poll_seconds'] ?? 6),
    'totals' => [
        'cleanYears' => $totalYears,
        'cleanMonths' => $totalMonths,
        'cleanLabel' => wishes_clean_duration_label($totalYears, $totalMonths, 'ru'),
    ],
]);
