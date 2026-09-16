/**
 * Шизо 95: Клинический синтезатор
 * 1. EarthBound Battle Background Engine (SNES Sine Scanline + Smooth Palette Cycling)
 * 2. Процедурный генератор шизофазии на базе CFG и морфемного мутатора (4 профиля, без повторов)
 * 3. Интерактивная среда Windows 95 (Drag & Drop, 8-сторонняя трансформация, Roll-up, Ghost Mode)
 * 4. Web Audio API синтезатор 8-битных звуковых эффектов
 */

// ============================================================================
// 1. Движок EarthBound Battle Background (Photosensitive Safe)
// ============================================================================
class EarthBoundRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });

    // Внутреннее SNES-разрешение для ретро-пикселизации и высокой производительности
    this.width = 256;
    this.height = 224;

    this.offscreen = document.createElement('canvas');
    this.offscreen.width = this.width;
    this.offscreen.height = this.height;
    this.offCtx = this.offscreen.getContext('2d', { willReadFrequently: true });
    this.imgData = this.offCtx.createImageData(this.width, this.height);

    this.time = 0;
    this.surge = 1.0;          // Текущий множитель завихрения
    this.targetSurge = 1.0;    // Целевой множитель
    this.baseAmp = 10.0;       // Базовая амплитуда смещения строк
    this.currentAmp = 10.0;
    this.baseFreq = 0.045;     // Базовая пространственная частота
    this.liveFreqHz = 0.14;    // Частота для отображения в статус-баре

    // Глубокие, мягкие 16-битные палитры в комфортных тонах (без резких вспышек):
    // 1: Индиго / Космос; 2: Изумрудный мох / Нефрит; 3: Приглушённый пурпур / Аметист; 4: Тёмный янтарь / Охра
    this.palettes = [
      // Палитра 1: Deep Indigo & Cyan Drift
      [
        [16, 12, 42], [24, 18, 64], [38, 28, 92], [56, 44, 124],
        [80, 64, 156], [112, 90, 184], [84, 110, 186], [54, 128, 178],
        [36, 118, 158], [24, 96, 134], [18, 68, 102], [14, 44, 76],
        [10, 26, 54], [8, 16, 40], [12, 14, 46], [18, 14, 54]
      ],
      // Палитра 2: Emerald Moss & Bio Jade
      [
        [8, 28, 18], [14, 48, 28], [22, 74, 42], [32, 104, 58],
        [46, 138, 76], [72, 168, 98], [108, 194, 128], [148, 214, 162],
        [116, 198, 172], [78, 168, 168], [48, 132, 152], [32, 98, 126],
        [20, 68, 96], [12, 44, 68], [8, 28, 48], [6, 20, 32]
      ],
      // Палитра 3: Muted Purple & Velvet Delirium
      [
        [24, 10, 36], [46, 18, 66], [74, 26, 100], [108, 38, 134],
        [146, 56, 162], [180, 84, 186], [204, 120, 202], [220, 160, 216],
        [186, 134, 206], [142, 104, 184], [102, 74, 152], [70, 48, 118],
        [46, 30, 86], [30, 18, 60], [20, 12, 42], [14, 8, 30]
      ],
      // Палитра 4: Dark Amber & Ancient Ochre
      [
        [34, 18, 8], [58, 28, 12], [88, 42, 18], [124, 60, 24],
        [162, 82, 32], [198, 112, 48], [224, 148, 74], [238, 182, 112],
        [212, 156, 86], [176, 122, 60], [136, 90, 42], [100, 62, 28],
        [70, 40, 18], [46, 24, 12], [30, 14, 8], [18, 10, 6]
      ]
    ];
    this.paletteIndex = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.start();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.imageSmoothingEnabled = false;
  }

  // Мягкое завихрение пространства при генерации (без вспышек)
  triggerSurge() {
    this.targetSurge = 2.8; // Увеличение амплитуды волны и завихрения
    this.paletteIndex = (this.paletteIndex + 1) % this.palettes.length;
  }

  update() {
    // Плавное приближение множителя к целевому значению
    this.surge += (this.targetSurge - this.surge) * 0.08;
    // Мягкий возврат целевого множителя к исходному 1.0
    if (this.targetSurge > 1.0) {
      this.targetSurge = Math.max(1.0, this.targetSurge - 0.018);
    }

    const baseSpeed = 0.022;
    this.time += baseSpeed * (1.0 + (this.surge - 1.0) * 0.7);

    // Текущая частота колебаний для статус-бара (в пределах 0.12 - 0.85 Гц)
    this.liveFreqHz = 0.12 + (this.surge - 1.0) * 0.38 + 0.03 * Math.sin(this.time);
  }

  render() {
    const data = this.imgData.data;
    const w = this.width;
    const h = this.height;
    const pal = this.palettes[this.paletteIndex];
    const palLen = pal.length;

    const t = this.time;
    const surge = this.surge;

    // Параметры горизонтального синусоидального искажения (Scanline Sine Warp):
    // x' = x + A * sin(k * y + omega * t)
    const A = (this.baseAmp + Math.sin(t * 0.9) * 3.0) * surge;
    const k = this.baseFreq + 0.012 * Math.cos(t * 0.6);
    const omega = 1.8 * surge;

    // Плавное циклирование палитры (Palette Cycling) с непрерывной фазой
    const cyclePhase = t * 4.5 * (1.0 + (surge - 1.0) * 0.5);

    for (let y = 0; y < h; y++) {
      // Горизонтальный синусоидальный сдвиг текущей строки
      const rowShift = Math.sin(k * y + omega * t) * A;
      const yNorm = (y + Math.cos(t * 0.8 + y * 0.035) * 6.0) * 0.032;

      for (let x = 0; x < w; x++) {
        const warpedX = (x + rowShift) * 0.032;

        // Суперпозиция гармонических волн EarthBound
        const wave1 = Math.sin(warpedX + t * 0.65);
        const wave2 = Math.sin(1.15 * (warpedX * Math.cos(t * 0.3) + yNorm * Math.sin(t * 0.4)) + t * 0.9);
        const cx = warpedX + 0.4 * Math.sin(t * 0.3);
        const cy = yNorm + 0.4 * Math.cos(t * 0.25);
        const wave3 = Math.sin(Math.sqrt(cx * cx + cy * cy + 0.8) + t * 1.1);

        const sum = wave1 + wave2 + wave3; // диапазон [-3, 3]

        // Непрерывный индекс цвета с плавным смешиванием (без резких границ)
        const continuousIdx = Math.abs((sum + 3.0) * 2.6 + cyclePhase) % palLen;
        const idxFloor = Math.floor(continuousIdx);
        const idxNext = (idxFloor + 1) % palLen;
        const frac = continuousIdx - idxFloor;

        const c1 = pal[idxFloor];
        const c2 = pal[idxNext];

        // Линейная интерполяция между соседними цветами палитры
        const r = (c1[0] + (c2[0] - c1[0]) * frac) | 0;
        const g = (c1[1] + (c2[1] - c1[1]) * frac) | 0;
        const b = (c1[2] + (c2[2] - c1[2]) * frac) | 0;

        const pixelIdx = (y * w + x) * 4;
        data[pixelIdx]     = r;
        data[pixelIdx + 1] = g;
        data[pixelIdx + 2] = b;
        data[pixelIdx + 3] = 255;
      }
    }

    this.offCtx.putImageData(this.imgData, 0, 0);

    // Рендеринг на полноэкранный холст с ретро-пикселизацией
    this.ctx.drawImage(this.offscreen, 0, 0, this.canvas.width, this.canvas.height);
  }

  start() {
    const loop = () => {
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

// ============================================================================
// 2. CFG & Морфемный генератор шизофазии (4 клинических профиля, без повторов)
// ============================================================================
class SchizoEngine {
  constructor() {
    // Буфер последних сгенерированных фраз для предотвращения повторов
    this.history = [];
    this.maxHistorySize = 40;

    this.lexicon = {
      // 1. Атаксическая инкогеренция (Word Salad)
      salad: {
        subjects: [
          'хромосомный штепсель', 'слюна картофельного сиропа', 'ножницы в зелёном киселе',
          'губчатый падеж', 'сахарный перекос', 'свистящий треугольник снарядов',
          'мадам архивариус под ванной', 'ушная известь', 'лоскутный рефлекс',
          'перламутровый паралич', 'шестипалый бутерброд', 'фосфорный напёрсток',
          'ржавая биссектриса', 'ватный амперметр', 'студенистый кабель'
        ],
        verbs: [
          'полощет в керосине', 'отстёгивает воробья от фаланги', 'пережёвывает известняк',
          'свистит в три ноздри', 'намыливает горизонт', 'склеивает лобные доли',
          'выкручивает изюм из эфира', 'капает гудроном в чай', 'пересаживает кочергу',
          'закручивает суглинок в спираль', 'штопает судорогу нитками', 'смазывает картон квасом'
        ],
        conjunctions: [
          'ибо селезёнка помнит четверг', 'но не трогай ложку за бедро',
          'покуда кудри сохнут на заборе', 'через пятьдесят граммов липкой тишины',
          'оттого и скрипят мостовые у соседей', 'хотя вокзал уже проглочен',
          'и трижды потри локоть о суглинок', 'вопреки инструкции по варке чугуна',
          'поскольку мыло утратило гражданство'
        ]
      },

      // 2. Параноидный неологизм / Технопсихоз
      tech: {
        prefixes: [
          'пере', 'де', 'суб', 'гипер', 'анти', 'квази', 'мульти', 'синхро',
          'термо', 'хроно', 'микро', 'псевдо', 'экстра', 'нано', 'дигитал'
        ],
        roots: [
          'чип', 'гомп', 'нюаш', 'кремн', 'байт', 'стек', 'биос', 'ядро',
          'феррит', 'порт', 'кэш', 'флюс', 'пайп', 'тракт', 'шин', 'резист'
        ],
        suffixes: [
          'ировать', 'ация', 'оидный', 'ированный', 'изатор', 'ируемый',
          'озный', 'ический', 'ящийся', 'оватый', 'ирование'
        ],
        nouns: [
          'карбид кремния', 'стек вызова BIOS', 'порт PS/2', 'кэш DNS',
          'банановое пюре', 'шина PCI-Express', 'пропаянный резистор', 'пайплайн сборки',
          'кнопка на 3 пикселя', 'системный бубен шамана', 'текстуры ядра',
          'кабель витой пары', 'компилятор прерываний', 'термопаста из патоки'
        ],
        actions: [
          'провалился в текстуры прерывания', 'пахнет жареной селёдкой',
          'удалён ради ускорения компиляции', 'требует срочной замены термопасты из патоки',
          'генерирует бесконечный цикл деградации', 'залит эпоксидной смолой до лучших времён',
          'перешёл на протокол бессознательного', 'намертво застрял в кольце прерываний'
        ]
      },

      // 3. Ритуальная латинская вербигерация
      latin: {
        invocations: [
          'Ceterum censeo', 'Ave Caesar', 'Gloria in tenebris', 'Heus tu',
          'Audite omnes', 'O sors immanis', 'Vade retro', 'In nomine'
        ],
        substantives: [
          'bananam', 'machinam lavatrinam', 'Linux kernel', 'Vespertiliovirum',
          'cydere', 'strix nocturna', 'tuber terrae', 'cerebrum syntheticum',
          'carburetorum siliconis', 'vacuum delirium'
        ],
        predicates: [
          'esse manducandam', 'melius est quam vivere sine codice', 'in machinam ne miseris',
          'saniem ex udonibus hauri', 'in saecula peribit', 'semper vigilat',
          'in pulvere deponit', 'aeterno blue screen obdormit', 'omne ferrum consumit'
        ],
        refrains: [
          'In vino veritas, in cydere blue screen of death.',
          'Strix canit, homo vigilant!',
          'Truflas in machinam lavatrinam ne miseris!',
          'Melius est mori quam vivere sine debian package.',
          'Non omne quod nitet silicon est.'
        ]
      },

      // 4. Олигофазический бытовой сюрреализм
      domestic: {
        carolChronicles: [
          'Огурцы Мэра Кэрол выросли. Как сообщает сама Мадам Мэр, в этом году они "вполне нормальные"... Мы держим кулаки за Кэрол.',
          'В третьем подъезде обнаружен портал в 1997 год. Жильцы жалуются на звуки модема и запах варёной сгущёнки.',
          'Пенсионерка нашла в мешке картошки второе сознание и отказалась платить за него по тарифу ЖКХ.',
          'Хуан "Гуапо" де Гваделупа снова вышел на балкон в шубе из макарон.',
          'Банки с соленьями Мэра Кэрол начали тихо передавать азбуку Морзе на ультракоротких волнах.',
          'Мутировавшая ДНК, жирные кислоты и два с половиной стакана бананового пюре.'
        ],
        minnesotaSayings: [
          'Ope, let me just squeeze right past ya.',
          'Well, could be worse, dontcha know!',
          'Tater Tot Hotdish in the oven, dontcha dare touch the thermostat.',
          "Uff da! The snow is up to the gutters, but the lutefisk won't soak itself, ya heard?"
        ],
        koreanDynasties: [
          '내 할아버지도 현대(그룹)에서 일하셨고, 내 아버지도 현대에서 일하셨고, 나와 네 어머니도 현대에서 일하고 있으며, 너와 네 자녀, 손주들도 모두 현대에서 일하게 될 거야!',
          '삼성 반도체 라인 3호기에서 발견된 미확인 규소 유기체가 정규직 전환을 요구하고 있습니다.',
          'LG 디스플레이의 백라이트 속에서 잊혀진 삼국시대의 도공들이 기판을 굽고 있다.'
        ]
      }
    };
  }

  choice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Морфемный генератор неологизмов (Префикс + Корень + Суффикс)
  generateNeologism() {
    const p = this.choice(this.lexicon.tech.prefixes);
    const r = this.choice(this.lexicon.tech.roots);
    const s = this.choice(this.lexicon.tech.suffixes);
    return `${p}${r}${s}`;
  }

  // Процедурный синтез мыслеформы с гарантией отсутствия немедленных повторов
  synthesize(profileIndex) {
    let result = '';
    let attempts = 0;

    do {
      result = this._rawSynthesize(profileIndex);
      attempts++;
    } while (this.history.includes(result) && attempts < 10);

    this.history.push(result);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    return result;
  }

  _rawSynthesize(profileIndex) {
    switch (profileIndex) {
      case 0: { // 1. Атаксическая инкогеренция (Word Salad)
        const s1 = this.choice(this.lexicon.salad.subjects);
        const v1 = this.choice(this.lexicon.salad.verbs);
        const s2 = this.choice(this.lexicon.salad.subjects);
        const v2 = this.choice(this.lexicon.salad.verbs);
        const conj = this.choice(this.lexicon.salad.conjunctions);
        const patterns = [
          `${this.capitalize(s1)} ${v1}, пока ${s2} ${v2}, ${conj}.`,
          `${this.capitalize(s2)} ${v2} — ${conj}, оттого ${s1} ${v1}.`,
          `Внимание: ${s1} уже ${v1}. Никакой пощады, ибо ${s2} ${conj}!`
        ];
        return this.choice(patterns);
      }

      case 1: { // 2. Параноидный неологизм / Технопсихоз
        const neo1 = this.generateNeologism();
        const neo2 = this.generateNeologism();
        const n1 = this.choice(this.lexicon.tech.nouns);
        const n2 = this.choice(this.lexicon.tech.nouns);
        const act = this.choice(this.lexicon.tech.actions);
        const patterns = [
          `Хватит уже ${neo1} ${n1}: ${n2} окончательно ${act}.`,
          `Обнаружен ${neo2}-фактор: ${n1} ${act}, покуда системный стек пытается ${neo1}.`,
          `Критический сбой: ${n1} и ${n2} слились в ${this.generateNeologism()}, после чего порт ${act}.`,
          `Процедура ${neo1} прервана: ${n1} требует срочной замены через ${neo2}.`
        ];
        return this.choice(patterns);
      }

      case 2: { // 3. Ритуальная латинская вербигерация
        if (Math.random() < 0.35) {
          return this.choice(this.lexicon.latin.refrains);
        }
        const inv = this.choice(this.lexicon.latin.invocations);
        const sub = this.choice(this.lexicon.latin.substantives);
        const pred = this.choice(this.lexicon.latin.predicates);
        const formula = `${inv} ${sub} ${pred}!`;
        const post = Math.random() < 0.5 ? ` — ${this.choice(this.lexicon.latin.refrains)}` : '';
        return formula + post;
      }

      case 3: // 4. Олигофазический бытовой сюрреализм
      default: {
        const roll = Math.random();
        if (roll < 0.38) {
          return this.choice(this.lexicon.domestic.carolChronicles);
        } else if (roll < 0.68) {
          const mn = this.choice(this.lexicon.domestic.minnesotaSayings);
          const cr = this.choice(this.lexicon.domestic.carolChronicles);
          return `${mn} (${cr})`;
        } else {
          return this.choice(this.lexicon.domestic.koreanDynasties);
        }
      }
    }
  }

  // Расчёт информационной энтропии Шеннона (бит на символ)
  calculateEntropy(text) {
    if (!text || text.length === 0) return '0.00';
    const freqs = {};
    for (const char of text) {
      freqs[char] = (freqs[char] || 0) + 1;
    }
    let entropy = 0;
    const len = text.length;
    for (const ch in freqs) {
      const p = freqs[ch] / len;
      entropy -= p * Math.log2(p);
    }
    return entropy.toFixed(2);
  }
}

// ============================================================================
// 3. Web Audio API (Аутентичные 8-битные ретро-звуки)
// ============================================================================
class RetroAudio {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  beep(type = 'click') {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const now = this.ctx.currentTime;
      if (type === 'click') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'chime') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);       // Нота C5
        osc.frequency.setValueAtTime(659.25, now + 0.06); // Нота E5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      }
    } catch (e) {
      // Игнорируем в средах без аудио-устройств
    }
  }
}

// ============================================================================
// 4. Менеджер свободного окна Windows 95 (Drag & Drop, 8-сторонняя трансформация)
// ============================================================================
class Win95WindowManager {
  constructor(winElem, titleBarElem) {
    this.win = winElem;
    this.titleBar = titleBarElem;

    // Сохранённые координаты перед разворачиванием
    this.savedGeom = { left: 40, top: 40, width: 420, height: 330 };
    this.isMaximized = false;
    this.isRolledUp = false;

    this.initDefaultPosition();
    this.bindDragging();
    this.bindResizing();
  }

  initDefaultPosition() {
    // Начальное позиционирование: ~420x330px по центру экрана (на десктопе)
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let initW = Math.min(420, vw - 24);
    let initH = Math.min(330, vh - 24);

    let initL = Math.max(12, Math.floor((vw - initW) / 2));
    let initT = Math.max(12, Math.floor((vh - initH) / 2));

    this.win.style.width = `${initW}px`;
    this.win.style.height = `${initH}px`;
    this.win.style.left = `${initL}px`;
    this.win.style.top = `${initT}px`;
  }

  bindDragging() {
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    let isDragging = false;

    const onPointerDown = (e) => {
      // Игнорируем клики по кнопкам управления в шапке
      if (e.target.closest('.title-bar-controls')) return;
      if (this.isMaximized) return;

      isDragging = true;
      startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      const rect = this.win.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('touchmove', onPointerMove, { passive: false });
      window.addEventListener('touchend', onPointerUp);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();

      const curX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const curY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      const dx = curX - startX;
      const dy = curY - startY;

      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      // Ограничение в пределах вьюпорта
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = this.win.offsetWidth;
      newLeft = Math.max(0, Math.min(newLeft, vw - Math.min(w, 80)));
      newTop = Math.max(0, Math.min(newTop, vh - 32));

      this.win.style.left = `${newLeft}px`;
      this.win.style.top = `${newTop}px`;
    };

    const onPointerUp = () => {
      isDragging = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };

    this.titleBar.addEventListener('pointerdown', onPointerDown);
    this.titleBar.addEventListener('touchstart', onPointerDown, { passive: true });
  }

  bindResizing() {
    const handles = this.win.querySelectorAll('.resize-handle');
    const minW = 290;
    const minH = 170;

    handles.forEach((handle) => {
      const dir = handle.dataset.dir;

      const onResizeDown = (e) => {
        e.stopPropagation();
        if (this.isMaximized || this.isRolledUp) return;

        const startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        const startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
        const rect = this.win.getBoundingClientRect();
        const startLeft = rect.left;
        const startTop = rect.top;
        const startWidth = rect.width;
        const startHeight = rect.height;

        const onResizeMove = (ev) => {
          if (ev.cancelable) ev.preventDefault();
          const curX = ev.clientX || (ev.touches && ev.touches[0].clientX) || 0;
          const curY = ev.clientY || (ev.touches && ev.touches[0].clientY) || 0;

          const dx = curX - startX;
          const dy = curY - startY;

          let newW = startWidth;
          let newH = startHeight;
          let newL = startLeft;
          let newT = startTop;

          // Восток
          if (dir.includes('e')) {
            newW = Math.max(minW, startWidth + dx);
          }
          // Запад
          if (dir.includes('w')) {
            const proposedW = startWidth - dx;
            if (proposedW >= minW) {
              newW = proposedW;
              newL = startLeft + dx;
            } else {
              newW = minW;
              newL = startLeft + (startWidth - minW);
            }
          }
          // Юг
          if (dir.includes('s')) {
            newH = Math.max(minH, startHeight + dy);
          }
          // Север
          if (dir.includes('n')) {
            const proposedH = startHeight - dy;
            if (proposedH >= minH) {
              newH = proposedH;
              newT = startTop + dy;
            } else {
              newH = minH;
              newT = startTop + (startHeight - minH);
            }
          }

          this.win.style.width = `${newW}px`;
          this.win.style.height = `${newH}px`;
          this.win.style.left = `${newL}px`;
          this.win.style.top = `${newT}px`;
        };

        const onResizeUp = () => {
          window.removeEventListener('pointermove', onResizeMove);
          window.removeEventListener('pointerup', onResizeUp);
          window.removeEventListener('touchmove', onResizeMove);
          window.removeEventListener('touchend', onResizeUp);
        };

        window.addEventListener('pointermove', onResizeMove, { passive: false });
        window.addEventListener('pointerup', onResizeUp);
        window.addEventListener('touchmove', onResizeMove, { passive: false });
        window.addEventListener('touchend', onResizeUp);
      };

      handle.addEventListener('pointerdown', onResizeDown);
      handle.addEventListener('touchstart', onResizeDown, { passive: true });
    });
  }

  toggleRollup() {
    this.isRolledUp = !this.isRolledUp;
    this.win.classList.toggle('rolled-up', this.isRolledUp);
  }

  toggleMaximize() {
    if (!this.isMaximized) {
      // Сохраняем геометрию
      this.savedGeom = {
        left: parseInt(this.win.style.left, 10) || this.win.offsetLeft,
        top: parseInt(this.win.style.top, 10) || this.win.offsetTop,
        width: parseInt(this.win.style.width, 10) || this.win.offsetWidth,
        height: parseInt(this.win.style.height, 10) || this.win.offsetHeight
      };
      this.isMaximized = true;
      this.win.classList.add('maximized');
    } else {
      this.isMaximized = false;
      this.win.classList.remove('maximized');
      this.win.style.left = `${this.savedGeom.left}px`;
      this.win.style.top = `${this.savedGeom.top}px`;
      this.win.style.width = `${this.savedGeom.width}px`;
      this.win.style.height = `${this.savedGeom.height}px`;
    }
  }

  toggleGhostMode(btnGhost) {
    const isTranslucent = this.win.classList.toggle('translucent');
    if (btnGhost) {
      btnGhost.classList.toggle('active-toggle', isTranslucent);
    }
    return isTranslucent;
  }
}

// ============================================================================
// 5. Инициализация приложения и привязка событий
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('earthbound-canvas');
  const bgEngine = new EarthBoundRenderer(canvas);
  const schizo = new SchizoEngine();
  const audio = new RetroAudio();

  const winElem = document.getElementById('win95-window');
  const titleBarElem = document.getElementById('window-title-bar');
  const winManager = new Win95WindowManager(winElem, titleBarElem);

  const profileSelect = document.getElementById('profile-select');
  const quoteText = document.getElementById('quote-text');
  const quoteBox = document.getElementById('quote-box');
  const toast = document.getElementById('toast-msg');

  const statusEntropy = document.getElementById('status-entropy');
  const statusCoherence = document.getElementById('status-coherence');
  const statusFreq = document.getElementById('status-freq');

  const btnSynthesize = document.getElementById('btn-synthesize');
  const btnCopy = document.getElementById('btn-copy');
  const btnGhost = document.getElementById('btn-ghost');
  const btnMin = document.getElementById('btn-minimize');
  const btnMax = document.getElementById('btn-maximize');
  const btnClose = document.getElementById('btn-close');

  let toastTimer = null;

  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 2200);
  }

  // Обновление строки состояния
  function updateTelemetry(text) {
    const entropy = schizo.calculateEntropy(text);
    // Когерентность мысли в клиническом диапазоне 3.0% - 17.0%
    const coherence = (3.0 + Math.random() * 14.0).toFixed(1);
    const freq = bgEngine.liveFreqHz.toFixed(2);

    statusEntropy.textContent = `H(S): ${entropy} бит`;
    statusCoherence.textContent = `Когерентность: ${coherence}%`;
    statusFreq.textContent = `Волна: ${freq} Гц`;
  }

  // Генерация новой мыслеформы
  function triggerGeneration() {
    audio.beep('click');
    bgEngine.triggerSurge(); // Мягкое реактивное завихрение волны без мерцания

    const profile = parseInt(profileSelect.value, 10);
    const text = schizo.synthesize(profile);

    quoteText.textContent = text;
    quoteBox.scrollTop = 0;

    updateTelemetry(text);

    // Тактильный виброотклик (для Android)
    if (window.AndroidBridge && typeof window.AndroidBridge.vibrate === 'function') {
      window.AndroidBridge.vibrate(30);
    } else if ('vibrate' in navigator) {
      try { navigator.vibrate(30); } catch (e) {}
    }
  }

  // Копирование в буфер обмена
  async function copyQuote() {
    const text = quoteText.textContent;
    if (!text) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      audio.beep('chime');
      showToast('✓ Мыслеформа скопирована в буфер обмена!');

      if (window.AndroidBridge && typeof window.AndroidBridge.vibrate === 'function') {
        window.AndroidBridge.vibrate(40);
      } else if ('vibrate' in navigator) {
        try { navigator.vibrate(40); } catch (e) {}
      }
    } catch (e) {
      showToast('Ошибка копирования буфера обмена');
    }
  }

  // Привязка обработчиков
  if (btnSynthesize) btnSynthesize.addEventListener('click', triggerGeneration);
  if (btnCopy) btnCopy.addEventListener('click', copyQuote);

  if (profileSelect) {
    profileSelect.addEventListener('change', () => {
      triggerGeneration();
    });
  }

  // Кнопка ретро-полупрозрачности (Ghost Mode)
  if (btnGhost) {
    btnGhost.addEventListener('click', () => {
      audio.beep('click');
      const active = winManager.toggleGhostMode(btnGhost);
      showToast(active ? 'Ghost Mode: Вкл (Ретро-полупрозрачность)' : 'Ghost Mode: Выкл');
    });
  }

  // Свернуть в плашку (Roll-up / Shade)
  if (btnMin) {
    btnMin.addEventListener('click', () => {
      audio.beep('click');
      winManager.toggleRollup();
    });
  }

  // Развернуть / Восстановить (Toggle Maximize)
  if (btnMax) {
    btnMax.addEventListener('click', () => {
      audio.beep('click');
      winManager.toggleMaximize();
    });
  }

  // Закрыть процесс
  if (btnClose) {
    btnClose.addEventListener('click', () => {
      audio.beep('click');
      if (window.pywebview && window.pywebview.api && typeof window.pywebview.api.close === 'function') {
        window.pywebview.api.close();
      } else if (window.AndroidBridge && typeof window.AndroidBridge.closeApp === 'function') {
        window.AndroidBridge.closeApp();
      } else {
        showToast('Процесс Shizo95.exe защищён от закрытия');
      }
    });
  }

  // Периодическое мягкое обновление показателя частоты в строке состояния
  setInterval(() => {
    if (statusFreq) {
      statusFreq.textContent = `Волна: ${bgEngine.liveFreqHz.toFixed(2)} Гц`;
    }
  }, 400);

  // Первичный запуск синтеза при старте приложения
  triggerGeneration();
});
