import { writeFile } from "node:fs/promises";

const PAGE_URL = "https://na-russia.org/meditation-today";
const OUTPUT_MODULE = new URL("../site/scripts/daily-ru.js", import.meta.url);
const OUTPUT_PAGE = new URL("../site/daily/ru.html", import.meta.url);

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&laquo;/g, "«")
    .replace(/&raquo;/g, "»")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&hellip;/g, "…")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value) {
  return decodeEntities(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function escapeJs(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphize(body) {
  const sentences = body
    .split(/(?<=[.!?])\s+(?=[А-ЯЁ])/u)
    .map((part) => part.trim())
    .filter(Boolean);

  if (sentences.length <= 4) {
    return sentences;
  }

  const targetParagraphs = Math.min(4, Math.ceil(sentences.length / 2));
  const chunkSize = Math.ceil(sentences.length / targetParagraphs);
  const paragraphs = [];

  for (let index = 0; index < sentences.length; index += chunkSize) {
    paragraphs.push(sentences.slice(index, index + chunkSize).join(" "));
  }

  return paragraphs;
}

function matchOrThrow(html, pattern, label) {
  const match = html.match(pattern);
  if (!match?.[1]) {
    throw new Error(`Could not parse ${label}`);
  }
  return stripTags(match[1]);
}

function parseMeditationPage(html) {
  const title = matchOrThrow(
    html,
    /<div class="text-lg font-bold">([\s\S]*?)<\/div>\s*<div class="text-base text-secondary-blue whitespace-nowrap" data-qa="meditation-date">/,
    "title",
  );
  const date = matchOrThrow(html, /data-qa="meditation-date">([\s\S]*?)<\/div>/, "date");
  const quote = matchOrThrow(html, /<div class="text-md italic">([\s\S]*?)<\/div>/, "quote");
  const source = matchOrThrow(
    html,
    /<div class="text-md text-secondary-blue min-w-0 break-words">([\s\S]*?)<\/div>/,
    "source",
  );

  const bodyMatch = html.match(/<div class="mt-8 text-md">([\s\S]*?)<\/div><\/div><\/div><div class="mt-4 flex justify-end">/);
  if (!bodyMatch?.[1]) {
    throw new Error("Could not parse body");
  }

  const [bodyHtml, focusHtml = ""] = bodyMatch[1].split(/<br><br><b>ТОЛЬКО СЕГОДНЯ:<\/b>\s*/);
  const body = stripTags(bodyHtml);
  const focusText = stripTags(focusHtml);
  const paragraphs = paragraphize(body);

  if (!paragraphs.length || !focusText) {
    throw new Error("Parsed empty body or focus text");
  }

  return {
    title: `${date} • «${title}»`,
    quote,
    source,
    paragraphs,
    focusLabel: "Только сегодня:",
    focusText,
    previewLead: paragraphs.slice(0, 2),
  };
}

function renderRuModule(data) {
  const paragraphs = data.paragraphs.map((paragraph) => `    "${escapeJs(paragraph)}",`).join("\n");

  return `export const dailyMeditationRu = {
  title: "${escapeJs(data.title)}",
  quote:
    "${escapeJs(data.quote)}",
  source: "${escapeJs(data.source)}",
  paragraphs: [
${paragraphs}
  ],
  focusLabel: "${escapeJs(data.focusLabel)}",
  focusText:
    "${escapeJs(data.focusText)}",
};
`;
}

function renderRuPage(data) {
  const description = `Ежедневник на сегодня для гостей NA8 Warszawa. ${data.title}. Юбилей группы «МАЕВКА» пройдет 9–10 мая в Варшаве.`;
  const bodyParagraphs = data.paragraphs
    .map((paragraph) => `          <p>\n            ${escapeHtml(paragraph)}\n          </p>`)
    .join("\n");

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(data.title)} | Ежедневник на сегодня | NA8 Warszawa</title>
    <meta
      name="description"
      content="${escapeHtml(description)}"
    />
    <link rel="canonical" href="https://na8waw.pl/daily/ru.html" />
    <link rel="alternate" hreflang="ru" href="https://na8waw.pl/daily/ru.html" />
    <link rel="alternate" hreflang="uk" href="https://na8waw.pl/daily/uk.html" />
    <meta property="og:site_name" content="NA8 Warszawa" />
    <meta property="og:locale" content="ru_RU" />
    <meta property="og:locale:alternate" content="uk_UA" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://na8waw.pl/daily/ru.html" />
    <meta property="og:title" content="${escapeHtml(data.title)} | Ежедневник на сегодня | NA8 Warszawa" />
    <meta
      property="og:description"
      content="${escapeHtml(description)}"
    />
    <meta property="og:image" content="https://na8waw.pl/media/na8.png" />
    <meta property="og:image:alt" content="NA8 Warszawa" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(data.title)} | Ежедневник на сегодня | NA8 Warszawa" />
    <meta
      name="twitter:description"
      content="${escapeHtml(description)}"
    />
    <meta name="twitter:image" content="https://na8waw.pl/media/na8.png" />
    <style>
      :root {
        --bg: #f7f3eb;
        --panel: rgba(255, 255, 255, 0.9);
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

      h1 {
        margin: 0 0 10px;
        font-size: clamp(2rem, 5vw, 3.3rem);
        line-height: 0.95;
        text-transform: uppercase;
      }

      p {
        margin: 0;
        color: var(--muted);
        line-height: 1.7;
      }

      blockquote {
        margin: 0 0 16px;
        font-size: clamp(1.2rem, 3.5vw, 1.9rem);
        line-height: 1.1;
        text-transform: uppercase;
      }

      .source {
        margin-bottom: 16px;
        color: var(--blue);
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.75rem;
        font-weight: 700;
      }

      .body {
        display: grid;
        gap: 14px;
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
        <div class="eyebrow">Ежедневник на сегодня</div>
        <h1>${escapeHtml(data.title)}</h1>
        <p>
          Полный сегодняшний текст дня и быстрый переход к информации о
          юбилейной встрече в Варшаве 9–10 мая.
        </p>
      </header>

      <section>
        <blockquote>
          ${escapeHtml(data.quote)}
        </blockquote>

        <div class="source">${escapeHtml(data.source)}</div>

        <div class="body">
${bodyParagraphs}
        </div>

        <div class="body">
          <p>
            <strong>${escapeHtml(data.focusLabel)}</strong> ${escapeHtml(data.focusText)}
          </p>
        </div>

        <a class="button" href="/?lang=ru">Узнать о мероприятии в Варшаве</a>
      </section>
    </main>
  </body>
</html>
`;
}

const response = await fetch(PAGE_URL, {
  headers: {
    "user-agent": "Mozilla/5.0 (compatible; NA8WAWDailyBot/1.0)",
    accept: "text/html,application/xhtml+xml",
  },
});

if (!response.ok) {
  throw new Error(`Failed to fetch ${PAGE_URL}: ${response.status}`);
}

const html = await response.text();
const data = parseMeditationPage(html);

await writeFile(OUTPUT_MODULE, renderRuModule(data), "utf8");
await writeFile(OUTPUT_PAGE, renderRuPage(data), "utf8");

console.log(`Updated Russian daily: ${data.title}`);
