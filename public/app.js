
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


/* RAIL DARPAN LIVE PASS-THROUGH GROUPING V1 */
function rdLiveV3AppendGroupedStops(parent, stops, offset, total) {
  if (typeof rdScheduleV2EnsurePassThroughStyle === "function") {
    rdScheduleV2EnsurePassThroughStyle();
  }

  let i = 0;

  while (i < stops.length) {
    const absoluteIndex = offset + i;

    if (rdScheduleV2IsHalt(stops[i], absoluteIndex, total)) {
      parent.appendChild(rdLiveV3Row(stops[i], absoluteIndex));
      i++;
      continue;
    }

    const group = [];
    const groupStart = i;

    while (i < stops.length &&
           !rdScheduleV2IsHalt(stops[i], offset + i, total)) {
      group.push(stops[i]);
      i++;
    }

    if (!group.length) continue;

    const details = document.createElement("details");
    details.className = "rd-schedule-v2-pass-through";

    const label = group.length === 1
      ? "Show 1 non-stopping station"
      : `Show ${group.length} non-stopping stations`;

    addText(details, "summary", label);

    const list = document.createElement("div");
    list.className = "rd-schedule-v2-pass-list";

    group.forEach((stop, j) => {
      list.appendChild(rdLiveV3Row(stop, offset + groupStart + j));
    });

    details.appendChild(list);
    parent.appendChild(details);
  }
}


/* RAIL DARPAN LIVE COACH BADGES V2 */
function rdLiveCoachTokens(value, depth = 0) {
  if (value === null || value === undefined || depth > 7) return [];

  if (typeof value === "number") return [String(value)];

  if (typeof value === "string") {
    const text = value.trim();
    if (!text || /^(not available|unknown|none|null|undefined)$/i.test(text)) {
      return [];
    }

    if (
      (text.startsWith("[") && text.endsWith("]")) ||
      (text.startsWith("{") && text.endsWith("}"))
    ) {
      try {
        return rdLiveCoachTokens(JSON.parse(text), depth + 1);
      } catch (_) {}
    }

    const parts = text.split(/\s*(?:,|;|\||→|➜|>|->)\s*/)
      .map(item => item.trim()).filter(Boolean);

    if (parts.length > 1) return parts;

    // Handle compact sequences such as ENGINE-GS-S1-S2-B1.
    if (/^[A-Z0-9/]+(?:-[A-Z0-9/]+){2,}$/.test(text)) {
      return text.split("-").filter(Boolean);
    }

    return [text];
  }

  if (Array.isArray(value)) {
    return value.flatMap(item => rdLiveCoachTokens(item, depth + 1))
      .filter(Boolean);
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);

    const sequenceKeys = [
      "coaches", "coachList", "coach_list", "coachComposition",
      "coach_composition", "coachSequence", "coach_sequence",
      "coachOrder", "coach_order", "positions", "sequence", "composition"
    ];

    for (const key of sequenceKeys) {
      const match = entries.find(([name, child]) =>
        rdLiveCoachKey(name) === rdLiveCoachKey(key) &&
        child !== null && child !== undefined
      );

      if (match) {
        const tokens = rdLiveCoachTokens(match[1], depth + 1);
        if (tokens.length) return tokens;
      }
    }

    const labelKeys = [
      "coachCode", "coach_code", "coachNumber", "coach_number",
      "coachNo", "coach_no", "coachName", "coach_name",
      "coach", "code", "number", "label", "name", "type", "value"
    ];

    for (const key of labelKeys) {
      const match = entries.find(([name, child]) =>
        rdLiveCoachKey(name) === rdLiveCoachKey(key) &&
        child !== null && child !== undefined &&
        typeof child !== "object" && String(child).trim() !== ""
      );
      if (match) return [String(match[1]).trim()];
    }

    const numbered = entries
      .filter(([key, child]) => /^\d+$/.test(key) && child !== null && child !== undefined)
      .sort((a, b) => Number(a[0]) - Number(b[0]));

    if (numbered.length) {
      return numbered.flatMap(([, child]) =>
        rdLiveCoachTokens(child, depth + 1)
      );
    }

    for (const [, child] of entries) {
      if (Array.isArray(child)) {
        const tokens = rdLiveCoachTokens(child, depth + 1);
        if (tokens.length) return tokens;
      }
    }
  }

  return [];
}

function rdLiveCoachBadgeStyle() {
  if (document.getElementById("rd-live-coach-badges-style")) return;

  const style = document.createElement("style");
  style.id = "rd-live-coach-badges-style";
  style.textContent = `
    .rd-live-coach-section {
      margin-top: 13px;
      padding: 13px;
      border: 1px solid #dce7ef;
      border-radius: 12px;
      background: linear-gradient(135deg, #fff, #f5fafc);
    }
    .rd-live-coach-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 11px;
    }
    .rd-live-coach-title {
      margin: 0;
      color: #173b57;
      font-size: 14px;
      font-weight: 800;
    }
    .rd-live-coach-tag {
      padding: 5px 8px;
      border-radius: 999px;
      background: #dff8f3;
      color: #11665f;
      font-size: 9px;
      font-weight: 850;
      letter-spacing: .8px;
    }
    .rd-live-coach-list {
      display: flex;
      align-items: stretch;
      flex-wrap: wrap;
      gap: 7px;
    }
    .rd-live-coach-badge {
      min-width: 52px;
      min-height: 48px;
      padding: 6px 8px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 1px solid #cce8e5;
      border-radius: 9px;
      background: #edfbf8;
    }
    .rd-live-coach-index {
      color: #68858b;
      font-size: 9px;
      font-weight: 750;
      line-height: 1.3;
      margin-bottom: 3px;
    }
    .rd-live-coach-code {
      color: #115e59;
      font-size: 13px;
      font-weight: 850;
      line-height: 1.4;
      text-align: center;
      overflow-wrap: anywhere;
    }
    .rd-live-coach-more {
      display: inline-flex;
      align-items: center;
      padding: 7px 10px;
      border: 1px dashed #b8cbd7;
      border-radius: 9px;
      color: #456276;
      font-size: 11px;
      font-weight: 750;
    }
    .rd-live-coach-note {
      margin: 10px 0 0;
      padding: 8px 9px;
      border-radius: 8px;
      background: #fff8e7;
      color: #7c5b18;
      font-size: 11px;
      line-height: 1.5;
    }
    @media(max-width: 600px) {
      .rd-live-coach-section { padding: 10px; }
      .rd-live-coach-list { gap: 6px; }
      .rd-live-coach-badge { min-width: 46px; min-height: 45px; }
    }
  `;
  document.head.appendChild(style);
}


/* RAIL DARPA​N CLICKABLE COACH SEAT MAP V1 */
function rdSeatMapStyle() {
  if (document.getElementById("rd-seat-map-style")) return;

  const style = document.createElement("style");
  style.id = "rd-seat-map-style";
  style.textContent = `
    .rd-seat-map-clickable {
      cursor: pointer !important;
      transition: transform .16s ease, box-shadow .16s ease;
    }
    .rd-seat-map-clickable:hover,
    .rd-seat-map-clickable:focus-visible {
      transform: translateY(-2px);
      box-shadow: 0 0 0 3px rgba(13,148,136,.24);
      outline: none;
    }
    .rd-seat-map-overlay {
      position: fixed;
      inset: 0;
      z-index: 100000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 14px;
      background: rgba(7, 21, 37, .72);
      backdrop-filter: blur(5px);
    }
    .rd-seat-map-dialog {
      width: min(970px, 100%);
      max-height: calc(100vh - 28px);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-radius: 18px;
      background: #f7fafc;
      box-shadow: 0 24px 80px rgba(0,0,0,.32);
      color: #102a43;
    }
    .rd-seat-map-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      padding: 18px 20px;
      background: linear-gradient(120deg, #123c55, #0c263d);
      color: #fff;
    }
    .rd-seat-map-title {
      margin: 0;
      color: #fff;
      font-size: 19px;
      line-height: 1.4;
    }
    .rd-seat-map-subtitle {
      margin: 5px 0 0;
      color: #c7dce7;
      font-size: 12px;
      line-height: 1.5;
    }
    .rd-seat-map-close {
      flex: 0 0 auto;
      border: 1px solid #7592a4;
      border-radius: 10px;
      width: 38px;
      height: 38px;
      cursor: pointer;
      color: #fff;
      background: #ffffff12;
      font-size: 23px;
      line-height: 1;
    }
    .rd-seat-map-body {
      overflow: auto;
      padding: 16px;
    }
    .rd-seat-map-note {
      border: 1px solid #f1d79b;
      border-radius: 10px;
      padding: 10px 12px;
      margin: 0 0 14px;
      background: #fff8e8;
      color: #76551a;
      font-size: 12px;
      line-height: 1.6;
    }
    .rd-seat-map-controls {
      display: flex;
      align-items: end;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 13px;
    }
    .rd-seat-map-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 140px;
      flex: 1;
      color: #526678;
      font-size: 11px;
      font-weight: 700;
    }
    .rd-seat-map-field input,
    .rd-seat-map-field select {
      width: 100%;
      min-height: 42px;
      box-sizing: border-box;
      border: 1px solid #cad7e2;
      border-radius: 9px;
      padding: 9px 10px;
      font: inherit;
      font-size: 13px;
      color: #102a43;
      background: #fff;
    }
    .rd-seat-map-find {
      min-height: 42px;
      border: 0;
      border-radius: 9px;
      padding: 10px 15px;
      background: #0d9488;
      color: #fff;
      font-weight: 800;
      cursor: pointer;
    }
    .rd-seat-map-result {
      border: 1px solid #b7e5dc;
      background: #eafaf6;
      color: #115e59;
      border-radius: 10px;
      padding: 11px 12px;
      margin: 0 0 14px;
      font-size: 13px;
      line-height: 1.6;
      font-weight: 750;
    }
    .rd-seat-map-result:empty { display: none; }
    .rd-seat-map-bays {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
    }
    .rd-seat-map-bay {
      min-width: 0;
      border: 1px solid #dbe5ed;
      border-radius: 13px;
      background: #fff;
      padding: 12px;
    }
    .rd-seat-map-bay-title {
      margin: 0 0 10px;
      color: #28495f;
      font-size: 12px;
      font-weight: 850;
    }
    .rd-seat-map-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-rows: repeat(3, minmax(58px, auto));
      gap: 6px;
    }
    .rd-seat-map-grid.two-tier {
      grid-template-rows: repeat(2, minmax(58px, auto));
    }
    .rd-seat-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      min-width: 0;
      border: 1px solid #d7e4ed;
      border-radius: 9px;
      padding: 6px 3px;
      background: #f1f7fb;
      color: #204259;
      cursor: pointer;
      text-align: center;
    }
    .rd-seat-tile[data-type="LB"] { background: #e8f7ed; border-color: #b8e3c4; color: #176338; }
    .rd-seat-tile[data-type="MB"] { background: #fff7dc; border-color: #f0dda0; color: #765a08; }
    .rd-seat-tile[data-type="UB"] { background: #eaf0ff; border-color: #c8d5ff; color: #314f9b; }
    .rd-seat-tile[data-type="SL"] { background: #e8f8fb; border-color: #b5e3eb; color: #145b6b; }
    .rd-seat-tile[data-type="SU"] { background: #f4eefe; border-color: #dfcef7; color: #674098; }
    .rd-seat-tile.is-selected {
      outline: 3px solid #0d9488;
      outline-offset: 1px;
      box-shadow: 0 0 0 4px #0d948820;
    }
    .rd-seat-number { font-size: 15px; font-weight: 900; line-height: 1.3; }
    .rd-seat-code { font-size: 10px; font-weight: 850; }
    .rd-seat-full-name { font-size: 9px; line-height: 1.3; }
    .rd-seat-map-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin-top: 14px;
    }
    .rd-seat-map-legend-item {
      border: 1px solid #dbe5ed;
      border-radius: 999px;
      padding: 6px 9px;
      background: #fff;
      color: #38566b;
      font-size: 10px;
      font-weight: 750;
    }
    .rd-seat-map-other {
      border: 1px solid #dbe5ed;
      border-radius: 12px;
      background: #fff;
      padding: 14px;
      line-height: 1.7;
      color: #38566b;
      font-size: 13px;
    }
    .rd-seat-map-other h3 {
      margin: 0 0 8px;
      color: #173b57;
      font-size: 15px;
    }
    .rd-seat-map-footer {
      border-top: 1px solid #dbe5ed;
      padding: 11px 16px;
      color: #64748b;
      background: #fff;
      font-size: 11px;
      line-height: 1.5;
    }
    @media(max-width: 580px) {
      .rd-seat-map-overlay { padding: 7px; }
      .rd-seat-map-dialog { max-height: calc(100vh - 14px); border-radius: 13px; }
      .rd-seat-map-header { padding: 14px; }
      .rd-seat-map-title { font-size: 17px; }
      .rd-seat-map-body { padding: 10px; }
      .rd-seat-map-bays { grid-template-columns: 1fr; }
      .rd-seat-map-controls { align-items: stretch; }
      .rd-seat-map-find { width: 100%; }
    }
  `;
  document.head.appendChild(style);
}

function rdSeatMapConfig(rawCoach) {
  const raw = String(rawCoach || "").trim().toUpperCase();
  const compact = raw.replace(/\s+/g, "");
  const match = compact.match(/^(HA|GS|GEN|S|B|M|A|H|C|D)\d*/);
  const prefix = match ? match[1] : "";

  const threeTier = [
    { code: "LB", name: "Lower berth", row: 3, col: 1 },
    { code: "MB", name: "Middle berth", row: 2, col: 1 },
    { code: "UB", name: "Upper berth", row: 1, col: 1 },
    { code: "LB", name: "Lower berth", row: 3, col: 2 },
    { code: "MB", name: "Middle berth", row: 2, col: 2 },
    { code: "UB", name: "Upper berth", row: 1, col: 2 },
    { code: "SL", name: "Side lower berth", row: 3, col: 3 },
    { code: "SU", name: "Side upper berth", row: 1, col: 3 }
  ];

  const twoTier = [
    { code: "LB", name: "Lower berth", row: 2, col: 1 },
    { code: "UB", name: "Upper berth", row: 1, col: 1 },
    { code: "LB", name: "Lower berth", row: 2, col: 2 },
    { code: "UB", name: "Upper berth", row: 1, col: 2 },
    { code: "SL", name: "Side lower berth", row: 2, col: 3 },
    { code: "SU", name: "Side upper berth", row: 1, col: 3 }
  ];

  if (prefix === "S") {
    return {
      label: "Sleeper (SL)",
      kind: "three",
      pattern: threeTier,
      capacities: [80, 72],
      defaultCapacity: 80
    };
  }
  if (prefix === "B") {
    return {
      label: "AC 3-Tier (3A)",
      kind: "three",
      pattern: threeTier,
      capacities: [72, 64],
      defaultCapacity: 72
    };
  }
  if (prefix === "A") {
    return {
      label: "AC 2-Tier (2A)",
      kind: "two",
      pattern: twoTier,
      capacities: [52, 46, 54],
      defaultCapacity: 52
    };
  }
  if (prefix === "H" || prefix === "HA") {
    return {
      label: prefix === "HA" ? "First AC + 2-Tier hybrid" : "First AC (1A)",
      kind: "cabin"
    };
  }
  if (prefix === "C" || prefix === "D" || prefix === "GS" || prefix === "GEN") {
    return {
      label: prefix === "C" ? "Chair Car" :
        prefix === "D" ? "Second Sitting" : "General coach",
      kind: "seating"
    };
  }

  return {
    label: "Coach-specific layout",
    kind: "unknown"
  };
}


/* RAIL DARPA​N COACH INTERIOR LAYOUT V2 SAFE */
function rdCoachInteriorStyle() {
  if (document.getElementById("rd-coach-interior-safe-style")) return;

  const style = document.createElement("style");
  style.id = "rd-coach-interior-safe-style";
  style.textContent = `
    .rd-seat-map-bays {
      display: flex !important;
      flex-direction: column !important;
      align-items: stretch !important;
      gap: 10px !important;
      width: 100% !important;
      max-width: 620px !important;
      margin: 0 auto !important;
    }

    .rd-seat-map-bays::before,
    .rd-seat-map-bays::after {
      display: block;
      text-align: center;
      padding: 8px 12px;
      border: 1px solid #b7cbd8;
      border-radius: 9px;
      background: #e4edf3;
      color: #47677b;
      font-size: 10px;
      font-weight: 850;
      letter-spacing: 1.2px;
    }

    .rd-seat-map-bays::before { content: "FRONT / ENGINE SIDE"; }
    .rd-seat-map-bays::after { content: "REAR OF COACH"; }

    .rd-seat-map-bay {
      width: 100% !important;
      box-sizing: border-box !important;
      padding: 10px !important;
      border: 2px solid #8aa5b7 !important;
      border-radius: 13px !important;
      background: #eaf1f6 !important;
      box-shadow: inset 0 0 0 3px #fff;
    }

    .rd-seat-map-bay-title {
      padding-bottom: 8px !important;
      border-bottom: 1px solid #cfdae3;
      color: #3b5d73;
      font-size: 10px;
      letter-spacing: .6px;
    }

    .rd-seat-map-grid {
      position: relative !important;
      display: grid !important;
      grid-template-columns:
        minmax(0, 1fr) minmax(0, 1fr) minmax(58px, .72fr) !important;
      grid-template-rows: repeat(3, minmax(62px, auto)) !important;
      align-items: stretch;
      gap: 7px 17px !important;
      padding: 7px !important;
      border: 1px solid #c6d6e1;
      border-radius: 9px;
      background: #dce7ef;
    }

    .rd-seat-map-grid.two-tier {
      grid-template-rows: repeat(2, minmax(70px, auto)) !important;
    }

    /* Narrow central passage between berth bay and side berths */
    .rd-seat-map-grid::after {
      content: "";
      position: absolute;
      z-index: 1;
      pointer-events: none;
      top: 8px;
      bottom: 8px;
      left: 72%;
      width: 10px;
      transform: translateX(-50%);
      border-left: 1px dashed #91a9b8;
      border-right: 1px dashed #91a9b8;
      background: repeating-linear-gradient(
        0deg, #f9fbfc 0 12px, #e7eef3 12px 14px
      );
      opacity: .9;
    }

    .rd-seat-map-grid .rd-seat-tile {
      position: relative;
      z-index: 2;
      width: 100%;
      min-width: 0;
      min-height: 0;
      box-sizing: border-box;
      padding: 4px 2px;
      border-radius: 7px;
      cursor: pointer;
    }

    .rd-seat-map-grid .rd-seat-tile.is-selected {
      outline: 3px solid #0d9488;
      outline-offset: 1px;
    }

    @media (max-width: 580px) {
      .rd-seat-map-grid {
        grid-template-columns:
          minmax(0, 1fr) minmax(0, 1fr) minmax(50px, .72fr) !important;
        gap: 6px 13px !important;
        padding: 5px !important;
      }
      .rd-seat-map-grid::after {
        left: 71%;
        width: 7px;
      }
    }
  `;
  document.head.appendChild(style);
}


/* RAIL DARPAN COMPACT COACH DIAGRAM V1 */
function rdCoachCompactLayoutStyle() {
  if (document.getElementById("rd-coach-compact-layout-style")) return;

  const style = document.createElement("style");
  style.id = "rd-coach-compact-layout-style";
  style.textContent = `
    .rd-seat-map-dialog {
      width: min(760px, 100%) !important;
    }

    .rd-seat-map-body {
      padding: 12px !important;
    }

    /* Coach runs horizontally; swipe sideways for more compartments. */
    .rd-seat-map-bays {
      display: flex !important;
      flex-direction: row !important;
      flex-wrap: nowrap !important;
      align-items: stretch !important;
      gap: 6px !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 4px 3px 10px !important;
      overflow-x: auto !important;
      overflow-y: hidden !important;
      overscroll-behavior-x: contain;
      scrollbar-width: thin;
      scroll-snap-type: x proximity;
    }

    .rd-seat-map-bays::before,
    .rd-seat-map-bays::after {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex: 0 0 25px !important;
      width: 25px !important;
      min-width: 25px !important;
      min-height: 0 !important;
      box-sizing: border-box !important;
      margin: 0 !important;
      padding: 5px 2px !important;
      border: 1px solid #b7cbd8 !important;
      border-radius: 8px !important;
      background: #e4edf3 !important;
      color: #47677b !important;
      font-size: 8px !important;
      font-weight: 850 !important;
      letter-spacing: .6px !important;
      white-space: nowrap !important;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
    }

    .rd-seat-map-bays::before { content: "END A" !important; }
    .rd-seat-map-bays::after { content: "END B" !important; }

    .rd-seat-map-bay {
      flex: 0 0 184px !important;
      width: 184px !important;
      min-width: 184px !important;
      max-width: 184px !important;
      margin: 0 !important;
      padding: 6px !important;
      box-sizing: border-box !important;
      border: 2px solid #8aa5b7 !important;
      border-radius: 10px !important;
      background: #eaf1f6 !important;
      scroll-snap-align: start;
    }

    .rd-seat-map-bay-title {
      margin: 0 0 5px !important;
      padding: 2px 2px 6px !important;
      border-bottom: 1px solid #cfdae3 !important;
      color: #3b5d73 !important;
      font-size: 9px !important;
      letter-spacing: .2px !important;
      line-height: 1.3 !important;
    }

    .rd-seat-map-grid {
      position: relative !important;
      display: grid !important;
      grid-template-columns:
        minmax(0, 1fr) minmax(0, 1fr) 12px minmax(0, .85fr) !important;
      grid-template-rows: repeat(3, minmax(35px, auto)) !important;
      align-items: stretch !important;
      gap: 4px !important;
      padding: 4px !important;
      border: 1px solid #c6d6e1 !important;
      border-radius: 7px !important;
      background: #dce7ef !important;
    }

    .rd-seat-map-grid.two-tier {
      grid-template-rows: repeat(2, minmax(39px, auto)) !important;
    }

    /* The aisle is already a grid element: don't draw a second aisle. */
    .rd-seat-map-grid::after {
      content: none !important;
      display: none !important;
    }

    .rd-seat-map-aisle {
      grid-column: 3 !important;
      grid-row: 1 / -1 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 12px !important;
      min-width: 0 !important;
      padding: 0 !important;
      border-left: 1px dashed #9eb2c0 !important;
      border-right: 1px dashed #9eb2c0 !important;
      background: #f5f9fb !important;
      color: #7690a2 !important;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-size: 6px !important;
      font-weight: 850 !important;
      letter-spacing: .3px !important;
      overflow: hidden !important;
    }

    .rd-seat-map-grid .rd-seat-tile {
      width: 100% !important;
      min-width: 0 !important;
      min-height: 35px !important;
      margin: 0 !important;
      padding: 2px !important;
      box-sizing: border-box !important;
      border-radius: 5px !important;
      cursor: pointer !important;
    }

    .rd-seat-map-grid.two-tier .rd-seat-tile {
      min-height: 39px !important;
    }

    .rd-seat-map-grid .rd-seat-number {
      font-size: 11px !important;
      line-height: 1.2 !important;
    }

    .rd-seat-map-grid .rd-seat-code {
      font-size: 8px !important;
      line-height: 1.2 !important;
    }

    .rd-seat-map-grid .rd-seat-full-name {
      font-size: 7px !important;
      line-height: 1.15 !important;
    }

    .rd-seat-map-grid .rd-seat-tile.is-selected {
      outline: 2px solid #0d9488 !important;
      outline-offset: 1px !important;
      z-index: 3 !important;
    }

    @media(max-width: 580px) {
      .rd-seat-map-body {
        padding: 9px !important;
      }

      .rd-seat-map-bay {
        flex-basis: 164px !important;
        width: 164px !important;
        min-width: 164px !important;
        max-width: 164px !important;
        padding: 5px !important;
      }

      .rd-seat-map-grid {
        grid-template-columns:
          minmax(0, 1fr) minmax(0, 1fr) 10px minmax(0, .8fr) !important;
        grid-template-rows: repeat(3, minmax(33px, auto)) !important;
        gap: 3px !important;
        padding: 3px !important;
      }

      .rd-seat-map-grid.two-tier {
        grid-template-rows: repeat(2, minmax(37px, auto)) !important;
      }

      .rd-seat-map-grid .rd-seat-tile {
        min-height: 33px !important;
      }

      .rd-seat-map-grid.two-tier .rd-seat-tile {
        min-height: 37px !important;
      }

      .rd-seat-map-aisle {
        width: 10px !important;
      }
    }
  `;
  document.head.appendChild(style);
}


/* RAIL DARPA​N CONFIRMTKT STYLE SEAT DIAGRAM V1 */
function rdConfirmTktDiagramStyle() {
  if (document.getElementById("rd-confirmtkt-diagram-style")) return;

  const style = document.createElement("style");
  style.id = "rd-confirmtkt-diagram-style";
  style.textContent = `
    .rd-seat-map-dialog {
      width: min(600px, 100%) !important;
    }

    .rd-seat-map-body {
      padding: 12px !important;
      background: #f7f9fb !important;
    }

    /* Complete coach outline, viewed from above */
    .rd-seat-map-bays {
      display: flex !important;
      flex-direction: column !important;
      gap: 0 !important;
      width: min(100%, 390px) !important;
      max-width: 390px !important;
      max-height: 60vh !important;
      margin: 0 auto !important;
      padding: 7px !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      box-sizing: border-box !important;
      border: 2px solid #8197a6 !important;
      border-radius: 7px !important;
      background: #fff !important;
      box-shadow: inset 0 0 0 3px #edf2f5 !important;
    }

    .rd-seat-map-bays::before,
    .rd-seat-map-bays::after {
      content: "TOILET                 TOILET" !important;
      display: block !important;
      width: 100% !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
      padding: 12px 4px !important;
      margin: 0 !important;
      border: 1px solid #c4d0d9 !important;
      background:
        linear-gradient(
          90deg,
          #e7edf2 0 42%,
          #fff 42% 58%,
          #e7edf2 58% 100%
        ) !important;
      color: #62798a !important;
      text-align: center !important;
      font-size: 9px !important;
      font-weight: 800 !important;
      letter-spacing: .35px !important;
      white-space: pre !important;
      writing-mode: horizontal-tb !important;
      transform: none !important;
    }

    .rd-seat-map-bay {
      display: block !important;
      flex: 0 0 auto !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 4px 1px !important;
      box-sizing: border-box !important;
      border: 0 !important;
      border-bottom: 1px solid #bbc9d3 !important;
      border-radius: 0 !important;
      background: #fff !important;
      box-shadow: none !important;
    }

    .rd-seat-map-bay-title {
      margin: 0 !important;
      padding: 1px 0 3px !important;
      border: 0 !important;
      color: #8294a1 !important;
      text-align: center !important;
      font-size: 8px !important;
      font-weight: 600 !important;
      letter-spacing: .3px !important;
      line-height: 1.3 !important;
    }

    /* 3-tier / sleeper: six main berths plus two side berths per bay */
    .rd-seat-map-grid {
      display: grid !important;
      grid-template-columns:
        minmax(0, 1fr)
        minmax(0, 1fr)
        minmax(0, 1fr)
        17px
        minmax(0, .85fr) !important;
      grid-template-rows: repeat(2, minmax(28px, auto)) !important;
      align-items: stretch !important;
      gap: 4px !important;
      padding: 4px 2px !important;
      margin: 0 !important;
      position: relative !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: #fff !important;
    }

    /* Map berth number order to the top-down rail-coach diagram. */
    .rd-seat-map-grid:not(.two-tier) > .rd-seat-tile:nth-child(1) { grid-row: 1 !important; grid-column: 1 !important; }
    .rd-seat-map-grid:not(.two-tier) > .rd-seat-tile:nth-child(2) { grid-row: 1 !important; grid-column: 2 !important; }
    .rd-seat-map-grid:not(.two-tier) > .rd-seat-tile:nth-child(3) { grid-row: 1 !important; grid-column: 3 !important; }
    .rd-seat-map-grid:not(.two-tier) > .rd-seat-tile:nth-child(4) { grid-row: 2 !important; grid-column: 1 !important; }
    .rd-seat-map-grid:not(.two-tier) > .rd-seat-tile:nth-child(5) { grid-row: 2 !important; grid-column: 2 !important; }
    .rd-seat-map-grid:not(.two-tier) > .rd-seat-tile:nth-child(6) { grid-row: 2 !important; grid-column: 3 !important; }
    .rd-seat-map-grid:not(.two-tier) > .rd-seat-tile:nth-child(7) { grid-row: 2 !important; grid-column: 5 !important; }
    .rd-seat-map-grid:not(.two-tier) > .rd-seat-tile:nth-child(8) { grid-row: 1 !important; grid-column: 5 !important; }

    /* The corridor between berth blocks and side berths */
    .rd-seat-map-grid:not(.two-tier)::after {
      content: "" !important;
      display: block !important;
      grid-column: 4 !important;
      grid-row: 1 / -1 !important;
      min-width: 0 !important;
      background: #f7fafc !important;
      border-left: 1px solid #e1e8ed !important;
      border-right: 1px solid #e1e8ed !important;
      pointer-events: none !important;
    }

    /* 2AC: four main berths and two side berths per bay */
    .rd-seat-map-grid.two-tier {
      grid-template-columns:
        minmax(0, 1fr)
        minmax(0, 1fr)
        17px
        minmax(0, .85fr) !important;
      grid-template-rows: repeat(2, minmax(31px, auto)) !important;
    }

    .rd-seat-map-grid.two-tier > .rd-seat-tile:nth-child(1) { grid-row: 1 !important; grid-column: 1 !important; }
    .rd-seat-map-grid.two-tier > .rd-seat-tile:nth-child(2) { grid-row: 1 !important; grid-column: 2 !important; }
    .rd-seat-map-grid.two-tier > .rd-seat-tile:nth-child(3) { grid-row: 2 !important; grid-column: 1 !important; }
    .rd-seat-map-grid.two-tier > .rd-seat-tile:nth-child(4) { grid-row: 2 !important; grid-column: 2 !important; }
    .rd-seat-map-grid.two-tier > .rd-seat-tile:nth-child(5) { grid-row: 2 !important; grid-column: 4 !important; }
    .rd-seat-map-grid.two-tier > .rd-seat-tile:nth-child(6) { grid-row: 1 !important; grid-column: 4 !important; }

    .rd-seat-map-grid.two-tier::after {
      content: "" !important;
      display: block !important;
      grid-column: 3 !important;
      grid-row: 1 / -1 !important;
      min-width: 0 !important;
      background: #f7fafc !important;
      border-left: 1px solid #e1e8ed !important;
      border-right: 1px solid #e1e8ed !important;
      pointer-events: none !important;
    }

    .rd-seat-map-grid .rd-seat-tile {
      width: 100% !important;
      min-width: 0 !important;
      min-height: 28px !important;
      padding: 2px 1px !important;
      box-sizing: border-box !important;
      border-radius: 3px !important;
      box-shadow: none !important;
      cursor: pointer !important;
    }

    .rd-seat-map-grid .rd-seat-number {
      font-size: 11px !important;
      line-height: 1.15 !important;
    }

    .rd-seat-map-grid .rd-seat-code {
      font-size: 8px !important;
      line-height: 1.1 !important;
    }

    .rd-seat-map-grid .rd-seat-full-name {
      display: none !important;
    }

    .rd-seat-map-grid .rd-seat-tile.is-selected {
      outline: 2px solid #0d9488 !important;
      outline-offset: 1px !important;
      z-index: 3 !important;
    }

    .rd-seat-map-legend {
      justify-content: center !important;
      max-width: 390px !important;
      margin: 11px auto 0 !important;
      gap: 6px !important;
    }

    .rd-seat-map-legend-item {
      font-size: 10px !important;
      padding: 6px 8px !important;
    }

    @media(max-width: 580px) {
      .rd-seat-map-dialog {
        max-height: calc(100vh - 14px) !important;
      }
      .rd-seat-map-bays {
        max-height: 52vh !important;
        padding: 5px !important;
      }
      .rd-seat-map-grid {
        grid-template-columns:
          minmax(0, 1fr)
          minmax(0, 1fr)
          minmax(0, 1fr)
          14px
          minmax(0, .85fr) !important;
        gap: 3px !important;
      }
      .rd-seat-map-grid.two-tier {
        grid-template-columns:
          minmax(0, 1fr)
          minmax(0, 1fr)
          14px
          minmax(0, .85fr) !important;
      }
    }
  `;

  document.head.appendChild(style);
}

function rdOpenCoachSeatMap(coachCode) {
  rdSeatMapStyle();
  rdCoachInteriorStyle();
  rdConfirmTktDiagramStyle();
  rdCoachCompactLayoutStyle();

  const old = document.getElementById("rd-seat-map-overlay");
  if (old) old.remove();

  const config = rdSeatMapConfig(coachCode);
  const overlay = document.createElement("div");
  overlay.id = "rd-seat-map-overlay";
  overlay.className = "rd-seat-map-overlay";
  overlay.setAttribute("role", "presentation");

  const dialog = document.createElement("section");
  dialog.className = "rd-seat-map-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-label", `Seat layout for coach ${coachCode}`);

  const header = document.createElement("header");
  header.className = "rd-seat-map-header";

  const titleBox = document.createElement("div");
  const title = addText(titleBox, "h2", `Coach ${coachCode} · Seat layout`,
    "rd-seat-map-title");
  const subtitle = `${config.label} · Visual berth reference`;
  addText(titleBox, "p", subtitle, "rd-seat-map-subtitle");

  const close = document.createElement("button");
  close.type = "button";
  close.className = "rd-seat-map-close";
  close.textContent = "×";
  close.setAttribute("aria-label", "Close seat layout");

  header.appendChild(titleBox);
  header.appendChild(close);

  const body = document.createElement("div");
  body.className = "rd-seat-map-body";

  addText(
    body,
    "p",
    "This is a typical reference layout, not live seat availability. Berth numbering and capacity can vary by coach build; confirm the layout shown on your ticket or at the station.",
    "rd-seat-map-note"
  );

  const footer = document.createElement("div");
  footer.className = "rd-seat-map-footer";
  footer.textContent =
    "LB = Lower · MB = Middle · UB = Upper · SL = Side Lower · SU = Side Upper. This does not show whether a berth is vacant or reserved.";

  const closeMap = () => {
    document.removeEventListener("keydown", onKeyDown);
    overlay.remove();
  };

  const onKeyDown = event => {
    if (event.key === "Escape") closeMap();
  };

  close.addEventListener("click", closeMap);
  overlay.addEventListener("click", event => {
    if (event.target === overlay) closeMap();
  });
  dialog.addEventListener("click", event => event.stopPropagation());
  document.addEventListener("keydown", onKeyDown);

  if (config.kind === "three" || config.kind === "two") {
    const controls = document.createElement("div");
    controls.className = "rd-seat-map-controls";

    let capacity = config.defaultCapacity;

    if (config.capacities.length > 1) {
      const capacityLabel = document.createElement("label");
      capacityLabel.className = "rd-seat-map-field";
      addText(capacityLabel, "span", "Choose coach capacity");

      const select = document.createElement("select");
      config.capacities.forEach(count => {
        const option = document.createElement("option");
        option.value = String(count);
        option.textContent = `${count}-berth reference`;
        if (count === capacity) option.selected = true;
        select.appendChild(option);
      });

      capacityLabel.appendChild(select);
      controls.appendChild(capacityLabel);
      select.addEventListener("change", () => {
        capacity = Number(select.value);
        renderMap();
      });
    }

    const searchLabel = document.createElement("label");
    searchLabel.className = "rd-seat-map-field";
    addText(searchLabel, "span", "Find a seat / berth number");

    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.max = String(capacity);
    input.placeholder = "e.g. 23";
    searchLabel.appendChild(input);
    controls.appendChild(searchLabel);

    const findButton = document.createElement("button");
    findButton.type = "button";
    findButton.className = "rd-seat-map-find";
    findButton.textContent = "Find berth";
    controls.appendChild(findButton);

    const foundResult = document.createElement("div");
    foundResult.className = "rd-seat-map-result";
    foundResult.setAttribute("aria-live", "polite");

    const map = document.createElement("div");
    map.className = "rd-seat-map-bays";

    const legends = document.createElement("div");
    legends.className = "rd-seat-map-legend";
    [
      ["LB", "Lower berth"],
      ["MB", "Middle berth"],
      ["UB", "Upper berth"],
      ["SL", "Side lower"],
      ["SU", "Side upper"]
    ].filter(([code]) => config.pattern.some(item => item.code === code))
      .forEach(([code, name]) => {
        addText(legends, "span", `${code} · ${name}`, "rd-seat-map-legend-item");
      });

    function highlightSeat(number) {
      map.querySelectorAll(".rd-seat-tile.is-selected").forEach(tile =>
        tile.classList.remove("is-selected")
      );

      const seatNumber = Number(number);
      if (!Number.isInteger(seatNumber) || seatNumber < 1 || seatNumber > capacity) {
        foundResult.textContent = `Enter a berth number between 1 and ${capacity}.`;
        return;
      }

      const patternIndex = (seatNumber - 1) % config.pattern.length;
      const berth = config.pattern[patternIndex];
      const bay = Math.floor((seatNumber - 1) / config.pattern.length) + 1;

      foundResult.textContent =
        `Berth ${seatNumber}: ${berth.name} (${berth.code}) · Bay ${bay}`;

      const tile = map.querySelector(`[data-seat-number="${seatNumber}"]`);
      if (tile) {
        tile.classList.add("is-selected");
        tile.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    }

    function renderMap() {
      map.replaceChildren();
      input.max = String(capacity);

      for (let first = 1; first <= capacity; first += config.pattern.length) {
        const last = Math.min(first + config.pattern.length - 1, capacity);
        const bay = document.createElement("section");
        bay.className = "rd-seat-map-bay";

        addText(
          bay, "h3",
          `Bay ${Math.floor((first - 1) / config.pattern.length) + 1} · Berths ${first}–${last}`,
          "rd-seat-map-bay-title"
        );

        const grid = document.createElement("div");
        grid.className =
          "rd-seat-map-grid" + (config.kind === "two" ? " two-tier" : "");

        config.pattern.forEach((position, offset) => {
          const number = first + offset;
          if (number > capacity) return;

          const tile = document.createElement("button");
          tile.type = "button";
          tile.className = "rd-seat-tile";
          tile.dataset.seatNumber = String(number);
          tile.dataset.type = position.code;
          tile.style.gridRow = String(position.row);
          tile.style.gridColumn = String(position.col);
          tile.title = `Berth ${number}: ${position.name}`;

          addText(tile, "span", String(number), "rd-seat-number");
          addText(tile, "strong", position.code, "rd-seat-code");
          addText(
            tile, "span",
            position.name.replace(" berth", ""),
            "rd-seat-full-name"
          );

          tile.addEventListener("click", () => {
            input.value = String(number);
            highlightSeat(number);
          });

          grid.appendChild(tile);
        });

        bay.appendChild(grid);
        map.appendChild(bay);
      }

      if (input.value && Number(input.value) > capacity) {
        input.value = "";
        foundResult.textContent = "";
      }
    }

    findButton.addEventListener("click", () => highlightSeat(input.value));
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") highlightSeat(input.value);
    });

    renderMap();
    body.appendChild(controls);
    body.appendChild(foundResult);
    body.appendChild(map);
    body.appendChild(legends);
  } else {
    const info = document.createElement("section");
    info.className = "rd-seat-map-other";

    if (config.kind === "cabin") {
      addText(info, "h3", config.label);
      addText(
        info, "p",
        "First AC and hybrid coaches can have cabins and coupes. Their exact seat numbers and berth placement depend on the specific coach diagram, which the current coach-position feed does not provide."
      );
      addText(
        info, "p",
        "Typical concepts: a cabin can contain lower and upper berths on both sides; a coupe generally contains a lower and an upper berth. This is illustrative only, not a numbered map."
      );
    } else if (config.kind === "seating") {
      addText(info, "h3", config.label);
      addText(
        info, "p",
        "This is a seating coach, not a lower/middle/upper sleeper berth layout. Exact seat numbers, row order and window/aisle positions depend on its specific coach diagram."
      );
      addText(
        info, "p",
        "The current live coach-position data gives the coach order, but does not contain a verified numbered seating plan. I won't invent seat numbers."
      );
    } else {
      addText(info, "h3", "Exact seat map unavailable");
      addText(
        info, "p",
        "The coach label alone is not enough to identify a verified seat-number layout. Please use the coach diagram shown at the station or supplied with the ticket."
      );
    }

    body.appendChild(info);
  }

  dialog.appendChild(header);
  dialog.appendChild(body);
  dialog.appendChild(footer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  close.focus();
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

      /* RAIL DARPAN LIVE STATUS PREMIUM UI V1 */

      .result-panel.live-result-panel {
        position: relative;
        box-sizing: border-box;
        overflow: hidden;
        padding: clamp(15px, 2.5vw, 25px) !important;
        border: 1px solid #c7d2fe !important;
        border-radius: 22px !important;
        color: #172554 !important;
        background:
          radial-gradient(ellipse at 100% 0%, rgba(103,232,249,.20), transparent 32%),
          radial-gradient(ellipse at 0% 100%, rgba(167,139,250,.14), transparent 34%),
          linear-gradient(145deg, #ffffff 0%, #f8faff 58%, #eef2ff 100%) !important;
        box-shadow: 0 18px 45px rgba(49,46,129,.13) !important;
      }

      .result-panel.live-result-panel::before {
        content: "";
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 5px;
        background: linear-gradient(90deg, #4f46e5, #8b5cf6, #06b6d4, #34d399);
        pointer-events: none;
      }

      .live-result-panel > h4 {
        margin: 5px 0 12px;
        color: #172554 !important;
        font-size: clamp(21px, 3vw, 29px);
        font-weight: 850;
        letter-spacing: -.6px;
        line-height: 1.3;
        overflow-wrap: anywhere;
      }

      .live-result-panel .live-v3-head {
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        padding: 13px 15px;
        border: 1px solid #c7d2fe;
        border-radius: 14px;
        background: linear-gradient(115deg, #eef2ff, #f5f3ff 55%, #ecfeff);
      }

      .live-result-panel .live-v3-subtitle {
        color: #475569;
        font-size: 12px;
        font-weight: 650;
        line-height: 1.65;
      }

      .live-result-panel .live-v3-badge {
        padding: 8px 12px;
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        color: #334155;
        background: #f1f5f9;
        font-size: 11px;
        font-weight: 850;
        letter-spacing: .35px;
        box-shadow: 0 2px 6px rgba(15,23,42,.05);
      }

      .live-result-panel .live-v3-badge.good {
        color: #166534;
        border-color: #86efac;
        background: linear-gradient(120deg, #dcfce7, #bbf7d0);
      }

      .live-result-panel .live-v3-badge.warn {
        color: #92400e;
        border-color: #fcd34d;
        background: linear-gradient(120deg, #fef3c7, #fde68a);
      }

      .live-result-panel .live-v3-badge.bad {
        color: #991b1b;
        border-color: #fda4af;
        background: linear-gradient(120deg, #fee2e2, #fecdd3);
      }

      .live-result-panel .live-v3-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 11px;
        margin: 14px 0 17px;
      }

      .live-result-panel .live-v3-card {
        position: relative;
        min-width: 0;
        padding: 15px 13px;
        overflow: hidden;
        border: 1px solid #dbeafe;
        border-radius: 15px;
        background: linear-gradient(145deg, #ffffff, #eff6ff);
        box-shadow: 0 5px 16px rgba(37,99,235,.06);
        transition: transform .18s ease, box-shadow .18s ease;
      }

      .live-result-panel .live-v3-card:nth-child(2) {
        border-color: #fed7aa;
        background: linear-gradient(145deg, #ffffff, #fff7ed);
      }

      .live-result-panel .live-v3-card:nth-child(3) {
        border-color: #c4b5fd;
        background: linear-gradient(145deg, #ffffff, #f5f3ff);
      }

      .live-result-panel .live-v3-card:nth-child(4) {
        border-color: #a5f3fc;
        background: linear-gradient(145deg, #ffffff, #ecfeff);
      }

      .live-result-panel .live-v3-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 9px 22px rgba(79,70,229,.11);
      }

      .live-result-panel .live-v3-label {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 8px;
        color: #64748b;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: .6px;
        text-transform: uppercase;
        line-height: 1.4;
      }

      .live-result-panel .live-v3-card:nth-child(1) .live-v3-label::before {
        content: "📍";
      }

      .live-result-panel .live-v3-card:nth-child(2) .live-v3-label::before {
        content: "⏱️";
      }

      .live-result-panel .live-v3-card:nth-child(3) .live-v3-label::before {
        content: "🚉";
      }

      .live-result-panel .live-v3-card:nth-child(4) .live-v3-label::before {
        content: "⚡";
      }

      .live-result-panel .live-v3-value {
        color: #172554;
        font-size: clamp(13px, 1.5vw, 17px);
        font-weight: 850;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      .live-result-panel .live-v3-section {
        margin-top: 15px;
        padding: 15px;
        border: 1px solid #dbe4ff;
        border-radius: 16px;
        background: linear-gradient(145deg, #ffffff, #f8faff);
        box-shadow: 0 5px 18px rgba(37,51,112,.045);
      }

      .live-result-panel .live-v3-section-title {
        margin: 0 0 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid #e0e7ff;
        color: #312e81;
        font-size: 15px;
        font-weight: 850;
        line-height: 1.5;
      }

      .live-result-panel .live-v3-stop {
        gap: 12px;
        padding: 12px 5px;
        border-top-color: #e8edf8;
      }

      .live-result-panel .live-v3-stop-name {
        color: #1e293b;
        font-size: 13px;
        font-weight: 800;
      }

      .live-result-panel .live-v3-stop-meta {
        color: #64748b;
        line-height: 1.7;
      }

      .live-result-panel .live-v3-platform {
        border: 1px solid #bae6fd;
        border-radius: 9px;
        color: #075985;
        background: linear-gradient(130deg, #e0f2fe, #cffafe);
      }

      .live-result-panel .live-v3-details {
        margin-top: 12px;
        border: 1px solid #c7d2fe;
        border-radius: 13px;
        background: linear-gradient(145deg, #ffffff, #f5f3ff);
      }

      .live-result-panel .live-v3-details summary {
        color: #4338ca;
        font-weight: 800;
      }

      .live-result-panel .live-v3-note {
        border: 1px solid #fde68a;
        border-radius: 10px;
        background: #fffbeb;
        color: #92400e;
        line-height: 1.65;
      }

      .live-result-panel .rd-live-coach-section {
        margin-top: 15px;
        padding: 15px;
        border: 1px solid #c7d2fe;
        border-radius: 16px;
        background: linear-gradient(140deg, #eef2ff, #ffffff 58%, #ecfeff);
        box-shadow: 0 6px 18px rgba(79,70,229,.07);
      }

      .live-result-panel .rd-live-coach-title {
        color: #312e81;
        font-size: 16px;
        font-weight: 850;
      }

      .live-result-panel .rd-live-coach-tag {
        border-radius: 999px;
        color: #4338ca;
        background: #e0e7ff;
        font-weight: 800;
      }

      @media(max-width:900px) {
        .live-result-panel .live-v3-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media(max-width:600px) {
        .result-panel.live-result-panel {
          padding: 14px !important;
          border-radius: 17px !important;
        }

        .live-result-panel .live-v3-head {
          padding: 11px;
        }

        .live-result-panel .live-v3-grid {
          gap: 8px;
        }

        .live-result-panel .live-v3-card {
          padding: 11px 10px;
          border-radius: 12px;
        }

        .live-result-panel .live-v3-section {
          padding: 11px;
          border-radius: 13px;
        }
      }

      @media(prefers-reduced-motion:reduce) {
        .live-result-panel .live-v3-card {
          transition: none;
        }

        .live-result-panel .live-v3-card:hover {
          transform: none;
        }
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


  /* RAIL DARPAN LIVE HALT TIMELINE V1 */
  if (!document.getElementById("rd-live-route-timeline-style")) {
    const style = document.createElement("style");
    style.id = "rd-live-route-timeline-style";
    style.textContent = `
      .live-v3-route-timeline {
        overflow: hidden;
        border: 1px solid #c7d2fe;
        background: linear-gradient(135deg,#ffffff,#f5f3ff 55%,#ecfeff);
      }
      .live-v3-route-help {
        margin: 0 0 8px;
        color: #64748b;
        font-size: 11px;
        line-height: 1.55;
      }
      .live-v3-route-viewport {
        width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 12px 4px 16px;
        overscroll-behavior-x: contain;
        scrollbar-width: thin;
        scrollbar-color: #818cf8 #e0e7ff;
      }
      .live-v3-route-track {
        display: flex;
        align-items: flex-start;
        width: max-content;
        min-width: 100%;
      }
      .live-v3-route-stop {
        box-sizing: border-box;
        flex: 0 0 70px;
        width: 70px;
        min-width: 0;
        padding: 5px 3px 7px;
        border: 1px solid transparent;
        border-radius: 13px;
        text-align: center;
        scroll-snap-align: center;
      }
      .live-v3-route-stop.is-current {
        border-color: #86efac;
        background: linear-gradient(155deg,#f0fdf4,#dcfce7);
        box-shadow: 0 5px 18px rgba(34,197,94,.15);
      }
      .live-v3-route-marker {
        box-sizing: border-box;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 30px;
        margin-bottom: 5px;
      }
      .live-v3-route-station-dot {
        width: 13px;
        height: 13px;
        flex: 0 0 13px;
        border: 3px solid #6366f1;
        border-radius: 50%;
        background: #fff;
        box-shadow: 0 0 0 5px #e0e7ff;
      }
      .live-v3-route-current-icon {
        font-size: 22px;
        line-height: 1;
        filter: drop-shadow(0 3px 3px rgba(15,23,42,.2));
      }
      .live-v3-route-live-pill {
        position: absolute;
        top: -5px;
        right: -2px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 5px;
        border: 1px solid #86efac;
        border-radius: 999px;
        background: #dcfce7;
        color: #166534;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .3px;
      }
      .live-v3-route-live-dot {
        position: absolute;
        top: 0;
        left: calc(50% + 4px);
        z-index: 3;
        box-sizing: border-box;
        width: 9px;
        height: 9px;
        border: 2px solid #ffffff;
        border-radius: 50%;
        background: #16a34a;
        box-shadow: 0 0 0 0 rgba(22,163,74,.65);
        animation: rd-live-halt-pulse 1.35s infinite;
      }
      @keyframes rd-live-halt-pulse {
        0% { box-shadow: 0 0 0 0 rgba(22,163,74,.65); }
        70% { box-shadow: 0 0 0 7px rgba(22,163,74,0); }
        100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); }
      }
      .live-v3-route-stop-name {
        color: #1e1b4b;
        font-size: 10px;
        font-weight: 800;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }
      .live-v3-route-stop.is-current .live-v3-route-stop-name {
        color: #166534;
      }
      .live-v3-route-stop-code {
        margin-top: 4px;
        color: #64748b;
        font-size: 10px;
        font-weight: 700;
      }
      .live-v3-route-current-label {
        display: inline-block;
        margin-top: 6px;
        padding: 3px 7px;
        border-radius: 999px;
        background: #bbf7d0;
        color: #166534;
        font-size: 9px;
        font-weight: 900;
      }
      .live-v3-route-connector {
        box-sizing: border-box;
        position: relative;
        flex: 0 0 8px;
        width: 8px;
        height: 12px;
        margin-top: 17px;
        background: repeating-linear-gradient(
          90deg, transparent 0 8px, #94a3b8 8px 11px, transparent 11px 17px
        );
      }
      .live-v3-route-connector::before,
      .live-v3-route-connector::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        height: 2px;
        border-radius: 2px;
        background: #64748b;
      }
      .live-v3-route-connector::before { top: 2px; }
      .live-v3-route-connector::after { top: 8px; }
      .live-v3-route-connector.is-live-connector {
        position: relative;
        z-index: 4;
        overflow: visible;
      }
      .live-v3-route-connector.is-live-connector .live-v3-route-current-icon {
        position: absolute;
        top: -10px;
        left: 50%;
        z-index: 5;
        transform: translateX(-50%);
        font-size: 18px;
        line-height: 1;
        white-space: nowrap;
      }
      .live-v3-route-connector.is-live-connector .live-v3-route-live-dot {
        position: absolute;
        top: -12px;
        left: calc(50% + 3px);
        z-index: 6;
        width: 8px;
        height: 8px;
        border: 1.5px solid #ffffff;
        border-radius: 50%;
        box-sizing: border-box;
      }

      @media(max-width:600px) {
        .live-v3-route-stop {
          flex-basis: 64px;
          width: 64px;
        }
        .live-v3-route-connector {
          flex-basis: 6px;
          width: 6px;
        }
      }
      @media(prefers-reduced-motion:reduce) {
        .live-v3-route-live-dot { animation: none; }
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


  /* RAIL-DARPAN-LIVE-PREMIUM-STRUCTURE-V2 */
  if (source || destination) {
    const journey = document.createElement("div");
    journey.className = "live-v3-journey";

    const fromBox = document.createElement("div");
    fromBox.className = "live-v3-journey-stop";
    addText(fromBox, "span", "FROM STATION", "live-v3-journey-label");
    addText(fromBox, "strong", source || "Source not available",
      "live-v3-journey-name");

    const connector = document.createElement("div");
    connector.className = "live-v3-journey-connector";
    connector.setAttribute("aria-hidden", "true");
    connector.textContent = "➜";

    const toBox = document.createElement("div");
    toBox.className = "live-v3-journey-stop";
    addText(toBox, "span", "TO STATION", "live-v3-journey-label");
    addText(toBox, "strong", destination || "Destination not available",
      "live-v3-journey-name");

    journey.append(fromBox, connector, toBox);
    panel.appendChild(journey);
  }


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
    const icon = document.createElement("span");
    icon.className = "live-v3-card-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = ({
      "Current location": "📍",
      "Delay": "⏱️",
      "Next station": "🚉",
      "Current speed": "⚡"
    })[label] || "🚆";
    card.appendChild(icon);
    addText(card, "span", label, "live-v3-label");
    addText(card, "strong", value, "live-v3-value");
    grid.appendChild(card);
  });

  panel.appendChild(grid);


  /* Build a route strip using halting stations only. */
  let routeTimeline = null;

  const haltStations = route
    .map((stop, index) => ({
      stop,
      index,
      name: rdLiveV3StopName(stop)
    }))
    .filter(item =>
      rdScheduleV2IsHalt(item.stop, item.index, route.length) &&
      item.name &&
      !/^not available$/i.test(String(item.name))
    );

  if (haltStations.length) {
    routeTimeline = document.createElement("section");
    routeTimeline.className = "live-v3-section live-v3-route-timeline";

    addText(
      routeTimeline,
      "h5",
      "Train route · stopping stations",
      "live-v3-section-title"
    );

    addText(
      routeTimeline,
      "p",
      "Only halting stations are shown. The green LIVE marker appears only when the provider's current station matches a listed halt.",
      "live-v3-route-help"
    );

    const viewport = document.createElement("div");
    viewport.className = "live-v3-route-viewport";
    viewport.setAttribute("aria-label", "Scrollable train route");

    const track = document.createElement("div");
    track.className = "live-v3-route-track";

    // RAIL DARPAN LIVE TRAIN BETWEEN STATIONS V1
    const currentHaltPosition = haltStations.findIndex(
      item => item.index === currentIndex
    );
    const nextHaltPosition = haltStations.findIndex(
      item => item.index === nextIndex
    );
    const numericSpeed = Number.parseFloat(String(speed));

    const feedIndicatesMovement =
      /\b(running|in transit|between stations|on the way|departed|moving|approaching)\b/i
        .test(String(status)) ||
      (Number.isFinite(numericSpeed) && numericSpeed > 0);

    const currentTrainInTransit =
      currentHaltPosition >= 0 &&
      nextHaltPosition === currentHaltPosition + 1 &&
      feedIndicatesMovement;

    haltStations.forEach((item, visibleIndex) => {
      if (visibleIndex > 0) {
        const connector = document.createElement("div");
        connector.className = "live-v3-route-connector";
        connector.setAttribute("aria-hidden", "true");

        const previousHalt = haltStations[visibleIndex - 1];
        const isLiveSegment =
          currentTrainInTransit &&
          previousHalt.index === currentIndex &&
          item.index === nextIndex;

        if (isLiveSegment) {
          connector.classList.add("is-live-connector");

          const trainIcon = document.createElement("span");
          trainIcon.className = "live-v3-route-current-icon";
          trainIcon.textContent = "🚆";
          trainIcon.setAttribute("role", "img");
          trainIcon.setAttribute("aria-label", "Train currently travelling between stations");
          connector.appendChild(trainIcon);

          const liveDot = document.createElement("span");
          liveDot.className = "live-v3-route-live-dot";
          liveDot.setAttribute("aria-label", "Live movement");
          connector.appendChild(liveDot);
        }

        track.appendChild(connector);
      }

      const isCurrent = !currentTrainInTransit && currentIndex >= 0 && item.index === currentIndex;

      const stopCard = document.createElement("div");
      stopCard.className = "live-v3-route-stop" + (isCurrent ? " is-current" : "");

      const markerRow = document.createElement("div");
      markerRow.className = "live-v3-route-marker";

      if (isCurrent) {
        const trainIcon = document.createElement("span");
        trainIcon.className = "live-v3-route-current-icon";
        trainIcon.textContent = "🚆";
        trainIcon.setAttribute("role", "img");
        trainIcon.setAttribute("aria-label", "Train currently reported at this station");
        markerRow.appendChild(trainIcon);

        // RAIL DARPAN LIVE ICON ONLY V2
        const liveDot = document.createElement("span");
        liveDot.className = "live-v3-route-live-dot";
        liveDot.setAttribute("aria-hidden", "true");
        markerRow.appendChild(liveDot);
      } else {
        const stationDot = document.createElement("span");
        stationDot.className = "live-v3-route-station-dot";
        stationDot.setAttribute("aria-hidden", "true");
        markerRow.appendChild(stationDot);
      }

      stopCard.appendChild(markerRow);
      addText(stopCard, "div", String(item.name), "live-v3-route-stop-name");

      const code = rdLiveV3Value(item.stop, [
        "stationCode", "station_code", "code", "stationId", "station_id"
      ]);

      if (code && String(code).toLowerCase() !== String(item.name).toLowerCase()) {
        addText(stopCard, "div", String(code), "live-v3-route-stop-code");
      }


      track.appendChild(stopCard);
    });

    viewport.appendChild(track);
    routeTimeline.appendChild(viewport);

    const currentIsShown = haltStations.some(item => item.index === currentIndex);

    if (!currentIsShown) {
      addText(
        routeTimeline,
        "p",
        "Current station could not be matched to a scheduled halt. No station is marked LIVE.",
        "live-v3-note"
      );
    }

    panel.appendChild(routeTimeline);
  }

  const routeStart = nextIndex >= 0
    ? nextIndex
    : currentIndex >= 0 ? currentIndex + 1 : -1;


  if (route.length) {
    const section = document.createElement("section");
    section.className = "live-v3-section";
    addText(section, "h5", "Next stopping stations · halt · platform",
      "live-v3-section-title");

    let visibleEnd = route.length;

    if (routeStart >= 0 && routeStart < route.length) {
      // Include the next three stopping stations and group pass-through stops
      // between them into expandable rows.
      let stoppingCount = 0;

      for (let i = routeStart; i < route.length; i++) {
        if (rdScheduleV2IsHalt(route[i], i, route.length)) {
          stoppingCount++;
        }
        if (stoppingCount >= 3) {
          visibleEnd = i + 1;
          break;
        }
      }

      rdLiveV3AppendGroupedStops(
        section,
        route.slice(routeStart, visibleEnd),
        routeStart,
        route.length
      );
    } else if (nextRaw && typeof nextRaw === "object") {
      section.appendChild(rdLiveV3Row(nextRaw, 0));
      addText(section, "p",
        "The provider route could not be matched to the current train location.",
        "live-v3-note");
    } else {
      addText(section, "p",
        "The upcoming route order is not confirmed by the current feed.",
        "live-v3-note");
    }

    panel.appendChild(section);

    const remainingStart = routeStart >= 0 ? visibleEnd : 0;
    const remaining = route.slice(remainingStart);

    if (remaining.length || routeStart < 0) {
      const details = document.createElement("details");
      details.className = "live-v3-details";

      const remainingHaltCount = remaining.filter((stop, index) =>
        rdScheduleV2IsHalt(stop, remainingStart + index, route.length)
      ).length;

      addText(details, "summary",
        routeStart >= 0
          ? `View remaining route · ${remainingHaltCount} stopping stations`
          : `View full route & timings · ${route.length} stations`
      );

      const scroll = document.createElement("div");
      scroll.className = "live-v3-scroll";

      rdLiveV3AppendGroupedStops(
        scroll,
        remaining,
        remainingStart,
        route.length
      );

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
    rdLiveCoachBadgeStyle();

    const section = document.createElement("section");
    section.className = "rd-live-coach-section";

    const header = document.createElement("div");
    header.className = "rd-live-coach-header";
    addText(header, "h5", "Coach position", "rd-live-coach-title");
    addText(header, "span", "COACH ORDER", "rd-live-coach-tag");
    section.appendChild(header);

    const allTokens = rdLiveCoachTokens(coach);
    const tokens = allTokens.slice(0, 36);

    if (tokens.length) {
      const list = document.createElement("div");
      list.className = "rd-live-coach-list";

      tokens.forEach((token, index) => {
        const badge = document.createElement("div");
        badge.className = "rd-live-coach-badge";
        badge.title = `Position ${index + 1}`;

        addText(
          badge, "span",
          String(index + 1).padStart(2, "0"),
          "rd-live-coach-index"
        );
        addText(badge, "strong", token, "rd-live-coach-code");

        badge.classList.add("rd-seat-map-clickable");
        badge.setAttribute("role", "button");
        badge.setAttribute("tabindex", "0");
        badge.setAttribute("aria-label", `Open seat layout for coach ${token}`);
        badge.addEventListener("click", () => rdOpenCoachSeatMap(token));
        badge.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            rdOpenCoachSeatMap(token);
          }
        });
list.appendChild(badge);
      });

      if (allTokens.length > tokens.length) {
        addText(
          list, "span",
          `+${allTokens.length - tokens.length} more`,
          "rd-live-coach-more"
        );
      }

      section.appendChild(list);
    } else {
      addText(
        section, "p",
        "Coach-position data is available but could not be formatted as badges.",
        "rd-live-coach-note"
      );

      const extra = document.createElement("details");
      addText(extra, "summary", "View coach details");
      const content = document.createElement("div");
      renderObject(coach, content);
      extra.appendChild(content);
      section.appendChild(extra);
    }

    addText(
      section, "p",
      "Coach order can be static. Confirm the coach display at the station before boarding.",
      "rd-live-coach-note"
    );

    /* RAIL DARPA​N COACH POSITION PLACEMENT V2 */
    const routeTimeline = panel.querySelector(".live-v3-route-timeline");
    const summaryGrid = panel.querySelector(".live-v3-grid");

    if (routeTimeline) {
      routeTimeline.insertAdjacentElement("afterend", section);
    } else if (summaryGrid) {
      summaryGrid.insertAdjacentElement("afterend", section);
    } else {
      panel.appendChild(section);
    }
  }


  const updated = rdLiveV3Value(payload, [
    "lastUpdatedAt", "last_updated_at", "updatedAt", "updated_at"
  ]);

  if (updated) addText(panel, "p", `Last updated: ${updated}`);
}


/* RAIL DARPA​N COMPACT SCHEDULE V2 */
function rdScheduleV2Value(obj, keys) {
  if (!obj || typeof obj !== "object") return "";
  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null && value !== "") {
      if (typeof value === "object" && !Array.isArray(value)) {
        const nested = value.name || value.stationName || value.station_name ||
          value.code || value.stationCode || value.station_code;
        if (nested) return String(nested);
      } else if (!Array.isArray(value)) {
        return String(value);
      }
    }
  }
  return "";
}

function rdScheduleV2Minutes(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;

  const text = String(raw).trim();
  const h = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
  const m = text.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)\b/i);

  if (h || m) {
    return (h ? Number(h[1]) * 60 : 0) +
      (m ? Number(m[1]) : 0);
  }
  if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text);
  return null;
}

function rdScheduleV2Duration(raw) {
  const minutes = rdScheduleV2Minutes(raw);
  if (minutes === null) return String(raw || "Not available");

  const total = Math.max(0, Math.round(minutes));
  const hrs = Math.floor(total / 60);
  const mins = total % 60;
  if (hrs && mins) return `${hrs} hr ${mins} min`;
  if (hrs) return `${hrs} hr`;
  return `${mins} min`;
}

function rdScheduleV2Time(raw) {
  if (raw === null || raw === undefined || raw === "") return "—";

  const text = String(raw).trim();
  const match = text.match(/(?:T|\b)(\d{1,2}):([0-5]\d)(?::\d{2})?/);
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`;
  return text;
}

function rdScheduleV2DayList(raw) {
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const lookup = {
    mon: 0, monday: 0,
    tue: 1, tues: 1, tuesday: 1,
    wed: 2, wednesday: 2,
    thu: 3, thur: 3, thurs: 3, thursday: 3,
    fri: 4, friday: 4,
    sat: 5, saturday: 5,
    sun: 6, sunday: 6
  };
  const active = new Set();
  let known = false;

  function read(value) {
    if (value === null || value === undefined || value === "") return;

    if (Array.isArray(value)) {
      if (value.length === 7 && value.every(v =>
        typeof v === "boolean" || v === 0 || v === 1
      )) {
        known = true;
        value.forEach((v, i) => { if (v === true || v === 1) active.add(i); });
        return;
      }
      value.forEach(read);
      return;
    }

    if (typeof value === "object") {
      Object.entries(value).forEach(([key, state]) => {
        const index = lookup[key.toLowerCase().trim()];
        if (index !== undefined) {
          known = true;
          if (state === true || state === 1 ||
              /^(yes|true|1|runs)$/i.test(String(state))) active.add(index);
        }
      });
      return;
    }

    String(value).toLowerCase().split(/[^a-z]+/).filter(Boolean).forEach(token => {
      if (token === "daily" || token === "everyday" || token === "every") {
        known = true;
        names.forEach((_, i) => active.add(i));
      }
      if (lookup[token] !== undefined) {
        known = true;
        active.add(lookup[token]);
      }
    });
  }

  read(raw);
  return { names, active, known };
}

function rdScheduleV2StationName(stop) {
  return rdScheduleV2Value(stop, [
    "stationName", "station_name", "name", "stopName", "stop_name", "label"
  ]) || rdScheduleV2Value(stop && stop.station, [
    "stationName", "station_name", "name", "code"
  ]) || rdScheduleV2Value(stop, ["stationCode", "station_code", "code"]) ||
    "Station";
}


/* RAIL DARPA​N HIDE PASS-THROUGH STATIONS V1 */

function rdScheduleV2IsHalt(stop, index, total) {
  if (!stop || typeof stop !== "object") return true;

  // Trust explicit stop/halt flags if the provider supplies them.
  for (const key of [
    "isHalt", "is_halt", "isStopping", "is_stopping",
    "hasStop", "has_stop", "stopsHere", "stops_here"
  ]) {
    if (!(key in stop) || stop[key] === null || stop[key] === "") continue;

    const value = stop[key];

    if (value === true || value === 1) return true;
    if (value === false || value === 0) return false;

    const text = String(value).trim().toLowerCase();

    if (["true", "yes", "y", "1", "halt", "stops", "stopping"].includes(text)) {
      return true;
    }

    if (["false", "no", "n", "0", "pass", "pass-through",
         "passthrough", "non-stop", "nonstop", "does not stop"].includes(text)) {
      return false;
    }
  }

  // Status/type text can explicitly identify a run-through station.
  const status = [
    stop.stopType, stop.stop_type, stop.stopStatus,
    stop.stop_status, stop.haltStatus, stop.halt_status, stop.status
  ].filter(value => value !== undefined && value !== null)
   .map(value => String(value).toLowerCase())
   .join(" ");

  if (/\b(pass[\s-]?through|non[\s-]?stop|does not stop|no halt|run[\s-]?through|not halting)\b/.test(status)) {
    return false;
  }

  if (/\b(stopping|halt station|scheduled stop|halts here)\b/.test(status)) {
    return true;
  }

  // Use an explicit halt/stoppage duration if available.
  for (const key of [
    "haltDuration", "halt_duration", "stoppageDuration",
    "stoppage_duration", "dwellTime", "dwell_time",
    "haltMinutes", "halt_minutes", "stoppageMinutes", "stoppage_minutes"
  ]) {
    if (!(key in stop) || stop[key] === null || stop[key] === "") continue;

    const raw = stop[key];

    if (typeof raw === "number") return raw > 0;

    const text = String(raw).trim().toLowerCase();

    if (/^(00:00|0:00|0|0\.0|0 min|0 mins|0 minute|0 minutes|zero)$/.test(text)) {
      return false;
    }

    const minutes = rdScheduleV2Minutes(raw);
    if (minutes !== null) return minutes > 0;
  }

  // Equal arrival/departure times suggest a non-stop, unless this is
  // the origin or terminal. If uncertain, keep the station visible.
  const arrival = stop.scheduledArrival ?? stop.scheduled_arrival ?? stop.arrival;
  const departure = stop.scheduledDeparture ?? stop.scheduled_departure ?? stop.departure;

  if (arrival !== undefined && arrival !== null && arrival !== "" &&
      departure !== undefined && departure !== null && departure !== "") {

    const a = rdScheduleV2Time(arrival).match(/^(\d{1,2}):([0-5]\d)$/);
    const d = rdScheduleV2Time(departure).match(/^(\d{1,2}):([0-5]\d)$/);

    if (a && d) {
      const sameTime = Number(a[1]) === Number(d[1]) &&
                       Number(a[2]) === Number(d[2]);

      if (sameTime && index !== 0 && index !== total - 1) return false;
      if (!sameTime) return true;
    }
  }

  // Do not hide a station merely because the API lacks stop metadata.
  return true;
}

function rdScheduleV2EnsurePassThroughStyle() {
  if (document.getElementById("rd-schedule-v2-pass-style")) return;

  const style = document.createElement("style");
  style.id = "rd-schedule-v2-pass-style";
  style.textContent = `
    .rd-schedule-v2-pass-through {
      margin: 4px 0;
      padding: 0 10px;
      border-top: 1px dashed #d6e0e8;
      border-bottom: 1px dashed #d6e0e8;
      border-radius: 8px;
      background: #f8fafc;
    }
    .rd-schedule-v2-pass-through summary {
      padding: 10px 0;
      cursor: pointer;
      color: #64748b;
      font-size: 11px;
      line-height: 1.5;
      font-weight: 750;
    }
    .rd-schedule-v2-pass-list {
      max-height: 240px;
      overflow: auto;
      padding-bottom: 6px;
    }
    .rd-schedule-v2-pass-through[open] summary {
      color: #14527a;
    }
  `;
  document.head.appendChild(style);
}

function rdScheduleV2AppendGroupedStops(parent, stops, offset, total) {
  let i = 0;

  while (i < stops.length) {
    const absoluteIndex = offset + i;
    const stop = stops[i];

    if (rdScheduleV2IsHalt(stop, absoluteIndex, total)) {
      parent.appendChild(rdScheduleV2Stop(stop, absoluteIndex));
      i++;
      continue;
    }

    // Collect consecutive pass-through stations into one collapsed group.
    const passThrough = [];

    while (i < stops.length &&
           !rdScheduleV2IsHalt(stops[i], offset + i, total)) {
      passThrough.push(stops[i]);
      i++;
    }

    if (!passThrough.length) continue;

    const details = document.createElement("details");
    details.className = "rd-schedule-v2-pass-through";

    const label = passThrough.length === 1
      ? "Show 1 non-stopping station"
      : `Show ${passThrough.length} non-stopping stations`;

    addText(details, "summary", label);

    const list = document.createElement("div");
    list.className = "rd-schedule-v2-pass-list";

    passThrough.forEach((station, localIndex) => {
      list.appendChild(
        rdScheduleV2Stop(station, offset + i - passThrough.length + localIndex)
      );
    });

    details.appendChild(list);
    parent.appendChild(details);
  }
}

function rdScheduleV2Stop(stop, index) {
  const row = document.createElement("div");
  row.className = "rd-schedule-v2-stop";

  const main = document.createElement("div");
  addText(main, "div", rdScheduleV2StationName(stop), "rd-schedule-v2-station");

  const arr = rdScheduleV2Time(
    stop.scheduledArrival ?? stop.scheduled_arrival ?? stop.arrival
  );
  const dep = rdScheduleV2Time(
    stop.scheduledDeparture ?? stop.scheduled_departure ?? stop.departure
  );

  const arrDay = Number(stop.arrivalDay ?? stop.arrival_day ?? 1);
  const depDay = Number(stop.departureDay ?? stop.departure_day ?? 1);
  const arrLabel = arr !== "—" && arrDay > 1 ? `${arr} (+${arrDay - 1}d)` : arr;
  const depLabel = dep !== "—" && depDay > 1 ? `${dep} (+${depDay - 1}d)` : dep;

  let halt = "Not available";
  const explicitHalt = stop.haltDuration ?? stop.halt_duration ??
    stop.stoppageDuration ?? stop.stoppage_duration ?? stop.dwellTime;

  if (explicitHalt !== undefined && explicitHalt !== null) {
    halt = rdScheduleV2Duration(explicitHalt);
  } else if (stop.isHalt === false || stop.is_halt === false) {
    halt = "Pass-through";
  } else if (arr === "—" && dep !== "—") {
    halt = index === 0 ? "Origin" : "—";
  } else if (arr !== "—" && dep === "—") {
    halt = "Terminal";
  } else {
    const am = arr.match(/^(\d{2}):(\d{2})$/);
    const dm = dep.match(/^(\d{2}):(\d{2})$/);
    if (am && dm) {
      const a = Number(am[1]) * 60 + Number(am[2]);
      const d = Number(dm[1]) * 60 + Number(dm[2]);
      halt = rdScheduleV2Duration((d - a + 1440) % 1440);
    }
  }

  const meta = [
    `Arr ${arrLabel}`,
    `Dep ${depLabel}`,
    `Halt ${halt}`
  ];
  const distance = stop.distance ?? stop.distanceKm ?? stop.distance_km;
  if (distance !== undefined && distance !== null && distance !== "") {
    meta.push(`${distance} km`);
  }
  addText(main, "div", meta.join(" · "), "rd-schedule-v2-meta");
  row.appendChild(main);

  const platform = stop.platform ?? stop.platformNumber ??
    stop.platform_number ?? stop.platformNo ?? stop.platform_no;

  addText(row, "span",
    platform !== undefined && platform !== null && platform !== ""
      ? `Platform ${platform}` : "Platform —",
    "rd-schedule-v2-platform");

  return row;
}

function renderCompactScheduleV2(payload, panel) {
  if (!document.getElementById("rd-schedule-v2-style")) {
    const style = document.createElement("style");
    style.id = "rd-schedule-v2-style";
    style.textContent = `
      .rd-schedule-v2-subtitle { color:#64748b;font-size:12px;line-height:1.5;margin:5px 0 12px; }
      .rd-schedule-v2-grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:12px 0; }
      .rd-schedule-v2-card { min-width:0;border:1px solid #e2e8f0;border-radius:11px;padding:11px;background:#fff; }
      .rd-schedule-v2-label { display:block;color:#64748b;font-size:11px;margin-bottom:5px; }
      .rd-schedule-v2-value { display:block;font-size:14px;line-height:1.45;font-weight:750;color:#102a43;overflow-wrap:anywhere; }
      .rd-schedule-v2-days,.rd-schedule-v2-route { border:1px solid #e2e8f0;border-radius:11px;padding:12px;background:#fff;margin-top:12px; }
      .rd-schedule-v2-title { margin:0 0 10px;font-size:14px;font-weight:800;color:#173b57; }
      .rd-schedule-v2-day-list { display:flex;flex-wrap:wrap;gap:7px; }
      .rd-schedule-v2-day { padding:7px 9px;border-radius:8px;background:#f1f5f9;color:#94a3b8;font-size:11px;font-weight:800; }
      .rd-schedule-v2-day.active { background:#dcfce7;color:#166534; }
      .rd-schedule-v2-note { color:#64748b;font-size:11px;line-height:1.5;margin:8px 0 0; }
      .rd-schedule-v2-stop { display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;border-top:1px solid #edf1f5;padding:11px 0; }
      .rd-schedule-v2-stop:first-of-type { border-top:0; }
      .rd-schedule-v2-station { font-size:13px;font-weight:750;line-height:1.45;color:#102a43;overflow-wrap:anywhere; }
      .rd-schedule-v2-meta { margin-top:5px;color:#64748b;font-size:11px;line-height:1.7;overflow-wrap:anywhere; }
      .rd-schedule-v2-platform { padding:7px 8px;border-radius:8px;background:#e9f6ff;color:#14527a;font-size:11px;font-weight:750;text-align:center;overflow-wrap:anywhere;max-width:100px; }
      .rd-schedule-v2-more { border:1px solid #e2e8f0;border-radius:10px;padding:0 12px;margin-top:10px;background:#fff; }
      .rd-schedule-v2-more summary { padding:12px 0;cursor:pointer;font-size:13px;font-weight:750;color:#173b57; }
      .rd-schedule-v2-scroll { max-height:300px;overflow:auto; }
      @media(max-width:600px) { .rd-schedule-v2-grid{gap:7px}.rd-schedule-v2-card{padding:10px}.rd-schedule-v2-platform{max-width:85px} }
    `;
    document.head.appendChild(style);
  }

  const train = payload && payload.train && typeof payload.train === "object"
    ? payload.train : {};
  const route = Array.isArray(payload && payload.route)
    ? payload.route
    : Array.isArray(payload && payload.stops) ? payload.stops : [];

  const input = document.getElementById("searchInput");
  const number = rdScheduleV2Value(train, ["number", "trainNumber", "train_number"]) ||
    rdScheduleV2Value(payload, ["trainNumber", "train_number"]) ||
    (input ? input.value.trim() : "");

  const name = rdScheduleV2Value(train, ["name", "trainName", "train_name", "title"]) ||
    rdScheduleV2Value(payload, ["trainName", "train_name"]) ||
    (number ? `Train ${number}` : "Train Schedule");

  const first = route.length ? rdScheduleV2StationName(route[0]) : "";
  const last = route.length ? rdScheduleV2StationName(route[route.length - 1]) : "";
  const source = rdScheduleV2Value(train, ["sourceName", "source_name", "source"]) || first;
  const dest = rdScheduleV2Value(train, ["destinationName", "destination_name", "destination"]) || last;

  const heading = panel.querySelector("h4");
  if (heading) heading.textContent = name;

  const subtitle = [
    number ? `Train No. ${number}` : "",
    train.type || "",
    source && dest ? `${source} → ${dest}` : ""
  ].filter(Boolean).join(" · ");

  if (subtitle) addText(panel, "p", subtitle, "rd-schedule-v2-subtitle");

  const distance = train.distance ?? train.distanceKm ?? train.distance_km ??
    (route.length ? route[route.length - 1].distance : null);

  const durationRaw = train.durationMinutes ?? train.duration_minutes ??
    train.journeyDurationMinutes ?? train.duration;

  const halts = route.filter(stop =>
    stop && (stop.isHalt === true || stop.is_halt === true)
  ).length;

  const metrics = document.createElement("div");
  metrics.className = "rd-schedule-v2-grid";

  [
    ["Stations", route.length ? String(route.length) : "Not available"],
    ["Distance", distance !== null && distance !== undefined && distance !== ""
      ? `${distance} km` : "Not available"],
    ["Journey time", durationRaw !== undefined && durationRaw !== null && durationRaw !== ""
      ? rdScheduleV2Duration(durationRaw) : "Not available"],
    ["Halting stations", route.length ? String(halts) : "Not available"]
  ].forEach(([label, value]) => {
    const card = document.createElement("div");
    card.className = "rd-schedule-v2-card";
    addText(card, "span", label, "rd-schedule-v2-label");
    addText(card, "strong", value, "rd-schedule-v2-value");
    metrics.appendChild(card);
  });

  panel.appendChild(metrics);

  const runDays = train.runDays ?? train.run_days ??
    train.runningDays ?? train.running_days ??
    (payload && (payload.runDays ?? payload.run_days ?? payload.runningDays));

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const aliases = {
    mon: 0, monday: 0, tue: 1, tues: 1, tuesday: 1,
    wed: 2, wednesday: 2, thu: 3, thur: 3, thurs: 3, thursday: 3,
    fri: 4, friday: 4, sat: 5, saturday: 5, sun: 6, sunday: 6
  };
  const activeDays = new Set();
  let dayDataAvailable = false;

  if (Array.isArray(runDays)) {
    runDays.forEach(value => {
      const token = String(value).toLowerCase().trim();
      if (aliases[token] !== undefined) {
        activeDays.add(aliases[token]);
        dayDataAvailable = true;
      }
    });

    if (runDays.length === 7 && runDays.every(v => typeof v === "boolean" || v === 0 || v === 1)) {
      dayDataAvailable = true;
      runDays.forEach((v, i) => { if (v === true || v === 1) activeDays.add(i); });
    }
  } else if (typeof runDays === "string") {
    runDays.toLowerCase().split(/[^a-z]+/).filter(Boolean).forEach(token => {
      if (aliases[token] !== undefined) {
        activeDays.add(aliases[token]);
        dayDataAvailable = true;
      }
      if (token === "daily") {
        dayDataAvailable = true;
        dayNames.forEach((_, i) => activeDays.add(i));
      }
    });
  } else if (runDays && typeof runDays === "object") {
    Object.entries(runDays).forEach(([key, value]) => {
      const index = aliases[key.toLowerCase()];
      if (index !== undefined) {
        dayDataAvailable = true;
        if (value === true || value === 1 || /^(yes|true|runs|1)$/i.test(String(value))) {
          activeDays.add(index);
        }
      }
    });
  }

  const daysSection = document.createElement("section");
  daysSection.className = "rd-schedule-v2-days";
  addText(daysSection, "h5", "Running days", "rd-schedule-v2-title");

  if (dayDataAvailable) {
    const days = document.createElement("div");
    days.className = "rd-schedule-v2-day-list";
    dayNames.forEach((day, i) => {
      addText(days, "span", day,
        `rd-schedule-v2-day${activeDays.has(i) ? " active" : ""}`);
    });
    daysSection.appendChild(days);
    addText(daysSection, "p",
      activeDays.size === 7 ? "Runs every day" :
      activeDays.size === 0 ? "Provider reports no active running days" :
      `Runs ${activeDays.size} day${activeDays.size === 1 ? "" : "s"} per week`,
      "rd-schedule-v2-note");
  } else {
    addText(daysSection, "p",
      "Running days were not included in the provider response.",
      "rd-schedule-v2-note");
  }

  panel.appendChild(daysSection);

  const routeSection = document.createElement("section");
  routeSection.className = "rd-schedule-v2-route";
  addText(routeSection, "h5",
    `Journey route${route.length ? ` · ${route.length} stations` : ""}`,
    "rd-schedule-v2-title");

  if (!route.length) {
    addText(routeSection, "p", "No station route was included in this schedule response.");
    panel.appendChild(routeSection);
    return;
  }


  const haltIndexes = [];

  route.forEach((stop, index) => {
    if (rdScheduleV2IsHalt(stop, index, route.length)) {
      haltIndexes.push(index);
    }
  });

  // Show the first five stopping stations, plus any pass-through stations
  // between those stops in their own collapsed groups.
  const visibleEnd = haltIndexes.length > 5
    ? haltIndexes[5]
    : route.length;

  rdScheduleV2EnsurePassThroughStyle();

  rdScheduleV2AppendGroupedStops(
    routeSection,
    route.slice(0, visibleEnd),
    0,
    route.length
  );

  panel.appendChild(routeSection);

  if (visibleEnd < route.length) {
    const details = document.createElement("details");
    details.className = "rd-schedule-v2-more";

    const remaining = route.slice(visibleEnd);
    const remainingHalts = haltIndexes.filter(index => index >= visibleEnd).length;

    addText(
      details,
      "summary",
      `View remaining route · ${remainingHalts} stopping stations`
    );

    const rest = document.createElement("div");
    rest.className = "rd-schedule-v2-scroll";

    rdScheduleV2AppendGroupedStops(
      rest,
      remaining,
      visibleEnd,
      route.length
    );

    details.appendChild(rest);
    panel.appendChild(details);
  }

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
  } else if (currentMode === "schedule") {
    renderCompactScheduleV2(payload, panel);
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


function renderStationFriendlyV2(payload, panel) {
  const isObj = value =>
    value !== null && typeof value === "object" && !Array.isArray(value);

  const pick = (obj, keys) => {
    for (const key of keys) {
      if (obj && obj[key] !== undefined &&
          obj[key] !== null && obj[key] !== "") return obj[key];
    }
    return undefined;
  };

  const hasAny = (obj, keys) =>
    isObj(obj) && keys.some(key => obj[key] !== undefined);

  const isTrain = obj =>
    isObj(obj) &&
    pick(obj, ["number", "trainNumber", "trainNo", "train_number"]) !== undefined &&
    pick(obj, ["name", "trainName", "train_name"]) !== undefined;

  function findRows(value, depth = 0) {
    if (depth > 8) return null;

    if (Array.isArray(value)) {
      const tupleRows = value.filter(
        row => Array.isArray(row) && row.some(isTrain)
      );

      if (tupleRows.length &&
          tupleRows.length >= Math.ceil(value.length / 2)) {
        return { rows: tupleRows, tuples: true };
      }

      const trains = value.filter(isTrain);
      if (trains.length) return { rows: trains, tuples: false };

      for (const child of value) {
        const found = findRows(child, depth + 1);
        if (found) return found;
      }
    } else if (isObj(value)) {
      // Station API rows contain nested train, stop and live objects.
      for (const key of ["trains", "trainList", "trainDetails", "results"]) {
        const rows = value[key];
        if (Array.isArray(rows) && rows.some(row =>
          isTrain(row) ||
          (isObj(row) && Object.values(row).some(isTrain)) ||
          (Array.isArray(row) && row.some(isTrain))
        )) {
          return { rows, tuples: false };
        }
      }

      if (isTrain(value)) return { rows: [value], tuples: false };

      for (const child of Object.values(value)) {
        const found = findRows(child, depth + 1);
        if (found) return found;
      }
    }
    return null;
  }

  function timeText(value) {
    if (value === undefined || value === null || value === "") return "—";
    const text = String(value);
    const isoTime = text.match(/T(\d{2}:\d{2})/);
    if (isoTime) return isoTime[1];
    const clock = text.match(/\b\d{1,2}:\d{2}\b/);
    return clock ? clock[0] : text;
  }

  function titleCase(value) {
    return String(value || "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function addMetric(grid, label, value) {
    const item = document.createElement("div");
    item.className = "station-train-metric";
    const labelNode = document.createElement("span");
    labelNode.className = "station-metric-label";
    labelNode.textContent = label;
    item.appendChild(labelNode);

    const valueNode = document.createElement("strong");
    valueNode.className = "station-metric-value";
    valueNode.textContent = String(value ?? "—");
    item.appendChild(valueNode);
    grid.appendChild(item);
  }

  const found = findRows(payload);

  if (found && found.rows.length) {
    addText(
      panel,
      "p",
      `${found.rows.length} train(s) returned by the railway data provider.`,
      "station-train-count"
    );

    const grid = document.createElement("div");
    grid.className = "station-trains-grid";

    found.rows.forEach((row, index) => {
      const pieces = Array.isArray(row)
        ? row.filter(isObj)
        : [row, ...Object.values(row).filter(isObj)];

      const train = pieces.find(isTrain) || {};
      const timing = pieces.find(obj =>
        hasAny(obj, ["arrival", "departure", "platform", "sequence", "distance"])
      ) || {};
      const live = pieces.find(obj =>
        hasAny(obj, [
          "expectedArrivalTime", "expectedDepartureTime",
          "delayMinutes", "liveStatus"
        ]) || (obj.type && obj !== train && obj !== timing)
      ) || {};

      const number = pick(train, [
        "number", "trainNumber", "trainNo", "train_number"
      ]) || "N/A";
      const name = pick(train, [
        "name", "trainName", "train_name"
      ]) || `Train ${number}`;
      const type = pick(train, ["type", "trainType", "category"]) || "Train";
      const from = pick(train, ["source", "from", "origin", "sourceCode"]) || "—";
      const to = pick(train, [
        "destination", "to", "destinationCode", "dest"
      ]) || "—";

      const arrival = timeText(
        pick(timing, ["arrival", "arrivalTime", "scheduledArrival"]) ??
        pick(live, ["expectedArrivalTime"])
      );
      const departure = timeText(
        pick(timing, ["departure", "departureTime", "scheduledDeparture"]) ??
        pick(live, ["expectedDepartureTime"])
      );
      const platform = pick(timing, ["platform", "platformNumber"]) || "—";

      const rawStatus = pick(live, ["type", "status", "liveStatus", "state"]);
      const state = rawStatus
        ? titleCase(rawStatus)
        : (timing.isHalt === false ? "Pass-through" : "Scheduled stop");

      const delay = pick(live, ["delayMinutes", "delay_min"]);
      let delayText = "—";
      if (delay !== undefined && Number.isFinite(Number(delay))) {
        const minutes = Number(delay);
        delayText = minutes === 0
          ? "On time"
          : minutes > 0
            ? `${minutes} min late`
            : `${Math.abs(minutes)} min early`;
      } else if (delay !== undefined) {
        delayText = String(delay);
      }

      const card = document.createElement("article");
      card.className = "station-train-card";

      const top = document.createElement("div");
      top.className = "station-train-card-top";
      addText(top, "span", `Train ${number}`, "station-train-number");
      addText(top, "span", state, "station-train-status");
      card.appendChild(top);

      addText(card, "h4", String(name), "station-train-name");
      addText(card, "p", String(type), "station-train-type");
      addText(card, "p", `${from}  →  ${to}`, "station-train-route");

      const runDays = pick(train, [
        "runDays", "runningDays", "daysOfRun", "runsOn", "days"
      ]);

      if (Array.isArray(runDays) && runDays.length) {
        const dayNames = {
          mon: "Monday", monday: "Monday",
          tue: "Tuesday", tues: "Tuesday", tuesday: "Tuesday",
          wed: "Wednesday", wednesday: "Wednesday",
          thu: "Thursday", thur: "Thursday", thurs: "Thursday",
          thursday: "Thursday",
          fri: "Friday", friday: "Friday",
          sat: "Saturday", saturday: "Saturday",
          sun: "Sunday", sunday: "Sunday"
        };

        const daysWrap = document.createElement("div");
        daysWrap.className = "station-train-days";
        addText(daysWrap, "span", "Runs on", "station-days-label");

        const daysList = document.createElement("div");
        daysList.className = "station-days-list";

        const normalizedDays = Array.from(new Set(
          runDays.map(day => {
            const key = String(day ?? "").trim().toLowerCase();
            return dayNames[key] || (key ? titleCase(key) : "");
          }).filter(Boolean)
        ));

        normalizedDays.forEach(day =>
          addText(daysList, "span", day, "station-day-chip")
        );

        if (normalizedDays.length) {
          daysWrap.appendChild(daysList);
          card.appendChild(daysWrap);
        }
      }

      const metrics = document.createElement("div");
      metrics.className = "station-train-metrics";
      addMetric(metrics, "Arrival", arrival);
      addMetric(metrics, "Departure", departure);
      addMetric(metrics, "Platform", platform);
      addMetric(metrics, "Delay", delayText);
      card.appendChild(metrics);

      grid.appendChild(card);
    });

    panel.appendChild(grid);
  } else {
    addText(
      panel,
      "p",
      "The provider response could not be identified as a train list. Open the technical details below.",
      "result-success"
    );
  }


}

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
    renderStationFriendlyV2(payload, panel);

    stationLiveResults.appendChild(panel);
  } catch (error) {
    stationMessage(stationLiveResults, error.message, "result-error");
  }
});


async function loadRailwayNews({ silent = false } = {}) {
  const section = document.getElementById("railway-news");
  if (!section) return;

  let container = document.getElementById("railwayNewsFeed");

  if (!container) {
    container = document.createElement("div");
    container.id = "railwayNewsFeed";
    container.className = "services-grid";
    section.appendChild(container);
  }

  let status = document.getElementById("railwayNewsRefreshStatus");
  if (!status) {
    status = document.createElement("p");
    status.id = "railwayNewsRefreshStatus";
    status.className = "result-label";
    section.insertBefore(status, container);
  }

  if (loadRailwayNews.inFlight) return;
  loadRailwayNews.inFlight = true;

  const hadExistingCards = Boolean(
    container.querySelector("article.service-card")
  );

  if (!hadExistingCards) {
    container.replaceChildren();
    const loading = document.createElement("p");
    loading.textContent = "Loading official railway news…";
    container.appendChild(loading);
    status.textContent = "Checking official news updates…";
  } else if (!silent) {
    status.textContent = "Checking for the latest official news…";
  }

  try {
    const response = await fetch("/api/news?_=" + Date.now(), {
      cache: "no-store",
      headers: { Accept: "application/json" }
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "News unavailable");
    }

    const items = Array.isArray(result.items) ? result.items : [];

    if (items.length === 0) {
      if (!hadExistingCards) {
        const empty = document.createElement("p");
        empty.textContent = "No news items are available right now.";
        container.replaceChildren(empty);
      }
      status.textContent =
        "No new news items were returned. The next automatic check will retry.";
      return;
    }

    const fragment = document.createDocumentFragment();

    items.forEach((news) => {
      const card = document.createElement("article");
      card.className = "service-card";

      if (
        news.image &&
        /^https?:\/\//i.test(news.image) &&
        !/ph20221121131401\.png|\/images\/(?:hindi|english)\.png/i.test(news.image)
      ) {
        const image = document.createElement("img");
        image.className = "railway-news-image";
        image.src = news.image;
        image.alt = news.title || "Official railway news";
        image.loading = "lazy";
        image.decoding = "async";
        image.style.cssText =
          "display:block;width:100%;aspect-ratio:16/9;object-fit:cover;" +
          "border-radius:12px;margin:0 0 14px;background:#eef2f7;";
        image.addEventListener("error", () => image.remove(), { once: true });
        card.appendChild(image);
      }

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

      if (news.link && /^https:\/\/www\.pib\.gov\.in\//i.test(news.link)) {
        const link = document.createElement("a");
        link.href = news.link;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Read official update →";
        card.appendChild(link);
      }

      fragment.appendChild(card);
    });

    container.replaceChildren(fragment);
    loadRailwayNews.lastSuccessAt = Date.now();

    status.textContent =
      "Official railway news · Last checked " +
      new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
      }) +
      " · Automatic updates every 10 minutes";
  } catch (error) {
    console.error("Railway news loading failed:", error);

    if (!hadExistingCards) {
      const message = document.createElement("p");
      message.textContent =
        "Official news is temporarily unavailable. The site will retry automatically.";
      message.className = "result-error";
      container.replaceChildren(message);
    } else {
      status.textContent =
        "Could not refresh news just now. Showing the last loaded updates; automatic retry is enabled.";
    }
  } finally {
    loadRailwayNews.inFlight = false;
  }
}

loadRailwayNews();

// RAIL DARPAN AUTO NEWS REFRESH V1
// Poll only while the page is open and visible.
if (!window.__railDarpanNewsAutoRefreshTimer) {
  window.__railDarpanNewsAutoRefreshTimer = window.setInterval(() => {
    if (!document.hidden) loadRailwayNews({ silent: true });
  }, 10 * 60 * 1000);
}

if (!window.__railDarpanNewsVisibilityBound) {
  window.__railDarpanNewsVisibilityBound = true;

  document.addEventListener("visibilitychange", () => {
    const lastSuccess = loadRailwayNews.lastSuccessAt || 0;
    if (
      !document.hidden &&
      Date.now() - lastSuccess >= 10 * 60 * 1000
    ) {
      loadRailwayNews({ silent: true });
    }
  });
}
