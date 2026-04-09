import { dailyMeditations } from "./daily-data.js";
import { getLocale, setLocale, subscribeLocale } from "./locale.js";

const titleNode = document.getElementById("daily-title");
const quoteNode = document.getElementById("daily-quote");
const sourceNode = document.getElementById("daily-source");
const bodyNode = document.getElementById("daily-body");
const focusLabelNode = document.getElementById("daily-focus-label");
const focusTextNode = document.getElementById("daily-focus-text");
const ukButtonNode = document.getElementById("lang-uk");
const ruButtonNode = document.getElementById("lang-ru");
const shareButtonNode = document.getElementById("daily-share");

function setActiveLanguage(lang) {
  ukButtonNode.classList.toggle("is-active", lang === "uk");
  ruButtonNode.classList.toggle("is-active", lang === "ru");
}

function renderDaily(lang) {
  const item = dailyMeditations[lang];

  titleNode.textContent = item.title;
  quoteNode.textContent = item.quote;
  sourceNode.textContent = item.source;
  focusLabelNode.textContent = item.focusLabel;
  focusTextNode.textContent = item.focusText;

  bodyNode.innerHTML = "";
  item.paragraphs.forEach((paragraph) => {
    const node = document.createElement("p");
    node.className = "daily-text";
    node.textContent = paragraph;
    bodyNode.appendChild(node);
  });

  setActiveLanguage(lang);
}

ukButtonNode.addEventListener("click", () => {
  setLocale("uk");
});

ruButtonNode.addEventListener("click", () => {
  setLocale("ru");
});

shareButtonNode.addEventListener("click", async () => {
  const locale = getLocale();
  const url = new URL(window.location.href);
  url.pathname = locale === "uk" ? "/daily/uk.html" : "/daily/ru.html";
  url.search = "";
  url.hash = "";

  try {
    await navigator.clipboard.writeText(url.toString());
    shareButtonNode.textContent = locale === "uk" ? "Посилання скопійовано" : "Ссылка скопирована";
  } catch (error) {
    shareButtonNode.textContent = locale === "uk" ? "Не вдалося скопіювати" : "Не удалось скопировать";
  }

  window.setTimeout(() => {
    shareButtonNode.textContent = locale === "uk" ? "Поділитися щоденником" : "Поделиться ежедневником";
  }, 1400);
});

subscribeLocale((locale) => {
  renderDaily(locale);
  shareButtonNode.textContent = locale === "uk" ? "Поділитися щоденником" : "Поделиться ежедневником";
});
