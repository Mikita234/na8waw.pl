import "./predictions.js?v=20260409r";
import "./daily.js?v=20260409r";
import { siteCopy } from "./locale-data.js?v=20260409r";
import { subscribeLocale } from "./locale.js?v=20260409r";

const nodes = {
  heroKicker: document.getElementById("hero-kicker"),
  heroTitleMain: document.getElementById("hero-title-main"),
  heroCopy: document.getElementById("hero-copy"),
  heroCtaPrimary: document.getElementById("hero-cta-primary"),
  heroCtaSecondary: document.getElementById("hero-cta-secondary"),
  oracleEyebrow: document.getElementById("oracle-eyebrow"),
  oracleTitle: document.getElementById("oracle-title"),
  oracleCopy: document.getElementById("oracle-copy"),
  oracleLabel: document.getElementById("oracle-label"),
  oraclePlaceholder: document.getElementById("oracle-placeholder"),
  aboutEyebrow: document.getElementById("about-eyebrow"),
  aboutTitle: document.getElementById("about-title"),
  aboutCopy: document.getElementById("about-copy"),
  factCityLabel: document.getElementById("fact-city-label"),
  factCityValue: document.getElementById("fact-city-value"),
  factDatesLabel: document.getElementById("fact-dates-label"),
  factDatesValue: document.getElementById("fact-dates-value"),
  factFormatLabel: document.getElementById("fact-format-label"),
  factFormatValue: document.getElementById("fact-format-value"),
  dailyEyebrow: document.getElementById("daily-eyebrow"),
  dailyCopy: document.getElementById("daily-copy"),
  layerEyebrow: document.getElementById("layer-eyebrow"),
  layerTitle: document.getElementById("layer-title"),
  layerCopy: document.getElementById("layer-copy"),
  sourceLabel: document.getElementById("source-label"),
  sourceValue: document.getElementById("source-value"),
  entryLabel: document.getElementById("entry-label"),
  entryValue: document.getElementById("entry-value"),
  roleLabel: document.getElementById("role-label"),
  roleValue: document.getElementById("role-value"),
  programEyebrow: document.getElementById("program-eyebrow"),
  programTitle: document.getElementById("program-title"),
  programDays: document.getElementById("program-days"),
  contactsEyebrow: document.getElementById("contacts-eyebrow"),
  contactsTitle: document.getElementById("contacts-title"),
  contactLinks: document.getElementById("contact-links"),
  localeSwitchers: Array.from(document.querySelectorAll('[role="tablist"]')),
};

function setText(node, value) {
  if (node) {
    node.textContent = value;
  }
}

function renderProgram(days) {
  nodes.programDays.innerHTML = "";

  days.forEach((day) => {
    const article = document.createElement("article");
    article.className = "day";

    const title = document.createElement("h3");
    title.textContent = day.title;
    article.appendChild(title);

    const list = document.createElement("ul");
    list.className = "program-list";

    day.items.forEach(([time, text]) => {
      const item = document.createElement("li");
      item.innerHTML = `<span class="time">${time}</span><span>${text}</span>`;
      list.appendChild(item);
    });

    article.appendChild(list);
    nodes.programDays.appendChild(article);
  });
}

function renderContacts(items) {
  nodes.contactLinks.innerHTML = "";

  items.forEach((item) => {
    const link = document.createElement("a");
    link.className = "contact-link";
    link.href = item.href;
    link.innerHTML = `<strong>${item.title}</strong><span>${item.text}</span>`;
    nodes.contactLinks.appendChild(link);
  });
}

subscribeLocale((locale) => {
  const copy = siteCopy[locale];

  document.documentElement.lang = copy.htmlLang;
  document.title = copy.pageTitle;
  document.querySelector('meta[name="description"]').setAttribute("content", copy.metaDescription);
  nodes.localeSwitchers.forEach((node) => {
    node.setAttribute("aria-label", copy.localeSwitcherLabel);
  });

  setText(nodes.heroKicker, copy.heroKicker);
  setText(nodes.heroTitleMain, copy.heroTitleMain);
  setText(nodes.heroCopy, copy.heroCopy);
  setText(nodes.heroCtaPrimary, copy.heroCtaPrimary);
  setText(nodes.heroCtaSecondary, copy.heroCtaSecondary);
  setText(nodes.oracleEyebrow, copy.oracleEyebrow);
  setText(nodes.oracleTitle, copy.oracleTitle);
  setText(nodes.oracleCopy, copy.oracleCopy);
  setText(nodes.oracleLabel, copy.oracleLabel);
  setText(nodes.oraclePlaceholder, copy.oraclePlaceholder);
  setText(nodes.aboutEyebrow, copy.aboutEyebrow);
  setText(nodes.aboutTitle, copy.aboutTitle);
  setText(nodes.aboutCopy, copy.aboutCopy);
  setText(nodes.factCityLabel, copy.factCityLabel);
  setText(nodes.factCityValue, copy.factCityValue);
  setText(nodes.factDatesLabel, copy.factDatesLabel);
  setText(nodes.factDatesValue, copy.factDatesValue);
  setText(nodes.factFormatLabel, copy.factFormatLabel);
  setText(nodes.factFormatValue, copy.factFormatValue);
  setText(nodes.dailyEyebrow, copy.dailyEyebrow);
  setText(nodes.dailyCopy, copy.dailyCopy);
  setText(nodes.layerEyebrow, copy.layerEyebrow);
  setText(nodes.layerTitle, copy.layerTitle);
  setText(nodes.layerCopy, copy.layerCopy);
  setText(nodes.sourceLabel, copy.sourceLabel);
  setText(nodes.sourceValue, copy.sourceValue);
  setText(nodes.entryLabel, copy.entryLabel);
  setText(nodes.entryValue, copy.entryValue);
  setText(nodes.roleLabel, copy.roleLabel);
  setText(nodes.roleValue, copy.roleValue);
  setText(nodes.programEyebrow, copy.programEyebrow);
  setText(nodes.programTitle, copy.programTitle);
  setText(nodes.contactsEyebrow, copy.contactsEyebrow);
  setText(nodes.contactsTitle, copy.contactsTitle);

  renderProgram(copy.programDays);
  renderContacts(copy.contacts);
});
