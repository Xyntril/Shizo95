/**
 * «Шизо 95» — Автономный оффлайн клиент
 * Поддерживает: pywebview (Linux AppImage), Android WebView / Capacitor, браузер.
 */

// Загрузка базы цитат из quotes.js или встроенный резервный массив
const quotes = (typeof SHIZO_QUOTES !== "undefined" && Array.isArray(SHIZO_QUOTES))
  ? SHIZO_QUOTES
  : [
      { id: 1, category: "Псевдолатынь и античность", text: "Ceterum censeo bananam esse manducandam!" },
      { id: 2, category: "IT-деградация и деплой", text: "Хватит уже нюашить эту кнопку на три пикселя влево, функционал работает — кати в прод!" },
      { id: 3, category: "Бытовой сюрреализм и локальные новости", text: "Огурцы Кэрол выросли. В этом году они \"вполне нормальные\"..." },
      { id: 4, category: "Миннесотский диалект", text: "Ope, let me just squeeze right past ya." }
    ];

let currentIndex = -1;
let toastTimeout = null;

// Ретро звуковой генератор (Web Audio API)
function playRetroBeep(type = "click") {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "click") {
      osc.type = "square";
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === "chime") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "error") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch (e) {
    // Web Audio может требовать пользовательского взаимодействия
  }
}

// Виброотклик (если поддерживается устройством)
function triggerVibration(duration = 30) {
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate(duration);
    }
  } catch (e) {}
}

// Уведомление в стиле Windows 95
function showToast(text) {
  const toast = document.getElementById("toast-msg");
  if (!toast) return;
  toast.textContent = text;
  toast.classList.add("visible");
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("visible");
  }, 2200);
}

// Генерация случайной цитаты
function displayRandomQuote() {
  if (!quotes || quotes.length === 0) return;

  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * quotes.length);
  } while (quotes.length > 1 && newIndex === currentIndex);

  currentIndex = newIndex;
  const quote = quotes[currentIndex];

  const quoteBox = document.getElementById("quote-box");
  const quoteText = document.getElementById("quote-text");
  const categoryTag = document.getElementById("quote-category");
  const counterTag = document.getElementById("status-counter");

  // Анимация мерцания кинескопа
  quoteBox.classList.remove("flicker");
  void quoteBox.offsetWidth;
  quoteBox.classList.add("flicker");

  // Обновление контента
  quoteText.textContent = quote.text;
  categoryTag.textContent = `Категория: ${quote.category || "Общий делирий"}`;
  if (counterTag) {
    counterTag.textContent = `Цитата #${quote.id || (currentIndex + 1)}`;
  }
  quoteBox.scrollTop = 0;

  playRetroBeep("click");
  triggerVibration(25);
}

// Копирование в буфер обмена
async function copyCurrentQuote() {
  if (currentIndex < 0 || !quotes[currentIndex]) return;
  const quote = quotes[currentIndex];
  const fullText = `[Шизо 95: ${quote.category}]\n«${quote.text}»`;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(fullText);
    } else {
      fallbackCopyText(fullText);
    }
    showToast("✓ Скопировано в буфер обмена!");
    playRetroBeep("chime");
    triggerVibration(40);
  } catch (err) {
    fallbackCopyText(fullText);
  }
}

function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
    showToast("✓ Скопировано в буфер!");
    playRetroBeep("chime");
    triggerVibration(40);
  } catch (e) {
    showToast("Ошибка копирования");
    playRetroBeep("error");
  }
  document.body.removeChild(textarea);
}

// Функция "Поделиться" (Web Share API для Android или fallback на копирование)
async function shareQuote() {
  if (currentIndex < 0 || !quotes[currentIndex]) return;
  const quote = quotes[currentIndex];
  const shareData = {
    title: "Шизо 95",
    text: `«${quote.text}» (${quote.category})`
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      playRetroBeep("chime");
      triggerVibration(30);
      return;
    } catch (err) {
      // Пользователь закрыл окно шеринга — не ошибка
      if (err.name === "AbortError") return;
    }
  }

  // Если Web Share API недоступен (например, в Linux Desktop)
  await copyCurrentQuote();
  showToast("Текст скопирован для отправки!");
}

// Управление окном (закрытие/сворачивание)
function handleWindowClose() {
  playRetroBeep("error");
  if (window.pywebview && window.pywebview.api && typeof window.pywebview.api.close === "function") {
    window.pywebview.api.close();
  } else if (window.AndroidBridge && typeof window.AndroidBridge.closeApp === "function") {
    window.AndroidBridge.closeApp();
  } else {
    showToast("Завершение сеанса Shizo95.exe...");
    try {
      window.close();
    } catch (e) {}
  }
}

function handleWindowMinimize() {
  playRetroBeep("click");
  if (window.pywebview && window.pywebview.api && typeof window.pywebview.api.minimize === "function") {
    window.pywebview.api.minimize();
  } else {
    showToast("Шизофазия не сворачивается в трей");
  }
}

function handleWindowMaximize() {
  playRetroBeep("click");
  if (window.pywebview && window.pywebview.api && typeof window.pywebview.api.toggle_maximize === "function") {
    window.pywebview.api.toggle_maximize();
  } else {
    showToast("Окно уже развёрнуто на 100% мощности 486DX2");
  }
}

// Инициализация интерфейса
document.addEventListener("DOMContentLoaded", () => {
  const btnGenerate = document.getElementById("btn-generate");
  const btnCopy = document.getElementById("btn-copy");
  const btnShare = document.getElementById("btn-share");

  const btnClose = document.getElementById("btn-close");
  const btnMin = document.getElementById("btn-minimize");
  const btnMax = document.getElementById("btn-maximize");

  if (btnGenerate) btnGenerate.addEventListener("click", displayRandomQuote);
  if (btnCopy) btnCopy.addEventListener("click", copyCurrentQuote);
  if (btnShare) btnShare.addEventListener("click", shareQuote);

  if (btnClose) btnClose.addEventListener("click", handleWindowClose);
  if (btnMin) btnMin.addEventListener("click", handleWindowMinimize);
  if (btnMax) btnMax.addEventListener("click", handleWindowMaximize);

  // Первая цитата при запуске
  displayRandomQuote();
});
