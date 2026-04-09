import "./predictions.js?v=20260409i";
import "./daily.js?v=20260409i";
import { siteCopy } from "./locale-data.js?v=20260409i";
import { subscribeLocale } from "./locale.js?v=20260409i";

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

  nodes.heroKicker.textContent = copy.heroKicker;
  nodes.heroTitleMain.textContent = copy.heroTitleMain;
  nodes.heroCopy.textContent = copy.heroCopy;
  nodes.heroCtaPrimary.textContent = copy.heroCtaPrimary;
  nodes.heroCtaSecondary.textContent = copy.heroCtaSecondary;
  nodes.oracleEyebrow.textContent = copy.oracleEyebrow;
  nodes.oracleTitle.textContent = copy.oracleTitle;
  nodes.oracleCopy.textContent = copy.oracleCopy;
  nodes.oracleLabel.textContent = copy.oracleLabel;
  nodes.oraclePlaceholder.textContent = copy.oraclePlaceholder;
  nodes.aboutEyebrow.textContent = copy.aboutEyebrow;
  nodes.aboutTitle.textContent = copy.aboutTitle;
  nodes.aboutCopy.textContent = copy.aboutCopy;
  nodes.factCityLabel.textContent = copy.factCityLabel;
  nodes.factCityValue.textContent = copy.factCityValue;
  nodes.factDatesLabel.textContent = copy.factDatesLabel;
  nodes.factDatesValue.textContent = copy.factDatesValue;
  nodes.factFormatLabel.textContent = copy.factFormatLabel;
  nodes.factFormatValue.textContent = copy.factFormatValue;
  nodes.dailyEyebrow.textContent = copy.dailyEyebrow;
  nodes.dailyCopy.textContent = copy.dailyCopy;
  nodes.layerEyebrow.textContent = copy.layerEyebrow;
  nodes.layerTitle.textContent = copy.layerTitle;
  nodes.layerCopy.textContent = copy.layerCopy;
  nodes.sourceLabel.textContent = copy.sourceLabel;
  nodes.sourceValue.textContent = copy.sourceValue;
  nodes.entryLabel.textContent = copy.entryLabel;
  nodes.entryValue.textContent = copy.entryValue;
  nodes.roleLabel.textContent = copy.roleLabel;
  nodes.roleValue.textContent = copy.roleValue;
  nodes.programEyebrow.textContent = copy.programEyebrow;
  nodes.programTitle.textContent = copy.programTitle;
  nodes.contactsEyebrow.textContent = copy.contactsEyebrow;
  nodes.contactsTitle.textContent = copy.contactsTitle;

  renderProgram(copy.programDays);
  renderContacts(copy.contacts);
});
