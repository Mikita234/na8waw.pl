import { mkdir, writeFile } from "node:fs/promises";
import { predictionsByLocale } from "../site/scripts/predictions-data.js";

const locales = {
  uk: {
    dir: new URL("../site/oracle/uk/", import.meta.url),
    lang: "uk",
    locale: "uk_UA",
    alternateLocale: "ru_RU",
    alternateHref: "https://na8waw.pl/oracle/ru/",
    pageLabel: "Передбачення від Вищої Сили",
    descriptionPrefix: "Передбачення від Вищої Сили для гостей NA8 Warszawa.",
    eventTail: "Ювілей групи «МАЇВКА» відбудеться 9–10 травня у Варшаві.",
    heroText: "Передбачення від Вищої Сили та вся інформація про ювілейну зустріч у Варшаві 9–10 травня.",
    buttonText: "Перейти до передбачення і програми",
    eventUrl: (index) => `/uk.html?oracle=${index}#oracle`,
  },
  ru: {
    dir: new URL("../site/oracle/ru/", import.meta.url),
    lang: "ru",
    locale: "ru_RU",
    alternateLocale: "uk_UA",
    alternateHref: "https://na8waw.pl/oracle/uk/",
    pageLabel: "Предсказание от Высшей силы",
    descriptionPrefix: "Предсказание от Высшей силы для гостей NA8 Warszawa.",
    eventTail: "Юбилей группы «МАЕВКА» пройдет 9–10 мая в Варшаве.",
    heroText: "Предсказание от Высшей силы и вся информация о юбилейной встрече в Варшаве 9–10 мая.",
    buttonText: "Перейти к предсказанию и программе",
    eventUrl: (index) => `/ru.html?oracle=${index}#oracle`,
  },
};

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPage(localeKey, item, index) {
  const config = locales[localeKey];
  const title = `${item.title} | ${config.pageLabel} | NA8 Warszawa`;
  const description = `${config.descriptionPrefix} ${item.text} ${config.eventTail}`;
  const canonical = `https://na8waw.pl/oracle/${localeKey}/${index}.html`;
  const alternate = `https://na8waw.pl/oracle/${localeKey === "uk" ? "ru" : "uk"}/${index}.html`;

  return `<!doctype html>
<html lang="${config.lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta
      name="description"
      content="${escapeHtml(description)}"
    />
    <link rel="canonical" href="${canonical}" />
    <link rel="alternate" hreflang="${config.lang}" href="${canonical}" />
    <link rel="alternate" hreflang="${localeKey === "uk" ? "ru" : "uk"}" href="${alternate}" />
    <meta property="og:site_name" content="NA8 Warszawa" />
    <meta property="og:locale" content="${config.locale}" />
    <meta property="og:locale:alternate" content="${config.alternateLocale}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta
      property="og:description"
      content="${escapeHtml(description)}"
    />
    <meta property="og:image" content="https://na8waw.pl/media/na8.png" />
    <meta property="og:image:alt" content="NA8 Warszawa" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta
      name="twitter:description"
      content="${escapeHtml(description)}"
    />
    <meta name="twitter:image" content="https://na8waw.pl/media/na8.png" />
    <style>
      :root {
        --bg: #f7f3eb;
        --panel: rgba(255, 255, 255, 0.92);
        --ink: #171717;
        --muted: #5e5e5e;
        --line: rgba(23, 23, 23, 0.12);
        --blue: #0d57bb;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        color: var(--ink);
        font-family: "Arial Narrow", Arial, sans-serif;
        background: linear-gradient(180deg, #fcfbf8 0%, var(--bg) 100%);
        padding: 20px;
      }

      main {
        width: min(100%, 760px);
        margin: 0 auto;
        border: 1px solid var(--line);
        border-radius: 32px;
        background: var(--panel);
        box-shadow: 0 24px 60px rgba(23, 23, 23, 0.08);
        overflow: hidden;
      }

      header,
      section {
        padding: 24px;
      }

      header {
        border-bottom: 1px solid var(--line);
      }

      .eyebrow {
        margin-bottom: 10px;
        color: var(--blue);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.76rem;
        font-weight: 700;
      }

      h1, h2 {
        margin: 0 0 12px;
        text-transform: uppercase;
      }

      h1 {
        font-size: clamp(2rem, 5vw, 3.2rem);
        line-height: 0.95;
      }

      h2 {
        font-size: clamp(1.4rem, 4vw, 2.4rem);
        line-height: 1;
      }

      p {
        margin: 0;
        color: var(--muted);
        line-height: 1.7;
      }

      .oracle {
        display: grid;
        gap: 16px;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-top: 22px;
        padding: 14px 22px;
        border-radius: 999px;
        background: #171717;
        color: #fff;
        text-decoration: none;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.82rem;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div class="eyebrow">${config.pageLabel}</div>
        <h1>${config.pageLabel}</h1>
        <p>${config.heroText}</p>
      </header>

      <section class="oracle">
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.text)}</p>
        <a class="button" href="${config.eventUrl(index)}">${config.buttonText}</a>
      </section>
    </main>
  </body>
</html>
`;
}

for (const [localeKey, items] of Object.entries(predictionsByLocale)) {
  const config = locales[localeKey];
  await mkdir(config.dir, { recursive: true });

  let index = 1;
  for (const item of items) {
    const output = new URL(`${index}.html`, config.dir);
    await writeFile(output, renderPage(localeKey, item, index), "utf8");
    index += 1;
  }
}

console.log("Generated oracle share pages");
