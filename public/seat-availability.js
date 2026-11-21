(() => {
  const toggle = document.getElementById("rdSeatToggle");
  const panel = document.getElementById("rdSeatSearchPanel");
  const form = document.getElementById("rdSeatSearchForm");
  const fromInput = document.getElementById("rdSeatSearchFrom");
  const toInput = document.getElementById("rdSeatSearchTo");
  const dateInput = document.getElementById("rdSeatSearchDate");
  const classInput = document.getElementById("rdSeatSearchClass");
  const quotaInput = document.getElementById("rdSeatSearchQuota");
  const searchButton = document.getElementById("rdSeatSearchButton");
  const results = document.getElementById("rdSeatTrainResults");

  if (!toggle || !panel || !form || !results) return;

  // Reuse Rail Darpan's existing station autocomplete.
  if (typeof rdAttachAutocomplete === "function" &&
      typeof rdStationSuggestions === "function") {

    const stationAutocomplete = {
      minLength: 2,
      endpoint: query =>
        `/api/stations/code-search?q=${encodeURIComponent(query)}`,
      items: rdStationSuggestions,
      label: item =>
        [item.code, item.name].filter(Boolean).join(" — ") || "Station",
      description: item =>
        [item.state, item.zone].filter(Boolean).join(" · "),
      value: item => String(item.code || "").toUpperCase()
    };

    rdAttachAutocomplete(fromInput, stationAutocomplete);
    rdAttachAutocomplete(toInput, stationAutocomplete);
  }

  const style = document.createElement("style");
  style.textContent = `
    .rd-seat-route-controls {
      display: grid;
      grid-template-columns: repeat(2,minmax(0,1fr));
      gap: 10px;
      margin: 12px 0;
    }
    .rd-seat-route-controls label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .rd-seat-route-controls select {
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      padding: 10px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: white;
    }
    .rd-seat-days-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      margin: 10px 0;
      align-items: start;
    }
    .rd-seat-entry {
      min-width: 0;
      padding: 8px;
      border: 1px solid #d6e2f1;
      border-radius: 8px;
      background: #fff;
    }
    .rd-seat-entry strong {
      display: block;
      font-size: 12px;
      margin-bottom: 6px;
    }
    .rd-seat-entry p {
      margin: 5px 0;
      font-size: 12px;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }
    .rd-seat-entry .rd-seat-status-available,
    .rd-seat-entry .rd-seat-status-unavailable {
      padding: 6px;
      font-size: 12px;
      border-radius: 6px;
    }
    @media(max-width:600px) {
      .rd-seat-days-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media(max-width:380px) {
      .rd-seat-days-grid {
        grid-template-columns: 1fr;
      }
    }    .rd-seat-per-train-result[hidden] {
      display: none !important;
    }
    @media(max-width:480px) {
      .rd-seat-route-controls {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  dateInput.value = now.toISOString().slice(0, 10);
  dateInput.min = dateInput.value;

  function showMessage(target, text, className = "result-label") {
    target.replaceChildren();
    const p = document.createElement("p");
    p.className = className;
    p.textContent = text;
    target.appendChild(p);
  }

  function addText(parent, tag, text, className = "") {
    const el = document.createElement(tag);
    el.textContent = text;
    if (className) el.className = className;
    parent.appendChild(el);
    return el;
  }

  function openPanel(open) {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.classList.toggle("active", open);

    [
      "formTitle", "formSub", "searchForm", "result", "pnrHistory"
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.hidden = open;
    });
  }

  toggle.addEventListener("click", () => openPanel(panel.hidden));

  document.querySelectorAll(".tabs .tab").forEach(tab => {
    tab.addEventListener("click", () => openPanel(false));
  });

  function makeSelectField(parent, labelText) {
    const field = document.createElement("div");
    const label = document.createElement("label");
    label.textContent = labelText;

    const select = document.createElement("select");
    field.appendChild(label);
    field.appendChild(select);
    parent.appendChild(field);

    return select;
  }

  function populateDestinations(route, fromSelect, toSelect, preferred) {
    const index = route.findIndex(
      station => station.stnCode === fromSelect.value
    );

    const onward = route.slice(index + 1);
    toSelect.replaceChildren();

    onward.forEach(station => {
      const option = document.createElement("option");
      option.value = station.stnCode;
      option.textContent = `${station.stnCode} - ${station.stnName}`;
      toSelect.appendChild(option);
    });

    toSelect.disabled = !onward.length;

    if (onward.length) {
      toSelect.value = onward.some(s => s.stnCode === preferred)
        ? preferred
        : onward[onward.length - 1].stnCode;
    }
  }

  async function loadTrainRoute(info, card, searchFrom, searchTo, date) {
    const routeMessage = addText(
      card, "p", "Loading train route dropdowns...", "result-label"
    );

    try {
      const response = await fetch(
        `/api/train/${encodeURIComponent(info.number)}/schedule`
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || "Train route unavailable.");
      }

      const rawRoute = payload?.data?.route || payload?.route;

      if (!Array.isArray(rawRoute)) {
        throw new Error("Unable to load this train's route.");
      }

      const route = rawRoute
        .filter(s => s?.stnCode && s?.stnName)
        .map(s => ({
          stnCode: String(s.stnCode).trim().toUpperCase(),
          stnName: String(s.stnName).trim()
        }));

      if (route.length < 2) {
        throw new Error("Insufficient route stations.");
      }

      routeMessage.remove();

      const controls = document.createElement("div");
      controls.className = "rd-seat-route-controls";

      const fromSelect = makeSelectField(controls, "From Station");
      const toSelect = makeSelectField(controls, "To Station");
      const classSelect = makeSelectField(controls, "Travel Class");
      const quotaSelect = makeSelectField(controls, "Booking Quota");

      route.forEach(station => {
        const option = document.createElement("option");
        option.value = station.stnCode;
        option.textContent = `${station.stnCode} - ${station.stnName}`;
        fromSelect.appendChild(option);
      });

      const searchFromIndex = route.findIndex(
        s => s.stnCode === searchFrom
      );

      const defaultFromIndex =
        searchFromIndex >= 0 && searchFromIndex < route.length - 1
          ? searchFromIndex
          : 0;

      fromSelect.value = route[defaultFromIndex].stnCode;

      const searchToIndex = route.findIndex(
        s => s.stnCode === searchTo
      );

      const preferredTo =
        searchToIndex > defaultFromIndex
          ? searchTo
          : route[route.length - 1].stnCode;

      populateDestinations(
        route, fromSelect, toSelect, preferredTo
      );

      fromSelect.addEventListener("change", () => {
        populateDestinations(route, fromSelect, toSelect, "");
        result.replaceChildren();
      });

      [
        ["2S", "Second Sitting"],
        ["SL", "Sleeper"],
        ["3A", "AC 3 Tier"],
        ["3E", "AC 3 Economy"],
        ["2A", "AC 2 Tier"],
        ["1A", "First AC"],
        ["CC", "AC Chair Car"],
        ["EC", "Executive Chair Car"]
      ].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = `${label} (${value})`;
        classSelect.appendChild(option);
      });

      [
        ["GN", "General"],
        ["TQ", "Tatkal"],
        ["LD", "Ladies"],
        ["SS", "Senior Citizen"]
      ].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        quotaSelect.appendChild(option);
      });

      card.appendChild(controls);

      const checkButton = document.createElement("button");
      checkButton.type = "button";
      checkButton.className = "primary";
      checkButton.textContent = "Check Availability";
      card.appendChild(checkButton);

      const result = document.createElement("div");
      result.className = "rd-seat-per-train-result";
      result.hidden = true;
      card.appendChild(result);

      // Availability runs ONLY after this button is clicked.
      checkButton.addEventListener("click", async () => {
        const selectedFrom = fromSelect.value;
        const selectedTo = toSelect.value;

        const fromIndex = route.findIndex(
          s => s.stnCode === selectedFrom
        );
        const toIndex = route.findIndex(
          s => s.stnCode === selectedTo
        );

        if (fromIndex < 0 || toIndex <= fromIndex) {
          showMessage(
            result,
            "Destination must come after boarding station.",
            "result-error"
          );
          result.hidden = false;
          return;
        }

        checkButton.disabled = true;
        checkButton.textContent = "Checking...";
        result.hidden = false;
        showMessage(result, "Checking Availability...");

        try {
          const params = new URLSearchParams({
            from: selectedFrom,
            to: selectedTo,
            date,
            class: classSelect.value,
            quota: quotaSelect.value
          });

          const availabilityResponse = await fetch(
            `/api/trains/${encodeURIComponent(info.number)}/availability?${params}`
          );

          const availabilityPayload = await availabilityResponse.json();

          if (!availabilityResponse.ok ||
              availabilityPayload?.success === false) {
            throw new Error(
              availabilityPayload?.error ||
              availabilityPayload?.message ||
              "Availability unavailable."
            );
          }

          const data =
            availabilityPayload?.data &&
            typeof availabilityPayload.data === "object"
              ? availabilityPayload.data
              : availabilityPayload;

          const train = data?.train;

          if (train) {
            const actualFrom = String(train.from || "").toUpperCase();
            const actualTo = String(train.to || "").toUpperCase();

            if (
              (actualFrom && actualFrom !== selectedFrom) ||
              (actualTo && actualTo !== selectedTo)
            ) {
              throw new Error(
                "Provider returned a different station segment."
              );
            }
          }

          result.replaceChildren();

          const entries = Array.isArray(data?.availability)
            ? data.availability
            : [];

          if (!entries.length) {
            showMessage(
              result,
              "No availability entries returned by provider."
            );
          } else {
            const dayGrid = document.createElement("div");
            dayGrid.className = "rd-seat-days-grid";

            entries.forEach(entry => {
              const item = document.createElement("div");
              item.className = "rd-seat-entry";

              if (entry.date !== undefined) {
                addText(item, "strong", String(entry.date));
              }

              const raw =
                entry.availabilityText ??
                entry.status ??
                entry.availability ??
                "";

              const statusText = typeof raw === "string"
                ? raw
                : raw == null ? "" : JSON.stringify(raw);

              const status = document.createElement("p");

              const isGreen =
                /^(?:AVL|AVAILABLE|RAC)\b/i.test(statusText.trim());

              status.className = isGreen
                ? "rd-seat-status-available"
                : "rd-seat-status-unavailable";

              status.textContent =
                statusText || "Status not provided";

              item.appendChild(status);

              if (entry.prediction !== undefined &&
                  entry.prediction !== null &&
                  entry.prediction !== "") {
                addText(
                  item,
                  "p",
                  `Provider prediction: ${entry.prediction}`,
                  "result-label"
                );
              }

              dayGrid.appendChild(item);
            });

            result.appendChild(dayGrid);
          }

          addText(
            result,
            "p",
            `Journey: ${selectedFrom} -> ${selectedTo} | Date: ${date} | Class: ${classSelect.value} | Quota: ${quotaSelect.value}`,
            "result-label"
          );

          checkButton.textContent = "Refresh Availability";

        } catch (error) {
          showMessage(
            result,
            error.message || "Unable to fetch availability.",
            "result-error"
          );
          checkButton.textContent = "Retry Availability";
        } finally {
          checkButton.disabled = false;
        }
      });

    } catch (error) {
      routeMessage.className = "result-error";
      routeMessage.textContent =
        error.message || "Unable to load train route.";
    }
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const from = fromInput.value.trim().toUpperCase();
    const to = toInput.value.trim().toUpperCase();
    const date = dateInput.value;

    if (!/^[A-Z0-9]{2,10}$/.test(from) ||
        !/^[A-Z0-9]{2,10}$/.test(to) ||
        from === to || !date) {
      showMessage(
        results,
        "Enter valid From, To and Journey Date.",
        "result-error"
      );
      return;
    }

    searchButton.disabled = true;
    searchButton.textContent = "Searching...";
    showMessage(results, "Finding trains...");

    try {
      const params = new URLSearchParams({ from, to, date });
      const response = await fetch(`/api/trains/between?${params}`);

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || "Train search failed.");
      }

      if (typeof window.rdBetweenFindTrainRows !== "function" ||
          typeof window.rdBetweenTrainInfo !== "function") {
        throw new Error("Train search helpers are unavailable. Reload the page.");
      }

      const data = payload.data !== undefined ? payload.data : payload;
      const rows = window.rdBetweenFindTrainRows(data);

      results.replaceChildren();

      if (rows === null) {
        throw new Error("Train-list response was not recognised.");
      }

      if (!rows.length) {
        showMessage(results, "No matching trains found.");
        return;
      }

      addText(results, "h4", `Trains: ${from} -> ${to}`, "result-value");
      addText(results, "p", `Journey Date: ${date}`, "result-label");
      addText(results, "p", `${rows.length} trains found. Select stations, class and quota in each train card.`, "result-success");

      const grid = document.createElement("div");
      grid.className = "rd-between-train-grid";

      const routeJobs = [];

      rows.forEach(row => {
        const info = window.rdBetweenTrainInfo(row);
        if (!info) return;

        const card = document.createElement("article");
        card.className = "rd-between-train";

        addText(card, "h4", info.name);
        addText(card, "p", `Train No. ${info.number}`, "result-label");

        if (info.fromName || info.toName) {
          addText(
            card,
            "p",
            `Train route: ${info.fromName || info.fromCode || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"} -> ${info.toName || info.toCode || "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â"}`,
            "result-label"
          );
        }

        const details = [];
        if (info.departure) details.push(`Departure: ${info.departure}`);
        if (info.arrival) details.push(`Arrival: ${info.arrival}`);
        if (info.duration) details.push(`Duration: ${info.duration}`);
        if (info.distance) details.push(`Distance: ${info.distance} km`);

        if (details.length) {
          addText(card, "p", details.join(" | "), "result-label");
        }

        addText(card, "p", "Choose your boarding station, destination, class and quota below.", "result-label");

        grid.appendChild(card);

        routeJobs.push(() =>
          loadTrainRoute(info, card, from, to, date)
        );
      });

      results.appendChild(grid);

      // Load station dropdowns with limited route requests.
      // No seat availability is checked automatically.
      let nextJob = 0;

      async function worker() {
        while (nextJob < routeJobs.length) {
          const job = routeJobs[nextJob++];
          await job();
        }
      }

      await Promise.all(
        Array.from(
          { length: Math.min(2, routeJobs.length) },
          () => worker()
        )
      );

      addText(
        results,
        "p",
        "Choose the journey and press Check Availability on any train card.",
        "result-success"
      );

    } catch (error) {
      showMessage(
        results,
        error.message || "Unable to find trains.",
        "result-error"
      );
    } finally {
      searchButton.disabled = false;
      searchButton.textContent = "Search Trains";
    }
  });
})();