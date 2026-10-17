import rateLimit from "express-rate-limit";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { railradar } from "./providers/railradar.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.RAILRADAR_API_KEY;

app.use(express.json());app.use(express.json());app.use(express.json());app.use(cors());
app.use(express.json());

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
    providerConfigured: Boolean(API_KEY)
  });
});

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
    const data = await railradar.pnr(req.params.pnr, API_KEY);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
});

// Live train status
app.get("/api/train/:number/live", async (req, res) => {
  const number = req.params.number;

  if (!/^\d{1,10}$/.test(number)) {
    return res.status(400).json({ error: "Invalid train number" });
  }

  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const data = await railradar.liveTrain(number, date, API_KEY);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
});

// Train schedule
app.get("/api/train/:number/schedule", async (req, res) => {
  if (!/^\d{1,10}$/.test(req.params.number)) {
    return res.status(400).json({ error: "Invalid train number" });
  }

  try {
    const data = await railradar.schedule(req.params.number, API_KEY);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
});

// Station search
app.get("/api/stations/search", async (req, res) => {
  const query = String(req.query.q || "").trim();

  if (query.length < 2) {
    return res.status(400).json({
      error: "Enter at least 2 characters to search stations"
    });
  }

  try {
    const data = await railradar.stationSearch(query, 10, API_KEY);
    res.json(data);
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
    const hours = Math.min(24, Math.max(1, Number(req.query.hours) || 4));
    const data = await railradar.stationLive(code, hours, API_KEY);
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
});

// Official railway news from PIB
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

    res.json({
      success: true,
      source: "Press Information Bureau — Ministry of Railways",
      sourceUrl: filteredUrl,
      count: items.length,
      items
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
