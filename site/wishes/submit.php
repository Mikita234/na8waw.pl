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
    wishes_ensure_schema($pdo);
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

$imagePath = null;
$imageMime = null;
$imageWidth = null;
$imageHeight = null;

if (isset($_FILES['photo']) && (int)($_FILES['photo']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    $fileError = (int)($_FILES['photo']['error'] ?? UPLOAD_ERR_NO_FILE);

    if ($fileError !== UPLOAD_ERR_OK) {
        wishes_json(['ok' => false, 'error' => 'Не удалось загрузить фотографию. Попробуй еще раз.'], 422);
    }

    $tmpPath = (string)($_FILES['photo']['tmp_name'] ?? '');
    $fileSize = (int)($_FILES['photo']['size'] ?? 0);

    if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
        wishes_json(['ok' => false, 'error' => 'Файл фотографии не распознан.'], 422);
    }

    if ($fileSize <= 0 || $fileSize > 5 * 1024 * 1024) {
        wishes_json(['ok' => false, 'error' => 'Фотография должна быть не больше 5 MB.'], 422);
    }

    $imageInfo = @getimagesize($tmpPath);

    if (!is_array($imageInfo)) {
        wishes_json(['ok' => false, 'error' => 'Поддерживаются только изображения JPG, PNG или WebP.'], 422);
    }

    $allowedMimes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    $mime = (string)($imageInfo['mime'] ?? '');
    $extension = $allowedMimes[$mime] ?? null;

    if ($extension === null) {
        wishes_json(['ok' => false, 'error' => 'Поддерживаются только изображения JPG, PNG или WebP.'], 422);
    }

    $uploadDir = wishes_ensure_upload_dir();
    $filename = date('Ymd-His') . '-' . bin2hex(random_bytes(6)) . '.' . $extension;
    $targetPath = $uploadDir . '/' . $filename;

    if (!move_uploaded_file($tmpPath, $targetPath)) {
        wishes_json(['ok' => false, 'error' => 'Не удалось сохранить фотографию на сервере.'], 500);
    }

    $imagePath = wishes_upload_web_path($filename);
    $imageMime = $mime;
    $imageWidth = isset($imageInfo[0]) ? (int)$imageInfo[0] : null;
    $imageHeight = isset($imageInfo[1]) ? (int)$imageInfo[1] : null;
}

$stmt = $pdo->prepare('INSERT INTO wishes (author, message, status, image_path, image_mime, image_width, image_height) VALUES (:author, :message, :status, :image_path, :image_mime, :image_width, :image_height)');
$stmt->execute([
    ':author' => $author,
    ':message' => $message,
    ':status' => 'pending',
    ':image_path' => $imagePath,
    ':image_mime' => $imageMime,
    ':image_width' => $imageWidth,
    ':image_height' => $imageHeight,
]);

wishes_json([
    'ok' => true,
    'message' => 'Пожелание отправлено. После проверки оно появится на экране.',
]);
