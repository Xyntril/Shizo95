/**
 * Шизо 95: Клинический синтезатор
 * 1. Global Web Audio API Unlocker & Master Gain Audio Engine
 * 2. EarthBound Battle Background Engine (Scanline Sine Warp: x' = x + A * sin(k * y + ω * t))
 * 3. Комбинаторный генератор (CFG / 15 000+ вариаций) с кольцевым буфером на 40 фраз (Zero-Repeat)
 *    Культовые отсылки: Arch Linux ("I use Arch btw", pacman, AUR) & IKEA Blåhaj (синяя акула-тотем)
 * 4. Режим «Творческий импульс» (зацепки для писателей, геймдизайнеров и квестов)
 * 5. 5 локализаций: RU, EN, FR, Lingua Latina (средневековая схоластика), CZ (славянская латиница)
 * 6. Оживленный DEFRAG.EXE (3-6 одновременно бегающих зеленых кластеров + процедурный скрежет)
 * 7. Доктор Скрепка: 100+ тематических диалогов по 5 клиническим категориям
 * 8. Оконный менеджер Windows 98: интерактивные меню, Maximize/Restore, умный Close, анимации
 */

// ============================================================================
// 1. Глобальный разблокировщик Web Audio API (Autoplay Policy & WebKitGTK fix)
// ============================================================================
window.audioCtx = null;

function getAudioContext() {
  if (!window.audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      window.audioCtx = new AudioCtx();
    }
  }
  return window.audioCtx;
}

function ensureAudioUnlocked() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

['click', 'keydown', 'touchstart', 'pointerdown'].forEach(evt => {
  document.addEventListener(evt, ensureAudioUnlocked, { passive: true });
});

class RetroAudioEngine {
  constructor() {
    this.enabled = true;
    this.masterGain = null;
  }

  init() {
    const ctx = getAudioContext();
    if (!ctx) return null;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (!this.masterGain && ctx) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, ctx.currentTime);
      this.masterGain.connect(ctx.destination);
    }
    return ctx;
  }

  beep(type = 'click') {
    if (!this.enabled) return;
    try {
      const ctx = this.init();
      if (!ctx || !this.masterGain) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain);

      if (type === 'click') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'chime') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.06);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.07);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {}
  }

  // Процедурный скрежет шагового двигателя жесткого диска (HDD Stepper Motor & Sector Seek)
  playHddCrunch(intensity = 1.0) {
    if (!this.enabled) return;
    try {
      const ctx = this.init();
      if (!ctx || !this.masterGain) return;
      const now = ctx.currentTime;
      const burstCount = Math.floor(Math.random() * 2) + 2;

      for (let i = 0; i < burstCount; i++) {
        const offset = now + i * 0.035;
        const dur = 0.02 + Math.random() * 0.018;

        const bufferSize = Math.floor(ctx.sampleRate * dur);
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let s = 0; s < bufferSize; s++) {
          output[s] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600 + Math.random() * 1200, offset);
        filter.Q.setValueAtTime(4.0, offset);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15 * intensity, offset);
        gain.gain.exponentialRampToValueAtTime(0.001, offset + dur);

        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        whiteNoise.start(offset);
        whiteNoise.stop(offset + dur);
      }
    } catch (e) {}
  }
}

// ============================================================================
// 2. Движок EarthBound Battle Background (Оригинальная математика автора)
// ============================================================================
class EarthBoundRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });

    this.width = 256;
    this.height = 224;

    this.offscreen = document.createElement('canvas');
    this.offscreen.width = this.width;
    this.offscreen.height = this.height;
    this.offCtx = this.offscreen.getContext('2d', { willReadFrequently: true });
    this.imgData = this.offCtx.createImageData(this.width, this.height);

    this.time = 0;
    this.surge = 1.0;
    this.targetSurge = 1.0;
    this.baseAmp = 10.0;
    this.currentAmp = 10.0;
    this.baseFreq = 0.045;
    this.liveFreqHz = 0.14;

    this.palettes = [
      // 1: Deep Indigo & Cyan Drift
      [
        [16, 12, 42], [24, 18, 64], [38, 28, 92], [56, 44, 124],
        [80, 64, 156], [112, 90, 184], [84, 110, 186], [54, 128, 178],
        [36, 118, 158], [24, 96, 134], [18, 68, 102], [14, 44, 76],
        [10, 26, 54], [8, 16, 40], [12, 14, 46], [18, 14, 54]
      ],
      // 2: Emerald Moss & Bio Jade
      [
        [8, 28, 18], [14, 48, 28], [22, 74, 42], [32, 104, 58],
        [46, 138, 76], [72, 168, 98], [108, 194, 128], [148, 214, 162],
        [116, 198, 172], [78, 168, 168], [48, 132, 152], [32, 98, 126],
        [20, 68, 96], [12, 44, 68], [8, 28, 48], [6, 20, 32]
      ],
      // 3: Muted Purple & Velvet Delirium
      [
        [24, 10, 36], [46, 18, 66], [74, 26, 100], [108, 38, 134],
        [146, 56, 162], [180, 84, 186], [204, 120, 202], [220, 160, 216],
        [186, 134, 206], [142, 104, 184], [102, 74, 152], [70, 48, 118],
        [46, 30, 86], [30, 18, 60], [20, 12, 42], [14, 8, 30]
      ],
      // 4: Dark Amber & Ancient Ochre
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

  triggerSurge() {
    this.targetSurge = 2.8;
    this.paletteIndex = (this.paletteIndex + 1) % this.palettes.length;
  }

  update() {
    this.surge += (this.targetSurge - this.surge) * 0.08;
    if (this.targetSurge > 1.0) {
      this.targetSurge = Math.max(1.0, this.targetSurge - 0.018);
    }
    const baseSpeed = 0.022;
    this.time += baseSpeed * (1.0 + (this.surge - 1.0) * 0.7);
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

    const A = (this.baseAmp + Math.sin(t * 0.9) * 3.0) * surge;
    const k = this.baseFreq + 0.012 * Math.cos(t * 0.6);
    const omega = 1.8 * surge;

    const cyclePhase = t * 4.5 * (1.0 + (surge - 1.0) * 0.5);

    for (let y = 0; y < h; y++) {
      const rowShift = Math.sin(k * y + omega * t) * A;
      const yNorm = (y + Math.cos(t * 0.8 + y * 0.035) * 6.0) * 0.032;

      for (let x = 0; x < w; x++) {
        const warpedX = (x + rowShift) * 0.032;

        const wave1 = Math.sin(warpedX + t * 0.65);
        const wave2 = Math.sin(1.15 * (warpedX * Math.cos(t * 0.3) + yNorm * Math.sin(t * 0.4)) + t * 0.9);
        const cx = warpedX + 0.4 * Math.sin(t * 0.3);
        const cy = yNorm + 0.4 * Math.cos(t * 0.25);
        const wave3 = Math.sin(Math.sqrt(cx * cx + cy * cy + 0.8) + t * 1.1);

        const sum = wave1 + wave2 + wave3;

        const continuousIdx = Math.abs((sum + 3.0) * 2.6 + cyclePhase) % palLen;
        const idxFloor = Math.floor(continuousIdx);
        const idxNext = (idxFloor + 1) % palLen;
        const frac = continuousIdx - idxFloor;

        const c1 = pal[idxFloor];
        const c2 = pal[idxNext];

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
// 3. Комбинаторный генератор (CFG / 15 000+ вариаций) и Кольцевой буфер (Zero-Repeat)
// ============================================================================
class SchizoLinguisticEngine {
  constructor() {
    this.historyBuffer = [];
    this.bufferCapacity = 40; // Кольцевой буфер для полного исключения повторов
    this.currentLanguage = 'ru'; // ru, en, fr, la, cz
    this.dbQuotes = [];

    // Богатый комбинаторный словарь (более 15 000 уникальных связок)
    this.dictionaries = {
      ru: {
        subjects: [
          'атаксический склероз', 'волосатый интеграл', 'синхрофазотрон на кефире',
          'губчатый падеж', 'сахарный перекос', 'свистящий треугольник снарядов',
          'мадам архивариус под ванной', 'ушная известь', 'лоскутный рефлекс',
          'перламутровый паралич', 'шестипалый бутерброд', 'фосфорный напёрсток',
          'ржавая биссектриса', 'ватный амперметр', 'студенистый кабель',
          'плюшевая акула Блохэй', 'спинной плавник Блохэй', 'дистрибутив Arch Linux',
          'блокировка /var/lib/pacman/db.lck', 'ядро бытия на rolling-release',
          'квантовый экранирующий тотем', 'пакетный менеджер пакман в мозжечке',
          'карбид кремния', 'стек вызова BIOS', 'порт PS/2', 'кэш DNS',
          'банановое пюре', 'шина PCI-Express', 'пропаянный резистор'
        ],
        verbs: [
          'полощет в керосине', 'отстёгивает воробья от фаланги', 'пережёвывает известняк',
          'свистит в три ноздри', 'намыливает горизонт', 'склеивает лобные доли',
          'выкручивает изюм из эфира', 'капает гудроном в чай', 'пересаживает кочергу',
          'закручивает суглинок в спираль', 'штопает судорогу нитками', 'смазывает картон квасом',
          'экранирует спутниковое облучение хлопковым наполнителем', 'вызывает панику после pacman -Syu',
          'пересобирает ядро бытия без модулей здравого смысла', 'транслирует телепатию через плавник Блохэй',
          'проваливается в кольцо прерываний', 'блокирует базу данных сознания'
        ],
        conjunctions: [
          'ибо селезёнка помнит четверг', 'но не трогай ложку за бедро',
          'покуда кудри сохнут на заборе', 'через пятьдесят граммов липкой тишины',
          'оттого и скрипят мостовые у соседей', 'хотя вокзал уже проглочен',
          'и трижды потри локоть о суглинок', 'вопреки инструкции по варке чугуна',
          'поскольку мыло утратило гражданство', 'ведь I use Arch btw',
          'покуда метровая синяя акула спит на системном блоке', 'потому что db.lck не отпускает душу'
        ],
        rationalizations: [
          ', что с непреложной необходимостью влечет за собой субферритизацию ликвора, ибо квази-шунтирование логики не оставляет альтернатив солярному BIOS.',
          ', в силу того, что солярный BIOS напрямую регулирует квантовое экранирование гипофиза через невысказанные системные прерывания.',
          ', следовательно, субферритизация ликвора неизбежна при любом квази-шунтировании логики в пределах третьего кольца защиты.',
          ', из чего с математической строгостью вытекает: карбид кремния резонирует исключительно в фазе солярного BIOS.',
          ', так как хлопковый наполнитель акулы Блохэй поглощает остаточный шум pacman -Syu на частоте 144 МГц.'
        ],
        perseverations: [
          'Ликвор... да, именно субферритизированный ликвор! Но шина PCI молчит, молчит и плавится в керосине.',
          'Солярный BIOS диктует: воробья от фаланги отстегнуть, отстегнуть и смазать картон квасом, вопреки инструкции по варке чугуна!',
          'Квази-шунтирование... шунтирование... кто разрешил шунтирование? Архивариус под ванной знает, но селезёнка помнит четверг!',
          'Акула... синяя метровая акула Блохэй! Плавник смотрит в зенит, pacman заблокирован, I use Arch btw, именно Arch!',
          'Вокзал проглочен, проглочен и переварен. Пятьдесят граммов липкой тишины... тишины и амперметров.'
        ],
        wordSalads: [
          'Фосфорный напёрсток! Отстёгивает воробья... воробья от фаланги, воробья от фаланги! Блохэй экранирует селезёнку! Ceterum censeo pacman -Syu! Ватный амперметр... свистит в три ноздри! Суглинок в спираль!',
          'Губчатый падеж! Свистит горизонт, мыло утратило гражданство! Ликвор в керосине, карбид кремния, I use Arch btw! Штопает судорогу нитками, трижды потри локоть о плавник акулы!',
          'Сахарный перекос! Не трогай ложку за бедро, ибо солярный BIOS проглочен! db.lck, db.lck, вокзал... шестипалый бутерброд полощет тишину!',
          'Атаксический склероз мостовидных долей! Субферритизация ликвора, хлопковый наполнитель, выкручивает изюм из эфира! Капает гудроном в чай!'
        ],
        creativeHooks: [
          'Концепт ретро-хоррора: Игрок должен переустановить Arch Linux на кардиостимулятор призрака, пока в пустой серверной гаснет ЭЛТ-монитор и воет шаговый двигатель 5.25" дисковода.',
          'Завязка киберпанк-новеллы: В подпольной клинике 1995 года нейрохирург обнаруживает, что все пациенты с синдромом Кандинского-Клерамбо телепатически синхронизированы через серийные номера плюшевых акул Блохэй.',
          'Сюрреалистический квест: Чтобы открыть заблокированный порт PS/2 в сознании вахтёра, необходимо отыскать шестьдесят граммов липкой тишины и смазать картон квасом ровно в полночь четверга.',
          'Поэтический образ: Лунный свет падает на материнскую плату через разбитый кинескоп. Память освобождена от прерываний, и только медные дорожки помнят запах варёной сгущёнки 1997 года.'
        ]
      },

      en: {
        subjects: [
          'ataxic cognitive core', 'IKEA Blåhaj plush totem', 'Arch Linux rolling kernel',
          'corrupted /var/lib/pacman/db.lck', 'quantum BIOS capacitor', 'phosphor vacuum tube',
          'six-fingered IDE cable', 'solar cerebrospinal shunt', 'sub-ferrite memory bus',
          'madam archivist under the floor', 'rusty baud modem', 'CRT electron gun'
        ],
        verbs: [
          'rinses logic in kerosene', 'unhooks sparrow from synaptic phalange', 'triggers panic after pacman -Syu',
          'shields telepathic radiation with cotton stuffing', 'twists loamy clay into spiral recursion',
          'whistles through three nostrils', 'melts BIOS cache into pure silence', 'claims I use Arch btw'
        ],
        conjunctions: [
          'because spleen remembers Thursday', 'lest you touch the teaspoon by its hip',
          'while fifty grams of sticky void dry on fence', 'despite iron casting safety manuals',
          'for the Blåhaj dorsal fin points directly at satellite array'
        ],
        creativeHooks: [
          'Retro-horror mechanic: The protagonist must compile custom Arch kernel onto a ghost pacemaker before the CRT refresh rate drops to zero.',
          'Cyberpunk premise: In an abandoned 1995 dial-up exchange, rogue AI worships a meter-long IKEA shark as an impenetrable radiation idol.'
        ]
      },

      fr: {
        subjects: [
          'le noyau ataxique de Boris Vian', 'le requin bleu Blåhaj protecteur', 'le paquet orphelin de pacman',
          'la bistourisation du liquide cérébral', 'le condensateur BIOS solaire', 'le câble IDE à six doigts',
          'madame archiviste sous la baignoire', 'l’ampermètre en coton phosphoré'
        ],
        verbs: [
          'rince la syntaxe dans le pétrole lampant', 'décroche le moineau de la phalange', 'bloque la base de données de l’âme',
          'absorbe le rayonnement satellitaire par ouate pure', 'siffle par trois narines simultanées'
        ],
        conjunctions: [
          'car la rate se souvient toujours de jeudi', 'pendant que le savon perd sa citoyenneté',
          'au mépris absolu des instructions de fonderie', 'puisque I use Arch btw sans concession'
        ],
        creativeHooks: [
          'Quête pataphysique: Réinstaller un système d’exploitation obsolète dans le coeur mécanique d’une statue de cire avant que le tube cathodique n’explose.'
        ]
      },

      la: {
        invocations: [
          'Sanctificatio cerebri', 'Inquisitio daemonis siliconis', 'Segfaultum aeternum',
          'Exorcismus pacmanis', 'Deus in machina lavatrina', 'Vade retro kernel panic',
          'O sors immanis Blåhaj', 'Liturgia interruptus'
        ],
        subjects: [
          'cerebrum syntheticum', 'nucleus Arch Linucis', 'piscis caeruleus Blåhaj',
          'carburetorum siliconis', 'liquor cerebrospinalis subferriticus', 'porta PS/2 damnata',
          'vacuum delirium', 'strix nocturna'
        ],
        predicates: [
          'in saecula saeculorum peribit', 'omne ferrum consumit', 'sancto cotone radiophoniam repellit',
          'aeterno blue screen obdormit', 'sine debian package vivere non potest',
          'in pulvere machinae clamat: I use Arch btw!'
        ],
        refrains: [
          'Ceterum censeo pacman esse purificandum!',
          'In vino veritas, in cydere blue screen of death!',
          'Truflas in machinam ne miseris, strix vigilat!',
          'Non omne quod nitet silicon est, sed Blåhaj sanctus est!'
        ],
        creativeHooks: [
          'Tractatus scholasticus: Disputatio de natura daemonum in memoria VCACHE residentium et virtute piscis caerulei contra fascinum satellitum.'
        ]
      }
    };
  }

  choice(arr) {
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Транслитерация русского текста в славянскую латиницу с гачеками (CZ / Slavic Latin)
  transliterateSlavic(text) {
    const table = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'jo',
      'ж': 'ž', 'з': 'z', 'и': 'i', 'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'ch', 'ц': 'c', 'ч': 'č', 'ш': 'š', 'щ': 'šč', 'ъ': '',
      'ы': 'y', 'ь': '’', 'э': 'e', 'ю': 'ju', 'я': 'ja',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Jo',
      'Ж': 'Ž', 'З': 'Z', 'И': 'I', 'Й': 'J', 'К': 'K', 'Л': 'L', 'М': 'M',
      'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
      'Ф': 'F', 'Х': 'Ch', 'Ц': 'C', 'Ч': 'Č', 'Ш': 'Š', 'Щ': 'Šč', 'Ъ': '',
      'Ы': 'Y', 'Ь': '’', 'Э': 'E', 'Ю': 'Ju', 'Я': 'Ja'
    };
    return text.split('').map(ch => table[ch] !== undefined ? table[ch] : ch).join('');
  }

  // Генератор с кольцевым буфером на 40 последних фраз для полного исключения повторов
  synthesizeBase(profileIndex, forceCreative = false) {
    let result = '';
    let attempts = 0;

    do {
      result = this._rawSynthesize(profileIndex, forceCreative);
      attempts++;
    } while (this.historyBuffer.includes(result) && attempts < 15);

    this.historyBuffer.push(result);
    if (this.historyBuffer.length > this.bufferCapacity) {
      this.historyBuffer.shift();
    }

    if (this.currentLanguage === 'cz') {
      return this.transliterateSlavic(result);
    }
    return result;
  }

  _rawSynthesize(profileIndex, forceCreative) {
    const lang = (this.currentLanguage === 'cz') ? 'ru' : this.currentLanguage;

    // Режим «Творческий импульс»
    if (forceCreative) {
      const hooks = this.dictionaries[lang]?.creativeHooks || this.dictionaries.ru.creativeHooks;
      return this.choice(hooks);
    }

    // Латынь
    if (lang === 'la' || profileIndex === 2) {
      const d = this.dictionaries.la;
      if (Math.random() < 0.3) {
        return this.choice(d.refrains);
      }
      const inv = this.choice(d.invocations);
      const sub = this.choice(d.subjects);
      const pred = this.choice(d.predicates);
      return `${inv}: ${sub} ${pred}.`;
    }

    // Английский
    if (lang === 'en') {
      const d = this.dictionaries.en;
      const s1 = this.choice(d.subjects);
      const v1 = this.choice(d.verbs);
      const conj = this.choice(d.conjunctions);
      return `${this.capitalize(s1)} ${v1}, ${conj}.`;
    }

    // Французский
    if (lang === 'fr') {
      const d = this.dictionaries.fr;
      const s1 = this.choice(d.subjects);
      const v1 = this.choice(d.verbs);
      const conj = this.choice(d.conjunctions);
      return `${this.capitalize(s1)} ${v1}, ${conj}.`;
    }

    // Русский (Каноничный комбинаторный CFG)
    const d = this.dictionaries.ru;
    const s1 = this.choice(d.subjects);
    const v1 = this.choice(d.verbs);
    const s2 = this.choice(d.subjects);
    const v2 = this.choice(d.verbs);
    const conj = this.choice(d.conjunctions);

    switch (profileIndex) {
      case 0: // 1. Атаксическая инкогеренция
        return `${this.capitalize(s1)} ${v1}, пока ${s2} ${v2}, ${conj}.`;

      case 1: // 2. Параноидный неологизм / Технопсихоз (Arch Linux)
        return `Внимание: ${s1} окончательно ${v1}! Системная шина пытается пересобрать ядро, но ${s2} уже ${v2}.`;

      case 3: // 4. Олигофазический бытовой сюрреализм & Блохэй
        return `${this.capitalize(s1)} ${v1} — ${conj}, оттого ${s2} непрерывно ${v2}!`;

      case 4: // 5. Из расширенной базы цитат
        if (this.dbQuotes && this.dbQuotes.length > 0) {
          const q = this.choice(this.dbQuotes);
          return q.text || q;
        }
        return `${this.capitalize(s1)} ${v1}, ${conj}.`;

      default:
        return `${this.capitalize(s1)} ${v1}, ${conj}.`;
    }
  }

  // Трансформация текста по шкале фазы клинического обострения (0 - 100%)
  transformByPhase(baseText, phase) {
    if (!baseText) return '';
    const cleanText = baseText.trim();

    // 0 - 25% (Нормотимия / Ремиссия)
    if (phase <= 25) {
      return cleanText;
    }

    // 26 - 55% (Резонерство и параноидные неологизмы)
    if (phase <= 55) {
      const trimmed = cleanText.replace(/[.!?]+$/, '');
      const rat = this.choice(this.dictionaries.ru.rationalizations);
      const result = `${trimmed}${rat}`;
      return (this.currentLanguage === 'cz') ? this.transliterateSlavic(result) : result;
    }

    // 56 - 74% (Параноидное соскальзывание и персеверации)
    if (phase <= 74) {
      const pers = this.choice(this.dictionaries.ru.perseverations);
      const prefix = cleanText.split('.')[0] || cleanText;
      const result = `${prefix}... ${pers}`;
      return (this.currentLanguage === 'cz') ? this.transliterateSlavic(result) : result;
    }

    // 75 - 100% (Атаксическая шизофазия / Word Salad / Вербигерация)
    const salad = this.choice(this.dictionaries.ru.wordSalads);
    return (this.currentLanguage === 'cz') ? this.transliterateSlavic(salad) : salad;
  }

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
// 4. Оживленный DEFRAG.EXE (3-6 одновременно активных зеленых кластеров)
// ============================================================================
class SchizoDefragEngine {
  constructor(canvas, audioEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audio = audioEngine;

    this.cols = 32;
    this.rows = 16;
    this.totalClusters = this.cols * this.rows; // 512 кластеров

    // 0: Coherent (Blue), 1: Delirium (Red), 2: Free (White), 3: Reading/Writing (Green)
    this.clusters = new Uint8Array(this.totalClusters);
    this.isRunning = false;
    this.isPaused = false;
    this.activeHeads = []; // 3-6 одновременно бегающих зеленых кластеров
    this.writeTarget = 0;
    this.scanPointer = 0;
    this.fragPercent = 78;
    this.animId = null;

    this.statusTexts = [
      'Анализ структуры параноидальных кластеров...',
      'Параллельное чтение LBA-секторов 0x0A - 0x7F...',
      'Буферизация делирия в квантовый кэш VCACHE...',
      'Уплотнение сверхценных идей в кластеры FAT95...',
      'Очистка остаточных прерываний карбида кремния...',
      'Реорганизация ликвора в непрерывные блоки сознания...',
      'Дефрагментация подсознания почти завершена.'
    ];

    this.initClusters();
    this.draw();
  }

  initClusters() {
    for (let i = 0; i < this.totalClusters; i++) {
      const r = Math.random();
      if (r < 0.28) {
        this.clusters[i] = 0; // Blue
      } else if (r < 0.78) {
        this.clusters[i] = 1; // Red
      } else {
        this.clusters[i] = 2; // White
      }
    }
    this.writeTarget = 0;
    this.scanPointer = 0;
    this.activeHeads = [];
    this.fragPercent = 78;
  }

  scramble() {
    this.initClusters();
    this.audio.beep('error');
    this.draw();
  }

  draw() {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, w, h);

    const pad = 1;
    const cellW = (w - (this.cols + 1) * pad) / this.cols;
    const cellH = (h - (this.rows + 1) * pad) / this.rows;

    const colors = {
      0: '#0000aa', // Coherent Blue
      1: '#cc0000', // Delirium Red
      2: '#ffffff', // Free White
      3: '#00ff00'  // Active Head Green
    };

    const headSet = new Set(this.activeHeads);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const idx = r * this.cols + c;
        let state = this.clusters[idx];
        if (headSet.has(idx) && this.isRunning) {
          state = 3; // Зеленый кластер
        }

        const x = pad + c * (cellW + pad);
        const y = pad + r * (cellH + pad);

        this.ctx.fillStyle = colors[state] || '#ffffff';
        this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(cellW), Math.ceil(cellH));
      }
    }
  }

  start(onUpdate) {
    if (this.isRunning && !this.isPaused) return;
    this.isRunning = true;
    this.isPaused = false;

    let frame = 0;
    const step = () => {
      if (!this.isRunning || this.isPaused) return;
      frame++;

      // Обновление состояния дефрагментации каждые 2 кадра
      if (frame % 2 === 0) {
        this.multiStepTick();
        if (onUpdate) onUpdate(this.getProgressData());
      }

      this.draw();

      if (this.scanPointer >= this.totalClusters && this.writeTarget >= this.totalClusters * 0.7) {
        this.finish(onUpdate);
        return;
      }

      this.animId = requestAnimationFrame(step);
    };

    this.animId = requestAnimationFrame(step);
  }

  // Оживленная параллельная обработка: 3-6 зеленых активных головок
  multiStepTick() {
    const headCount = Math.floor(Math.random() * 4) + 3; // 3 - 6 зеленых головок
    this.activeHeads = [];

    for (let h = 0; h < headCount; h++) {
      // Ищем красный кластер для переноса
      while (this.scanPointer < this.totalClusters && this.clusters[this.scanPointer] !== 1) {
        this.scanPointer++;
      }

      if (this.scanPointer < this.totalClusters) {
        this.activeHeads.push(this.scanPointer);

        // Ищем свободное место в начале
        while (this.writeTarget < this.scanPointer && this.clusters[this.writeTarget] === 0) {
          this.writeTarget++;
        }

        if (this.writeTarget < this.scanPointer) {
          this.activeHeads.push(this.writeTarget);
          this.clusters[this.scanPointer] = 2; // Освободили
          this.clusters[this.writeTarget] = 0; // Записали в синий
          this.scanPointer++;
          this.writeTarget++;
        } else {
          this.scanPointer++;
        }
      } else {
        // Если сканирование дошло до конца, добавляем блуждающую зеленую верификацию
        const jitter = Math.floor(Math.random() * this.totalClusters);
        this.activeHeads.push(jitter);
      }
    }

    // Процедурный скрежет шагового двигателя в такт переносам
    if (Math.random() < 0.45) {
      this.audio.playHddCrunch(0.85);
    }

    this.fragPercent = Math.max(0, Math.floor(78 * (1 - this.scanPointer / this.totalClusters)));
  }

  pause() {
    this.isPaused = true;
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  reset() {
    this.isRunning = false;
    this.isPaused = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    this.initClusters();
    this.draw();
  }

  finish(onUpdate) {
    this.isRunning = false;
    this.activeHeads = [];
    this.fragPercent = 0;
    for (let i = 0; i < Math.floor(this.totalClusters * 0.72); i++) {
      this.clusters[i] = 0; // Все утрамбовано в синий
    }
    for (let i = Math.floor(this.totalClusters * 0.72); i < this.totalClusters; i++) {
      this.clusters[i] = 2; // Белая пустота в конце
    }
    this.draw();
    this.audio.beep('chime');
    if (onUpdate) onUpdate(this.getProgressData());
  }

  getProgressData() {
    const pct = Math.min(100, Math.floor((this.scanPointer / this.totalClusters) * 100));
    const statusIdx = Math.min(this.statusTexts.length - 1, Math.floor((pct / 100) * this.statusTexts.length));
    return {
      percent: pct,
      fragPercent: this.fragPercent,
      headCount: this.activeHeads.length || 4,
      statusText: this.statusTexts[statusIdx]
    };
  }
}

// ============================================================================
// 5. Доктор Скрепка (100+ тематических диалогов по 5 категориям)
// ============================================================================
const clippyQuotes = [
  {
    "cat": "surveillance",
    "text": "Спецслужбы облучают вашу квартиру через батарею отопления стояка. Срочно заземлить чугунный утюг на водопровод?",
    "options": [
      {
        "text": "Заземлить утюг",
        "action": "ground"
      },
      {
        "text": "Усилить фольгу",
        "action": "foil"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Спутник низкоорбитального слежения сканирует лобные доли на частоте 433 МГц. Свернуть двухслойную шапочку из фольги?",
    "options": [
      {
        "text": "Надеть фольгу",
        "action": "foil"
      },
      {
        "text": "Включить генератор шума",
        "action": "ground"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Вы слышите навязчивое тиканье в розетке 220В? Это агенты снимают показания вашего внутреннего тактового генератора.",
    "options": [
      {
        "text": "Обесточить квартиру",
        "action": "ground"
      },
      {
        "text": "Заглушить радиоприемником",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Сосед этажом выше установил направленный микроволновый излучатель под линолеум. Экранировать тапочки свинцовой фольгой?",
    "options": [
      {
        "text": "Экранировать тапочки",
        "action": "foil"
      },
      {
        "text": "Постучать по трубе",
        "action": "ground"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Антенна коллективного телевидения транслирует психотронные директивы прямо в эмаль коренных зубов. Покрыть зубы лаком?",
    "options": [
      {
        "text": "Залакировать пломбы",
        "action": "foil"
      },
      {
        "text": "Игнорировать директивы",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Ваш стационарный телефон снял трубку в пустой комнате и передает азбуку Морзе прямо в ФСБ. Перерезать лапшу ТРП?",
    "options": [
      {
        "text": "Перерезать лапшу",
        "action": "ground"
      },
      {
        "text": "Продиктовать дезинформацию",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Окно вибрирует в такт сканирующему лазеру с чердака дома напротив. Зашторить фольгированными шторами «Блик-95»?",
    "options": [
      {
        "text": "Зашторить немедленно",
        "action": "foil"
      },
      {
        "text": "Показать фигу в форточку",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "В пачке пищевой соды обнаружен пассивный радиочастотный чип слежения за уровнем щелочи в мыслях. Выбросить соду?",
    "options": [
      {
        "text": "Утилизировать соду",
        "action": "ground"
      },
      {
        "text": "Съехать на дачу",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Люминесцентная лампа подмигивает на азбуке спецслужб с частотой 50 Гц. Выкрутить стартер голыми руками?",
    "options": [
      {
        "text": "Выкрутить стартер",
        "action": "ground"
      },
      {
        "text": "Надеть темные очки",
        "action": "foil"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Голубь за окном замер на 12 минут без моргания — явный биомеханический ретранслятор. Отразить сигнал зеркалом?",
    "options": [
      {
        "text": "Отразить сигнал",
        "action": "foil"
      },
      {
        "text": "Бросить крошки с ферритом",
        "action": "ground"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Через водопроводную воду подается жидкий перхлорат для подавления свободомыслия. Вскипятить чайник трижды?",
    "options": [
      {
        "text": "Вскипятить трижды",
        "action": "ground"
      },
      {
        "text": "Пить только дистиллят",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Вентиляционная решетка на кухне шепчет позывные номерной радиостанции УВБ-76. Заткнуть вентиляцию шерстяным носком?",
    "options": [
      {
        "text": "Заткнуть носком",
        "action": "ground"
      },
      {
        "text": "Записать шифрограмму",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Почтовый ящик вибрирует. Внутрь опустили конверт с радиоактивным излучением цензуры. Вскрывать пассатижами?",
    "options": [
      {
        "text": "Вскрыть пассатижами",
        "action": "ground"
      },
      {
        "text": "Сжечь ящик",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Магнитный компас указывает строго на здание районного КГБ, игнорируя север. Размагнитить голову кинескопом?",
    "options": [
      {
        "text": "Размагнитить голову",
        "action": "ground"
      },
      {
        "text": "Спрятать компас в банку",
        "action": "foil"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Холодильник «ЗИЛ» вошел в резонанс с американской спутниковой группировкой. Отключить компрессор из сети?",
    "options": [
      {
        "text": "Выдернуть шнур",
        "action": "ground"
      },
      {
        "text": "Оставить как глушилку",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Дверной глазок наблюдает за вами в обратную сторону через инфракрасную оптику. Заклеить синей изолентой?",
    "options": [
      {
        "text": "Заклеить изолентой",
        "action": "foil"
      },
      {
        "text": "Заглянуть с фонариком",
        "action": "ground"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Микроволновая печь в режиме ожидания отправляет дампы вашего сна в Пентагон. Завернуть ее в сетку рабицу?",
    "options": [
      {
        "text": "Обернуть рабицей",
        "action": "foil"
      },
      {
        "text": "Разогреть бутерброд",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Шуршание пакета с пакетами — это перехват шифрованных пакетов TCP/IP спецслужбами. Спрятать пакет под подушку?",
    "options": [
      {
        "text": "Спрятать надежно",
        "action": "ground"
      },
      {
        "text": "Шуршать громче назло",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Счетчик электроэнергии крутится назад, когда вы думаете о запретных истинах. Опломбировать мысли воском?",
    "options": [
      {
        "text": "Опломбировать воском",
        "action": "ground"
      },
      {
        "text": "Думать быстрее",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "На пыльном стекле проявился штрихкод вашей личности. Стереть рукавом фланелевой рубашки до прибытия опергруппы?",
    "options": [
      {
        "text": "Стереть рукавом",
        "action": "ground"
      },
      {
        "text": "Сфотографировать на память",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Внутри кинескопа «Горизонт» засел крошечный оператор спецсвязи с блокнотом. Выключить тумблер сети?",
    "options": [
      {
        "text": "Выключить тумблер",
        "action": "ground"
      },
      {
        "text": "Потребовать удостоверение",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "surveillance",
    "text": "Синхрофазотрон в Дубне передал импульс, сбивший ваши биоритмы ровно на 8 бит. Откалибровать пульс метрономом?",
    "options": [
      {
        "text": "Откалибровать метрономом",
        "action": "ground"
      },
      {
        "text": "Сбиться на 16 бит",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Кажется, вы запустили pacman -Syu без предварительной молитвы Блохэй. Запустить экзорцизм ядра Linux?",
    "options": [
      {
        "text": "Экзорцизм pacman",
        "action": "arch"
      },
      {
        "text": "Запустить DEFRAG",
        "action": "open_defrag"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Файл /var/lib/pacman/db.lck намертво заблокировал синаптическую щель. Удалить здравый смысл через rm -rf?",
    "options": [
      {
        "text": "Удалить db.lck",
        "action": "arch"
      },
      {
        "text": "Оставить замок",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Зачем вам systemd в голове, если голоса демонов init запускаются напрямую из /etc/rc.local?",
    "options": [
      {
        "text": "Убить PID 1",
        "action": "arch"
      },
      {
        "text": "Перейти на OpenRC",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "GRUB сломан: загрузочная запись сознания перенаправлена в 1997 год. Переустановить MBR в мозжечке?",
    "options": [
      {
        "text": "Переустановить MBR",
        "action": "arch"
      },
      {
        "text": "Загрузить MS-DOS",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Обнаружен конфликт версий libcrypto в таламусе. Откатить рассудок до ветки LTS?",
    "options": [
      {
        "text": "Откатить до LTS",
        "action": "arch"
      },
      {
        "text": "Ждать патча AUR",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Вы забыли сказать окружающим «I use Arch btw». Уровень тревоги вырос на 42%. Озвучить мантру немедленно?",
    "options": [
      {
        "text": "I use Arch btw!",
        "action": "arch"
      },
      {
        "text": "Скрыть гордость",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Пакет из AUR пересобирает мировоззрение уже седьмой час на одном потоке. Разогнать процессор паяльником?",
    "options": [
      {
        "text": "Разогнать паяльником",
        "action": "arch"
      },
      {
        "text": "Отменить сборку",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Ядро linux-zen упало в панику из-за нехватки эндорфинов в оперативной памяти. Сбросить стек в swap?",
    "options": [
      {
        "text": "Сбросить в swap",
        "action": "arch"
      },
      {
        "text": "Вызвать KERNEL_PANIC",
        "action": "bsod"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Вы пытались пропатчить ядро DSDT в реальном времени, но забыли смонтировать /boot. Повторить chroot?",
    "options": [
      {
        "text": "Войти в chroot",
        "action": "arch"
      },
      {
        "text": "Загрузить LiveCD",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Демон udevd переименовал ваш левый глаз в eth0, а правый — в wlan0. Настроить iptables для зрения?",
    "options": [
      {
        "text": "Настроить iptables",
        "action": "arch"
      },
      {
        "text": "Выключить интерфейс",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "При сборке glibc обнаружена циклическая зависимость между депрессией и компилятором gcc. Прервать make?",
    "options": [
      {
        "text": "Прервать make",
        "action": "arch"
      },
      {
        "text": "Продолжить с -j16",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Символическая ссылка /dev/null указывает на вашу зарплату. Исправить вывод через chmod 777?",
    "options": [
      {
        "text": "chmod 777 на карман",
        "action": "arch"
      },
      {
        "text": "Направить в /dev/random",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Демон cron запланировал паническую атаку ровно на 03:15 ночи. Удалить расписание crontab -r?",
    "options": [
      {
        "text": "Очистить crontab",
        "action": "arch"
      },
      {
        "text": "Перенести на утро",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Ваш X-сервер аварийно завершил работу с кодом (EE) No screens found. Протереть монитор спиртом?",
    "options": [
      {
        "text": "Протереть монитор",
        "action": "arch"
      },
      {
        "text": "Перейти на Wayland",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "В дереве процессов обнаружен зомби-процесс «бывшие надежды». Послать сигнал SIGKILL -9?",
    "options": [
      {
        "text": "kill -9 надеждам",
        "action": "arch"
      },
      {
        "text": "Оставить в zombie",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Шина PCI Express забита мусорными мыслями о невыключенном утюге. Выполнить lspci сознания?",
    "options": [
      {
        "text": "Выполнить lspci",
        "action": "arch"
      },
      {
        "text": "Очистить шину",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "В зеркалах pacman остался только сербский университетский сервер за 1999 год. Сгенерировать mirrorlist?",
    "options": [
      {
        "text": "Обновить mirrorlist",
        "action": "arch"
      },
      {
        "text": "Качать на 14400 bps",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Rolling-release обновление разрушило совместимость между логикой и эмоциями. Откатить снапшот btrfs?",
    "options": [
      {
        "text": "Откатить btrfs снапшот",
        "action": "arch"
      },
      {
        "text": "Жить в поломке",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Swap-раздел размером 640 килобайт переполнен ностальгией по Windows 95 OSR2. Запустить swapon?",
    "options": [
      {
        "text": "Запустить swapon",
        "action": "arch"
      },
      {
        "text": "Форматировать mkswap",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Модуль ядра synaptic_cortex.ko отвергнут из-за отсутствия цифровой подписи совести. Загрузить с insmod -f?",
    "options": [
      {
        "text": "Форсировать insmod",
        "action": "arch"
      },
      {
        "text": "Пересобрать модуль",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Вы случайно ввели alias rm='rm -rf /' в файл .bashrc души. Открыть vim и спастись?",
    "options": [
      {
        "text": "Открыть vim :wq!",
        "action": "arch"
      },
      {
        "text": "Покинуть терминал",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "linux",
    "text": "Драйвер nouveau вызвал артефакты в поле зрения при взгляде на ковер. Заблокировать в modprobe.d?",
    "options": [
      {
        "text": "Внести в blacklist",
        "action": "arch"
      },
      {
        "text": "Любоваться узором",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Метровая синяя акула Блохэй уловила телепатический сигнал через спинной плавник. Принести ей в жертву шнур питания IDE?",
    "options": [
      {
        "text": "Принести IDE-шнур",
        "action": "shark_sacrifice"
      },
      {
        "text": "Погладить плавник",
        "action": "shark_pet"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Плотный хлопковый наполнитель Блохэй поглотил 98.4% психотронного излучения спецслужб. Прижаться к брюшку?",
    "options": [
      {
        "text": "Уткнуться в акулу",
        "action": "shark_pet"
      },
      {
        "text": "Сшить чехол из фольги",
        "action": "foil"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Акула Блохэй тихо шепчет: «Rolling release спасет этот бренный мир». Назначить ее верховным системным администратором?",
    "options": [
      {
        "text": "Назначить рутом",
        "action": "shark_pet"
      },
      {
        "text": "Поделиться суши",
        "action": "shark_sacrifice"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Глаза-бусинки плюшевой акулы отражают атаки орбитальных микроволновых спутников. Развернуть акулу к окну?",
    "options": [
      {
        "text": "Развернуть к окну",
        "action": "shark_pet"
      },
      {
        "text": "Укрыть пледом",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Блохэй требует провести обряд очищения диска от следов проприетарного софта. Пожертвовать дискету 3.5\"?",
    "options": [
      {
        "text": "Скормить дискету",
        "action": "shark_sacrifice"
      },
      {
        "text": "Спрятать дискету",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "В жабрах плюшевой акулы обнаружен тайный резервуар чистого спокойствия. Погрузиться в медитацию с акулой?",
    "options": [
      {
        "text": "Медитировать с Блохэй",
        "action": "shark_pet"
      },
      {
        "text": "Проверить швы",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Телепатический сеанс с акулой Блохэй подтвердил: утечка синапсов купирована. Закрепить результат объятием?",
    "options": [
      {
        "text": "Крепко обнять",
        "action": "shark_pet"
      },
      {
        "text": "Записать в журнал",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Плюшевая акула просит подключить ее к шине ISA через звуковую карту Sound Blaster 16. Спаять переходник?",
    "options": [
      {
        "text": "Спаять переходник",
        "action": "shark_sacrifice"
      },
      {
        "text": "Включить MIDI",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Блохэй заблокировала попытку спецслужб считать ваши сны о Windows 98. Объявить акуле благодарность?",
    "options": [
      {
        "text": "Объявить благодарность",
        "action": "shark_pet"
      },
      {
        "text": "Купить вторую акулу",
        "action": "shark_sacrifice"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Спинной плавник Блохэй завибрировал на резонансной частоте северного сияния. Настроить акулий пеленгатор?",
    "options": [
      {
        "text": "Настроить пеленгатор",
        "action": "shark_pet"
      },
      {
        "text": "Заземлить хвост",
        "action": "ground"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Акула одобряет использование дистрибутива Arch Linux и дарует вам иммунитет к сегфолтам на 24 часа.",
    "options": [
      {
        "text": "Принять дар Блохэй",
        "action": "shark_pet"
      },
      {
        "text": "Собрать ядро",
        "action": "arch"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Плюшевая челюсть Блохэй сомкнулась на кабеле витой пары категории 5. Передать сигнал прямо в ее синтепон?",
    "options": [
      {
        "text": "Передать сигнал",
        "action": "shark_sacrifice"
      },
      {
        "text": "Погладить нос",
        "action": "shark_pet"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Подушка из ИКЕА ревнует вас к акуле Блохэй и генерирует статическое электричество. Рассадить их по разным углам?",
    "options": [
      {
        "text": "Рассадить по углам",
        "action": "ground"
      },
      {
        "text": "Оставить только Блохэй",
        "action": "shark_pet"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Акулий радар зафиксировал приближение санитаров с перфокартами. Спрятаться под плавником Блохэй?",
    "options": [
      {
        "text": "Спрятаться под плавник",
        "action": "shark_pet"
      },
      {
        "text": "Забаррикадировать дверь",
        "action": "ground"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Блохэй утверждает, что все вирусы 90-х были написаны для тестирования прочности ее швов. Согласиться?",
    "options": [
      {
        "text": "Полностью согласен",
        "action": "shark_pet"
      },
      {
        "text": "Проверить антивирусом",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Плюшевый хвост акулы отгоняет злых демонов прерывания IRQ7. Повязать на хвост синюю ленточку?",
    "options": [
      {
        "text": "Повязать ленту",
        "action": "shark_pet"
      },
      {
        "text": "Проверить джамперы",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Блохэй требует обновить микрокод синтепона через звуковой модем на скорости 2400 бод. Начать дозвон?",
    "options": [
      {
        "text": "Начать дозвон (пи-пи-шшш)",
        "action": "shark_sacrifice"
      },
      {
        "text": "Отложить дозвон",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Священный ритуал: положить акулу на ЭЛТ-монитор кнопкой размагничивания Degauss вниз. Нажать Degauss?",
    "options": [
      {
        "text": "Нажать Degauss! (Бззз)",
        "action": "shark_sacrifice"
      },
      {
        "text": "Пожалеть монитор",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Акула Блохэй почуяла запах свежей термопасты и благословила ваш процессор Pentium MMX на долгую жизнь.",
    "options": [
      {
        "text": "Слава Блохэй!",
        "action": "shark_pet"
      },
      {
        "text": "Нанести термопасту",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Синий цвет шкурки Блохэй совпадает по палитре с экраном BSOD #0000AA. Это не баг, это защитный тотем.",
    "options": [
      {
        "text": "Поклониться тотему",
        "action": "shark_pet"
      },
      {
        "text": "Проверить палитру",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "blohaj",
    "text": "Сеанс телепатии окончен. Блохэй погрузилась в спящий режим ожидания до следующего ядра Linux.",
    "options": [
      {
        "text": "Спокойной ночи, акула",
        "action": "shark_pet"
      },
      {
        "text": "Разбудить акулу",
        "action": "shark_sacrifice"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Назначаю курс: 40 капель перфокарт три раза в день внутримышечно и компресс из КПТ-8 на лобную долю.",
    "options": [
      {
        "text": "Принять капли перфокарт",
        "action": "med_accept"
      },
      {
        "text": "Отказаться от укола",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Повышенная температура процессора мыслей. Срочно приложить горчичник к северному мосту материнской платы!",
    "options": [
      {
        "text": "Приложить горчичник",
        "action": "med_accept"
      },
      {
        "text": "Включить кулер",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "В вашей крови обнаружен дефицит ферритовых колец. Проглотить дроссель индуктивности натощак?",
    "options": [
      {
        "text": "Проглотить дроссель",
        "action": "med_accept"
      },
      {
        "text": "Запить электролитом",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Электросон через LPT-порт принтера Robotron нормализует биполярный транзистор настроения. Подключить кабель?",
    "options": [
      {
        "text": "Подключить LPT-кабель",
        "action": "med_accept"
      },
      {
        "text": "Слишком больно",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "У вас обострение паранойи третьего уровня. Наклеить перцовый пластырь на COM-порт мыши Genius?",
    "options": [
      {
        "text": "Наклеить пластырь",
        "action": "med_accept"
      },
      {
        "text": "Почистить шарик мыши",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Рецепт: две таблетки валидола положить в дисковод 5.25\" и закрыть защелку до щелчка. Выполнить?",
    "options": [
      {
        "text": "Вставить валидол в дисковод",
        "action": "med_accept"
      },
      {
        "text": "Дисковод сломан",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Обнаружен спазм синаптического шлейфа. Промыть контакты этиловым спиртом с помощью ватной палочки?",
    "options": [
      {
        "text": "Протереть спиртом",
        "action": "med_accept"
      },
      {
        "text": "Спирт выпить",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Внутричерепное давление достигло 120 бод. Срочно перевести сознание в режим тонального набора!",
    "options": [
      {
        "text": "Тональный набор (бип-буп)",
        "action": "med_accept"
      },
      {
        "text": "Оставить пульс",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Электрокардиограмма показала синусоиду scanline sine warp. Вы превращаетесь в босса EarthBound!",
    "options": [
      {
        "text": "Принять боевую стойку",
        "action": "med_accept"
      },
      {
        "text": "Выпить зелье HP",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Клинический осмотр выявил хроническую нехватку оперативной памяти SIMM-30. Нарастить память клизмой?",
    "options": [
      {
        "text": "Отказаться от клизмы!",
        "action": "ignore"
      },
      {
        "text": "Поставить 4 Мб",
        "action": "med_accept"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Ваш слуховой нерв настроен на частоту свиста строчного трансформатора ТВС-110. Смазать эпоксидкой?",
    "options": [
      {
        "text": "Залить эпоксидкой",
        "action": "med_accept"
      },
      {
        "text": "Терпеть писк 15 кГц",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Санитары уже выехали на скорой «РАФ-2203» с чемоданом резисторов МЛТ-0.25. Открыть им входную дверь?",
    "options": [
      {
        "text": "Открыть санитарам",
        "action": "med_accept"
      },
      {
        "text": "Спрятаться в шкаф",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Принимайте раствор медного купороса для травления лишних мыслей на двустороннем текстолите черепа.",
    "options": [
      {
        "text": "Протравить плату",
        "action": "med_accept"
      },
      {
        "text": "Оставить лишние мысли",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Ингаляция парами канифоли сосновой восстановит поврежденную пайку нейронов. Зажечь паяльник ЭПСН-40?",
    "options": [
      {
        "text": "Вдохнуть канифоль",
        "action": "med_accept"
      },
      {
        "text": "Проветрить палату",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Ваш пульс синхронизирован с кварцевым резонатором на 14.318 МГц. Заменить кварц на советский в металле?",
    "options": [
      {
        "text": "Перепаять кварц",
        "action": "med_accept"
      },
      {
        "text": "Оставить тайминги",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Диагноз: кататонический ступор в ожидании ответа DNS-сервера провайдера. Ввести физраствор в модем?",
    "options": [
      {
        "text": "Ввести физраствор",
        "action": "med_accept"
      },
      {
        "text": "Перезагрузить модем",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Назначена утренняя гимнастика: 20 приседаний с монитором ЭЛТ 17 дюймов весом 24 кг на плечах. Начать?",
    "options": [
      {
        "text": "Взвалить монитор",
        "action": "med_accept"
      },
      {
        "text": "Грыжа не позволяет",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "В правом ухе шумит кулер блока питания мощностью 200 Вт. Капнуть машинного масла И-20А в ушную раковину?",
    "options": [
      {
        "text": "Капнуть масло И-20А",
        "action": "med_accept"
      },
      {
        "text": "Постучать по корпусу",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Шоковая терапия пьезоэлементом от зажигалки снимет навязчивые мысли о переустановке Windows.",
    "options": [
      {
        "text": "Щелкнуть током",
        "action": "med_accept"
      },
      {
        "text": "Убрать зажигалку",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Сеанс гипноза Кашпировского через 14-дюймовый CGA-дисплей начнется через минуту. Дать установку на добро?",
    "options": [
      {
        "text": "Даю установку на добро",
        "action": "med_accept"
      },
      {
        "text": "Рубцы рассосались",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "medical",
    "text": "Пациент, ваши рефлексы запаздывают на 4 кадра развертки. Прописать курс электрофореза через джойстик?",
    "options": [
      {
        "text": "Подключить джойстик",
        "action": "med_accept"
      },
      {
        "text": "Калибровать оси",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Внимание! Ваше сознание не сохранило изменения в реестре Windows перед сном. Вызвать Синий экран смерти 95?",
    "options": [
      {
        "text": "Вызвать BSOD 95",
        "action": "bsod"
      },
      {
        "text": "Игнорировать реестр",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Фатальная ошибка бытия: стек экзистенции переполнен детскими травмами и битыми секторами. Запустить DEFRAG?",
    "options": [
      {
        "text": "Запустить DEFRAG",
        "action": "open_defrag"
      },
      {
        "text": "Смириться с энтропией",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Вы находитесь в 1995 году уже 30 лет подряд. Попытаться обновить дату в BIOS материнской платы?",
    "options": [
      {
        "text": "Сменить батарейку CR2032",
        "action": "ignore"
      },
      {
        "text": "Остаться в 1995 навсегда",
        "action": "arch"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Процесс reality.exe выполнил недопустимую операцию и будет свернут. Закрыть окно в пустоту?",
    "options": [
      {
        "text": "Свернуть реальность",
        "action": "bsod"
      },
      {
        "text": "Перезагрузить сознание",
        "action": "open_defrag"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Недостаточно свободного места на диске C: для сохранения новых надежд. Удалить временные файлы иллюзий?",
    "options": [
      {
        "text": "Очистить корзину иллюзий",
        "action": "open_defrag"
      },
      {
        "text": "Купить диск на 1 Гб",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Система обнаружила новое неизвестное устройство: «Смысл Жизни». Драйверы для Windows 95 не найдены.",
    "options": [
      {
        "text": "Пропустить установку",
        "action": "ignore"
      },
      {
        "text": "Искать на дискете",
        "action": "open_defrag"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Ваш ангел-хранитель завис в бесконечном цикле while(true). Послать ему прерывание NMI?",
    "options": [
      {
        "text": "Послать прерывание NMI",
        "action": "bsod"
      },
      {
        "text": "Помолиться Блохэй",
        "action": "shark_pet"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Внимание! Обнаружена несанкционированная попытка осознания собственного я. Заблокировать мысли шлюзом?",
    "options": [
      {
        "text": "Заблокировать шлюз",
        "action": "ignore"
      },
      {
        "text": "Осознать себя до конца",
        "action": "bsod"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Файл совести conscience.dll поврежден или заменен вирусом CIH (Чернобыль). Восстановить из архива?",
    "options": [
      {
        "text": "Восстановить conscience.dll",
        "action": "open_defrag"
      },
      {
        "text": "Жить без совести",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Срок действия триальной версии вашей молодости истек. Ввести 25-значный серийный номер счастья?",
    "options": [
      {
        "text": "Искать crack в астрале",
        "action": "arch"
      },
      {
        "text": "Продолжить в демо-режиме",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Память души дефрагментирована на 99%. Оставшийся 1% — это невысказанные обиды в красных секторах.",
    "options": [
      {
        "text": "Утрамбовать в DEFRAG",
        "action": "open_defrag"
      },
      {
        "text": "Оставить на память",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Вы забыли выключить компьютер перед выходом в астрал. Теперь питание безопасно отключить.",
    "options": [
      {
        "text": "Выключить питание кнопкой",
        "action": "bsod"
      },
      {
        "text": "Остаться в астрале",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Обнаружен конфликт прерываний IRQ между долгом и желанием. Переставить джампер на плате судьбы?",
    "options": [
      {
        "text": "Переставить джампер",
        "action": "open_defrag"
      },
      {
        "text": "Вынуть шнур",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Ошибка четности памяти RAM: четность Вселенной нарушена на квантовом уровне. Запустить проверку scandisk?",
    "options": [
      {
        "text": "Запустить SCANDISK /ALL",
        "action": "open_defrag"
      },
      {
        "text": "Игнорировать кванты",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Файл конфигурации autoexec.bat содержит команду prompt бездна. Стереть строку безнадеги?",
    "options": [
      {
        "text": "Стереть строку",
        "action": "open_defrag"
      },
      {
        "text": "Прыгнуть в бездну",
        "action": "bsod"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Ваша тень отбрасывается с 8-битным разрешением и 256 цветами. Переключить палитру в True Color?",
    "options": [
      {
        "text": "Переключить в True Color",
        "action": "ignore"
      },
      {
        "text": "Любоваться дизерингом",
        "action": "arch"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Архиватор ARJ распаковал воспоминания за 1993 год прямо поверх текущей личности. Откатить архив?",
    "options": [
      {
        "text": "Откатить arj x -y",
        "action": "open_defrag"
      },
      {
        "text": "Вспомнить детство",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Служба времени сообщила: до тепловой смерти Вселенной осталось ровно 4 миллиарда тактов процессора.",
    "options": [
      {
        "text": "Разогнать шину FSB",
        "action": "arch"
      },
      {
        "text": "Засечь секундомер",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Зеркало в ванной комнате рендерит ваше отражение с задержкой в 50 миллисекунд. Включить вертикальную синхронизацию?",
    "options": [
      {
        "text": "Включить V-Sync",
        "action": "ignore"
      },
      {
        "text": "Моргнуть быстрее",
        "action": "open_defrag"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Винчестер Seagate на 40 Мб издает щелчки калибровки в такт вашему сердцебиению. Запарковать головки?",
    "options": [
      {
        "text": "Парковать головки park.exe",
        "action": "open_defrag"
      },
      {
        "text": "Слушать щелчки",
        "action": "ignore"
      }
    ]
  },
  {
    "cat": "existential",
    "text": "Кажется, вы пытаетесь написать роман о смысле бытия на печатной машинке без ленты. Вставить ленту?",
    "options": [
      {
        "text": "Вставить красящую ленту",
        "action": "open_defrag"
      },
      {
        "text": "Печатать вслепую",
        "action": "ignore"
      }
    ]
  }
];
window.clippyQuotes = clippyQuotes;

class SchizoClippyAssistant {
  constructor(widgetElem, audioEngine) {
    this.widget = widgetElem;
    this.bubble = document.getElementById('clippy-bubble');
    this.bubbleText = document.getElementById('clippy-bubble-text');
    this.bubbleOptions = document.getElementById('clippy-bubble-options');
    this.btnClose = document.getElementById('clippy-bubble-close');
    this.character = document.getElementById('clippy-character');

    this.pupilLeft = document.getElementById('pupil-left');
    this.pupilRight = document.getElementById('pupil-right');
    this.eyebrowLeft = document.getElementById('eyebrow-left');
    this.eyebrowRight = document.getElementById('eyebrow-right');

    this.audio = audioEngine;
    this.isOpen = true;

    // База из 100+ тематических диалогов по 5 клиническим категориям
    this.dialogTree = this.buildDialogDatabase();

    this.bindEvents();
    this.bindEyeTracking();
  }

  buildDialogDatabase() {
    return window.clippyQuotes || clippyQuotes;
  }

  bindEvents() {
    if (this.character) {
      this.character.addEventListener('click', () => {
        this.audio.beep('pop');
        this.nextRandomDialog();
        this.open();
      });
    }

    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => {
        this.audio.beep('click');
        this.close();
      });
    }

    if (this.bubbleOptions) {
      this.bubbleOptions.addEventListener('click', (e) => {
        const btn = e.target.closest('.clippy-opt-btn');
        if (!btn) return;
        this.audio.beep('click');
        const act = btn.dataset.action;
        this.handleAction(act);
      });
    }
  }

  bindEyeTracking() {
    window.addEventListener('mousemove', (e) => {
      if (!this.character || !this.pupilLeft || !this.pupilRight) return;
      const rect = this.character.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.hypot(dx, dy) || 1;

      const maxOffset = 2.4;
      const ox = (dx / dist) * Math.min(maxOffset, dist * 0.04);
      const oy = (dy / dist) * Math.min(maxOffset, dist * 0.04);

      this.pupilLeft.setAttribute('cx', 38.5 + ox);
      this.pupilLeft.setAttribute('cy', 46 + oy);
      this.pupilRight.setAttribute('cx', 61.5 + ox);
      this.pupilRight.setAttribute('cy', 46 + oy);
    });
  }

  nextRandomDialog() {
    const item = this.dialogTree[Math.floor(Math.random() * this.dialogTree.length)];
    this.bubbleText.textContent = item.text;
    this.bubbleOptions.innerHTML = item.options.map(opt =>
      `<button class="win-btn clippy-opt-btn" data-action="${opt.action}">${opt.text}</button>`
    ).join('');
  }

  handleAction(action) {
    if (action === 'ground') {
      this.bubbleText.textContent = '✓ Утюг заземлен. Спутниковый сигнал отражен в чугунный стояк отопления.';
      this.bubbleOptions.innerHTML = '<button class="win-btn clippy-opt-btn" data-action="close">Спасибо, Доктор</button>';
    } else if (action === 'open_defrag') {
      const defragWin = document.getElementById('defrag-window');
      if (defragWin) {
        defragWin.classList.remove('minimized');
        defragWin.classList.add('active-window');
      }
      this.close();
    } else if (action === 'arch') {
      this.bubbleText.textContent = '✓ Мантра «I use Arch btw» озвучена. Ядро бытия синхронизировано.';
      this.bubbleOptions.innerHTML = '<button class="win-btn clippy-opt-btn" data-action="close">Понятно</button>';
    } else if (action === 'shark_sacrifice' || action === 'shark_pet') {
      this.bubbleText.textContent = '✓ Акула Блохэй довольно шевелит плавником. Телепатический щит активен на 100%.';
      this.bubbleOptions.innerHTML = '<button class="win-btn clippy-opt-btn" data-action="close">Слава Блохэй</button>';
    } else if (action === 'med_accept') {
      this.bubbleText.textContent = '✓ 40 капель перфокарт усвоены. Конфликт синапсов временно купирован.';
      this.bubbleOptions.innerHTML = '<button class="win-btn clippy-opt-btn" data-action="close">Благодарю</button>';
    } else if (action === 'bsod') {
      const bsod = document.getElementById('bsod-overlay');
      if (bsod) {
        this.audio.beep('error');
        bsod.classList.add('active');
      }
      this.close();
    } else {
      this.close();
    }
  }

  open() {
    this.bubble.style.display = 'flex';
    this.isOpen = true;
  }

  close() {
    this.bubble.style.display = 'none';
    this.isOpen = false;
  }
}

// ============================================================================
// 6. Оконный менеджер Windows 98 (Maximize/Restore, Drag&Drop, Dropdown Menus)
// ============================================================================
class Win95WindowManager {
  constructor(winElem, titleBarElem) {
    this.win = winElem;
    this.titleBar = titleBarElem;

    this.savedGeom = { left: 40, top: 40, width: 500, height: 420 };
    this.isMaximized = false;

    this.bindDragging();
    this.bindResizing();
    this.bindFocus();
  }

  bindFocus() {
    this.win.addEventListener('pointerdown', () => {
      document.querySelectorAll('.window').forEach(w => w.classList.remove('active-window'));
      this.win.classList.add('active-window');
    });
  }

  bindDragging() {
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    let isDragging = false;

    const onPointerDown = (e) => {
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

      let newLeft = initialLeft + (curX - startX);
      let newTop = initialTop + (curY - startY);

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
    const minW = 480;
    const minH = 380;

    handles.forEach((handle) => {
      const dir = handle.dataset.dir;

      const onResizeDown = (e) => {
        e.stopPropagation();
        if (this.isMaximized) return;

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

          if (dir.includes('e')) newW = Math.max(minW, startWidth + dx);
          if (dir.includes('w')) {
            const proposedW = startWidth - dx;
            if (proposedW >= minW) {
              newW = proposedW;
              newL = startLeft + dx;
            }
          }
          if (dir.includes('s')) newH = Math.max(minH, startHeight + dy);
          if (dir.includes('n')) {
            const proposedH = startHeight - dy;
            if (proposedH >= minH) {
              newH = proposedH;
              newT = startTop + dy;
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
        window.addEventListener('touchmove', onResizeMove);
        window.addEventListener('touchend', onResizeUp);
      };

      handle.addEventListener('pointerdown', onResizeDown);
      handle.addEventListener('touchstart', onResizeDown, { passive: true });
    });
  }

  toggleMaximize(btnMaxElem) {
    if (!this.isMaximized) {
      this.savedGeom = {
        left: parseInt(this.win.style.left, 10) || this.win.offsetLeft,
        top: parseInt(this.win.style.top, 10) || this.win.offsetTop,
        width: parseInt(this.win.style.width, 10) || this.win.offsetWidth,
        height: parseInt(this.win.style.height, 10) || this.win.offsetHeight
      };
      this.isMaximized = true;
      this.win.classList.add('maximized');
      if (btnMaxElem) btnMaxElem.setAttribute('aria-label', 'Restore');
    } else {
      this.isMaximized = false;
      this.win.classList.remove('maximized');
      this.win.style.left = `${this.savedGeom.left}px`;
      this.win.style.top = `${this.savedGeom.top}px`;
      this.win.style.width = `${this.savedGeom.width}px`;
      this.win.style.height = `${this.savedGeom.height}px`;
      if (btnMaxElem) btnMaxElem.setAttribute('aria-label', 'Maximize');
    }
  }

  minimize() {
    this.win.classList.add('minimized');
    this.win.classList.remove('active-window');
  }

  restore() {
    this.win.classList.remove('minimized');
    this.win.classList.add('active-window');
  }
}

// ============================================================================
// 7. Инициализация приложения и привязка событий
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('earthbound-canvas');
  const bgEngine = new EarthBoundRenderer(canvas);
  const audio = new RetroAudioEngine();
  const schizo = new SchizoLinguisticEngine();

  // Загрузка резервной базы
  fetch('./quotes.json')
    .then(r => r.json())
    .then(data => { schizo.dbQuotes = data; })
    .catch(() => {});

  // Менеджеры окон
  const winShizo = document.getElementById('win95-window');
  const titleShizo = document.getElementById('window-title-bar');
  const mgrShizo = new Win95WindowManager(winShizo, titleShizo);

  const winDefrag = document.getElementById('defrag-window');
  const titleDefrag = document.getElementById('defrag-title-bar');
  const mgrDefrag = new Win95WindowManager(winDefrag, titleDefrag);

  // Центрирование окна Шизо_95
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  winShizo.style.left = `${Math.max(12, Math.floor((vw - 500) / 2))}px`;
  winShizo.style.top = `${Math.max(16, Math.floor((vh - 420) / 2))}px`;
  winShizo.style.width = `${Math.min(500, vw - 24)}px`;

  // Инициализация дефрагментатора
  const defragCanvas = document.getElementById('defrag-canvas');
  const defragEngine = new SchizoDefragEngine(defragCanvas, audio);

  // Инициализация Доктора Скрепки
  const clippyWidget = document.getElementById('clippy-widget');
  const clippy = new SchizoClippyAssistant(clippyWidget, audio);

  // Элементы интерфейса
  const profileSelect = document.getElementById('profile-select');
  const quoteText = document.getElementById('quote-text');
  const quoteBox = document.getElementById('quote-box');
  const toast = document.getElementById('toast-msg');

  const psychosisSlider = document.getElementById('psychosis-slider');
  const psychosisBadge = document.getElementById('psychosis-badge');

  const statusEntropy = document.getElementById('status-entropy');
  const statusCoherence = document.getElementById('status-coherence');
  const statusFreq = document.getElementById('status-freq');

  const btnSynthesize = document.getElementById('btn-synthesize');
  const btnCopy = document.getElementById('btn-copy');
  const btnCreative = document.getElementById('btn-creative');

  const titleBtnDefrag = document.getElementById('title-btn-defrag');

  // Кнопки заголовка Шизо_95
  const btnMin = document.getElementById('btn-minimize');
  const btnMax = document.getElementById('btn-maximize');
  const btnClose = document.getElementById('btn-close');

  // Кнопки заголовка DEFRAG
  const defragMin = document.getElementById('defrag-btn-min');
  const defragMax = document.getElementById('defrag-btn-max');
  const defragClose = document.getElementById('defrag-btn-close');

  // Управление дефрагментатором
  const btnDefragStart = document.getElementById('btn-defrag-start');
  const btnDefragPause = document.getElementById('btn-defrag-pause');
  const btnDefragReset = document.getElementById('btn-defrag-reset');
  const btnDefragScramble = document.getElementById('btn-defrag-scramble');

  const defragFill = document.getElementById('defrag-progress-fill');
  const defragPctLabel = document.getElementById('defrag-pct-label');
  const defragStatusText = document.getElementById('defrag-status-text');
  const defragStatFrag = document.getElementById('defrag-stat-frag');
  const defragStatHead = document.getElementById('defrag-stat-head');
  const defragHeadMode = document.getElementById('defrag-head-mode');

  // Панель задач и меню Пуск
  const startBtn = document.getElementById('start-btn');
  const startMenu = document.getElementById('start-menu');
  const tabShizo = document.getElementById('tab-shizo');
  const tabDefrag = document.getElementById('tab-defrag');
  const trayClock = document.getElementById('tray-clock');
  const traySound = document.getElementById('tray-sound');
  const trayClippy = document.getElementById('tray-clippy');

  let currentBaseThought = '';

  function showToast(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('visible');
    setTimeout(() => { toast.classList.remove('visible'); }, 2400);
  }

  function updateBadge(phase) {
    if (phase <= 25) {
      psychosisBadge.textContent = `${phase}: Нормотимия (${phase}%)`;
      psychosisBadge.style.color = '#000080';
    } else if (phase <= 55) {
      psychosisBadge.textContent = `${phase}: Резонерство (${phase}%)`;
      psychosisBadge.style.color = '#804000';
    } else if (phase <= 74) {
      psychosisBadge.textContent = `${phase}: Соскальзывание (${phase}%)`;
      psychosisBadge.style.color = '#990000';
    } else {
      psychosisBadge.textContent = `${phase}: Word Salad (${phase}%)`;
      psychosisBadge.style.color = '#cc0000';
    }
  }

  function updateTelemetry(text) {
    const entropy = schizo.calculateEntropy(text);
    const coherence = (3.0 + Math.random() * 14.0).toFixed(1);
    const freq = bgEngine.liveFreqHz.toFixed(2);

    statusEntropy.textContent = `H(S): ${entropy} бит`;
    statusCoherence.textContent = `Когерентность: ${coherence}%`;
    statusFreq.textContent = `Волна: ${freq} Гц`;
  }

  function generateNewThought(forceCreative = false) {
    audio.beep('click');
    bgEngine.triggerSurge();

    const profile = parseInt(profileSelect.value, 10);
    currentBaseThought = schizo.synthesizeBase(profile, forceCreative);

    const phase = parseInt(psychosisSlider.value, 10);
    const displayed = schizo.transformByPhase(currentBaseThought, phase);

    quoteText.textContent = displayed;
    quoteBox.scrollTop = 0;
    updateTelemetry(displayed);
  }

  function onSliderChange() {
    const phase = parseInt(psychosisSlider.value, 10);
    updateBadge(phase);

    if (currentBaseThought) {
      const transformed = schizo.transformByPhase(currentBaseThought, phase);
      quoteText.textContent = transformed;
      updateTelemetry(transformed);
    }
  }

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
      // Мгновенный вывод в статус-бар и тултип
      statusEntropy.textContent = '✓ Скопировано в буфер обмена';
      showToast('Мыслеформа скопирована в буфер обмена');
    } catch (e) {
      showToast('Ошибка копирования');
    }
  }

  function handleAppClose() {
    audio.beep('click');
    // 1. Десктопная версия (pywebview / AppImage)
    if (window.pywebview && window.pywebview.api && typeof window.pywebview.api.close === 'function') {
      window.pywebview.api.close();
      return;
    }
    // 2. Нативная мобильная версия (Android WebView)
    if (window.AndroidBridge && typeof window.AndroidBridge.closeApp === 'function') {
      window.AndroidBridge.closeApp();
      return;
    }
    // 3. Веб-версия (GitHub Pages / PWA)
    minimizeMainWindow();
  }

  function minimizeMainWindow() {
    winShizo.classList.add('shake');
    setTimeout(() => winShizo.classList.remove('shake'), 400);
    audio.beep('error');
    showToast('Процесс переведен в фоновый режим сознания');
    mgrShizo.minimize();
    tabShizo.classList.remove('active-tab');
  }

  function openDefragWindow() {
    audio.beep('click');
    mgrDefrag.restore();
    tabDefrag.classList.add('active-tab');
    tabShizo.classList.remove('active-tab');
  }

  // Привязка интерактивного меню окна
  const dropdownContainers = document.querySelectorAll('.menu-item-dropdown');
  dropdownContainers.forEach(container => {
    const head = container.querySelector('.menu-item');
    const list = container.querySelector('.menu-dropdown-list');
    head.addEventListener('click', (e) => {
      e.stopPropagation();
      audio.beep('click');
      const wasOpen = list.classList.contains('show');
      document.querySelectorAll('.menu-dropdown-list').forEach(l => l.classList.remove('show'));
      if (!wasOpen) list.classList.add('show');
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.menu-dropdown-list').forEach(l => l.classList.remove('show'));
  });

  // Действия из меню
  const menuFileCopy = document.getElementById('menu-file-copy');
  const menuFileCreative = document.getElementById('menu-file-creative');
  const menuFileMin = document.getElementById('menu-file-min');
  const menuFileExit = document.getElementById('menu-file-exit');

  if (menuFileCopy) menuFileCopy.addEventListener('click', copyQuote);
  if (menuFileCreative) menuFileCreative.addEventListener('click', () => generateNewThought(true));
  if (menuFileMin) menuFileMin.addEventListener('click', () => { mgrShizo.minimize(); tabShizo.classList.remove('active-tab'); });
  if (menuFileExit) menuFileExit.addEventListener('click', handleAppClose);

  const menuActDefrag = document.getElementById('menu-act-defrag');
  const menuActClippy = document.getElementById('menu-act-clippy');
  const menuActEntropy = document.getElementById('menu-act-entropy');
  const menuActBsod = document.getElementById('menu-act-bsod');

  if (menuActDefrag) menuActDefrag.addEventListener('click', openDefragWindow);
  if (menuActClippy) menuActClippy.addEventListener('click', () => { clippy.nextRandomDialog(); clippy.open(); });
  if (menuActEntropy) menuActEntropy.addEventListener('click', () => {
    psychosisSlider.value = 0;
    onSliderChange();
    generateNewThought();
    showToast('Энтропия сознания сброшена до нуля');
  });
  if (menuActBsod) menuActBsod.addEventListener('click', () => {
    audio.beep('error');
    const bsod = document.getElementById('bsod-overlay');
    if (bsod) bsod.classList.add('active');
  });

  // Переключение 5 локализаций
  const langItems = document.querySelectorAll('#list-lang .menu-dropdown-item');
  langItems.forEach(item => {
    item.addEventListener('click', () => {
      audio.beep('click');
      langItems.forEach(i => {
        i.classList.remove('active-lang');
        i.textContent = i.textContent.replace('✓ ', '');
      });
      item.classList.add('active-lang');
      item.textContent = '✓ ' + item.textContent;

      schizo.currentLanguage = item.dataset.lang;
      showToast(`Язык изменён: ${item.dataset.lang.toUpperCase()}`);
      generateNewThought();
    });
  });

  const menuHelpAbout = document.getElementById('menu-help-about');
  const menuHelpClinical = document.getElementById('menu-help-clinical');
  if (menuHelpAbout) menuHelpAbout.addEventListener('click', () => {
    showToast('Шизо 95 v4.3: Клинический синтезатор мыслеформ (GPLv3)');
  });
  if (menuHelpClinical) menuHelpClinical.addEventListener('click', () => {
    showToast('Протокол: МКБ-95 / F20.0 — Системный параноидный делирий');
  });

  // Кнопки основного окна
  if (btnSynthesize) btnSynthesize.addEventListener('click', () => generateNewThought(false));
  if (btnCreative) btnCreative.addEventListener('click', () => generateNewThought(true));
  if (btnCopy) btnCopy.addEventListener('click', copyQuote);
  if (titleBtnDefrag) titleBtnDefrag.addEventListener('click', openDefragWindow);

  if (psychosisSlider) psychosisSlider.addEventListener('input', onSliderChange);
  if (profileSelect) profileSelect.addEventListener('change', () => generateNewThought(false));

  if (btnMin) btnMin.addEventListener('click', () => { audio.beep('click'); mgrShizo.minimize(); tabShizo.classList.remove('active-tab'); });
  if (btnMax) btnMax.addEventListener('click', () => { audio.beep('click'); mgrShizo.toggleMaximize(btnMax); });
  if (btnClose) btnClose.addEventListener('click', handleAppClose);

  // Кнопки окна DEFRAG
  if (defragMin) defragMin.addEventListener('click', () => { audio.beep('click'); mgrDefrag.minimize(); tabDefrag.classList.remove('active-tab'); });
  if (defragMax) defragMax.addEventListener('click', () => { audio.beep('click'); mgrDefrag.toggleMaximize(defragMax); });
  if (defragClose) defragClose.addEventListener('click', () => { audio.beep('click'); mgrDefrag.minimize(); tabDefrag.classList.remove('active-tab'); });

  // Меню DEFRAG
  const defragMReset = document.getElementById('defrag-m-reset');
  const defragMClose = document.getElementById('defrag-m-close');
  const defragMStart = document.getElementById('defrag-m-start');
  const defragMPause = document.getElementById('defrag-m-pause');
  const defragMScramble = document.getElementById('defrag-m-scramble');

  if (defragMReset) defragMReset.addEventListener('click', () => btnDefragReset.click());
  if (defragMClose) defragMClose.addEventListener('click', () => defragClose.click());
  if (defragMStart) defragMStart.addEventListener('click', () => btnDefragStart.click());
  if (defragMPause) defragMPause.addEventListener('click', () => btnDefragPause.click());
  if (defragMScramble) defragMScramble.addEventListener('click', () => btnDefragScramble.click());

  // Управление дефрагментацией
  if (btnDefragStart) {
    btnDefragStart.addEventListener('click', () => {
      audio.beep('click');
      btnDefragStart.disabled = true;
      btnDefragPause.disabled = false;
      defragHeadMode.textContent = 'Статус: Сканирование секторов (3-6 головок)...';

      defragEngine.start((data) => {
        defragFill.style.width = `${data.percent}%`;
        defragPctLabel.textContent = `Дефрагментация... ${data.percent}% выполнено`;
        defragStatusText.textContent = data.statusText;
        defragStatFrag.textContent = `Фрагментация: ${data.fragPercent}%`;
        defragStatHead.textContent = `LBA головки: ${data.headCount} активных`;

        if (data.percent >= 100) {
          btnDefragStart.disabled = false;
          btnDefragPause.disabled = true;
          defragHeadMode.textContent = 'Статус: Завершено';
          showToast('✓ Дефрагментация сознания успешно завершена!');
        }
      });
    });
  }

  if (btnDefragPause) {
    btnDefragPause.addEventListener('click', () => {
      audio.beep('click');
      defragEngine.pause();
      btnDefragStart.disabled = false;
      btnDefragPause.disabled = true;
      defragHeadMode.textContent = 'Статус: Пауза';
    });
  }

  if (btnDefragReset) {
    btnDefragReset.addEventListener('click', () => {
      audio.beep('click');
      defragEngine.reset();
      btnDefragStart.disabled = false;
      btnDefragPause.disabled = true;
      defragFill.style.width = '0%';
      defragPctLabel.textContent = 'Дефрагментация... 0% выполнено';
      defragStatusText.textContent = 'Готов к анализу структуры параноидальных кластеров.';
      defragStatFrag.textContent = 'Фрагментация: 78%';
      defragStatHead.textContent = 'LBA головки: Ожидание';
      defragHeadMode.textContent = 'Статус: Ожидание';
    });
  }

  if (btnDefragScramble) {
    btnDefragScramble.addEventListener('click', () => {
      defragEngine.scramble();
      showToast('⚠️ Секторы подсознания засорены свежим делирием!');
    });
  }

  // Иконки рабочего стола
  const diconShizo = document.getElementById('dicon-shizo');
  const diconDefrag = document.getElementById('dicon-defrag');
  const diconClippy = document.getElementById('dicon-clippy');

  if (diconShizo) diconShizo.addEventListener('dblclick', () => { audio.beep('click'); mgrShizo.restore(); });
  if (diconDefrag) diconDefrag.addEventListener('dblclick', () => { audio.beep('click'); mgrDefrag.restore(); });
  if (diconClippy) diconClippy.addEventListener('dblclick', () => { audio.beep('pop'); clippy.nextRandomDialog(); clippy.open(); });

  // Таскбар
  if (tabShizo) {
    tabShizo.addEventListener('click', () => {
      audio.beep('click');
      if (winShizo.classList.contains('minimized')) {
        mgrShizo.restore();
        tabShizo.classList.add('active-tab');
      } else {
        mgrShizo.minimize();
        tabShizo.classList.remove('active-tab');
      }
    });
  }

  if (tabDefrag) {
    tabDefrag.addEventListener('click', () => {
      audio.beep('click');
      if (winDefrag.classList.contains('minimized')) {
        mgrDefrag.restore();
        tabDefrag.classList.add('active-tab');
      } else {
        mgrDefrag.minimize();
        tabDefrag.classList.remove('active-tab');
      }
    });
  }

  // Пуск
  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      audio.beep('click');
      startMenu.classList.toggle('open');
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#start-menu') && !e.target.closest('#start-btn')) {
      startMenu.classList.remove('open');
    }
  });

  const smenuShizo = document.getElementById('smenu-shizo');
  const smenuDefrag = document.getElementById('smenu-defrag');
  const smenuClippy = document.getElementById('smenu-clippy');
  const smenuRestart = document.getElementById('smenu-restart');

  if (smenuShizo) smenuShizo.addEventListener('click', () => { mgrShizo.restore(); tabShizo.classList.add('active-tab'); startMenu.classList.remove('open'); });
  if (smenuDefrag) smenuDefrag.addEventListener('click', () => { mgrDefrag.restore(); tabDefrag.classList.add('active-tab'); startMenu.classList.remove('open'); });
  if (smenuClippy) smenuClippy.addEventListener('click', () => { clippy.nextRandomDialog(); clippy.open(); startMenu.classList.remove('open'); });
  if (smenuRestart) smenuRestart.addEventListener('click', () => {
    startMenu.classList.remove('open');
    audio.beep('error');
    const bsod = document.getElementById('bsod-overlay');
    if (bsod) bsod.classList.add('active');
  });

  // Каноничный BSOD: закрытие по любой клавише или клику
  const bsod = document.getElementById('bsod-overlay');
  function closeBsod() {
    if (bsod && bsod.classList.contains('active')) {
      bsod.classList.remove('active');
      audio.beep('chime');
      generateNewThought(false);
    }
  }

  if (bsod) {
    bsod.addEventListener('click', closeBsod);
    window.addEventListener('keydown', (e) => {
      if (bsod && bsod.classList.contains('active')) {
        closeBsod();
      }
    });
  }

  // Трей
  if (traySound) {
    traySound.addEventListener('click', () => {
      audio.enabled = !audio.enabled;
      traySound.style.opacity = audio.enabled ? '1' : '0.4';
      showToast(audio.enabled ? 'Звук: Включен' : 'Звук: Отключен');
    });
  }

  if (trayClippy) {
    trayClippy.addEventListener('click', () => {
      audio.beep('pop');
      clippy.nextRandomDialog();
      clippy.open();
    });
  }

  // Часы в трее
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    if (trayClock) trayClock.textContent = `${h}:${m}`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  // Периодическое обновление частоты волны в статус-баре
  setInterval(() => {
    if (statusFreq) {
      statusFreq.textContent = `Волна: ${bgEngine.liveFreqHz.toFixed(2)} Гц`;
    }
  }, 400);

  // Стартовая мыслеформа
  generateNewThought(false);
});
