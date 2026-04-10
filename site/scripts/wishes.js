import { getLocale, subscribeLocale } from "./locale.js?v=20260410m";

const formNode = document.getElementById("wish-form");
const statusNode = document.getElementById("wish-status");
const submitNode = document.getElementById("wish-submit");

const messages = {
  ru: {
    sending: "Отправляем...",
    success: "Пожелание отправлено. После проверки оно появится на экране.",
    error: "Не удалось отправить пожелание. Попробуй еще раз.",
  },
  uk: {
    sending: "Надсилаємо...",
    success: "Побажання надіслано. Після перевірки воно з'явиться на екрані.",
    error: "Не вдалося надіслати побажання. Спробуй ще раз.",
  },
};

let currentLocale = getLocale();

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

    const formData = new FormData(formNode);
    statusNode.dataset.state = "pending";
    statusNode.textContent = messages[currentLocale].sending;
    submitNode.disabled = true;

    try {
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
