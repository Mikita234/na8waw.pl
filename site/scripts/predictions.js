import { predictions } from "./predictions-data.js";

const titleNode = document.getElementById("prediction-title");
const textNode = document.getElementById("prediction-text");
const metaNode = document.getElementById("prediction-meta");
const buttonNode = document.getElementById("prediction-button");
const shareNode = document.getElementById("prediction-share");

let currentIndex = 0;

function renderPrediction(index) {
  const item = predictions[index];

  titleNode.textContent = item.title;
  textNode.textContent = item.text;
  metaNode.textContent = `Предсказание №${index + 1} из колоды Высшей силы`;
}

function getNextPredictionIndex() {
  let nextIndex = Math.floor(Math.random() * predictions.length);

  if (predictions.length > 1) {
    while (nextIndex === currentIndex) {
      nextIndex = Math.floor(Math.random() * predictions.length);
    }
  }

  return nextIndex;
}

async function copyPrediction() {
  const text = `${predictions[currentIndex].title}. ${predictions[currentIndex].text}`;

  try {
    await navigator.clipboard.writeText(text);
    shareNode.textContent = "Скопировано";
  } catch (error) {
    shareNode.textContent = "Не удалось скопировать";
  }

  window.setTimeout(() => {
    shareNode.textContent = "Скопировать текст";
  }, 1400);
}

buttonNode.addEventListener("click", () => {
  currentIndex = getNextPredictionIndex();
  renderPrediction(currentIndex);
});

shareNode.addEventListener("click", () => {
  copyPrediction();
});

renderPrediction(currentIndex);
