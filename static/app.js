/**
 * Шизо 95 - Ретро генератор абсурда и шизофазии
 * Telegram Mini App Client Logic
 */

// Базовый пул цитат на случай отсутствия сети
const DEFAULT_QUOTES = [
  {
    id: 1,
    category: "Псевдолатынь и античность",
    text: "Ceterum censeo bananam esse manducandam!"
  },
  {
    id: 2,
    category: "Псевдолатынь и античность",
    text: "Ave Cæsar, Ave Linux. Melius est mori quam vivere sine Linux."
  },
  {
    id: 3,
    category: "Псевдолатынь и античность",
    text: "Truflas in machinam lavatrinam ne miseris."
  },
  {
    id: 4,
    category: "Псевдолатынь и античность",
    text: "Heus tu, Vespertiliovir, ex udonibus meis putidis saniem hauri!"
  },
  {
    id: 5,
    category: "Псевдолатынь и античность",
    text: "Gloria in tenebris. Nox est nostra. Strix canit, homo vigilant!"
  },
  {
    id: 6,
    category: "IT-деградация и деплой",
    text: "Хватит уже нюашить эту кнопку на три пикселя влево, функционал работает — кати в прод!"
  },
  {
    id: 7,
    category: "IT-деградация и деплой",
    text: "Карбид кремния."
  },
  {
    id: 8,
    category: "IT-деградация и деплой",
    text: "Гомперить."
  },
  {
    id: 9,
    category: "IT-деградация и деплой",
    text: "Стек вызова провалился в текстуры BIOS. Срочно вызовите системного шамана с бубном PS/2."
  },
  {
    id: 10,
    category: "IT-деградация и деплой",
    text: "Рефакторинг завершён успешно: ни один unit-тест не упал, потому что они были удалены для ускорения пайплайна."
  },
  {
    id: 11,
    category: "Бытовой сюрреализм и локальные новости",
    "text": "Огурцы Кэрол выросли. Как сообщает сама Мадам Мэр, в этом году они \"вполне нормальные\"... Мы держим кулаки за Кэрол."
  },
  {
    id: 12,
    category: "Бытовой сюрреализм и локальные новости",
    text: "Мутировавшая ДНК, жирные кислоты и два с половиной стакана бананового пюре."
  },
  {
    id: 13,
    category: "Бытовой сюрреализм и локальные новости",
    text: "Хуан “Гуапо” де Гваделупа."
  },
  {
    id: 14,
    category: "Миннесотский диалект и неожиданные иноязычные вставки",
    text: "Ope, let me just squeeze right past ya."
  },
  {
    id: 15,
    category: "Миннесотский диалект и неожиданные иноязычные вставки",
    text: "Well, could be worse, dontcha know!"
  },
  {
    id: 16,
    category: "Миннесотский диалект и неожиданные иноязычные вставки",
    text: "Tater Tot Hotdish."
  },
  {
    id: 17,
    category: "Миннесотский диалект и неожиданные иноязычные вставки",
    text: "내 할아버지도 현대(그룹)에서 일하셨고, 내 아버지도 현대에서 일하셨고, 나와 네 어머니도 현대에서 일하고 있으며, 너와 네 자녀, 손주들도 모두 현대에서 일하게 될 거야!"
  }
];

// Глобальное состояние
let quotes = [...DEFAULT_QUOTES];
let currentIndex = -1;
let toastTimeout = null;

// Инициализация Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  if (tg.setHeaderColor) {
    tg.setHeaderColor("#008080");
  }
  if (tg.setBackgroundColor) {
    tg.setBackgroundColor("#008080");
  }
}

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
    // Web Audio может быть заблокирован политикой автоплея
  }
}

// Виброотклик Telegram
function triggerHaptic(type = "light") {
  if (tg && tg.HapticFeedback) {
    if (type === "success") {
      tg.HapticFeedback.notificationOccurred("success");
    } else if (type === "warning") {
      tg.HapticFeedback.notificationOccurred("warning");
    } else {
      tg.HapticFeedback.impactOccurred("medium");
    }
  }
}

// Вспомогательный тост в стиле Win95
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

// Загрузка полного списка цитат с бэкенда
async function loadQuotes() {
  try {
    const res = await fetch("/api/quotes");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        quotes = data;
      }
    }
  } catch (e) {
    console.warn("Локальный режим: используются встроенные цитаты", e);
  }
}

// Вывод случайной цитаты
function displayRandomQuote() {
  if (quotes.length === 0) return;

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

  // Анимация мерцания
  quoteBox.classList.remove("flicker");
  void quoteBox.offsetWidth; // перезапуск CSS анимации
  quoteBox.classList.add("flicker");

  // Обновление контента
  quoteText.textContent = quote.text;
  categoryTag.textContent = `Категория: ${quote.category || "Общий делирий"}`;
  if (counterTag) {
    counterTag.textContent = `Цитата #${quote.id || (currentIndex + 1)}`;
  }
  quoteBox.scrollTop = 0;

  playRetroBeep("click");
  triggerHaptic("medium");
}

// Копирование в буфер обмена
async function copyCurrentQuote() {
  if (currentIndex < 0 || !quotes[currentIndex]) return;
  const text = quotes[currentIndex].text;

  try {
    await navigator.clipboard.writeText(text);
    showToast("✓ Скопировано в буфер обмена!");
    playRetroBeep("chime");
    triggerHaptic("success");
  } catch (err) {
    // Fallback для старых WebView
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
      triggerHaptic("success");
    } catch (e) {
      showToast("Ошибка копирования");
      playRetroBeep("error");
    }
    document.body.removeChild(textarea);
  }
}

// Отправка цитаты в Telegram чат через sendData
function sendQuoteToChat() {
  if (currentIndex < 0 || !quotes[currentIndex]) return;
  const quote = quotes[currentIndex];

  playRetroBeep("chime");
  triggerHaptic("success");

  // Проверяем, запущен ли Mini App внутри Telegram
  if (tg && typeof tg.sendData === "function") {
    // Формируем payload для бота
    const payload = `[${quote.category}] ${quote.text}`;
    try {
      tg.sendData(payload);
    } catch (err) {
      console.error("sendData error:", err);
      showToast("Ошибка отправки через Telegram API");
    }
  } else {
    // Если открыто в обычном браузере
    copyCurrentQuote();
    showToast("sendData работает только в Telegram. Текст скопирован!");
  }
}

// Привязка обработчиков событий
document.addEventListener("DOMContentLoaded", async () => {
  await loadQuotes();

  const btnGenerate = document.getElementById("btn-generate");
  const btnCopy = document.getElementById("btn-copy");
  const btnSendChat = document.getElementById("btn-send-chat");

  const btnClose = document.getElementById("btn-close");
  const btnMin = document.getElementById("btn-minimize");
  const btnMax = document.getElementById("btn-maximize");

  if (btnGenerate) btnGenerate.addEventListener("click", displayRandomQuote);
  if (btnCopy) btnCopy.addEventListener("click", copyCurrentQuote);
  if (btnSendChat) btnSendChat.addEventListener("click", sendQuoteToChat);

  // Кнопки управления окном
  if (btnClose) {
    btnClose.addEventListener("click", () => {
      playRetroBeep("error");
      if (tg && typeof tg.close === "function") {
        tg.close();
      } else {
        showToast("Закрытие окна запрещено системным администратором");
      }
    });
  }

  if (btnMin) {
    btnMin.addEventListener("click", () => {
      playRetroBeep("click");
      showToast("Шизофазия не сворачивается в трей");
    });
  }

  if (btnMax) {
    btnMax.addEventListener("click", () => {
      playRetroBeep("click");
      showToast("Окно уже развернуто на 100% мощности 486DX2");
    });
  }

  // Первая генерация цитаты при запуске
  displayRandomQuote();
});
