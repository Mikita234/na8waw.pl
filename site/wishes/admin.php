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
        $wishId = (int)$_POST['wish_id'];
        $action = (string)$_POST['action'];

        if ($wishId > 0 && in_array($action, ['approve', 'reject', 'pending'], true)) {
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

$pending = $pdo->query("SELECT id, author, message, status, image_path, image_width, image_height, created_at, approved_at FROM wishes ORDER BY FIELD(status,'pending','approved','rejected'), created_at DESC LIMIT 200")->fetchAll();
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
          <p class="message"><?= nl2br(htmlspecialchars((string)$wish['message'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')) ?></p>
          <p class="author"><?= htmlspecialchars((string)($wish['author'] ?: 'Без подписи'), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></p>
          <div class="actions">
            <form method="post"><input type="hidden" name="wish_id" value="<?= (int)$wish['id'] ?>"><input type="hidden" name="action" value="approve"><button type="submit">Одобрить</button></form>
            <form method="post"><input type="hidden" name="wish_id" value="<?= (int)$wish['id'] ?>"><input type="hidden" name="action" value="reject"><button class="ghost" type="submit">Скрыть</button></form>
            <form method="post"><input type="hidden" name="wish_id" value="<?= (int)$wish['id'] ?>"><input type="hidden" name="action" value="pending"><button class="ghost" type="submit">В очередь</button></form>
          </div>
        </article>
      <?php endforeach; ?>
    </section>
  </body>
</html>
