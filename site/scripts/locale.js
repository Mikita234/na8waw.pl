const localeListeners = new Set();
const localeButtons = Array.from(document.querySelectorAll("[data-set-locale]"));

function detectLocale() {
  const langParam = new URLSearchParams(window.location.search).get("lang");

  if (langParam === "uk" || langParam === "ru") {
    return langParam;
  }

  const language = (navigator.language || "").toLowerCase();
  return language.startsWith("uk") ? "uk" : "ru";
}

let currentLocale = detectLocale();

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale) {
  currentLocale = locale === "uk" ? "uk" : "ru";
  const url = new URL(window.location.href);
  url.searchParams.set("lang", currentLocale);
  window.history.replaceState({}, "", url);
  localeListeners.forEach((listener) => listener(currentLocale));
}

export function subscribeLocale(listener) {
  localeListeners.add(listener);
  listener(currentLocale);

  return () => {
    localeListeners.delete(listener);
  };
}

localeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setLocale(button.dataset.setLocale);
  });
});
