import rateLimit from "express-rate-limit";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import {
  railkitPnr,
  railkitTrackTrain,
  railkitStationByCode,
  railkitStationAmenities,
  railkitStationsByName,
  railkitTrainByNumber,
  railkitTrainsByName,
  railkitGetTrainInfo,
  railkitSearchTrainBetweenStations,
  railkitLiveAtStation,
  railkitCancelList
} from "./providers/railkit.js";
import { providerCache, getProviderCacheStats } from "./provider-cache.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please try again after some time."
  }
});

app.use("/api", apiLimiter);


app.use(express.static(path.resolve(__dirname, "../../public")));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Rail Darpan API",
    providerConfigured: Boolean(process.env.RAILKIT_API_KEY),
    providers: {
      railkit: Boolean(process.env.RAILKIT_API_KEY)
    },
    cache: getProviderCacheStats()
  });
});


// Public railway APIs; provider cache applies to API requests.
app.use("/api", providerCache);

function handleError(res, error) {
  console.error("Railway API error:", error.message);
  res.status(error.status || 502).json({
    error: error.message || "Railway data service unavailable"
  });
}

// PNR status
app.get("/api/pnr/:pnr", async (req, res) => {
  if (!/^\d{10}$/.test(req.params.pnr)) {
    return res.status(400).json({
      error: "PNR must be exactly 10 digits"
    });
  }

  try {
    const data = await railkitPnr(req.params.pnr);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
});


// RailKit Lookup APIs

app.get("/api/lookup/station/:code", async (req, res) => {
  const code = String(req.params.code || "").trim().toUpperCase();

  if (!/^[A-Z0-9]{2,10}$/.test(code)) {
    return res.status(400).json({ error: "Enter a valid station code." });
  }

  try {
    return res.json(await railkitStationByCode(code));
  } catch (error) {
    return handleError(res, error);
  }
});

app.get("/api/lookup/station/:code/amenities", async (req, res) => {
  const code = String(req.params.code || "").trim().toUpperCase();

  if (!/^[A-Z0-9]{2,10}$/.test(code)) {
    return res.status(400).json({ error: "Enter a valid station code." });
  }

  try {
    return res.json(await railkitStationAmenities(code));
  } catch (error) {
    return handleError(res, error);
  }
});

app.get("/api/lookup/stations", async (req, res) => {
  const name = String(req.query.name || "").trim();

  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({
      error: "Enter a station name between 2 and 100 characters."
    });
  }

  try {
    return res.json(await railkitStationsByName(name));
  } catch (error) {
    return handleError(res, error);
  }
});

app.get("/api/lookup/train/:number", async (req, res) => {
  const number = String(req.params.number || "").trim();

  if (!/^\d{1,10}$/.test(number)) {
    return res.status(400).json({ error: "Enter a valid train number." });
  }

  try {
    return res.json(await railkitTrainByNumber(number));
  } catch (error) {
    return handleError(res, error);
  }
});

app.get("/api/lookup/trains", async (req, res) => {
  const name = String(req.query.name || "").trim();

  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({
      error: "Enter a train name between 2 and 100 characters."
    });
  }

  try {
    return res.json(await railkitTrainsByName(name));
  } catch (error) {
    return handleError(res, error);
  }
});

function railKitLabel(value) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'object') return String(value);
  return String(value.name || value.stationName || value.station_name || value.code || value.stationCode || '');
}

function railKitRows(payload, keys) {
  const root = payload && payload.data !== undefined ? payload.data : payload;
  if (Array.isArray(root)) return root;
  const containers = [root, root && root.data, root && root.train, root && root.station];
  for (const item of containers) {
    if (!item || typeof item !== 'object') continue;
    for (const key of keys) {
      if (Array.isArray(item[key])) return item[key];
    }
  }
  for (const item of [root, root && root.train, root && root.trainDetails]) {
    if (!item || typeof item !== 'object') continue;
    const number = item.trainNo || item.trainNumber || item.train_number || item.number;
    if (number !== undefined && number !== null) return [item];
  }
  for (const item of [root, root && root.station]) {
    if (!item || typeof item !== 'object') continue;
    if (item.code || item.stationCode || item.station_code) return [item];
  }
  return [];
}

function normalizeRailKitTrain(row) {
  const nested = row.train && typeof row.train === 'object' ? row.train :
    row.trainDetails && typeof row.trainDetails === 'object' ? row.trainDetails : row;
  const number = String(row.trainNo || row.trainNumber || row.number || nested.trainNo || nested.trainNumber || nested.number || '').trim();
  const name = String(row.trainName || row.name || nested.trainName || nested.name || '').trim();
  const from = row.from || row.source || nested.from || nested.source;
  const to = row.to || row.destination || nested.to || nested.destination;
  return {
    ...row,
    number,
    trainNumber: number,
    trainNo: number,
    name,
    trainName: name,
    sourceName: row.sourceName || row.fromName || railKitLabel(from),
    destName: row.destName || row.destinationName || row.toName || railKitLabel(to)
  };
}

function normalizeRailKitStation(row) {
  const nested = row.station && typeof row.station === 'object' ? row.station : row;
  const name = String(row.name || row.stationName || row.station_name || nested.name || nested.stationName || '');
  const code = String(row.code || row.stationCode || row.station_code || nested.code || nested.stationCode || '').toUpperCase();
  const city = String(row.city || row.cityName || nested.city || '');
  return { ...row, name, stationName: name, code, stationCode: code, city, cityName: city };
}

function normalizeRailKitStop(stop) {
  stop = stop && typeof stop === 'object' ? stop : {};
  const station = stop.station && typeof stop.station === 'object' ? stop.station : {};
  const arrival = stop.arrival && typeof stop.arrival === 'object' ? stop.arrival : {};
  const departure = stop.departure && typeof stop.departure === 'object' ? stop.departure : {};
  const type = String(stop.type || stop.stopType || stop.stop_type || '').toLowerCase();
  const haltDuration = stop.haltDuration || stop.halt_duration || stop.stoppageDuration || stop.stoppage_duration || stop.dwellTime || stop.haltMinutes || stop.halt_minutes;
  const isHalt = stop.isHalt === true || stop.is_halt === true || ['stoppage', 'halt', 'stop'].includes(type) || (haltDuration !== undefined && haltDuration !== null && Number(haltDuration) > 0);
  return {
    ...stop,
    stationName: stop.stationName || stop.station_name || station.stationName || station.name || stop.name || '',
    stationCode: stop.stationCode || stop.station_code || station.stationCode || station.code || stop.code || '',
    isHalt,
    scheduledArrival: arrival.scheduled || stop.scheduledArrival || stop.scheduled_arrival || stop.arrivalTime || stop.arrival_time || (typeof stop.arrival === 'string' ? stop.arrival : null),
    actualArrival: arrival.actual || stop.actualArrival || stop.actual_arrival || null,
    scheduledDeparture: departure.scheduled || stop.scheduledDeparture || stop.scheduled_departure || stop.departureTime || stop.departure_time || (typeof stop.departure === 'string' ? stop.departure : null),
    actualDeparture: departure.actual || stop.actualDeparture || stop.actual_departure || null,
    delayArrival: arrival.delayMinutes || arrival.delay || stop.delayArrival || null,
    delayDeparture: departure.delayMinutes || departure.delay || stop.delayDeparture || null,
    platform: stop.platform || stop.platformNumber || stop.platformNo || null,
    distance: stop.distance || stop.distanceKm || stop.km || null
  };
}

// Live train status
app.get("/api/train/:number/live", async (req, res) => {
  const number = String(req.params.number || "").trim();

  if (!/^\d{5}$/.test(number)) {
    return res.status(400).json({ error: "Enter a valid 5-digit train number." });
  }

  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date());

    const today = Object.fromEntries(parts.map(p => [p.type, p.value]));
    const requestedDate = String(
      req.query.date || `${today.year}-${today.month}-${today.day}`
    ).trim();

    let railkitDate;

    if (/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
      const [year, month, day] = requestedDate.split("-");
      const parsed = new Date(`${requestedDate}T00:00:00Z`);

      if (
        Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== requestedDate
      ) {
        return res.status(400).json({ error: "Invalid journey date." });
      }

      railkitDate = `${day}-${month}-${year}`;
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(requestedDate)) {
      railkitDate = requestedDate;
    } else {
      return res.status(400).json({ error: "Date must be YYYY-MM-DD." });
    }

    const result = await railkitTrackTrain(number, railkitDate);

    if (!result || result.success === false) {
      return res.status(502).json(
        result || { success: false, error: "Live train data unavailable." }
      );
    }

    const live = result.data || {};
    const timeline = Array.isArray(live.timeline) ? live.timeline : [];

    const currentIndex = timeline.findIndex(stop =>
      String(stop.status || '').toLowerCase() === 'current' ||
      (live.currentStationCode && stop.stationCode === live.currentStationCode)
    );

    const currentPoint = currentIndex >= 0 ? timeline[currentIndex] : null;
    const nextPoint = timeline.slice(currentIndex >= 0 ? currentIndex + 1 : 0)
      .find(stop => ['upcoming', 'next'].includes(String(stop.status || '').toLowerCase())) || null;

    const route = timeline.map(normalizeRailKitStop);
    const currentStop = currentPoint ? normalizeRailKitStop(currentPoint) : {};
    const nextStop = nextPoint ? normalizeRailKitStop(nextPoint) : {};
    const trainInfo = live.train && typeof live.train === 'object' ? live.train : {};
    const sourceInfo = trainInfo.source && typeof trainInfo.source === 'object' ? trainInfo.source : {};
    const destinationInfo = trainInfo.destination && typeof trainInfo.destination === 'object' ? trainInfo.destination : {};

    const sourceName = sourceInfo.name || sourceInfo.stationName ||
      (typeof live.sourceStation === 'string' ? live.sourceStation : '') ||
      live.sourceName || route[0]?.stationName || '';
    const sourceCode = sourceInfo.code || sourceInfo.stationCode ||
      live.sourceStationCode || route[0]?.stationCode || '';
    const destinationName = destinationInfo.name || destinationInfo.stationName ||
      (typeof live.destinationStation === 'string' ? live.destinationStation : '') ||
      live.destinationName || route[route.length - 1]?.stationName || '';
    const destinationCode = destinationInfo.code || destinationInfo.stationCode ||
      live.destinationStationCode || route[route.length - 1]?.stationCode || '';
    const trainName = live.trainName || live.name || trainInfo.name || '';
    const suppliedCurrent = live.currentLocation;

    const currentLocation = {
      ...currentStop,
      stationName: currentStop.stationName ||
        (typeof suppliedCurrent === 'string' ? suppliedCurrent : suppliedCurrent?.stationName) ||
        live.currentStationName || '',
      stationCode: currentStop.stationCode || live.currentStationCode || ''
    };

    const nextHalt = {
      ...nextStop,
      stationName: nextStop.stationName || live.nextStationName || '',
      stationCode: nextStop.stationCode || ''
    };

    const status = live.statusNote || live.progress?.journeyStatus || live.status || '';
    const normalizedData = {
      ...live,
      train: {
        ...trainInfo,
        number: trainInfo.number || live.trainNo || number,
        name: trainName,
        type: trainInfo.type || live.trainType || live.type || 'Train',
        category: trainInfo.category || live.category || '',
        distance: trainInfo.distance ?? live.distance ?? null,
        duration: trainInfo.duration ?? live.duration ?? null,
        source: { ...sourceInfo, name: sourceName, code: sourceCode },
        destination: { ...destinationInfo, name: destinationName, code: destinationCode }
      },
      trainNumber: live.trainNo || live.trainNumber || number,
      trainName,
      status,
      runningStatus: status,
      currentLocation,
      currentStation: currentLocation.stationName,
      currentStationCode: currentLocation.stationCode,
      nextHalt,
      nextStation: nextHalt.stationName,
      speed: live.averageSpeedKmph ?? live.speedKmph ?? live.speed ?? null,
      delayMinutes: live.delayMinutes ?? live.progress?.delayMinutes ?? live.progress?.delay ?? null,
      sourceStation: sourceName,
      destinationStation: destinationName,
      route,
      startDate: live.startDate || live.journeyDate || requestedDate,
      lastUpdatedAt: live.lastUpdate || live.lastUpdatedAt || null,
      updatedAt: live.lastUpdate || live.lastUpdatedAt || null,
      trackingMode: live.trackingMode || 'RailKit live tracking'
    };

    return res.json({ ...result, data: normalizedData });
  } catch (error) {
    return handleError(res, error);
  }
});


/* Train number/name autocomplete search */
app.get('/api/train/search', async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (!query || query.length > 100) {
    return res.status(400).json({ success: false, error: 'Enter a train number or name (1-100 characters).' });
  }
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const isNumericQuery = /^\d+$/.test(query);

    // For a complete 5-digit number, show nearby trains sharing
    // the first four digits instead of returning only the exact match.
    const numberPrefix = isNumericQuery && query.length === 5
      ? query.slice(0, 4)
      : query;

    const payload = isNumericQuery
      ? await railkitTrainByNumber(numberPrefix)
      : await railkitTrainsByName(query);
    if (!payload || payload.success === false) {
      return res.status(502).json(payload || { success: false, error: 'Train search unavailable.' });
    }
    const rows = railKitRows(payload, ['trains', 'results', 'items', 'records', 'trainList', 'train_list']);
    const trains = rows.map(normalizeRailKitTrain).filter(item => item.number).slice(0, limit);
    return res.json({
      success: true,
      query: payload.data?.query || payload.query || query,
      count: trains.length,
      data: trains
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// Train schedule
app.get("/api/train/:number/schedule", async (req, res) => {
  if (!/^\d{1,10}$/.test(req.params.number)) {
    return res.status(400).json({ error: "Invalid train number" });
  }

  try {
    const data = await railkitGetTrainInfo(req.params.number);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
});

// Station search
app.get('/api/stations/search', async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (query.length < 2 || query.length > 100) {
    return res.status(400).json({ error: 'Enter a station name between 2 and 100 characters.' });
  }
  try {
    const payload = await railkitStationsByName(query);
    if (!payload || payload.success === false) {
      return res.status(502).json(payload || { success: false, error: 'Station search unavailable.' });
    }
    const stations = railKitRows(payload, ['stations', 'results', 'items', 'records', 'stationList', 'station_list'])
      .map(normalizeRailKitStation)
      .filter(item => item.code || item.name);
    return res.json({ success: true, count: stations.length, data: stations });
  } catch (error) {
    return handleError(res, error);
  }
});

// Trains between two stations
app.get("/api/trains/between", async (req, res) => {
  const from = String(req.query.from || "").trim().toUpperCase();
  const to = String(req.query.to || "").trim().toUpperCase();
  const date = String(req.query.date || "").trim();

  if (!/^[A-Z0-9]{2,10}$/.test(from)) {
    return res.status(400).json({ error: "Enter a valid source station code." });
  }

  if (!/^[A-Z0-9]{2,10}$/.test(to)) {
    return res.status(400).json({ error: "Enter a valid destination station code." });
  }

  if (from === to) {
    return res.status(400).json({
      error: "Source and destination stations must be different."
    });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({
      error: "Enter a valid journey date in YYYY-MM-DD format."
    });
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    return res.status(400).json({ error: "Invalid journey date." });
  }

  try {
    const parts = date.split('-');
    const railkitDate = parts[2] + '-' + parts[1] + '-' + parts[0];
    const data = await railkitSearchTrainBetweenStations(from, to, railkitDate);
    return res.json(data);
  } catch (error) {
    handleError(res, error);
  }
});

// Live station information
app.get("/api/station/:code/live", async (req, res) => {
  const code = req.params.code.trim().toUpperCase();

  if (!/^[A-Z0-9]{2,10}$/.test(code)) {
    return res.status(400).json({ error: "Invalid station code" });
  }

  try {
    const requestedHours = Math.min(24, Math.max(1, Number(req.query.hours) || 4));
    const hours = requestedHours <= 2 ? 2 : requestedHours <= 4 ? 4 : 8;
    const data = await railkitLiveAtStation(code, hours);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
});


// Operational alerts from RailKit.
app.get("/api/alerts", async (req, res) => {
  const type = String(req.query.type || "all").trim().toLowerCase();

  const allowedTypes = new Set([
    "all", "cancelled", "rescheduled", "diverted",
    "partially_cancelled", "partial_source", "partial_destination"
  ]);

  if (!allowedTypes.has(type)) {
    return res.status(400).json({
      success: false,
      error: "Invalid alert type."
    });
  }

  if (type !== "all") {
    return res.status(501).json({
      success: false,
      error: "RailKit alert feed is available, but this individual filter needs response mapping."
    });
  }

  try {
    const data = await railkitCancelList();
    return res.json(data);
  } catch (error) {
    return handleError(res, error);
  }
});

// Official railway news from PIB// Official railway news from PIB
app.get("/api/news", async (req, res) => {
  const sourceUrl =
    "https://www.pib.gov.in/AllRelease.aspx?lang=1&reg=3";

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 RailDarpan/1.0"
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`PIB returned HTTP ${response.status}`);
    }

    const html = await response.text();

    function cleanText(value) {
      return value
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&#(\d+);/g, (_, n) =>
          String.fromCodePoint(Number(n))
        )
        .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
          String.fromCodePoint(parseInt(n, 16))
        )
        .replace(/\s+/g, " ")
        .trim();
    }

    // PIB page offers a ministry selector; filter using its official ID.
    const filteredUrl =
      "https://www.pib.gov.in/AllRelease.aspx?MinId=23&lang=1&reg=3";

    const filteredResponse = await fetch(filteredUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 RailDarpan/1.0"
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!filteredResponse.ok) {
      throw new Error(`PIB ministry page returned HTTP ${filteredResponse.status}`);
    }

    const filteredHtml = await filteredResponse.text();

    const entries = [
      ...filteredHtml.matchAll(
        /<li\b[^>]*>([\s\S]*?)<\/li\s*>/gi
      )
    ];

    const items = entries
      .map((match) => {
        const entry = match[1];
        const anchor = entry.match(
          /<a\b[^>]*href\s*=\s*["']([^"']*PressReleseDetail\.aspx\?[^"']+)["'][^>]*>([\s\S]*?)<\/a\s*>/i
        );

        if (!anchor) return null;

        const title = cleanText(anchor[2]);
        const link = new URL(anchor[1], "https://www.pib.gov.in");
        const entryText = cleanText(entry);
        const dateMatch = entryText.match(
          /Posted\s+on:\s*(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i
        );

        if (!title || link.hostname !== "www.pib.gov.in") {
          return null;
        }

        return {
          title,
          link: link.href,
          date: dateMatch ? dateMatch[1] : "",
          description: ""
        };
      })
      .filter(Boolean)
      .slice(0, 15);

    if (items.length === 0) {
      throw new Error("No releases found on PIB ministry page");
    }


    // RAIL DARPAN NEWS ARTICLE ENRICHMENT V1
    // Read article metadata individually; one failed article should not break the feed.
    const enrichedItems = await Promise.all(items.map(async (item) => {
      try {
        const articleResponse = await fetch(item.link, {
          headers: {
            Accept: "text/html,application/xhtml+xml",
            "User-Agent": "Mozilla/5.0 RailDarpan/1.0"
          },
          signal: AbortSignal.timeout(8000)
        });

        if (!articleResponse.ok) {
          return { ...item, image: "", description: item.description || "" };
        }

        const articleHtml = await articleResponse.text();
        const metaTags = articleHtml.match(/<meta\b[^>]*>/gi) || [];

        function readAttribute(tag, name) {
          const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const match = tag.match(new RegExp(
            "\\b" + escapedName + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))",
            "i"
          ));
          return match ? (match[1] || match[2] || match[3] || "").trim() : "";
        }

        function readMeta(keys) {
          for (const key of keys) {
            for (const tag of metaTags) {
              const identity = (
                readAttribute(tag, "property") ||
                readAttribute(tag, "name") ||
                readAttribute(tag, "itemprop")
              ).toLowerCase();

              const content = readAttribute(tag, "content");
              if (identity === key && content) return cleanText(content);
            }
          }
          return "";
        }

        // RAIL DARPAN NEWS PIB IFRAME IMAGE SOURCE V1
        let imageHtml = articleHtml;
        let imageBaseUrl = item.link;

        try {
          const sourceLink = new URL(item.link);
          const prid = sourceLink.searchParams.get("PRID");

          if (prid) {
            const iframeUrl = new URL(
              "https://www.pib.gov.in/PressReleaseIframePage.aspx"
            );
            iframeUrl.searchParams.set("PRID", prid);
            iframeUrl.searchParams.set("lang", "1");

            const imagePageResponse = await fetch(iframeUrl.href, {
              headers: {
                Accept: "text/html,application/xhtml+xml",
                "User-Agent": "Mozilla/5.0 RailDarpan/1.0"
              },
              signal: AbortSignal.timeout(8000)
            });

            if (imagePageResponse.ok) {
              imageHtml = await imagePageResponse.text();
              imageBaseUrl = iframeUrl.href;
            }
          }
        } catch (imageError) {
          console.warn(
            "PIB article image lookup skipped:",
            item.link,
            imageError.message
          );
        }

        let image = "";
        const imageTags = imageHtml.match(/<img\b[^>]*>/gi) || [];

        for (const tag of imageTags) {
          const src =
            readAttribute(tag, "src") ||
            readAttribute(tag, "data-src") ||
            readAttribute(tag, "data-original");

          const alt = readAttribute(tag, "alt");
          if (!src) continue;

          if (
            /language-icon|hindi\.png|english\.png|logo|banner|g20|azadi|emblem|captcha|flag|relatedlink|mygov/i
              .test(src + " " + alt)
          ) continue;

          if (/\.(svg|gif)(?:[?#]|$)/i.test(src)) continue;

          const width = Number(readAttribute(tag, "width"));
          if (width && width < 220) continue;

          try {
            const candidate = new URL(src, imageBaseUrl);

            if (
              candidate.protocol !== "https:" &&
              candidate.protocol !== "http:"
            ) continue;

            if (candidate.hostname.toLowerCase() !== "static.pib.gov.in") {
              continue;
            }

            // Use press-release content images, not PIB page furniture.
            if (
              !/\/WriteReadData\/userfiles\/image\//i.test(candidate.pathname)
            ) continue;

            image = candidate.href;
            break;
          } catch (_) {}
        }

        const description =
          readMeta(["og:description", "description", "twitter:description"]) ||
          item.description ||
          "";

        if (image && /ph20221121131401\.png/i.test(image)) image = "";

        return { ...item, image, description };
      } catch (error) {
        console.warn("News article enrichment skipped:", item.link, error.message);
        return { ...item, image: "", description: item.description || "" };
      }
    }));

    res.json({
      success: true,
      source: "Press Information Bureau — Ministry of Railways",
      sourceUrl: filteredUrl,
      count: enrichedItems.length,
      items: enrichedItems
    });
  } catch (error) {
    console.error("Railway news error:", error.message);
    res.status(502).json({
      success: false,
      error: "Official railway news is temporarily unavailable."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Rail Darpan running at http://localhost:${PORT}`);
});
