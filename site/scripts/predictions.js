import { siteCopy } from "./locale-data.js";
import { getLocale, subscribeLocale } from "./locale.js";
import { predictionsByLocale } from "./predictions-data.js";

const titleNode = document.getElementById("prediction-title");
const textNode = document.getElementById("prediction-text");
const metaNode = document.getElementById("prediction-meta");
const buttonNode = document.getElementById("prediction-button");
const shareNode = document.getElementById("prediction-share");
const oracleCardNode = document.getElementById("oracle-card");

let currentIndex = 0;
let hasRevealedPrediction = false;
let currentLocale = getLocale();

function renderPrediction(index) {
  const item = predictionsByLocale[currentLocale][index];

  oracleCardNode.classList.remove("oracle-card-idle");
  oracleCardNode.classList.add("oracle-card-revealed");
  titleNode.textContent = item.title;
  textNode.textContent = item.text;
  metaNode.textContent = siteCopy[currentLocale].oracleMeta(index + 1);
  shareNode.disabled = false;
  hasRevealedPrediction = true;
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

async function copyPrediction() {
  if (!hasRevealedPrediction) {
    return;
  }

  const item = predictionsByLocale[currentLocale][currentIndex];
  const text = `${item.title}. ${item.text}`;

  try {
    await navigator.clipboard.writeText(text);
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
  copyPrediction();
});

subscribeLocale((locale) => {
  currentLocale = locale;
  buttonNode.textContent = siteCopy[locale].oracleButton;
  shareNode.textContent = siteCopy[locale].oracleShare;

  if (hasRevealedPrediction) {
    renderPrediction(currentIndex);
  }
});
