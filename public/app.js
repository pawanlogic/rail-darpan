
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

  addText(panel, "p", "Response received from the railway data service.", "result-success");
  renderObject(payload, panel);

  const details = document.createElement("details");
  details.className = "result-details";
  addText(details, "summary", "Technical response");
  const pre = document.createElement("pre");
  pre.className = "result-json";
  pre.textContent = JSON.stringify(data, null, 2);
  details.appendChild(pre);
  panel.appendChild(details);

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


  "https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?locale=en";

