<?php

declare(strict_types=1);

$documentRoot = (string)($_SERVER['DOCUMENT_ROOT'] ?? '');
$dir = __DIR__;
$tmpDir = __DIR__ . '/tmp';
$uploadTmp = (string)ini_get('upload_tmp_dir');
$sysTmp = (string)sys_get_temp_dir();
$uploadMax = (string)ini_get('upload_max_filesize');
$postMax = (string)ini_get('post_max_size');
$maxUploads = (string)ini_get('max_file_uploads');

header('Content-Type: text/plain; charset=utf-8');

echo "Wishes debug\n";
echo "===========\n\n";
echo "DOCUMENT_ROOT: {$documentRoot}\n";
echo "__DIR__: {$dir}\n";
echo "tmp dir: {$tmpDir}\n";
echo "tmp exists: " . (is_dir($tmpDir) ? 'yes' : 'no') . "\n";
echo "tmp writable: " . (is_writable($tmpDir) ? 'yes' : 'no') . "\n";
echo "upload_tmp_dir: " . ($uploadTmp !== '' ? $uploadTmp : '[empty]') . "\n";
echo "sys_get_temp_dir: {$sysTmp}\n";
echo "upload_max_filesize: {$uploadMax}\n";
echo "post_max_size: {$postMax}\n";
echo "max_file_uploads: {$maxUploads}\n\n";
echo "Suggested .user.ini line:\n";
echo 'upload_tmp_dir=' . $tmpDir . "\n";
