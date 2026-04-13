import { getLocale, subscribeLocale } from "./locale.js?v=20260410m";

const formNode = document.getElementById("wish-form");
const statusNode = document.getElementById("wish-status");
const submitNode = document.getElementById("wish-submit");
const photoNode = document.getElementById("wish-photo");

const messages = {
  ru: {
    sending: "Отправляем...",
    success: "Пожелание отправлено. После проверки оно появится на экране.",
    error: "Не удалось отправить пожелание. Попробуй еще раз.",
    copied: "Ссылка скопирована.",
  },
  uk: {
    sending: "Надсилаємо...",
    success: "Побажання надіслано. Після перевірки воно з'явиться на екрані.",
    error: "Не вдалося надіслати побажання. Спробуй ще раз.",
    copied: "Посилання скопійовано.",
  },
};

let currentLocale = getLocale();

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error(messages[currentLocale].error));
    };
    reader.onerror = () => {
      reject(new Error(messages[currentLocale].error));
    };
    reader.readAsDataURL(file);
  });
}

subscribeLocale((locale) => {
  currentLocale = locale;
  if (statusNode) {
    statusNode.textContent = "";
    statusNode.dataset.state = "";
  }
});

if (formNode && statusNode && submitNode) {
  formNode.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append("author", String(document.getElementById("wish-author")?.value || ""));
    formData.append("city", String(document.getElementById("wish-city")?.value || ""));
    formData.append("message", String(document.getElementById("wish-message")?.value || ""));
    formData.append("clean_years", String(document.getElementById("wish-clean-years")?.value || ""));
    formData.append("clean_months", String(document.getElementById("wish-clean-months")?.value || ""));
    formData.append("website", String(document.getElementById("wish-website")?.value || ""));
    statusNode.dataset.state = "pending";
    statusNode.textContent = messages[currentLocale].sending;
    submitNode.disabled = true;

    try {
      const file = photoNode?.files?.[0];

      if (file) {
        formData.append("photo_name", file.name);
        formData.append("photo_data", await readFileAsDataUrl(file));
      }

      const response = await fetch("/wishes/submit.php", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || messages[currentLocale].error);
      }

      formNode.reset();
      statusNode.dataset.state = "success";
      statusNode.textContent = payload.message || messages[currentLocale].success;
    } catch (error) {
      statusNode.dataset.state = "error";
      statusNode.textContent = error instanceof Error ? error.message : messages[currentLocale].error;
    } finally {
      submitNode.disabled = false;
    }
  });
}
