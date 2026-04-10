<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

try {
    $config = wishes_load_config();
    $pollSeconds = (int)($config['public']['poll_seconds'] ?? 6);
} catch (Throwable $e) {
    $pollSeconds = 6;
}
?>
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>NA8 Wishes Live</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        overflow: hidden;
        font-family: Arial Narrow, Arial, sans-serif;
        background:
          radial-gradient(circle at top, rgba(13,87,187,.22), transparent 40%),
          linear-gradient(180deg, #041126 0%, #020814 100%);
        color: #f8fbff;
      }
      .shell {
        display: grid;
        align-content: center;
        min-height: 100vh;
        padding: 32px;
      }
      .ticker {
        overflow: hidden;
        border-top: 1px solid rgba(255,255,255,.12);
        border-bottom: 1px solid rgba(255,255,255,.12);
        background: rgba(2,8,20,.72);
        box-shadow: 0 24px 60px rgba(0,0,0,.35);
      }
      .track {
        display: inline-flex;
        align-items: center;
        gap: 48px;
        padding: 28px 0;
        white-space: nowrap;
        will-change: transform;
        animation: ticker 45s linear infinite;
      }
      .item {
        display: inline-flex;
        align-items: baseline;
        gap: 18px;
        font-size: 44px;
        line-height: 1.15;
      }
      .item strong {
        color: #7bb1ff;
        text-transform: uppercase;
        letter-spacing: .06em;
        font-size: 24px;
      }
      .empty {
        text-align: center;
        font-size: 34px;
        color: rgba(248,251,255,.74);
      }
      @keyframes ticker {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }
    </style>
  </head>
  <body>
    <main class="shell">
      <div class="ticker" id="ticker">
        <div class="track" id="track">
          <div class="empty">Пожелания появятся здесь после модерации.</div>
        </div>
      </div>
    </main>
    <script>
      const pollMs = <?= max(3, $pollSeconds) ?> * 1000;
      const track = document.getElementById("track");

      function renderItems(items) {
        if (!items.length) {
          track.innerHTML = '<div class="empty">Пожелания появятся здесь после модерации.</div>';
          return;
        }

        const markup = items.map((item) => {
          const author = item.author ? `<strong>${item.author}</strong>` : "";
          return `<div class="item">${author}<span>${item.message}</span></div>`;
        }).join("");

        track.innerHTML = markup + markup;
      }

      async function loadFeed() {
        try {
          const response = await fetch(`/wishes/feed.php?ts=${Date.now()}`, { cache: "no-store" });
          const payload = await response.json();
          if (payload.ok) {
            renderItems(payload.items || []);
          }
        } catch (error) {}
      }

      loadFeed();
      window.setInterval(loadFeed, pollMs);
    </script>
  </body>
</html>
