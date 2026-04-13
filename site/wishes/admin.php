<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

try {
    $config = wishes_load_config();
    $pdo = wishes_pdo($config);
    wishes_ensure_schema($pdo);
} catch (Throwable $e) {
    wishes_html_error($e->getMessage(), 503);
}

if (($_GET['logout'] ?? '') === '1') {
    wishes_logout_admin();
    header('Location: /wishes/admin.php');
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    if (isset($_POST['login'])) {
        $username = (string)($_POST['username'] ?? '');
        $password = (string)($_POST['password'] ?? '');

        if ($username === (string)$config['admin']['username'] && $password === (string)$config['admin']['password']) {
            wishes_login_admin($config);
            header('Location: /wishes/admin.php');
            exit;
        }

        $loginError = 'Неверный логин или пароль.';
    } elseif (wishes_is_admin($config) && isset($_POST['wish_id'], $_POST['action'])) {
        if (!wishes_verify_admin_csrf($config, (string)($_POST['csrf'] ?? ''))) {
            http_response_code(403);
            exit('Invalid CSRF token');
        }

        $wishId = (int)$_POST['wish_id'];
        $action = (string)$_POST['action'];

        if ($wishId > 0 && in_array($action, ['approve', 'reject', 'pending', 'delete', 'save'], true)) {
            if ($action === 'delete') {
                $stmt = $pdo->prepare('DELETE FROM wishes WHERE id = :id');
                $stmt->execute([':id' => $wishId]);
                header('Location: /wishes/admin.php');
                exit;
            }

            if ($action === 'save') {
                $author = wishes_normalize_text((string)($_POST['author'] ?? ''));
                $city = wishes_normalize_text((string)($_POST['city'] ?? ''));
                $message = trim((string)($_POST['message'] ?? ''));
                $cleanYears = max(0, min(99, (int)($_POST['clean_years'] ?? 0)));
                $cleanMonths = max(0, min(11, (int)($_POST['clean_months'] ?? 0)));
                $cleanDays = max(0, min(31, (int)($_POST['clean_days'] ?? 0)));

                if ($message !== '') {
                    $stmt = $pdo->prepare('UPDATE wishes SET author = :author, city = :city, message = :message, clean_years = :clean_years, clean_months = :clean_months, clean_days = :clean_days WHERE id = :id');
                    $stmt->execute([
                        ':author' => mb_substr($author, 0, 40),
                        ':city' => mb_substr($city, 0, 60),
                        ':message' => mb_substr($message, 0, 220),
                        ':clean_years' => $cleanYears,
                        ':clean_months' => $cleanMonths,
                        ':clean_days' => $cleanDays,
                        ':id' => $wishId,
                    ]);
                }

                header('Location: /wishes/admin.php');
                exit;
            }

            $status = $action === 'approve' ? 'approved' : ($action === 'reject' ? 'rejected' : 'pending');
            $approvedAt = $status === 'approved' ? date('Y-m-d H:i:s') : null;

            $stmt = $pdo->prepare('UPDATE wishes SET status = :status, approved_at = :approved_at WHERE id = :id');
            $stmt->execute([
                ':status' => $status,
                ':approved_at' => $approvedAt,
                ':id' => $wishId,
            ]);
        }

        header('Location: /wishes/admin.php');
        exit;
    }
}

if (!wishes_is_admin($config)) {
    ?>
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Wishes Admin | NA8 Warszawa</title>
    <style>
      body{margin:0;padding:32px;font-family:Arial,sans-serif;background:#f5f2ea;color:#171717}
      main{max-width:520px;margin:0 auto;padding:24px;border:1px solid rgba(23,23,23,.12);border-radius:24px;background:#fff}
      h1{margin:0 0 16px;font-size:32px}
      p{margin:0 0 18px;color:#555;line-height:1.6}
      label{display:grid;gap:8px;margin:0 0 14px;font-weight:700}
      input{min-height:48px;padding:0 14px;border:1px solid rgba(23,23,23,.16);border-radius:14px;font-size:16px}
      button{min-height:48px;padding:0 18px;border:0;border-radius:999px;background:#171717;color:#fff;font-weight:700;text-transform:uppercase;letter-spacing:.08em;cursor:pointer}
      .error{margin:0 0 16px;color:#b42318;font-weight:700}
    </style>
  </head>
  <body>
    <main>
      <h1>Wishes Admin</h1>
      <p>Вход для модерации пожеланий перед выводом на экран.</p>
      <?php if (!empty($loginError)): ?><p class="error"><?= htmlspecialchars($loginError, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></p><?php endif; ?>
      <form method="post">
        <input type="hidden" name="login" value="1">
        <label>Логин <input name="username" type="text" autocomplete="username" required></label>
        <label>Пароль <input name="password" type="password" autocomplete="current-password" required></label>
        <button type="submit">Войти</button>
      </form>
    </main>
  </body>
</html>
    <?php
    exit;
}

$csrf = wishes_admin_csrf_token($config);
$pending = $pdo->query("SELECT id, author, city, message, clean_years, clean_months, clean_days, status, image_path, image_width, image_height, created_at, approved_at FROM wishes ORDER BY FIELD(status,'pending','approved','rejected'), created_at DESC LIMIT 200")->fetchAll();
?>
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Wishes Admin | NA8 Warszawa</title>
    <style>
      body{margin:0;padding:24px;font-family:Arial,sans-serif;background:#f5f2ea;color:#171717}
      header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;max-width:1100px;margin:0 auto 18px}
      h1{margin:0 0 8px;font-size:34px}
      p{margin:0;color:#555;line-height:1.6}
      a.button,button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border-radius:999px;border:0;background:#171717;color:#fff;text-decoration:none;font-weight:700;cursor:pointer}
      .ghost{background:#fff;color:#171717;border:1px solid rgba(23,23,23,.12)}
      .grid{display:grid;gap:12px;max-width:1100px;margin:0 auto}
      .card{padding:18px;border:1px solid rgba(23,23,23,.12);border-radius:22px;background:#fff}
      .media{margin:0 0 14px}
      .media img{display:block;width:min(100%,320px);aspect-ratio:4/3;object-fit:cover;border-radius:18px;border:1px solid rgba(23,23,23,.08)}
      .meta{display:flex;flex-wrap:wrap;gap:8px 14px;margin-bottom:10px;color:#666;font-size:14px}
      .status{font-weight:700;text-transform:uppercase;letter-spacing:.08em}
      .message{font-size:20px;line-height:1.45;margin:0 0 14px}
      .author{margin:0 0 14px;color:#444}
      .actions{display:flex;flex-wrap:wrap;gap:8px}
      form{margin:0}
      .editor{display:grid;gap:10px;margin:0 0 16px}
      .editor-grid{display:grid;grid-template-columns:1fr 1fr 100px 100px 100px;gap:10px}
      .editor input,.editor textarea{width:100%;border:1px solid rgba(23,23,23,.12);border-radius:14px;padding:10px 12px;font:inherit}
      .editor textarea{min-height:84px;resize:vertical}
      @media (max-width: 900px){.editor-grid{grid-template-columns:1fr 1fr}.editor{gap:8px}}
    </style>
  </head>
  <body>
    <header>
      <div>
        <h1>Wishes Admin</h1>
        <p>Одобряй пожелания перед выводом на экран. Live-страница: <code>/wishes/live.php</code></p>
      </div>
      <div class="actions">
        <a class="button ghost" href="/wishes/live.php" target="_blank" rel="noreferrer noopener">Открыть live</a>
        <a class="button ghost" href="/wishes/admin.php?logout=1">Выйти</a>
      </div>
    </header>
    <section class="grid">
      <?php foreach ($pending as $wish): ?>
        <article class="card">
          <div class="meta">
            <span>#<?= (int)$wish['id'] ?></span>
            <span class="status"><?= htmlspecialchars((string)$wish['status'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></span>
            <span><?= htmlspecialchars((string)$wish['created_at'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></span>
          </div>
          <?php if (!empty($wish['image_path'])): ?>
            <figure class="media">
              <img src="<?= htmlspecialchars((string)$wish['image_path'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" alt="Фото к пожеланию #<?= (int)$wish['id'] ?>">
            </figure>
          <?php endif; ?>
          <form class="editor" method="post">
            <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>">
            <input type="hidden" name="wish_id" value="<?= (int)$wish['id'] ?>">
            <input type="hidden" name="action" value="save">
            <div class="editor-grid">
              <input name="author" type="text" maxlength="40" value="<?= htmlspecialchars((string)$wish['author'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" placeholder="Подпись">
              <input name="city" type="text" maxlength="60" value="<?= htmlspecialchars((string)$wish['city'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" placeholder="Город">
              <input name="clean_years" type="number" min="0" max="99" value="<?= (int)($wish['clean_years'] ?? 0) ?>" placeholder="Лет">
              <input name="clean_months" type="number" min="0" max="11" value="<?= (int)($wish['clean_months'] ?? 0) ?>" placeholder="Мес.">
              <input name="clean_days" type="number" min="0" max="31" value="<?= (int)($wish['clean_days'] ?? 0) ?>" placeholder="Дней">
            </div>
            <textarea name="message" maxlength="220" placeholder="Текст пожелания"><?= htmlspecialchars((string)$wish['message'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></textarea>
            <div class="actions">
              <button class="ghost" type="submit">Сохранить правки</button>
            </div>
          </form>
          <p class="author"><?= htmlspecialchars(trim(implode(' • ', array_filter([(string)($wish['author'] ?: 'Без подписи'), (string)($wish['city'] ?? ''), wishes_clean_duration_label((int)($wish['clean_years'] ?? 0), (int)($wish['clean_months'] ?? 0), (int)($wish['clean_days'] ?? 0), 'ru')]))), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></p>
          <div class="actions">
            <form method="post"><input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"><input type="hidden" name="wish_id" value="<?= (int)$wish['id'] ?>"><input type="hidden" name="action" value="approve"><button type="submit">Одобрить</button></form>
            <form method="post"><input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"><input type="hidden" name="wish_id" value="<?= (int)$wish['id'] ?>"><input type="hidden" name="action" value="reject"><button class="ghost" type="submit">Скрыть</button></form>
            <form method="post"><input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"><input type="hidden" name="wish_id" value="<?= (int)$wish['id'] ?>"><input type="hidden" name="action" value="pending"><button class="ghost" type="submit">В очередь</button></form>
            <form method="post" onsubmit="return window.confirm('Удалить пожелание совсем?');"><input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>"><input type="hidden" name="wish_id" value="<?= (int)$wish['id'] ?>"><input type="hidden" name="action" value="delete"><button class="ghost" type="submit">Удалить</button></form>
          </div>
        </article>
      <?php endforeach; ?>
    </section>
  </body>
</html>
