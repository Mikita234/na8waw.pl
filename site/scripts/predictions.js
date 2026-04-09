import { siteCopy } from "./locale-data.js?v=20260409h";
import { getLocale, setLocale, subscribeLocale } from "./locale.js?v=20260409h";
import { predictionsByLocale } from "./predictions-data.js?v=20260409h";

const titleNode = document.getElementById("prediction-title");
const textNode = document.getElementById("prediction-text");
const metaNode = document.getElementById("prediction-meta");
const buttonNode = document.getElementById("prediction-button");
const shareNode = document.getElementById("prediction-share");
const oracleCardNode = document.getElementById("oracle-card");

let currentIndex = 0;
let hasRevealedPrediction = false;
let currentLocale = getLocale();

function syncOracleUrl(index, locale) {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", locale);
  url.searchParams.set("oracle", String(index + 1));
  url.hash = "oracle";
  window.history.replaceState({}, "", url);
}

function renderPrediction(index) {
  const item = predictionsByLocale[currentLocale][index];

  oracleCardNode.classList.remove("oracle-card-idle");
  oracleCardNode.classList.add("oracle-card-revealed");
  titleNode.textContent = item.title;
  textNode.textContent = item.text;
  metaNode.textContent = siteCopy[currentLocale].oracleMeta(index + 1);
  shareNode.disabled = false;
  hasRevealedPrediction = true;
  syncOracleUrl(index, currentLocale);
}

function getNextPredictionIndex() {
  const predictions = predictionsByLocale[currentLocale];
  let nextIndex = Math.floor(Math.random() * predictions.length);

  if (predictions.length > 1) {
    while (nextIndex === currentIndex) {
      nextIndex = Math.floor(Math.random() * predictions.length);
    }
  }

  return nextIndex;
}

function getPredictionShareUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("lang", currentLocale);
  url.searchParams.set("oracle", String(currentIndex + 1));
  url.hash = "oracle";
  return url.toString();
}

async function sharePrediction() {
  if (!hasRevealedPrediction) {
    return;
  }

  const item = predictionsByLocale[currentLocale][currentIndex];
  const url = getPredictionShareUrl();
  const shareText =
    currentLocale === "uk"
      ? `${item.title}. Передбачення від Вищої Сили й інформація про ювілей у Варшаві:`
      : `${item.title}. Предсказание от Высшей силы и информация о юбилее в Варшаве:`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: item.title,
        text: shareText,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
    shareNode.textContent = siteCopy[currentLocale].oracleShareDone;
  } catch (error) {
    shareNode.textContent = siteCopy[currentLocale].oracleShareFail;
  }

  window.setTimeout(() => {
    shareNode.textContent = siteCopy[currentLocale].oracleShare;
  }, 1400);
}

buttonNode.addEventListener("click", () => {
  currentIndex = getNextPredictionIndex();
  renderPrediction(currentIndex);
});

shareNode.addEventListener("click", () => {
  sharePrediction();
});

function revealPredictionFromUrl() {
  const url = new URL(window.location.href);
  const locale = url.searchParams.get("lang");
  const rawIndex = Number.parseInt(url.searchParams.get("oracle") || "", 10);

  if (locale === "uk" || locale === "ru") {
    setLocale(locale);
  }

  if (!Number.isInteger(rawIndex)) {
    return;
  }

  const nextLocale = getLocale();
  const predictions = predictionsByLocale[nextLocale];
  const normalizedIndex = rawIndex - 1;

  if (normalizedIndex < 0 || normalizedIndex >= predictions.length) {
    return;
  }

  currentLocale = nextLocale;
  currentIndex = normalizedIndex;
  renderPrediction(currentIndex);
}

subscribeLocale((locale) => {
  currentLocale = locale;
  buttonNode.textContent = siteCopy[locale].oracleButton;
  shareNode.textContent = siteCopy[locale].oracleShare;

  if (hasRevealedPrediction) {
    renderPrediction(currentIndex);
  }
});

revealPredictionFromUrl();
