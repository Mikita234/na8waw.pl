import "./predictions.js?v=20260409u";
import "./daily.js?v=20260409u";
import { siteCopy } from "./locale-data.js?v=20260409ab";
import { subscribeLocale } from "./locale.js?v=20260409u";

let programStatusInterval;

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
  locationsEyebrow: document.getElementById("locations-eyebrow"),
  locationsTitle: document.getElementById("locations-title"),
  locationsCopy: document.getElementById("locations-copy"),
  locationMapDay: document.getElementById("location-map-day"),
  locationMapOpen: document.getElementById("location-map-open"),
  locationMapFrame: document.getElementById("location-map-frame"),
  locationLinks: document.getElementById("location-links"),
  programEyebrow: document.getElementById("program-eyebrow"),
  programLiveLabel: document.getElementById("program-live-label"),
  programLiveText: document.getElementById("program-live-text"),
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

function setHTML(node, value) {
  if (node) {
    node.innerHTML = value;
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

    if (day.locationHref && day.locationLabel) {
      const actions = document.createElement("div");
      actions.className = "day-actions";

      const link = document.createElement("a");
      link.className = "button button-secondary day-action";
      link.href = day.locationHref;
      link.textContent = day.locationLabel;
      if (day.locationHref.startsWith("http")) {
        link.target = "_blank";
        link.rel = "noreferrer noopener";
      }

      actions.appendChild(link);
      article.appendChild(actions);
    }

    nodes.programDays.appendChild(article);
  });
}

function renderContacts(items) {
  nodes.contactLinks.innerHTML = "";

  items.forEach((item) => {
    const link = document.createElement("a");
    link.className = "contact-link";
    link.href = item.href;
    if (item.href.startsWith("http")) {
      link.target = "_blank";
      link.rel = "noreferrer noopener";
    }
    link.innerHTML = `<strong>${item.title}</strong><span>${item.text}</span>${
      item.action ? `<em>${item.action}</em>` : ""
    }`;
    nodes.contactLinks.appendChild(link);
  });
}

function formatCountdown(ms, units) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, units };
}

function renderCountdownMarkup(prefix, countdown) {
  const segments = [
    [countdown.days, countdown.units.d],
    [countdown.hours, countdown.units.h],
    [countdown.minutes, countdown.units.m],
    [countdown.seconds, countdown.units.s],
  ]
    .map(
      ([value, unit]) => `
        <span class="program-live-segment">
          <strong>${String(value).padStart(2, "0")}</strong>
          <em>${unit}</em>
        </span>
      `,
    )
    .join("");

  return `
    <span class="program-live-kicker">${prefix}</span>
    <span class="program-live-board">${segments}</span>
  `;
}

function renderStatusMarkup(prefix, label) {
  return `
    <span class="program-live-kicker">${prefix}</span>
    <span class="program-live-current">${label}</span>
  `;
}

function startProgramStatus(copy) {
  if (programStatusInterval) {
    window.clearInterval(programStatusInterval);
  }

  const update = () => {
    const now = Date.now();
    const entries = copy.programTimeline.map((item) => ({
      ...item,
      startMs: new Date(item.start).getTime(),
      endMs: new Date(item.end).getTime(),
    }));

    const firstStart = entries[0]?.startMs;
    const active = entries.find((item) => now >= item.startMs && now < item.endMs);
    const next = entries.find((item) => now < item.startMs);

    if (firstStart && now < firstStart) {
      setHTML(
        nodes.programLiveText,
        renderCountdownMarkup(
          copy.programStatusCountdown,
          formatCountdown(firstStart - now, copy.programCountdownUnits),
        ),
      );
      return;
    }

    if (active) {
      setHTML(nodes.programLiveText, renderStatusMarkup(copy.programStatusNow, active.label));
      return;
    }

    if (next) {
      setHTML(nodes.programLiveText, renderStatusMarkup(copy.programStatusNext, next.label));
      return;
    }

    setHTML(nodes.programLiveText, renderStatusMarkup(copy.programStatusEnded, ""));
  };

  update();
  programStatusInterval = window.setInterval(update, 1000);
}

function renderLocations(items, copy) {
  nodes.locationLinks.innerHTML = "";

  const activateLocation = (item, button) => {
    setText(nodes.locationMapDay, item.mapDayTitle);
    setText(nodes.locationMapOpen, copy.locationMapOpenLabel);
    nodes.locationMapOpen.href = item.href;
    nodes.locationMapFrame.src = item.embedHref;

    Array.from(nodes.locationLinks.children).forEach((node) => {
      node.classList.remove("is-active");
    });

    if (button) {
      button.classList.add("is-active");
    }
  };

  items.forEach((item, index) => {
    const button = document.createElement("button");
    button.className = "location-link";
    button.type = "button";
    if (index === 0) {
      button.classList.add("is-active");
    }
    button.innerHTML = `
      <div class="location-link-head">
        <strong>${item.title}</strong>
        <span>${item.kicker}</span>
      </div>
      <p>${item.text}</p>
      <em>${item.action}</em>
    `;
    button.addEventListener("click", () => {
      activateLocation(item, button);
    });
    nodes.locationLinks.appendChild(button);
  });

  if (items[0]) {
    activateLocation(items[0], nodes.locationLinks.firstElementChild);
  }
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
  setText(nodes.locationsEyebrow, copy.locationsEyebrow);
  setText(nodes.locationsTitle, copy.locationsTitle);
  setText(nodes.locationsCopy, copy.locationsCopy);
  setText(nodes.locationMapOpen, copy.locationMapOpenLabel);
  setText(nodes.programEyebrow, copy.programEyebrow);
  setText(nodes.programLiveLabel, copy.programLiveLabel);
  setText(nodes.programTitle, copy.programTitle);
  setText(nodes.contactsEyebrow, copy.contactsEyebrow);
  setText(nodes.contactsTitle, copy.contactsTitle);

  renderProgram(copy.programDays);
  renderLocations(copy.locations, copy);
  renderContacts(copy.contacts);
  startProgramStatus(copy);
});
