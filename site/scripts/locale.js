const localeListeners = new Set();
const localeButtons = Array.from(document.querySelectorAll("[data-set-locale]"));
const LOCALE_SCROLL_KEY = "na8waw:pending-locale-scroll";

function normalizeForcedLocaleUrl() {
  const forcedLocale = document.body?.dataset?.forceLocale;
  if (forcedLocale !== "uk" && forcedLocale !== "ru") {
    return forcedLocale;
  }

  const url = new URL(window.location.href);
  const paramLocale = url.searchParams.get("lang");
  url.searchParams.delete("lang");

  const targetPath = forcedLocale === "uk" ? "/uk.html" : "/ru.html";
  let shouldReplace = false;

  if (url.pathname !== targetPath) {
    url.pathname = targetPath;
    shouldReplace = true;
  }

  if (paramLocale && paramLocale !== forcedLocale) {
    shouldReplace = true;
  }

  if (shouldReplace) {
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  return forcedLocale;
}

function detectLocale() {
  const forcedLocale = normalizeForcedLocaleUrl();

  if (forcedLocale === "uk" || forcedLocale === "ru") {
    return forcedLocale;
  }

  const langParam = new URLSearchParams(window.location.search).get("lang");

  if (langParam === "uk" || langParam === "ru") {
    return langParam;
  }

  const language = (navigator.language || "").toLowerCase();
  return language.startsWith("uk") ? "uk" : "ru";
}

let currentLocale = detectLocale();

function restorePendingScroll() {
  const raw = window.sessionStorage.getItem(LOCALE_SCROLL_KEY);

  if (!raw) {
    return;
  }

  window.sessionStorage.removeItem(LOCALE_SCROLL_KEY);
  const scrollY = Number.parseFloat(raw);

  if (!Number.isFinite(scrollY)) {
    return;
  }

  window.requestAnimationFrame(() => {
    window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
    });
  });
}

export function getLocale() {
  return currentLocale;
}

export function setLocale(locale) {
  currentLocale = locale === "uk" ? "uk" : "ru";

  const target = currentLocale === "uk" ? "/uk.html" : "/ru.html";
  const url = new URL(window.location.href);
  url.searchParams.delete("lang");

  const forcedLocale = document.body?.dataset?.forceLocale;
  if (forcedLocale === "uk" || forcedLocale === "ru" || url.pathname === "/" || url.pathname === "/index.html") {
    window.sessionStorage.setItem(LOCALE_SCROLL_KEY, String(window.scrollY));
    url.pathname = target;
    url.hash = "";
    window.location.href = `${url.pathname}${url.search}`;
    return;
  }

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

restorePendingScroll();
