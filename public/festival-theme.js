
(function () {
  "use strict";

  const FESTIVALS = [
    { date: "2026-11-10", name: "Govardhan Puja", theme: "diwali", emoji: "🪔", priority: 8, greeting: "Shubh Govardhan Puja", message: "May every journey bring happiness and prosperity." },
    { date: "2026-11-11", name: "Bhai Dooj", theme: "diwali", emoji: "🌸", priority: 8, greeting: "Shubh Bhai Dooj", message: "Celebrating the beautiful bond of family." },
    { date: "2026-11-15", name: "Chhath Puja", theme: "chhath", emoji: "🌅", priority: 8, greeting: "Shubh Chhath Puja", message: "May the blessings of Surya Dev bring light to every journey." },
    { date: "2026-11-24", name: "Guru Nanak Jayanti", theme: "gurpurab", emoji: "🙏", priority: 8, greeting: "Happy Guru Nanak Gurpurab", message: "May the message of peace, service and kindness guide every journey." },
    { date: "2026-12-25", name: "Christmas", theme: "christmas", emoji: "🎄", priority: 8, greeting: "Merry Christmas", message: "Wishing you joyful celebrations and safe journeys." },

    { date: "2027-01-14", name: "Lohri", theme: "harvest", emoji: "🔥", priority: 7, greeting: "Happy Lohri", message: "Warm wishes for a bright and prosperous season." },
    { date: "2027-01-15", name: "Makar Sankranti • Pongal", theme: "harvest", emoji: "🪁", priority: 8, greeting: "Shubh Makar Sankranti", message: "Wishing you warmth, prosperity and new beginnings." },
    { date: "2027-01-26", name: "Republic Day", theme: "tricolour", emoji: "🇮🇳", priority: 10, greeting: "Happy Republic Day", message: "Celebrating the spirit, unity and diversity of India." },
    { date: "2027-02-11", name: "Vasant Panchami", theme: "spring", emoji: "🌼", priority: 7, greeting: "Shubh Vasant Panchami", message: "May this season bring knowledge, hope and fresh beginnings." },
    { date: "2027-03-06", name: "Maha Shivratri", theme: "shivratri", emoji: "🔱", priority: 8, greeting: "Shubh Maha Shivratri", message: "Wishing you peace, strength and positivity." },
    { date: "2027-03-10", name: "Eid-ul-Fitr", theme: "eid", emoji: "🌙", priority: 8, tentative: true, greeting: "Eid Mubarak", message: "Wishing you and your family peace, joy and togetherness." },
    { date: "2027-03-21", name: "Holika Dahan", theme: "holi", emoji: "🔥", priority: 7, greeting: "Shubh Holika Dahan", message: "May positivity and goodness brighten every path." },
    { date: "2027-03-22", name: "Holi", theme: "holi", emoji: "🎨", priority: 9, greeting: "Happy Holi", message: "Add colour, happiness and joy to every journey." },
    { date: "2027-04-07", endDate: "2027-04-15", name: "Chaitra Navratri • Ugadi • Gudi Padwa", theme: "spring", emoji: "🌺", priority: 7, greeting: "Happy Festive New Year", message: "Wishing you fresh beginnings and joyful celebrations." },
    { date: "2027-04-14", name: "Baisakhi", theme: "harvest", emoji: "🌾", priority: 8, greeting: "Happy Baisakhi", message: "Wishing everyone happiness and prosperity." },
    { date: "2027-04-15", name: "Ram Navami", theme: "ram", emoji: "🏹", priority: 8, greeting: "Shubh Ram Navami", message: "May truth, courage and kindness light your way." },
    { date: "2027-04-19", name: "Mahavir Jayanti", theme: "buddha", emoji: "🙏", priority: 8, greeting: "Happy Mahavir Jayanti", message: "May peace, compassion and non-violence inspire us all." },
    { date: "2027-04-20", name: "Hanuman Jayanti", theme: "hanuman", emoji: "🚩", priority: 8, greeting: "Shubh Hanuman Jayanti", message: "Wishing you courage, strength and devotion." },
    { date: "2027-05-09", name: "Akshaya Tritiya", theme: "gold", emoji: "✨", priority: 7, greeting: "Shubh Akshaya Tritiya", message: "May every new beginning bring abundance and happiness." },
    { date: "2027-05-17", name: "Eid-ul-Adha", theme: "eid", emoji: "🌙", priority: 8, tentative: true, greeting: "Eid Mubarak", message: "Wishing you peace, generosity and togetherness." },
    { date: "2027-05-20", name: "Buddha Purnima", theme: "buddha", emoji: "🪷", priority: 8, greeting: "Happy Buddha Purnima", message: "May peace, wisdom and compassion guide every journey." },
    { date: "2027-07-05", name: "Jagannath Rath Yatra", theme: "rath", emoji: "🛕", priority: 8, greeting: "Shubh Rath Yatra", message: "Wishing everyone a blessed and joyful celebration." },
    { date: "2027-07-18", name: "Guru Purnima", theme: "gurpurab", emoji: "🙏", priority: 7, greeting: "Happy Guru Purnima", message: "Gratitude to all teachers and guides." },
    { date: "2027-08-15", name: "Independence Day", theme: "tricolour", emoji: "🇮🇳", priority: 10, greeting: "Happy Independence Day", message: "Celebrating India's freedom, unity and progress." },
    { date: "2027-08-17", name: "Raksha Bandhan", theme: "rakhi", emoji: "🎀", priority: 8, greeting: "Shubh Raksha Bandhan", message: "Celebrating the bond of care and protection." },
    { date: "2027-08-25", name: "Krishna Janmashtami", theme: "krishna", emoji: "🦚", priority: 8, greeting: "Shubh Krishna Janmashtami", message: "May joy, love and wisdom fill every journey." },
    { date: "2027-09-04", name: "Ganesh Chaturthi", theme: "ganesh", emoji: "🐘", priority: 9, greeting: "Ganpati Bappa Morya", message: "May every journey begin with happiness and success." },
    { date: "2027-09-12", name: "Onam", theme: "onam", emoji: "🌼", priority: 8, greeting: "Happy Onam", message: "Wishing you prosperity, togetherness and happiness." },
    { date: "2027-09-30", endDate: "2027-10-08", name: "Sharad Navratri", theme: "navratri", emoji: "🌺", priority: 8, greeting: "Shubh Navratri", message: "May these festive days bring strength and positivity." },
    { date: "2027-10-09", name: "Dussehra", theme: "dussehra", emoji: "🏹", priority: 9, greeting: "Shubh Dussehra", message: "Celebrating the victory of good over evil." },
    { date: "2027-10-18", name: "Karwa Chauth", theme: "karwa", emoji: "🌙", priority: 7, greeting: "Shubh Karwa Chauth", message: "Wishing you love, happiness and togetherness." },
    { date: "2027-10-27", name: "Dhanteras", theme: "diwali", emoji: "🪔", priority: 8, greeting: "Shubh Dhanteras", message: "Wishing you health, happiness and prosperity." },
    { date: "2027-10-29", name: "Diwali", theme: "diwali", emoji: "🪔", priority: 10, greeting: "Shubh Deepawali", message: "May your homes and journeys shine with happiness." },
    { date: "2027-10-30", name: "Govardhan Puja", theme: "diwali", emoji: "🪔", priority: 8, greeting: "Shubh Govardhan Puja", message: "May every journey bring happiness and prosperity." },
    { date: "2027-10-31", name: "Bhai Dooj", theme: "diwali", emoji: "🌸", priority: 8, greeting: "Shubh Bhai Dooj", message: "Celebrating the beautiful bond of family." },
    { date: "2027-11-04", name: "Chhath Puja", theme: "chhath", emoji: "🌅", priority: 8, greeting: "Shubh Chhath Puja", message: "May the blessings of Surya Dev bring light to every journey." },
    { date: "2027-11-14", name: "Guru Nanak Jayanti", theme: "gurpurab", emoji: "🙏", priority: 8, greeting: "Happy Guru Nanak Gurpurab", message: "May the message of peace, service and kindness guide every journey." },
    { date: "2027-12-25", name: "Christmas", theme: "christmas", emoji: "🎄", priority: 8, greeting: "Merry Christmas", message: "Wishing you joyful celebrations and safe journeys." }
  ];

  const PALETTES = {
    diwali:     { primary: "#312e81", secondary: "#92400e", accent: "#fbbf24", glow: "rgba(245,158,11,.22)" },
    holi:       { primary: "#86198f", secondary: "#be185d", accent: "#67e8f9", glow: "rgba(236,72,153,.22)" },
    tricolour:  { primary: "#c2410c", secondary: "#047857", accent: "#fbbf24", glow: "rgba(22,163,74,.18)" },
    harvest:    { primary: "#92400e", secondary: "#166534", accent: "#facc15", glow: "rgba(234,179,8,.20)" },
    spring:     { primary: "#9d174d", secondary: "#6d28d9", accent: "#f9a8d4", glow: "rgba(236,72,153,.18)" },
    shivratri:  { primary: "#172554", secondary: "#4c1d95", accent: "#c4b5fd", glow: "rgba(99,102,241,.22)" },
    eid:        { primary: "#064e3b", secondary: "#0e7490", accent: "#fcd34d", glow: "rgba(16,185,129,.20)" },
    ram:        { primary: "#9a3412", secondary: "#7c2d12", accent: "#fbbf24", glow: "rgba(249,115,22,.20)" },
    hanuman:    { primary: "#9a3412", secondary: "#be123c", accent: "#facc15", glow: "rgba(239,68,68,.19)" },
    gold:       { primary: "#78350f", secondary: "#a16207", accent: "#fde68a", glow: "rgba(245,158,11,.22)" },
    buddha:     { primary: "#854d0e", secondary: "#166534", accent: "#fde68a", glow: "rgba(217,119,6,.18)" },
    rath:       { primary: "#7f1d1d", secondary: "#9a3412", accent: "#fbbf24", glow: "rgba(220,38,38,.18)" },
    gurpurab:   { primary: "#713f12", secondary: "#92400e", accent: "#fde68a", glow: "rgba(217,119,6,.20)" },
    rakhi:      { primary: "#9d174d", secondary: "#6d28d9", accent: "#f9a8d4", glow: "rgba(219,39,119,.18)" },
    krishna:    { primary: "#1e3a8a", secondary: "#6d28d9", accent: "#fcd34d", glow: "rgba(59,130,246,.20)" },
    ganesh:     { primary: "#9a3412", secondary: "#9f1239", accent: "#fcd34d", glow: "rgba(249,115,22,.20)" },
    onam:       { primary: "#065f46", secondary: "#0f766e", accent: "#facc15", glow: "rgba(16,185,129,.18)" },
    navratri:   { primary: "#9f1239", secondary: "#7c2d12", accent: "#fde68a", glow: "rgba(225,29,72,.20)" },
    dussehra:   { primary: "#7f1d1d", secondary: "#9a3412", accent: "#fbbf24", glow: "rgba(239,68,68,.18)" },
    karwa:      { primary: "#881337", secondary: "#7c2d12", accent: "#f9a8d4", glow: "rgba(225,29,72,.18)" },
    chhath:     { primary: "#9a3412", secondary: "#7c2d12", accent: "#facc15", glow: "rgba(245,158,11,.22)" },
    christmas:  { primary: "#14532d", secondary: "#991b1b", accent: "#fcd34d", glow: "rgba(34,197,94,.18)" }
  };

  function indiaToday() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());

    const values = {};
    parts.forEach(part => { values[part.type] = part.value; });
    return values.year + "-" + values.month + "-" + values.day;
  }

  function utcDay(iso) {
    const parts = iso.split("-").map(Number);
    return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000);
  }

  function formatFestivalDate(iso) {
    const parts = iso.split("-").map(Number);
    const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 6));
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function activateFestival(today) {
    const todayNumber = utcDay(today);

    const active = FESTIVALS
      .map(event => ({
        event,
        daysUntil: utcDay(event.date) - todayNumber,
        endNumber: utcDay(event.endDate || event.date)
      }))
      .filter(item =>
        item.daysUntil <= 2 &&
        todayNumber <= item.endNumber + 1 &&
        todayNumber >= utcDay(item.event.date) - 2
      )
      .sort((a, b) =>
        Math.abs(a.daysUntil) - Math.abs(b.daysUntil) ||
        (b.event.priority || 0) - (a.event.priority || 0)
      )[0];

    if (!active) return;

    const event = active.event;
    const palette = PALETTES[event.theme] || PALETTES.diwali;

    document.body.classList.add("rd-festival-active");
    document.body.dataset.rdFestival = event.theme;

    document.body.style.setProperty("--rd-festival-primary", palette.primary);
    document.body.style.setProperty("--rd-festival-secondary", palette.secondary);
    document.body.style.setProperty("--rd-festival-accent", palette.accent);
    document.body.style.setProperty("--rd-festival-glow", palette.glow);


    // RAIL DARPAN FESTIVAL DECORATIONS V1
    const oldDecor = document.getElementById("rd-festival-decorations");
    if (oldDecor) oldDecor.remove();

    const decorationsByTheme = {
      diwali: [
        { t:"🪔", x:"2%", y:"15%", s:29 },
        { t:"🎆", x:"5%", y:"35%", s:27 },
        { t:"✨", x:"3%", y:"60%", s:19 },
        { t:"🪔", x:"2%", y:"83%", s:27 },
        { t:"🎇", x:"91%", y:"14%", s:29 },
        { t:"🪔", x:"95%", y:"37%", s:27 },
        { t:"✨", x:"94%", y:"65%", s:20 },
        { t:"🎆", x:"91%", y:"82%", s:28 },
        { type:"burst", x:"12%", y:"13%", c:"#fbbf24" },
        { type:"burst", x:"87%", y:"42%", c:"#fb7185" },
        { type:"burst", x:"10%", y:"75%", c:"#67e8f9" },
        { type:"burst", x:"89%", y:"89%", c:"#c4b5fd" }
      ],
      holi: [
        { t:"🌈", x:"2%", y:"15%", s:28 },
        { t:"🎨", x:"4%", y:"40%", s:27 },
        { t:"💜", x:"2%", y:"75%", s:24 },
        { t:"🩷", x:"92%", y:"17%", s:25 },
        { t:"💛", x:"95%", y:"43%", s:25 },
        { t:"🎉", x:"92%", y:"77%", s:27 },
        { type:"burst", x:"12%", y:"30%", c:"#ec4899" },
        { type:"burst", x:"88%", y:"65%", c:"#06b6d4" }
      ],
      tricolour: [
        { t:"🇮🇳", x:"2%", y:"16%", s:28 },
        { t:"🕊️", x:"4%", y:"43%", s:24 },
        { t:"🇮🇳", x:"2%", y:"77%", s:28 },
        { t:"✨", x:"94%", y:"15%", s:22 },
        { t:"🕊️", x:"92%", y:"50%", s:25 },
        { t:"🇮🇳", x:"94%", y:"80%", s:27 }
      ],
      christmas: [
        { t:"🎄", x:"2%", y:"17%", s:28 },
        { t:"❄️", x:"4%", y:"43%", s:27 },
        { t:"🎁", x:"2%", y:"78%", s:25 },
        { t:"⭐", x:"93%", y:"17%", s:27 },
        { t:"❄️", x:"94%", y:"44%", s:25 },
        { t:"🎄", x:"92%", y:"80%", s:29 }
      ],
      eid: [
        { t:"🌙", x:"3%", y:"17%", s:31 },
        { t:"⭐", x:"3%", y:"48%", s:22 },
        { t:"✨", x:"3%", y:"77%", s:24 },
        { t:"🕌", x:"92%", y:"18%", s:29 },
        { t:"🌟", x:"94%", y:"48%", s:24 },
        { t:"🌙", x:"92%", y:"79%", s:28 }
      ],
      harvest: [
        { t:"🪁", x:"3%", y:"17%", s:29 },
        { t:"🌾", x:"3%", y:"49%", s:26 },
        { t:"🔥", x:"3%", y:"80%", s:25 },
        { t:"🪁", x:"92%", y:"18%", s:29 },
        { t:"🌼", x:"94%", y:"49%", s:25 },
        { t:"🌾", x:"92%", y:"80%", s:27 }
      ],
      spring: [
        { t:"🌼", x:"3%", y:"17%", s:29 },
        { t:"🌸", x:"3%", y:"49%", s:27 },
        { t:"🦋", x:"3%", y:"80%", s:27 },
        { t:"🌺", x:"92%", y:"17%", s:28 },
        { t:"✨", x:"94%", y:"49%", s:22 },
        { t:"🌸", x:"92%", y:"80%", s:27 }
      ],
      navratri: [
        { t:"🌺", x:"3%", y:"17%", s:29 },
        { t:"🔱", x:"3%", y:"48%", s:29 },
        { t:"✨", x:"3%", y:"79%", s:23 },
        { t:"🌸", x:"93%", y:"17%", s:28 },
        { t:"🪔", x:"94%", y:"49%", s:27 },
        { t:"🌺", x:"92%", y:"80%", s:27 }
      ],
      ganesh: [
        { t:"🐘", x:"2%", y:"17%", s:30 },
        { t:"🪔", x:"3%", y:"48%", s:26 },
        { t:"🌺", x:"2%", y:"79%", s:27 },
        { t:"🐘", x:"92%", y:"17%", s:29 },
        { t:"✨", x:"94%", y:"48%", s:22 },
        { t:"🪔", x:"92%", y:"80%", s:28 }
      ],
      krishna: [
        { t:"🦚", x:"3%", y:"17%", s:29 },
        { t:"🪈", x:"3%", y:"48%", s:28 },
        { t:"🪔", x:"3%", y:"80%", s:25 },
        { t:"🦚", x:"92%", y:"17%", s:28 },
        { t:"✨", x:"94%", y:"48%", s:23 },
        { t:"🪈", x:"92%", y:"80%", s:28 }
      ],
      chhath: [
        { t:"🌅", x:"3%", y:"17%", s:29 },
        { t:"🪔", x:"3%", y:"48%", s:27 },
        { t:"🌊", x:"3%", y:"80%", s:27 },
        { t:"☀️", x:"92%", y:"17%", s:29 },
        { t:"✨", x:"94%", y:"48%", s:22 },
        { t:"🌅", x:"92%", y:"80%", s:28 }
      ]
    };

    const selectedDecor = decorationsByTheme[event.theme] || [
      { t:event.emoji || "✨", x:"3%", y:"17%", s:29 },
      { t:"✨", x:"3%", y:"50%", s:22 },
      { t:event.emoji || "✨", x:"92%", y:"18%", s:28 },
      { t:"🌟", x:"94%", y:"78%", s:25 }
    ];

    const decorLayer = document.createElement("div");
    decorLayer.id = "rd-festival-decorations";
    decorLayer.className = "rd-festival-decorations";
    decorLayer.setAttribute("aria-hidden", "true");

    selectedDecor.forEach((item, index) => {
      const decoration = document.createElement("span");

      decoration.className = item.type === "burst"
        ? "rd-festival-decoration rd-festival-firework"
        : "rd-festival-decoration rd-festival-floating";

      if (item.t) decoration.textContent = item.t;

      decoration.style.left = item.x || "auto";
      decoration.style.right = item.x ? "auto" : "2%";
      decoration.style.top = item.y || "auto";
      decoration.style.fontSize = (item.s || 25) + "px";
      decoration.style.animationDelay = ((index % 5) * 0.45) + "s";
      decoration.style.setProperty("--rd-decor-color", item.c || palette.accent);

      decorLayer.appendChild(decoration);
    });

    document.body.appendChild(decorLayer);

// Apply festival colours to the complete website.
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.name = "theme-color";
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = palette.primary;
  }

  try {
    activateFestival(indiaToday());
  } catch (error) {
    console.warn("Rail Darpan festival theme could not be activated:", error);
  }
})();
