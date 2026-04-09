import { dailyMeditations } from "./daily-data.js";

const titleNode = document.getElementById("daily-title");
const quoteNode = document.getElementById("daily-quote");
const sourceNode = document.getElementById("daily-source");
const bodyNode = document.getElementById("daily-body");
const focusLabelNode = document.getElementById("daily-focus-label");
const focusTextNode = document.getElementById("daily-focus-text");
const ukButtonNode = document.getElementById("lang-uk");
const ruButtonNode = document.getElementById("lang-ru");

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
  renderDaily("uk");
});

ruButtonNode.addEventListener("click", () => {
  renderDaily("ru");
});

renderDaily("uk");
