<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

try {
    $config = wishes_load_config();
    $pollSeconds = (int)($config['public']['poll_seconds'] ?? 6);
} catch (Throwable $e) {
    $pollSeconds = 6;
}
$mode = (string)($_GET['mode'] ?? 'mixed');
if (!in_array($mode, ['mixed', 'cards', 'ticker'], true)) {
    $mode = 'mixed';
}
$cleanUi = (($_GET['clean'] ?? '') === '1');
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
        min-height: 100vh;
        padding: 32px;
        gap: 24px;
      }
      .switcher {
        position: fixed;
        top: 24px;
        right: 24px;
        display: inline-flex;
        gap: 8px;
        padding: 8px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 999px;
        background: rgba(2,8,20,.44);
        backdrop-filter: blur(12px);
      }
      .switcher a {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
        padding: 0 16px;
        border-radius: 999px;
        color: #f8fbff;
        text-decoration: none;
        text-transform: uppercase;
        letter-spacing: .08em;
        font-size: 12px;
        font-weight: 700;
      }
      .switcher a.is-active {
        background: #f8fbff;
        color: #041126;
      }
      .cards {
        display: grid;
        place-items: center;
        min-height: calc(100vh - 64px);
      }
      .mixed {
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        min-height: calc(100vh - 64px);
      }
      .stage {
        position: relative;
        width: min(100%, 1440px);
        aspect-ratio: 16 / 9;
        border-radius: 36px;
        overflow: hidden;
        background:
          radial-gradient(circle at 20% 15%, rgba(13,87,187,.22), transparent 38%),
          linear-gradient(180deg, rgba(255,255,255,.05), transparent 46%),
          #041126;
        box-shadow: 0 24px 80px rgba(0,0,0,.45);
      }
      .card-media,
      .card-overlay,
      .card-content {
        position: absolute;
        inset: 0;
      }
      .card-media {
        background-position: center;
        background-size: cover;
        filter: saturate(1.02) contrast(1.04);
        transform: scale(1.02);
      }
      .card-overlay {
        background:
          linear-gradient(180deg, rgba(4,17,38,.16), rgba(4,17,38,.34)),
          linear-gradient(90deg, rgba(4,17,38,.86), rgba(4,17,38,.54) 44%, rgba(4,17,38,.66) 100%);
      }
      .card-content {
        display: grid;
        align-content: end;
        gap: 18px;
        padding: clamp(28px, 4vw, 56px);
      }
      .card-kicker {
        color: #78a9ff;
        text-transform: uppercase;
        letter-spacing: .08em;
        font-size: clamp(12px, 1vw, 16px);
        font-weight: 700;
      }
      .card-message {
        max-width: 62%;
        margin: 0;
        font-size: clamp(34px, 3.1vw, 56px);
        line-height: 1.06;
        font-weight: 700;
        text-wrap: balance;
      }
      .card-author {
        color: rgba(248,251,255,.84);
        font-size: clamp(18px, 1.4vw, 24px);
        letter-spacing: .05em;
        text-transform: uppercase;
      }
      .card-total {
        position: absolute;
        top: clamp(28px, 4vw, 40px);
        right: clamp(28px, 4vw, 40px);
        z-index: 2;
        display: inline-flex;
        flex-direction: column;
        gap: 6px;
        padding: 14px 18px;
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 20px;
        background: rgba(4,17,38,.52);
        backdrop-filter: blur(10px);
        text-align: right;
      }
      .card-total span {
        color: #78a9ff;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .card-total strong {
        font-size: clamp(22px, 1.8vw, 30px);
        line-height: 1;
      }
      .card-empty {
        display: grid;
        place-items: center;
        height: 100%;
        padding: 48px;
        text-align: center;
        color: rgba(248,251,255,.8);
        font-size: clamp(32px, 3vw, 52px);
        line-height: 1.1;
      }
      .card-media:not([hidden]) + .card-overlay + .card-content .card-message {
        max-width: 54%;
      }
      .card-frame {
        position: absolute;
        right: clamp(28px, 4vw, 56px);
        top: 50%;
        width: min(36%, 420px);
        aspect-ratio: 4 / 5;
        transform: translateY(-50%);
        border-radius: 28px;
        border: 1px solid rgba(255,255,255,.18);
        background: rgba(255,255,255,.06);
        box-shadow: 0 24px 60px rgba(0,0,0,.35);
        overflow: hidden;
        backdrop-filter: blur(10px);
      }
      .card-frame img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .ticker {
        align-self: end;
        overflow: hidden;
        border-top: 1px solid rgba(255,255,255,.14);
        border-bottom: 1px solid rgba(255,255,255,.14);
        background: linear-gradient(180deg, rgba(4,17,38,.9), rgba(2,8,20,.94));
        box-shadow: 0 24px 60px rgba(0,0,0,.35);
        border-radius: 26px;
      }
      .track {
        display: inline-flex;
        align-items: center;
        gap: 48px;
        padding: 24px 0;
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
      .item em {
        color: rgba(248,251,255,.52);
        font-style: normal;
        font-size: 22px;
        text-transform: uppercase;
        letter-spacing: .06em;
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
      @media (max-width: 900px) {
        .shell { padding: 20px; }
        .switcher { top: 16px; right: 16px; left: 16px; justify-content: center; }
        .stage { aspect-ratio: auto; min-height: calc(100vh - 40px); border-radius: 28px; }
        .card-content { align-content: end; }
        .card-message { max-width: none; font-size: clamp(28px, 8vw, 42px); }
        .card-frame { position: static; width: 100%; max-width: none; transform: none; aspect-ratio: 4 / 3; margin-top: 12px; }
        .card-media:not([hidden]) + .card-overlay + .card-content .card-message { max-width: none; }
        .card-total { position: static; margin: 16px; text-align: left; }
      }
    </style>
  </head>
  <body>
    <?php if (!$cleanUi): ?>
      <nav class="switcher" aria-label="Режим live-экрана">
        <a class="<?= $mode === 'mixed' ? 'is-active' : '' ?>" href="/wishes/live.php?mode=mixed">Комбо</a>
        <a class="<?= $mode === 'cards' ? 'is-active' : '' ?>" href="/wishes/live.php?mode=cards">Карточки</a>
        <a class="<?= $mode === 'ticker' ? 'is-active' : '' ?>" href="/wishes/live.php?mode=ticker">Строка</a>
      </nav>
    <?php endif; ?>
    <main class="shell">
      <div class="<?= $mode === 'ticker' ? 'ticker' : ($mode === 'cards' ? 'cards' : 'mixed') ?>" id="display">
        <?php if ($mode !== 'ticker'): ?>
          <div class="stage" id="stage">
            <div class="card-empty" id="card-empty">Пожелания появятся здесь после модерации.</div>
            <div class="card-media" id="card-media" hidden></div>
            <div class="card-overlay" id="card-overlay" hidden></div>
            <div class="card-total" id="card-total">
              <span>Общий срок ЧВ</span>
              <strong id="card-total-value">0</strong>
            </div>
            <div class="card-content" id="card-content" hidden>
              <div class="card-kicker">Пожелания на экран</div>
              <p class="card-message" id="card-message"></p>
              <div class="card-author" id="card-author"></div>
              <div class="card-frame" id="card-frame" hidden>
                <img id="card-image" alt="Фото к пожеланию">
              </div>
            </div>
          </div>
        <?php endif; ?>
        <?php if ($mode !== 'cards'): ?>
          <div class="ticker">
            <div class="track" id="track">
              <div class="empty">Пожелания появятся здесь после модерации.</div>
            </div>
          </div>
        <?php endif; ?>
      </div>
    </main>
    <script>
      const mode = <?= json_encode($mode) ?>;
      const pollMs = <?= max(3, $pollSeconds) ?> * 1000;
      const tickerTrack = document.getElementById("track");
      const cardEmpty = document.getElementById("card-empty");
      const cardMedia = document.getElementById("card-media");
      const cardOverlay = document.getElementById("card-overlay");
      const cardContent = document.getElementById("card-content");
      const cardMessage = document.getElementById("card-message");
      const cardAuthor = document.getElementById("card-author");
      const cardFrame = document.getElementById("card-frame");
      const cardImage = document.getElementById("card-image");
      const cardTotalValue = document.getElementById("card-total-value");
      let cardItems = [];
      let cardIndex = 0;
      let cardTimer = null;
      let currentSignature = "";

      function renderTicker(items) {
        if (!tickerTrack) {
          return;
        }

        if (!items.length) {
          tickerTrack.innerHTML = '<div class="empty">Пожелания появятся здесь после модерации.</div>';
          return;
        }

        const markup = items.map((item) => {
          const authorParts = [item.author, item.city, item.cleanLabel].filter(Boolean);
          const author = authorParts.length ? `<strong>${authorParts.join(" • ")}</strong>` : "";
          return `<div class="item">${author}<span>${item.message}</span></div>`;
        }).join("");

        tickerTrack.innerHTML = markup + markup;
      }

      function applyCard(item) {
        if (!cardMedia || !cardOverlay || !cardContent || !cardMessage || !cardAuthor || !cardEmpty) {
          return;
        }

        if (!item) {
          cardEmpty.hidden = false;
          cardMedia.hidden = true;
          cardOverlay.hidden = true;
          cardContent.hidden = true;
          return;
        }

        cardEmpty.hidden = true;
        cardMedia.hidden = false;
        cardOverlay.hidden = false;
        cardContent.hidden = false;
        const hasImage = Boolean(item.imagePath);
        cardMedia.style.backgroundImage = hasImage ? `url("${item.imagePath}")` : "none";
        cardMedia.style.backgroundColor = hasImage ? "" : "#041126";
        if (cardFrame && cardImage) {
          cardFrame.hidden = !hasImage;
          if (hasImage) {
            cardImage.src = item.imagePath;
          } else {
            cardImage.removeAttribute("src");
          }
        }
        cardMessage.textContent = item.message || "";
        cardAuthor.textContent = [item.author || "Без подписи", item.city || "", item.cleanLabel || ""].filter(Boolean).join(" • ");
      }

      function buildSignature(items) {
        return items.map((item) => `${item.id}:${item.approvedAt || ""}`).join("|");
      }

      function scheduleCards(items) {
        const nextSignature = buildSignature(items);
        const shouldReset = nextSignature !== currentSignature;
        const lengthChanged = items.length !== cardItems.length;
        currentSignature = nextSignature;
        cardItems = items;

        if (!items.length) {
          if (cardTimer) {
            window.clearInterval(cardTimer);
            cardTimer = null;
          }
          cardIndex = 0;
          applyCard(null);
          return;
        }

        if (shouldReset) {
          cardIndex = 0;
        } else if (cardIndex >= items.length) {
          cardIndex = 0;
        }

        applyCard(items[cardIndex]);

        if (items.length === 1) {
          if (cardTimer) {
            window.clearInterval(cardTimer);
            cardTimer = null;
          }
          return;
        }

        if (shouldReset || lengthChanged || !cardTimer) {
          if (cardTimer) {
            window.clearInterval(cardTimer);
          }

          cardTimer = window.setInterval(() => {
            if (!cardItems.length) {
              return;
            }

            cardIndex = (cardIndex + 1) % cardItems.length;
            applyCard(cardItems[cardIndex]);
          }, 10000);
        }
      }

      async function loadFeed() {
        try {
          const response = await fetch(`/wishes/feed.php?ts=${Date.now()}`, { cache: "no-store" });
          const payload = await response.json();
          if (!payload.ok) {
            return;
          }

          const items = payload.items || [];
          if (cardTotalValue && payload.totals?.cleanLabel) {
            cardTotalValue.textContent = payload.totals.cleanLabel;
          }
          if (mode === "ticker" || mode === "mixed") {
            renderTicker(items);
          }
          if (mode === "cards" || mode === "mixed") {
            scheduleCards(items);
          }
        } catch (error) {}
      }

      loadFeed();
      window.setInterval(loadFeed, pollMs);
    </script>
  </body>
</html>
