<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Пожелания на экран | NA8 Warszawa</title>
    <meta
      name="description"
      content="Оставь короткое пожелание для юбилея группы «МАЕВКА» в Варшаве. После проверки оно появится на экране встречи."
    >
    <style>
      :root {
        --bg: #f7f3eb;
        --panel: rgba(255, 255, 255, 0.92);
        --ink: #171717;
        --muted: #5e5e5e;
        --line: rgba(23, 23, 23, 0.12);
        --blue: #0d57bb;
        --radius: 30px;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        padding: 20px;
        color: var(--ink);
        font-family: "Arial Narrow", Arial, sans-serif;
        background:
          linear-gradient(180deg, rgba(13, 87, 187, 0.08), transparent 32%),
          linear-gradient(180deg, #fcfbf8 0%, var(--bg) 100%);
      }

      main {
        width: min(100%, 760px);
        margin: 0 auto;
        padding: 24px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: var(--panel);
        box-shadow: 0 24px 60px rgba(23, 23, 23, 0.08);
      }

      .eyebrow {
        margin-bottom: 12px;
        color: var(--blue);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.76rem;
        font-weight: 700;
      }

      h1 {
        margin: 0 0 14px;
        font-size: clamp(2rem, 5vw, 3.2rem);
        line-height: 0.96;
        text-transform: uppercase;
      }

      p {
        margin: 0 0 18px;
        color: var(--muted);
        line-height: 1.65;
      }

      .wish-form {
        display: grid;
        gap: 14px;
      }

      .wish-field {
        display: grid;
        gap: 8px;
      }

      .wish-field span {
        font-size: 0.82rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .wish-field input,
      .wish-field textarea,
      .wish-field input[type="file"] {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.78);
        color: var(--ink);
        font: inherit;
      }

      .wish-field input {
        min-height: 54px;
        padding: 0 18px;
      }

      .wish-field textarea {
        min-height: 144px;
        padding: 16px 18px;
        resize: vertical;
      }

      .wish-field input[type="file"] {
        min-height: 58px;
        padding: 14px 18px;
      }

      .field-note {
        margin: -2px 0 0;
        color: var(--muted);
        font-size: 0.82rem;
        line-height: 1.5;
      }

      .wish-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 0 20px;
        border-radius: 999px;
        border: 1px solid transparent;
        background: #171717;
        color: #fff;
        text-decoration: none;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
      }

      .button-secondary {
        border-color: var(--line);
        background: rgba(255, 255, 255, 0.62);
        color: var(--ink);
      }

      .wish-status {
        min-height: 1.4em;
        margin: 0;
        color: var(--muted);
      }

      .wish-status[data-state="success"] {
        color: #0d57bb;
      }

      .wish-status[data-state="error"] {
        color: #b42318;
      }

      @media (max-width: 720px) {
        .wish-actions {
          flex-direction: column;
        }

        .wish-actions .button {
          width: 100%;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <div class="eyebrow">Пожелания на экран</div>
      <h1>Оставить пожелание к встрече</h1>
      <p>
        Оставь короткое пожелание для юбилея. После проверки оно появится на экране во время встречи.
      </p>

      <form class="wish-form" id="wish-form" enctype="multipart/form-data">
        <label class="wish-field">
          <span>Подпись, если хочешь</span>
          <input id="wish-author" name="author" type="text" maxlength="40" placeholder="Например: Ира, Варшава">
        </label>

        <label class="wish-field">
          <span>Твое пожелание</span>
          <textarea id="wish-message" name="message" maxlength="220" rows="4" placeholder="Напиши короткое пожелание для встречи" required></textarea>
        </label>

        <label class="wish-field">
          <span>Фото, если хочешь</span>
          <input id="wish-photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp">
          <p class="field-note">JPG, PNG или WebP до 5 MB. Фото тоже проходит модерацию вместе с текстом.</p>
        </label>

        <div class="wish-actions">
          <button class="button" id="wish-submit" type="submit">Отправить на экран</button>
          <a class="button button-secondary" href="/wishes/live.php" target="_blank" rel="noreferrer noopener">Открыть live-экран</a>
          <a class="button button-secondary" href="/wishes/admin.php" target="_blank" rel="noreferrer noopener">Модерация</a>
        </div>

        <p class="wish-status" id="wish-status" aria-live="polite"></p>
      </form>
    </main>

    <script type="module" src="/scripts/wishes.js?v=20260413w"></script>
  </body>
</html>
