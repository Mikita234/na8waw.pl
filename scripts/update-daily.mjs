import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const WARSAW_TIME_ZONE = "Europe/Warsaw";
const RU_PAGE_URL = "https://na-russia.org/meditation-today";
const UK_SOURCE_URL = new URL("../data/daily-uk-source.json", import.meta.url);
const RU_MODULE_URL = new URL("../site/scripts/daily-ru.js", import.meta.url);
const UK_MODULE_URL = new URL("../site/scripts/daily-uk.js", import.meta.url);
const DAILY_DATA_URL = new URL("../site/scripts/daily-data.js", import.meta.url);
const DAILY_SCRIPT_URL = new URL("../site/scripts/daily.js", import.meta.url);
const MAIN_SCRIPT_URL = new URL("../site/scripts/main.js", import.meta.url);
const INDEX_PAGE_URL = new URL("../site/index.html", import.meta.url);
const RU_HOME_URL = new URL("../site/ru.html", import.meta.url);
const UK_HOME_URL = new URL("../site/uk.html", import.meta.url);
const RU_DAILY_PAGE_URL = new URL("../site/daily/ru.html", import.meta.url);
const UK_DAILY_PAGE_URL = new URL("../site/daily/uk.html", import.meta.url);

const RU_MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

function getWarsawDateInfo(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: WARSAW_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const lookup = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const year = lookup.year;
  const month = lookup.month;
  const day = lookup.day;

  return {
    year,
    month,
    day,
    key: `${month}${day}`,
    assetVersion: `${year}${month}${day}d`,
    ruDate: `${Number(day)} ${RU_MONTHS[Number(month) - 1]}`,
  };
}

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

function parseRuPage(html) {
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
    throw new Error("Parsed empty Russian body or focus text");
  }

  return {
    date,
    title: `${date} • «${title}»`,
    quote,
    source,
    paragraphs,
    focusLabel: "Только сегодня:",
    focusText,
  };
}

function parseUkEntry(date, content) {
  const normalized = content.replace(/\r/g, "").trim();
  const blocks = normalized.split(/\n\s*\n/u).map((block) => block.trim()).filter(Boolean);

  if (blocks.length < 4) {
    throw new Error(`Could not parse Ukrainian daily entry for ${date}`);
  }

  const [title, metaBlock, ...restBlocks] = blocks;
  const focusBlock = restBlocks.at(-1);
  if (!focusBlock?.startsWith("Лише сьогодні:")) {
    throw new Error(`Could not parse Ukrainian focus text for ${date}`);
  }

  const focusText = focusBlock.replace(/^Лише сьогодні:\s*/u, "").replace(/\s+/g, " ").trim();
  const metaLines = metaBlock.split("\n").map((line) => line.trim()).filter(Boolean);
  const quote = metaLines[0];
  const source = metaLines.slice(1).join(" ").trim();
  const paragraphBlocks = restBlocks.slice(0, -1);
  const paragraphs = paragraphBlocks
    .flatMap((paragraph) => paragraph.split(/\n\s{2,}/u))
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (!quote || !source || !paragraphs.length) {
    throw new Error(`Could not parse Ukrainian daily content for ${date}`);
  }

  return {
    date,
    title: `${date} • «${title.trim()}»`,
    quote,
    source,
    paragraphs,
    focusLabel: "Лише сьогодні:",
    focusText,
  };
}

function renderModule(exportName, data) {
  const paragraphs = data.paragraphs.map((paragraph) => `    "${escapeJs(paragraph)}",`).join("\n");

  return `export const ${exportName} = {
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

function renderDailyPage(locale, data) {
  const isUk = locale === "uk";
  const titleSuffix = isUk ? "Щоденник на сьогодні" : "Ежедневник на сегодня";
  const description = isUk
    ? `Щоденник на сьогодні для гостей NA8 Warszawa. ${data.title}. Ювілей групи «МАЇВКА» відбудеться 9–10 травня у Варшаві.`
    : `Ежедневник на сегодня для гостей NA8 Warszawa. ${data.title}. Юбилей группы «МАЕВКА» пройдет 9–10 мая в Варшаве.`;
  const homeHref = isUk ? "/uk.html" : "/ru.html";
  const buttonLabel = isUk ? "Перейти на сайт зустрічі" : "Перейти на сайт встречи";
  const eyebrow = isUk ? "Щоденник на сьогодні" : "Ежедневник на сегодня";
  const intro = isUk
    ? "Текст на сьогодні та посилання на зустріч у Варшаві 9–10 травня."
    : "Текст на сегодня и ссылка на встречу в Варшаве 9–10 мая.";
  const canonicalPath = `/daily/${locale}.html`;
  const alternatePath = `/daily/${isUk ? "ru" : "uk"}.html`;
  const ogImage = "https://na8waw.pl/media/na8.png";
  const ogAlt = isUk ? "NA8 Warszawa — Щоденник на сьогодні" : "NA8 Warszawa — Ежедневник на сегодня";
  const localeMeta = isUk
    ? ['<meta property="og:locale" content="uk_UA" />', '<meta property="og:locale:alternate" content="ru_RU" />']
    : ['<meta property="og:locale" content="ru_RU" />', '<meta property="og:locale:alternate" content="uk_UA" />'];
  const bodyParagraphs = data.paragraphs
    .map((paragraph) => `          <p>\n            ${escapeHtml(paragraph)}\n          </p>`)
    .join("\n");

  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(data.title)} | ${titleSuffix} | NA8 Warszawa</title>
    <meta
      name="description"
      content="${escapeHtml(description)}"
    />
    <link rel="canonical" href="https://na8waw.pl${canonicalPath}" />
    <link rel="alternate" hreflang="${locale}" href="https://na8waw.pl${canonicalPath}" />
    <link rel="alternate" hreflang="${isUk ? "ru" : "uk"}" href="https://na8waw.pl${alternatePath}" />
    <meta property="og:site_name" content="NA8 Warszawa" />
    ${localeMeta.join("\n    ")}
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://na8waw.pl${canonicalPath}" />
    <meta property="og:title" content="${escapeHtml(data.title)} | ${titleSuffix} | NA8 Warszawa" />
    <meta
      property="og:description"
      content="${escapeHtml(description)}"
    />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:url" content="${ogImage}" />
    <meta property="og:image:secure_url" content="${ogImage}" />
    <meta property="og:image:alt" content="${ogAlt}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(data.title)} | ${titleSuffix} | NA8 Warszawa" />
    <meta
      name="twitter:description"
      content="${escapeHtml(description)}"
    />
    <meta name="twitter:image" content="${ogImage}" />
    <meta name="twitter:image:alt" content="${ogAlt}" />
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
        <div class="eyebrow">${eyebrow}</div>
        <h1>${escapeHtml(data.title)}</h1>
        <p>
          ${escapeHtml(intro)}
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

        <a class="button" href="${homeHref}">${buttonLabel}</a>
      </section>
    </main>
  </body>
</html>
`;
}

function rewriteHomePage(html, locale, data, assetVersion) {
  const isUk = locale === "uk";
  const seoDescription = isUk
    ? `Ювілей групи «МАЇВКА» у Варшаві 9–10 травня. Щоденник на сьогодні: ${data.title}. Програма, контакти й те, що може стати в пригоді в ці дні.`
    : `Юбилей группы «МАЕВКА» в Варшаве 9–10 мая. Ежедневник на сегодня: ${data.title}. Программа, контакты и то, что может пригодиться в эти дни.`;

  return html
    .replace(/(<h2 class="panel-title" id="daily-title">)([^<]+)(<\/h2>)/, `$1${data.title}$3`)
    .replace(
      /(<meta\s+name="description"\s+content=")[^"]+("\s*\/>)/,
      `$1${escapeHtml(seoDescription)}$2`,
    )
    .replace(
      /(<meta\s+property="og:description"\s+content=")[^"]+("\s*\/>)/,
      `$1${escapeHtml(seoDescription)}$2`,
    )
    .replace(
      /(<meta\s+name="twitter:description"\s+content=")[^"]+("\s*\/>)/,
      `$1${escapeHtml(seoDescription)}$2`,
    )
    .replace(
      /("description":\s*")[^"]+(")/,
      `$1${escapeJs(seoDescription)}$2`,
    )
    .replace(/\.\/styles\/main\.css\?v=[^"]+/g, `./styles/main.css?v=${assetVersion}`)
    .replace(/\.\/scripts\/main\.js\?v=[^"]+/g, `./scripts/main.js?v=${assetVersion}`);
}

async function loadJson(url) {
  return JSON.parse(await readFile(url, "utf8"));
}

async function loadCurrentRuData() {
  const imported = await import(`${pathToFileURL(RU_MODULE_URL.pathname).href}?t=${Date.now()}`);
  return imported.dailyMeditationRu;
}

async function fetchRuData(targetRuDate) {
  const response = await fetch(RU_PAGE_URL, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; NA8WAWDailyBot/1.0)",
      accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${RU_PAGE_URL}: ${response.status}`);
  }

  const html = await response.text();
  const data = parseRuPage(html);
  if (data.date !== targetRuDate) {
    throw new Error(`Russian source date mismatch: expected ${targetRuDate}, got ${data.date}`);
  }
  return data;
}

async function main() {
  const warsaw = getWarsawDateInfo();
  const ukSource = await loadJson(UK_SOURCE_URL);
  const ukEntry = ukSource[warsaw.key];

  if (!ukEntry) {
    throw new Error(`No Ukrainian daily entry for key ${warsaw.key}`);
  }

  const ukData = parseUkEntry(ukEntry.date, ukEntry.content);

  let ruData;
  try {
    ruData = await fetchRuData(warsaw.ruDate);
  } catch (error) {
    console.warn(String(error));
    ruData = await loadCurrentRuData();
    console.warn(`Falling back to current Russian daily: ${ruData.title}`);
  }

  await Promise.all([
    writeFile(UK_MODULE_URL, renderModule("dailyMeditationUk", ukData), "utf8"),
    writeFile(RU_MODULE_URL, renderModule("dailyMeditationRu", ruData), "utf8"),
    writeFile(UK_DAILY_PAGE_URL, renderDailyPage("uk", ukData), "utf8"),
    writeFile(RU_DAILY_PAGE_URL, renderDailyPage("ru", ruData), "utf8"),
    writeFile(
      DAILY_DATA_URL,
      `import { dailyMeditationUk } from "./daily-uk.js?v=${warsaw.assetVersion}";\nimport { dailyMeditationRu } from "./daily-ru.js?v=${warsaw.assetVersion}";\n\nexport const dailyMeditations = {\n  uk: dailyMeditationUk,\n  ru: dailyMeditationRu,\n};\n`,
      "utf8",
    ),
    writeFile(
      DAILY_SCRIPT_URL,
      (await readFile(DAILY_SCRIPT_URL, "utf8")).replace(
        /import \{ dailyMeditations \} from "\.\/daily-data\.js\?v=[^"]+";/,
        `import { dailyMeditations } from "./daily-data.js?v=${warsaw.assetVersion}";`,
      ),
      "utf8",
    ),
    writeFile(
      MAIN_SCRIPT_URL,
      (await readFile(MAIN_SCRIPT_URL, "utf8")).replace(
        /import "\.\/daily\.js\?v=[^"]+";/,
        `import "./daily.js?v=${warsaw.assetVersion}";`,
      ),
      "utf8",
    ),
    writeFile(INDEX_PAGE_URL, rewriteHomePage(await readFile(INDEX_PAGE_URL, "utf8"), "ru", ruData, warsaw.assetVersion), "utf8"),
    writeFile(UK_HOME_URL, rewriteHomePage(await readFile(UK_HOME_URL, "utf8"), "uk", ukData, warsaw.assetVersion), "utf8"),
    writeFile(RU_HOME_URL, rewriteHomePage(await readFile(RU_HOME_URL, "utf8"), "ru", ruData, warsaw.assetVersion), "utf8"),
  ]);

  console.log(`Updated daily files for Warsaw date ${warsaw.year}-${warsaw.month}-${warsaw.day}`);
  console.log(`UK: ${ukData.title}`);
  console.log(`RU: ${ruData.title}`);
}

await main();
