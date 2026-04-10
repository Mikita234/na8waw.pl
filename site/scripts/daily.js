import { dailyMeditations } from "./daily-data.js?v=20260410d";
import { getLocale, subscribeLocale } from "./locale.js?v=20260410m";

const titleNode = document.getElementById("daily-title");
const quoteNode = document.getElementById("daily-quote");
const sourceNode = document.getElementById("daily-source");
const bodyNode = document.getElementById("daily-body");
const focusLabelNode = document.getElementById("daily-focus-label");
const focusTextNode = document.getElementById("daily-focus-text");
const shareButtonNode = document.getElementById("daily-share");
const localeButtons = Array.from(document.querySelectorAll("[data-set-locale]"));

function prefersNativeShare() {
  return (
    typeof navigator.share === "function" &&
    (window.matchMedia?.("(pointer: coarse)").matches ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
  );
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "absolute";
  field.style.left = "-9999px";
  document.body.appendChild(field);
  field.select();
  field.setSelectionRange(0, field.value.length);

  try {
    document.execCommand("copy");
    return true;
  } finally {
    document.body.removeChild(field);
  }
}

function setActiveLanguage(lang) {
  localeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.setLocale === lang);
  });
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

shareButtonNode.addEventListener("click", async () => {
  const locale = getLocale();
  const url = new URL(window.location.href);
  url.pathname = locale === "uk" ? "/daily/uk.html" : "/daily/ru.html";
  url.search = "";
  url.hash = "";

  try {
    if (prefersNativeShare()) {
      await navigator.share({
        title: locale === "uk" ? "Щоденник на сьогодні | NA8 Warszawa" : "Ежедневник на сегодня | NA8 Warszawa",
        text:
          locale === "uk"
            ? "Щоденник на сьогодні і ювілей групи «МАЇВКА» у Варшаві 9–10 травня."
            : "Ежедневник на сегодня и юбилей группы «МАЕВКА» в Варшаве 9–10 мая.",
        url: url.toString(),
      });
    } else {
      await copyToClipboard(url.toString());
    }
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
