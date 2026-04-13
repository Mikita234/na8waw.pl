<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

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
$maxCityLength = 60;

$author = wishes_normalize_text((string)($_POST['author'] ?? ''));
$city = wishes_normalize_text((string)($_POST['city'] ?? ''));
$message = wishes_normalize_text((string)($_POST['message'] ?? ''));
$honeypot = trim((string)($_POST['website'] ?? ''));

if ($honeypot !== '') {
    wishes_json(['ok' => true, 'message' => 'Пожелание отправлено. После проверки оно появится на экране.']);
}

if ($message === '') {
    wishes_json(['ok' => false, 'error' => 'Напиши пожелание перед отправкой'], 422);
}

if (mb_strlen($message) > $maxLength) {
    wishes_json(['ok' => false, 'error' => "Слишком длинное пожелание. Максимум {$maxLength} символов."], 422);
}

if (mb_strlen($author) > $maxNameLength) {
    wishes_json(['ok' => false, 'error' => "Подпись слишком длинная. Максимум {$maxNameLength} символов."], 422);
}

if (mb_strlen($city) > $maxCityLength) {
    wishes_json(['ok' => false, 'error' => "Город слишком длинный. Максимум {$maxCityLength} символов."], 422);
}

$cleanYears = max(0, min(99, (int)($_POST['clean_years'] ?? 0)));
$cleanMonths = max(0, min(11, (int)($_POST['clean_months'] ?? 0)));

$imagePath = null;
$imageMime = null;
$imageWidth = null;
$imageHeight = null;
$serverUploadLimit = wishes_parse_size_to_bytes((string)ini_get('upload_max_filesize'));
$serverPostLimit = wishes_parse_size_to_bytes((string)ini_get('post_max_size'));
$effectiveUploadLimit = min(
    array_filter([$serverUploadLimit, $serverPostLimit, 5 * 1024 * 1024]) ?: [5 * 1024 * 1024]
);

$photoData = trim((string)($_POST['photo_data'] ?? ''));
$photoName = trim((string)($_POST['photo_name'] ?? ''));

if ($photoData !== '') {
    if (!preg_match('#^data:(image/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$#', $photoData, $matches)) {
        wishes_json(['ok' => false, 'error' => 'Поддерживаются только изображения JPG, PNG или WebP.'], 422);
    }

    $mime = $matches[1];
    $binary = base64_decode($matches[2], true);

    if ($binary === false || $binary === '') {
        wishes_json(['ok' => false, 'error' => 'Не удалось прочитать фотографию. Попробуй выбрать файл заново.'], 422);
    }

    if (strlen($binary) > $effectiveUploadLimit) {
        wishes_json(['ok' => false, 'error' => 'Фотография должна быть не больше ' . wishes_human_size($effectiveUploadLimit) . '.'], 422);
    }

    $imageInfo = @getimagesizefromstring($binary);

    if (!is_array($imageInfo)) {
        wishes_json(['ok' => false, 'error' => 'Поддерживаются только изображения JPG, PNG или WebP.'], 422);
    }

    $allowedMimes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    $extension = $allowedMimes[$mime] ?? null;

    if ($extension === null) {
        wishes_json(['ok' => false, 'error' => 'Поддерживаются только изображения JPG, PNG или WebP.'], 422);
    }

    $uploadDir = wishes_ensure_upload_dir();
    $filename = date('Ymd-His') . '-' . bin2hex(random_bytes(6)) . '.' . $extension;
    $targetPath = $uploadDir . '/' . $filename;

    if (file_put_contents($targetPath, $binary) === false) {
        wishes_json(['ok' => false, 'error' => 'Не удалось сохранить фотографию на сервере.'], 500);
    }

    $imagePath = wishes_upload_web_path($filename);
    $imageMime = $mime;
    $imageWidth = isset($imageInfo[0]) ? (int)$imageInfo[0] : null;
    $imageHeight = isset($imageInfo[1]) ? (int)$imageInfo[1] : null;
} elseif (isset($_FILES['photo']) && (int)($_FILES['photo']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    $fileError = (int)($_FILES['photo']['error'] ?? UPLOAD_ERR_NO_FILE);

    if ($fileError !== UPLOAD_ERR_OK) {
        $uploadError = match ($fileError) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Фотография слишком большая для сервера. Попробуй файл до ' . wishes_human_size($effectiveUploadLimit) . '.',
            UPLOAD_ERR_PARTIAL => 'Фотография загрузилась не полностью. Попробуй еще раз.',
            UPLOAD_ERR_NO_TMP_DIR => 'На сервере не настроена временная папка для загрузки файлов.',
            UPLOAD_ERR_CANT_WRITE => 'Сервер не смог сохранить фотографию. Проверь права на папку uploads.',
            UPLOAD_ERR_EXTENSION => 'PHP-расширение остановило загрузку фотографии.',
            default => 'Не удалось загрузить фотографию. Попробуй еще раз.',
        };

        wishes_json(['ok' => false, 'error' => $uploadError], 422);
    }

    $tmpPath = (string)($_FILES['photo']['tmp_name'] ?? '');
    $fileSize = (int)($_FILES['photo']['size'] ?? 0);

    if ($tmpPath === '' || !is_uploaded_file($tmpPath)) {
        wishes_json(['ok' => false, 'error' => 'Файл фотографии не распознан.'], 422);
    }

    if ($fileSize <= 0 || $fileSize > $effectiveUploadLimit) {
        wishes_json(['ok' => false, 'error' => 'Фотография должна быть не больше ' . wishes_human_size($effectiveUploadLimit) . '.'], 422);
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

$stmt = $pdo->prepare('INSERT INTO wishes (author, city, message, status, image_path, image_mime, image_width, image_height, clean_years, clean_months) VALUES (:author, :city, :message, :status, :image_path, :image_mime, :image_width, :image_height, :clean_years, :clean_months)');
$stmt->execute([
    ':author' => $author,
    ':city' => $city,
    ':message' => $message,
    ':status' => 'pending',
    ':image_path' => $imagePath,
    ':image_mime' => $imageMime,
    ':image_width' => $imageWidth,
    ':image_height' => $imageHeight,
    ':clean_years' => $cleanYears,
    ':clean_months' => $cleanMonths,
]);

wishes_json([
    'ok' => true,
    'message' => 'Пожелание отправлено. После проверки оно появится на экране.',
]);
