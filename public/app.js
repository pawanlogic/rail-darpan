
const modes = {
  pnr: {
    title: "Check your PNR status",
    sub: "Enter your 10-digit PNR number to check your booking details.",
    label: "PNR Number",
    placeholder: "Enter 10-digit PNR",
    button: "Check PNR →"
  },
  live: {
    title: "Check live train running status",
    sub: "Enter the train number to request its latest available running information.",
    label: "Train Number",
    placeholder: "Enter train number",
    button: "Track Train →"
  },
  schedule: {
    title: "Find a train schedule",
    sub: "Enter the train number to look up its route and scheduled timings.",
    label: "Train Number",
    placeholder: "Enter train number",
    button: "View Schedule →"
  }
};

let currentMode = "pnr";
const input = document.getElementById("searchInput");
const result = document.getElementById("result");
const form = document.getElementById("searchForm");

const style = document.createElement("style");
style.textContent = `
  .result-panel { margin-top:20px; padding:20px; border:1px solid #e1e7f0;
    border-radius:14px; background:#f8faff; }
  .result-panel h4 { margin:0 0 15px; font-size:19px; }
  .result-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
  .result-item { background:white; padding:13px; border:1px solid #e1e7f0;
    border-radius:10px; min-width:0; }
  .result-label { display:block; font-size:12px; color:#65748b; margin-bottom:6px; }
  .result-value { display:block; font-size:14px; font-weight:600; overflow-wrap:anywhere; }
  .result-table-wrap { overflow-x:auto; margin-top:15px; }
  .result-table { border-collapse:collapse; width:100%; background:white; font-size:13px; }
  .result-table th,.result-table td { text-align:left; padding:10px; border:1px solid #e1e7f0; }
  .result-table th { background:#edf3ff; }
  .result-details { margin-top:16px; }
  .result-details summary { cursor:pointer; font-weight:600; padding:10px 0; }
  .result-json { white-space:pre-wrap; overflow-wrap:anywhere; font-size:12px;
    max-height:350px; overflow:auto; background:#fff; padding:12px; border-radius:8px; }
  .result-error { color:#b42318; background:#fff3f1; padding:14px; border-radius:10px; }
  .result-success { color:#166534; font-weight:600; margin-bottom:12px; }
  @media(max-width:600px) { .result-grid { grid-template-columns:1fr; } }
`;
document.head.appendChild(style);

function selectMode(mode) {
  currentMode = mode;
  const config = modes[mode];

  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });

  document.getElementById("formTitle").textContent = config.title;
  document.getElementById("formSub").textContent = config.sub;
  document.getElementById("inputLabel").textContent = config.label;
  input.placeholder = config.placeholder;
  input.maxLength = 10;
  input.value = "";
  document.getElementById("searchButton").textContent = config.button;
  result.replaceChildren();
}

document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => selectMode(tab.dataset.mode));
});

document.querySelectorAll("[data-select]").forEach(card => {
  card.addEventListener("click", () => selectMode(card.dataset.select));
});

function labelize(key) {
  return String(key)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return "";
  return String(value);
}

function addText(parent, tag, text, className) {
  const el = document.createElement(tag);
  el.textContent = text;
  if (className) el.className = className;
  parent.appendChild(el);
  return el;
}

function renderObject(obj, parent, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 4) return;

  if (Array.isArray(obj)) {
    if (!obj.length) {
      addText(parent, "p", "No records available.");
      return;
    }

    if (obj.every(item => item === null || typeof item !== "object")) {
      const grid = document.createElement("div");
      grid.className = "result-grid";
      obj.forEach((item, i) => {
        const card = document.createElement("div");
        card.className = "result-item";
        addText(card, "span", `Item ${i + 1}`, "result-label");
        addText(card, "span", formatValue(item), "result-value");
        grid.appendChild(card);
      });
      parent.appendChild(grid);
      return;
    }

    const keys = [...new Set(obj.filter(item => item && typeof item === "object" && !Array.isArray(item))
      .flatMap(item => Object.keys(item)))].slice(0, 8);

    if (keys.length) {
      const wrap = document.createElement("div");
      wrap.className = "result-table-wrap";
      const table = document.createElement("table");
      table.className = "result-table";
      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");

      keys.forEach(key => addText(headRow, "th", labelize(key)));
      thead.appendChild(headRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      obj.slice(0, 100).forEach(item => {
        const row = document.createElement("tr");
        keys.forEach(key => {
          const cell = document.createElement("td");
          const value = item && typeof item === "object" ? item[key] : item;
          cell.textContent = value === null || value === undefined
            ? "—"
            : typeof value === "object" ? JSON.stringify(value) : formatValue(value);
          row.appendChild(cell);
        });
        tbody.appendChild(row);
      });

      table.appendChild(tbody);
      wrap.appendChild(table);
      parent.appendChild(wrap);
    } else {
      obj.forEach(item => renderObject(item, parent, depth + 1));
    }
    return;
  }

  const entries = Object.entries(obj);
  const simple = entries.filter(([, value]) =>
    value === null || ["string", "number", "boolean"].includes(typeof value)
  );
  const nested = entries.filter(([, value]) => value && typeof value === "object");

  if (simple.length) {
    const grid = document.createElement("div");
    grid.className = "result-grid";

    simple.forEach(([key, value]) => {
      const card = document.createElement("div");
      card.className = "result-item";
      addText(card, "span", labelize(key), "result-label");
      addText(card, "span", formatValue(value), "result-value");
      grid.appendChild(card);
    });

    parent.appendChild(grid);
  }

  nested.forEach(([key, value]) => {
    const details = document.createElement("section");
    details.className = "result-details";
    addText(details, "h4", `${labelize(key)}${Array.isArray(value) ? ` (${value.length})` : ""}`);
    renderObject(value, details, depth + 1);
    parent.appendChild(details);
  });
}


/* RAIL DARPan COMPACT LIVE STATUS V2 */
(function installCompactLiveStatusStyle() {
  if (document.getElementById("rd-compact-live-style")) return;

  const style = document.createElement("style");
  style.id = "rd-compact-live-style";
  style.textContent = `
    .live-status-train-title {
      font-size: 21px;
      line-height: 1.3;
      overflow-wrap: anywhere;
      margin-bottom: 5px;
    }
    .live-status-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 13px;
    }
    .live-status-subtitle {
      color: #64748b;
      font-size: 12px;
      line-height: 1.5;
      overflow-wrap: anywhere;
    }
    .live-status-badge {
      border-radius: 999px;
      padding: 7px 10px;
      background: #eef2f7;
      color: #334155;
      font-size: 11px;
      font-weight: 750;
    }
    .live-status-badge.good { background: #dcfce7; color: #166534; }
    .live-status-badge.warn { background: #fef3c7; color: #92400e; }
    .live-status-badge.bad { background: #fee2e2; color: #991b1b; }
    .live-status-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 9px;
      margin: 10px 0 13px;
    }
    .live-status-card {
      min-width: 0;
      border: 1px solid #e2e8f0;
      border-radius: 11px;
      background: #fff;
      padding: 12px;
    }
    .live-status-label {
      display: block;
      color: #64748b;
      font-size: 11px;
      line-height: 1.4;
      margin-bottom: 6px;
    }
    .live-status-value {
      display: block;
      color: #102a43;
      font-size: 14px;
      line-height: 1.45;
      font-weight: 750;
      overflow-wrap: anywhere;
    }
    .live-status-note {
      color: #64748b;
      font-size: 11px;
      line-height: 1.5;
      margin: 8px 0 0;
    }
    .live-route-details {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0 12px;
      margin-top: 11px;
      background: #fff;
    }
    .live-route-details summary {
      cursor: pointer;
      padding: 12px 0;
      color: #173b57;
      font-size: 13px;
      font-weight: 750;
    }
    .live-route-scroll {
      max-height: 280px;
      overflow: auto;
      padding-bottom: 8px;
    }
    @media(max-width: 700px) {
      .live-status-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
      .live-status-card { padding: 10px; }
      .live-status-train-title { font-size: 19px; }
    }
  `;
  document.head.appendChild(style);
})();

function rdLiveNormalizeKey(key) {
  return String(key).replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase().replace(/[^a-z0-9]/g, "");
}

function rdLiveFind(obj, aliases, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 6) return undefined;

  const entries = Array.isArray(obj)
    ? []
    : Object.entries(obj);

  for (const alias of aliases) {
    const wanted = rdLiveNormalizeKey(alias);
    const found = entries.find(([key, value]) =>
      rdLiveNormalizeKey(key) === wanted &&
      value !== null && value !== undefined && value !== ""
    );
    if (found) return found[1];
  }

  const children = Array.isArray(obj) ? obj : entries.map(entry => entry[1]);
  for (const value of children) {
    if (value && typeof value === "object") {
      const found = rdLiveFind(value, aliases, depth + 1);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

function rdLiveText(value, depth = 0) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value !== "object") return String(value);
  if (depth > 3) return "";

  const preferred = [
    "stationName", "station_name", "trainName", "train_name",
    "name", "label", "stationCode", "station_code", "code",
    "title", "text", "value", "minutes", "speed"
  ];

  if (!Array.isArray(value)) {
    for (const key of preferred) {
      const found = Object.entries(value).find(([k, v]) =>
        rdLiveNormalizeKey(k) === rdLiveNormalizeKey(key) &&
        v !== null && v !== undefined &&
        typeof v !== "object" && String(v).trim() !== ""
      );
      if (found) return String(found[1]);
    }
    for (const child of Object.values(value)) {
      if (child && typeof child === "object") {
        const text = rdLiveText(child, depth + 1);
        if (text) return text;
      }
    }
  }
  return Array.isArray(value) ? "" : "";
}

function rdLiveField(obj, aliases) {
  return rdLiveText(rdLiveFind(obj, aliases));
}


/* RAIL DARPAN LIVE DETAILS V3 */
function rdLiveV3Key(key) {
  return String(key).replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase().replace(/[^a-z0-9]/g, "");
}

function rdLiveV3Find(obj, aliases, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 7) return undefined;

  if (!Array.isArray(obj)) {
    const entries = Object.entries(obj);

    for (const alias of aliases) {
      const match = entries.find(([key, value]) =>
        rdLiveV3Key(key) === rdLiveV3Key(alias) &&
        value !== undefined && value !== null && value !== ""
      );
      if (match) return match[1];
    }

    for (const [, value] of entries) {
      if (value && typeof value === "object") {
        const found = rdLiveV3Find(value, aliases, depth + 1);
        if (found !== undefined) return found;
      }
    }
  } else {
    for (const value of obj.slice(0, 150)) {
      if (value && typeof value === "object") {
        const found = rdLiveV3Find(value, aliases, depth + 1);
        if (found !== undefined) return found;
      }
    }
  }

  return undefined;
}

function rdLiveV3Text(value, depth = 0) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "object") return String(value);
  if (depth > 4 || Array.isArray(value)) return "";

  const preferred = [
    "stationName", "station_name", "trainName", "train_name",
    "name", "label", "stationCode", "station_code", "code",
    "title", "text", "value", "displayName", "display_name",
    "minutes", "duration", "platformNumber", "platform_number"
  ];

  const entries = Object.entries(value);

  for (const alias of preferred) {
    const match = entries.find(([key, item]) =>
      rdLiveV3Key(key) === rdLiveV3Key(alias) &&
      item !== undefined && item !== null &&
      typeof item !== "object" && String(item).trim() !== ""
    );
    if (match) return String(match[1]);
  }

  for (const [, item] of entries) {
    if (item && typeof item === "object") {
      const text = rdLiveV3Text(item, depth + 1);
      if (text) return text;
    }
  }

  return "";
}

function rdLiveV3Value(obj, aliases) {
  return rdLiveV3Text(rdLiveV3Find(obj, aliases));
}

function rdLiveV3Minutes(raw) {
  if (raw && typeof raw === "object") {
    const h = rdLiveV3Find(raw, ["hours", "hour", "hrs", "hr"]);
    const m = rdLiveV3Find(raw, ["minutes", "minute", "mins", "min"]);
    if (h !== undefined || m !== undefined) {
      return Number(h || 0) * 60 + Number(m || 0);
    }
  }

  const text = rdLiveV3Text(raw).trim();
  if (!text) return null;

  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
  const minMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)\b/i);

  if (hourMatch || minMatch) {
    return (hourMatch ? Number(hourMatch[1]) * 60 : 0) +
           (minMatch ? Number(minMatch[1]) : 0);
  }

  const hm = text.match(/^([+-]?\d{1,3}):([0-5]\d)$/);
  if (hm) {
    const sign = hm[1].startsWith("-") ? -1 : 1;
    return sign * (Math.abs(Number(hm[1])) * 60 + Number(hm[2]));
  }

  if (/^[+-]?\d+(?:\.\d+)?$/.test(text)) return Number(text);
  return null;
}

function rdLiveV3DurationLabel(minutes) {
  const whole = Math.round(Math.abs(minutes));
  const hours = Math.floor(whole / 60);
  const mins = whole % 60;
  if (hours) return `${hours} hr ${mins} min`;
  return `${mins} min`;
}

function rdLiveV3Delay(raw) {
  const text = rdLiveV3Text(raw).trim();
  if (!text) return "Not available";

  const minutes = rdLiveV3Minutes(raw);
  if (minutes === null) {
    if (/on.?time|no delay/i.test(text)) return "On time";
    return text;
  }

  if (minutes === 0) return "On time";

  const early = minutes < 0 || /\b(early|ahead)\b/i.test(text);
  return `${rdLiveV3DurationLabel(minutes)} ${early ? "early" : "late"}`;
}

function rdLiveV3Time(raw) {
  let text = rdLiveV3Text(raw).trim();
  if (!text) return "";

  const clock12 = text.match(/^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i);
  if (clock12) {
    let hour = Number(clock12[1]) % 12;
    if (clock12[3].toUpperCase() === "PM") hour += 12;
    return `${String(hour).padStart(2, "0")}:${clock12[2]}`;
  }

  if (/^\d{3,4}$/.test(text)) {
    text = text.padStart(4, "0");
    const hh = Number(text.slice(0, 2));
    const mm = Number(text.slice(2, 4));
    if (hh < 24 && mm < 60) return `${text.slice(0, 2)}:${text.slice(2, 4)}`;
  }

  const match = text.match(/\b(\d{1,2}):([0-5]\d)(?::\d{2})?\b/);
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;

  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const date = new Date(text);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    }
  }

  return text;
}

function rdLiveV3ClockMinutes(raw) {
  const text = rdLiveV3Text(raw).trim();
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}T/.test(text)) {
    const parsed = Date.parse(text);
    return Number.isNaN(parsed) ? null : parsed / 60000;
  }

  const time = rdLiveV3Time(text);
  const m = time.match(/^(\d{1,2}):([0-5]\d)$/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function rdLiveV3StopName(stop) {
  if (typeof stop === "string") return stop;

  return rdLiveV3Value(stop, [
    "stationName", "station_name", "stopName", "stop_name",
    "station", "name", "label", "stationCode", "station_code", "code"
  ]);
}

function rdLiveV3Platform(stop) {
  const raw = rdLiveV3Find(stop, [
    "platformNumber", "platform_number", "platformNo", "platform_no",
    "arrivalPlatform", "arrival_platform", "platformName", "platform_name",
    "platform"
  ]);

  if (raw === undefined || raw === null || raw === "") return "";
  if (typeof raw !== "object") return String(raw);

  return rdLiveV3Text(raw);
}

function rdLiveV3Halt(stop) {
  const raw = rdLiveV3Find(stop, [
    "haltDuration", "halt_duration", "stoppageDuration",
    "stoppage_duration", "stopDuration", "stop_duration",
    "dwellTime", "dwell_time", "haltMinutes", "halt_minutes",
    "stoppageMinutes", "stoppage_minutes", "halt", "stoppage"
  ]);

  if (raw !== undefined && raw !== null && typeof raw !== "boolean") {
    const explicit = rdLiveV3Minutes(raw);
    if (explicit !== null) return rdLiveV3DurationLabel(explicit);
  }

  const arrival = rdLiveV3Find(stop, [
    "actualArrival", "actual_arrival", "expectedArrival", "expected_arrival",
    "scheduledArrival", "scheduled_arrival", "arrivalTime", "arrival_time",
    "arrival", "arr"
  ]);

  const departure = rdLiveV3Find(stop, [
    "actualDeparture", "actual_departure", "expectedDeparture", "expected_departure",
    "scheduledDeparture", "scheduled_departure", "departureTime", "departure_time",
    "departure", "dep"
  ]);

  const a = rdLiveV3ClockMinutes(arrival);
  const d = rdLiveV3ClockMinutes(departure);
  if (a === null || d === null) return "Not available";

  let duration = d - a;
  if (a < 10000000 && d < 10000000) duration = (duration + 1440) % 1440;
  if (duration < 0 || duration > 2880) return "Not available";
  return rdLiveV3DurationLabel(duration);
}

function rdLiveV3StopMatches(stop, targets) {
  const normalize = value => String(value || "").toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const name = rdLiveV3StopName(stop);
  const code = rdLiveV3Value(stop, [
    "stationCode", "station_code", "code", "stationId", "station_id"
  ]);

  return targets.filter(Boolean).some(target => {
    const t = normalize(target);
    const n = normalize(name);
    const c = normalize(code);
    return t && (t === n || t === c);
  });
}

function rdLiveV3Row(stop, index) {
  const row = document.createElement("div");
  row.className = "live-v3-stop";

  const left = document.createElement("div");
  addText(left, "div", rdLiveV3StopName(stop) || `Stop ${index + 1}`,
    "live-v3-stop-name");

  const arrival = rdLiveV3Time(rdLiveV3Find(stop, [
    "actualArrival", "actual_arrival", "expectedArrival", "expected_arrival",
    "scheduledArrival", "scheduled_arrival", "arrivalTime", "arrival_time",
    "arrival", "arr"
  ]));

  const departure = rdLiveV3Time(rdLiveV3Find(stop, [
    "actualDeparture", "actual_departure", "expectedDeparture", "expected_departure",
    "scheduledDeparture", "scheduled_departure", "departureTime", "departure_time",
    "departure", "dep"
  ]));

  const halt = rdLiveV3Halt(stop);

  const timing = [
    arrival ? `Arr ${arrival}` : "Arr —",
    departure ? `Dep ${departure}` : "Dep —",
    `Halt ${halt}`
  ].join(" · ");

  addText(left, "div", timing, "live-v3-stop-meta");
  row.appendChild(left);

  const platform = rdLiveV3Platform(stop);
  addText(row, "span",
    platform ? `Platform ${platform}` : "Platform unavailable",
    "live-v3-platform");

  return row;
}

function renderCompactLiveStatus(data, payload, panel) {
  if (!document.getElementById("rd-live-details-v3-style")) {
    const style = document.createElement("style");
    style.id = "rd-live-details-v3-style";
    style.textContent = `
      .live-v3-head {
        display:flex; justify-content:space-between; align-items:flex-start;
        flex-wrap:wrap; gap:9px; margin-bottom:13px;
      }
      .live-v3-subtitle {
        font-size:12px; color:#64748b; line-height:1.5;
        overflow-wrap:anywhere; margin-top:4px;
      }
      .live-v3-badge {
        flex:0 0 auto; border-radius:999px; padding:7px 10px;
        background:#eef2f7; color:#334155; font-size:11px; font-weight:750;
      }
      .live-v3-badge.good { background:#dcfce7; color:#166534; }
      .live-v3-badge.warn { background:#fef3c7; color:#92400e; }
      .live-v3-badge.bad { background:#fee2e2; color:#991b1b; }
      .live-v3-grid {
        display:grid; grid-template-columns:repeat(2,minmax(0,1fr));
        gap:9px; margin:12px 0;
      }
      .live-v3-card {
        min-width:0; border:1px solid #e2e8f0; border-radius:11px;
        background:#fff; padding:12px;
      }
      .live-v3-label {
        display:block; color:#64748b; font-size:11px; margin-bottom:6px;
      }
      .live-v3-value {
        display:block; color:#102a43; font-size:14px; line-height:1.45;
        font-weight:750; overflow-wrap:anywhere;
      }
      .live-v3-section {
        margin-top:13px; padding:12px; border:1px solid #e2e8f0;
        border-radius:12px; background:#fff;
      }
      .live-v3-section-title { margin:0 0 9px; font-size:14px; color:#173b57; }
      .live-v3-stop {
        display:grid; grid-template-columns:minmax(0,1fr) auto;
        gap:9px; align-items:center; padding:11px 0;
        border-top:1px solid #edf1f5;
      }
      .live-v3-stop:first-of-type { border-top:0; }
      .live-v3-stop-name { color:#102a43; font-size:13px; font-weight:750; line-height:1.45; }
      .live-v3-stop-meta { margin-top:5px; color:#64748b; font-size:11px; line-height:1.6; }
      .live-v3-platform {
        max-width:125px; padding:7px 8px; border-radius:8px;
        background:#e9f6ff; color:#14527a; text-align:center;
        font-size:11px; font-weight:750; overflow-wrap:anywhere;
      }
      .live-v3-details {
        margin-top:11px; border:1px solid #e2e8f0;
        border-radius:10px; background:#fff; padding:0 12px;
      }
      .live-v3-details summary {
        cursor:pointer; padding:12px 0; color:#173b57;
        font-size:13px; font-weight:750;
      }
      .live-v3-scroll { max-height:280px; overflow:auto; }
      .live-v3-note {
        margin:8px 0 0; padding:9px; border-radius:8px;
        background:#fff8e7; color:#805b17; font-size:11px; line-height:1.5;
      }
      @media(max-width:600px) {
        .live-v3-grid { gap:7px; }
        .live-v3-card { padding:10px; }
        .live-v3-stop { gap:6px; }
        .live-v3-platform { max-width:95px; padding:6px; }
      }
    `;
    document.head.appendChild(style);
  }

  panel.classList.add("live-result-panel");

  const inputEl = document.getElementById("searchInput");
  const searchedNumber = inputEl ? inputEl.value.trim() : "";

  const trainName = rdLiveV3Value(payload, [
    "trainName", "train_name", "trainTitle", "train_title"
  ]) || `Train ${rdLiveV3Value(payload, [
    "trainNumber", "train_number", "trainNo", "train_no"
  ]) || searchedNumber}`.trim();

  const trainNumber = rdLiveV3Value(payload, [
    "trainNumber", "train_number", "trainNo", "train_no"
  ]) || searchedNumber;

  const status = rdLiveV3Value(payload, [
    "runningStatus", "running_status", "trainStatus", "train_status", "status"
  ]) || "Status unavailable";

  const currentName = rdLiveV3Value(payload, [
    "currentLocation", "current_location", "currentStation",
    "current_station", "presentStation", "present_station",
    "currentStop", "current_stop"
  ]) || "Not available";

  const currentCode = rdLiveV3Value(payload, [
    "currentStationCode", "current_station_code",
    "currentLocationCode", "current_location_code"
  ]);

  const delayRaw = rdLiveV3Find(payload, [
    "delayMinutes", "delay_minutes", "lateBy", "late_by",
    "currentDelay", "current_delay", "delay"
  ]);

  const delay = rdLiveV3Delay(delayRaw);

  let speed = rdLiveV3Value(payload, [
    "speedKmh", "speed_kmh", "currentSpeed", "current_speed", "speed"
  ]) || "Not available";

  if (/^\d+(?:\.\d+)?$/.test(speed)) speed += " km/h";

  const nextRaw = rdLiveV3Find(payload, [
    "nextStation", "next_station", "nextHalt", "next_halt",
    "nextStop", "next_stop", "upcomingStation", "upcoming_station"
  ]);

  const nextName = rdLiveV3Text(nextRaw);

  const source = rdLiveV3Value(payload, [
    "sourceStation", "source_station", "source", "origin"
  ]);

  const destination = rdLiveV3Value(payload, [
    "destinationStation", "destination_station", "destination", "dest"
  ]);

  const routeRaw = rdLiveV3Find(payload, [
    "route", "stops", "runningStations", "running_stations",
    "routeStations", "route_stations", "stationList", "station_list"
  ]);

  const route = Array.isArray(routeRaw) ? routeRaw : [];

  const heading = panel.querySelector("h4");
  if (heading) heading.textContent = trainName;

  const head = document.createElement("div");
  head.className = "live-v3-head";

  const titleSide = document.createElement("div");
  titleSide.style.minWidth = "0";
  titleSide.style.flex = "1";

  const subtitle = [
    trainNumber ? `Train No. ${trainNumber}` : "",
    source && destination ? `${source} → ${destination}` : ""
  ].filter(Boolean).join(" · ");

  if (subtitle) addText(titleSide, "div", subtitle, "live-v3-subtitle");
  head.appendChild(titleSide);

  const statusLow = status.toLowerCase();
  const badgeTone =
    /cancel|suspend/.test(statusLow) ? "bad" :
    /divert|delay|late/.test(statusLow) || /\blate\b/i.test(delay) ? "warn" :
    /running|on.?time|arrived|departed/.test(statusLow) ? "good" : "";

  addText(head, "span", status.replace(/[_-]+/g, " "),
    `live-v3-badge ${badgeTone}`);
  panel.appendChild(head);

  let currentIndex = -1;
  let nextIndex = -1;

  const currentTargets = [currentName, currentCode].filter(Boolean);
  const nextTargets = [nextName].filter(Boolean);

  route.forEach((stop, index) => {
    const flagged = rdLiveV3Value(stop, [
      "isCurrent", "isCurrentStation", "currentStation"
    ]);
    const stopStatus = rdLiveV3Value(stop, ["status", "stopStatus", "stop_status"]);
    if (currentIndex < 0 &&
        (rdLiveV3StopMatches(stop, currentTargets) ||
         /current location|current station|you are here/i.test(stopStatus) ||
         flagged === "true")) {
      currentIndex = index;
    }

    if (nextIndex < 0 &&
        (rdLiveV3StopMatches(stop, nextTargets) ||
         /\bnext station\b/i.test(stopStatus))) {
      nextIndex = index;
    }
  });

  const nextStopFromRoute = nextIndex >= 0
    ? rdLiveV3StopName(route[nextIndex]) : "";

  const nextDisplay = nextStopFromRoute || nextName || "Not available";

  const grid = document.createElement("div");
  grid.className = "live-v3-grid";

  [
    ["Current location", currentName],
    ["Delay", delay],
    ["Next station", nextDisplay],
    ["Current speed", speed]
  ].forEach(([label, value]) => {
    const card = document.createElement("div");
    card.className = "live-v3-card";
    addText(card, "span", label, "live-v3-label");
    addText(card, "strong", value, "live-v3-value");
    grid.appendChild(card);
  });

  panel.appendChild(grid);

  const routeStart = nextIndex >= 0
    ? nextIndex
    : currentIndex >= 0 ? currentIndex + 1 : -1;

  if (route.length) {
    const section = document.createElement("section");
    section.className = "live-v3-section";
    addText(section, "h5", "Next stations · halt · platform", "live-v3-section-title");

    if (routeStart >= 0 && routeStart < route.length) {
      route.slice(routeStart, routeStart + 3).forEach((stop, i) => {
        section.appendChild(rdLiveV3Row(stop, routeStart + i));
      });
    } else if (nextRaw && typeof nextRaw === "object") {
      section.appendChild(rdLiveV3Row(nextRaw, 0));
      addText(section, "p",
        "Further stop order is not confirmed by the current feed.",
        "live-v3-note");
    } else if (nextName) {
      addText(section, "div", nextName, "live-v3-stop-name");
      addText(section, "p",
        "Arrival time, halt and platform were not supplied for this station.",
        "live-v3-note");
    } else {
      addText(section, "p",
        "Upcoming stop sequence is not confirmed by the current feed.",
        "live-v3-note");
    }

    panel.appendChild(section);

    const remainingStart = routeStart >= 0 ? routeStart + 3 : 0;
    const remaining = route.slice(remainingStart);

    if (remaining.length || routeStart < 0) {
      const details = document.createElement("details");
      details.className = "live-v3-details";
      addText(details, "summary",
        `View full route & timings · ${route.length} stops`);

      const scroll = document.createElement("div");
      scroll.className = "live-v3-scroll";
      (routeStart >= 0 ? remaining : route).forEach((stop, i) => {
        scroll.appendChild(rdLiveV3Row(stop, i));
      });

      details.appendChild(scroll);
      panel.appendChild(details);
    }
  }

  const coach = rdLiveV3Find(payload, [
    "coachPosition", "coach_position", "coachComposition",
    "coach_composition", "coachSequence", "coach_sequence",
    "coachOrder", "coach_order", "coachPositionData", "coach_position_data"
  ]);

  if (coach !== undefined && coach !== null && coach !== "") {
    const details = document.createElement("details");
    details.className = "live-v3-details";
    addText(details, "summary", "Coach position · static information");

    addText(details, "p",
      "Coach order may not update with train movement. Confirm the latest coach display at the station before boarding.",
      "live-v3-note");

    const content = document.createElement("div");
    content.className = "live-v3-scroll";

    if (typeof coach === "object") renderObject(coach, content);
    else addText(content, "p", String(coach));

    details.appendChild(content);
    panel.appendChild(details);
  }

  const updated = rdLiveV3Value(payload, [
    "lastUpdatedAt", "last_updated_at", "updatedAt", "updated_at"
  ]);

  if (updated) addText(panel, "p", `Last updated: ${updated}`);
}

function renderResult(data) {
  result.replaceChildren();

  const panel = document.createElement("section");
  panel.className = "result-panel";
  addText(panel, "h4", currentMode === "pnr"
    ? "PNR Result"
    : currentMode === "live" ? "Live Train Result" : "Train Schedule");

  if (data && data.success === false) {
    addText(panel, "p", data.message || data.error || "The provider could not retrieve the data.", "result-error");
    result.appendChild(panel);
    return;
  }

  const payload = data && data.data !== undefined ? data.data : data;


  if (currentMode === "live") {
    renderCompactLiveStatus(data, payload, panel);
  } else {
    addText(panel, "p", "Response received from the railway data service.", "result-success");
    renderObject(payload, panel);
  }



  result.appendChild(panel);
}

const officialPnrUrl = atob("aHR0cHM6Ly93d3cuaW5kaWFucmFpbC5nb3YuaW4vZW5xdWlyeS9QTlIvUG5yRW5xdWlyeS5odG1sP2xvY2FsZT1lbg==");

const pnrHistoryKey = "raildarpan_pnr_history";
const pnrHistoryList = document.getElementById("pnrHistoryList");
const clearPnrHistoryButton = document.getElementById("clearPnrHistory");

function getPnrHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(pnrHistoryKey) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function renderPnrHistory() {
  if (!pnrHistoryList) return;
  pnrHistoryList.replaceChildren();

  const history = getPnrHistory();

  if (!history.length) {
    addText(pnrHistoryList, "p", "No recent PNR searches yet.");
    return;
  }

  history.forEach(item => {
    const row = document.createElement("div");
    row.className = "result-item";
    row.style.marginTop = "10px";

    addText(row, "strong", `PNR: ${item.pnr}`, "result-value");

    const date = new Date(item.checkedAt);
    addText(
      row,
      "p",
      Number.isNaN(date.getTime()) ? "" : `Checked: ${date.toLocaleString()}`,
      "result-label"
    );

    pnrHistoryList.appendChild(row);
  });
}

function savePnrHistory(pnr) {
  try {
    const history = getPnrHistory().filter(item => item.pnr !== pnr);
    history.unshift({ pnr, checkedAt: new Date().toISOString() });
    localStorage.setItem(pnrHistoryKey, JSON.stringify(history.slice(0, 10)));
    renderPnrHistory();
    return true;
  } catch {
    return false;
  }
}

if (clearPnrHistoryButton) {
  clearPnrHistoryButton.addEventListener("click", () => {
    try {
      localStorage.removeItem(pnrHistoryKey);
    } catch {}
    renderPnrHistory();
  });
}

renderPnrHistory();

form.addEventListener("submit", async event => {
  event.preventDefault();

  const value = input.value.trim();

  if (currentMode === "pnr" && !/^\d{10}$/.test(value)) {
    result.replaceChildren();
    addText(result, "p", "Please enter a valid 10-digit PNR number.", "result-error");
    return;
  }

  if (currentMode === "pnr") {
    savePnrHistory(value);

    const officialTab = window.open(officialPnrUrl, "_blank");
    if (officialTab) officialTab.opener = null;
    result.replaceChildren();
    addText(
      result,
      "p",
      "PNR search saved in this browser's history. The official Indian Railways PNR page has been opened in a new tab. Enter your PNR there to view its current status.",
      "result-success"
    );
    return;
  }

  if (!/^\d{1,10}$/.test(value)) {
    result.replaceChildren();
    addText(result, "p", "Please enter a valid train number.", "result-error");
    return;
  }

  let endpoint = "";
  if (currentMode === "live") endpoint = `/api/train/${value}/live`;
  if (currentMode === "schedule") endpoint = `/api/train/${value}/schedule`;

  const button = document.getElementById("searchButton");
  button.disabled = true;
  button.textContent = "Loading…";
  result.replaceChildren();
  addText(result, "p", "Fetching railway information…");

  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed (${response.status})`);
    }

    renderResult(data);
  } catch (error) {
    result.replaceChildren();
    addText(result, "p", error.message || "Unable to retrieve railway information.", "result-error");
  } finally {
    button.disabled = false;
    button.textContent = modes[currentMode].button;
  }
});


const stationSearchForm = document.getElementById("stationSearchForm");
const stationResults = document.getElementById("stationResults");
const stationLiveForm = document.getElementById("stationLiveForm");
const stationLiveResults = document.getElementById("stationLiveResults");

function stationMessage(container, message, className = "") {
  container.replaceChildren();
  const p = document.createElement("p");
  p.textContent = message;
  if (className) p.className = className;
  container.appendChild(p);
}

function renderStationSearch(data) {
  stationResults.replaceChildren();

  const stations = Array.isArray(data.data)
    ? data.data
    : Array.isArray(data.data?.stations)
      ? data.data.stations
      : Array.isArray(data.stations)
        ? data.stations
        : [];

  if (!stations.length) {
    stationMessage(stationResults, "No stations found for this search.");
    return;
  }

  const grid = document.createElement("div");
  grid.className = "result-grid";

  stations.forEach(station => {
    const card = document.createElement("div");
    card.className = "result-item";

    const name = station.name || "Unknown station";
    const code = station.code || "";
    const city = station.city || "";

    addText(card, "strong", name, "result-value");
    addText(card, "span", `Code: ${code}`, "result-label");

    if (city) addText(card, "p", city, "result-label");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary";
    button.textContent = "View station status";
    button.style.marginTop = "12px";
    button.addEventListener("click", () => {
      document.getElementById("stationCode").value = code;
      document.getElementById("station-tools").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      stationLiveForm.requestSubmit();
    });

    card.appendChild(button);
    grid.appendChild(card);
  });

  stationResults.appendChild(grid);
}

stationSearchForm.addEventListener("submit", async event => {
  event.preventDefault();

  const query = document.getElementById("stationQuery").value.trim();

  if (query.length < 2) {
    stationMessage(stationResults, "Enter at least 2 characters.", "result-error");
    return;
  }

  stationMessage(stationResults, "Searching stations…");

  try {
    const response = await fetch(
      `/api/stations/search?q=${encodeURIComponent(query)}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Station search failed.");
    }

    renderStationSearch(data);
  } catch (error) {
    stationMessage(stationResults, error.message, "result-error");
  }
});

stationLiveForm.addEventListener("submit", async event => {
  event.preventDefault();

  const code = document.getElementById("stationCode")
    .value.trim().toUpperCase();
  const hours = document.getElementById("stationHours").value;

  if (!/^[A-Z0-9]{2,10}$/.test(code)) {
    stationMessage(
      stationLiveResults,
      "Enter a valid station code, such as DLI.",
      "result-error"
    );
    return;
  }

  stationMessage(stationLiveResults, "Fetching station information…");

  try {
    const response = await fetch(
      `/api/station/${encodeURIComponent(code)}/live?hours=${hours}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Station information unavailable.");
    }

    stationLiveResults.replaceChildren();

    const panel = document.createElement("section");
    panel.className = "result-panel";
    addText(panel, "h4", `Station Status — ${code}`);
    addText(
      panel,
      "p",
      "Data returned by the railway provider. Check the original details before relying on them for travel.",
      "result-success"
    );

    const payload = data.data !== undefined ? data.data : data;
    renderObject(payload, panel);

    stationLiveResults.appendChild(panel);
  } catch (error) {
    stationMessage(stationLiveResults, error.message, "result-error");
  }
});


async function loadRailwayNews() {
  const section = document.getElementById("railway-news");
  if (!section) return;

  let container = document.getElementById("railwayNewsFeed");

  if (!container) {
    container = document.createElement("div");
    container.id = "railwayNewsFeed";
    container.className = "services-grid";
    section.appendChild(container);
  }

  container.replaceChildren();

  const loading = document.createElement("p");
  loading.textContent = "Loading official railway news…";
  container.appendChild(loading);

  try {
    const response = await fetch("/api/news");
    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "News unavailable");
    }

    container.replaceChildren();

    if (!result.items || result.items.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No news items are available right now.";
      container.appendChild(empty);
      return;
    }

    result.items.forEach((news) => {
      const card = document.createElement("article");
      card.className = "service-card";

      const title = document.createElement("h4");
      title.textContent = news.title || "Railway update";
      card.appendChild(title);

      if (news.date) {
        const date = document.createElement("p");
        date.className = "result-label";

        const parsedDate = new Date(news.date);
        date.textContent = Number.isNaN(parsedDate.getTime())
          ? news.date
          : parsedDate.toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short"
            });

        card.appendChild(date);
      }

      if (news.description) {
        const description = document.createElement("p");
        description.textContent = news.description.slice(0, 250);
        card.appendChild(description);
      }

      const link = document.createElement("a");
      link.href = news.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Read official update →";
      card.appendChild(link);

      container.appendChild(card);
    });
  } catch (error) {
    container.replaceChildren();

    const message = document.createElement("p");
    message.textContent =
      "Official news is temporarily unavailable. Please try again later.";
    message.className = "result-error";
    container.appendChild(message);

    console.error("Railway news loading failed:", error);
  }
}

loadRailwayNews();
