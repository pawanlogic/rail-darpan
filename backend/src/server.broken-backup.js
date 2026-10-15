

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

app.use(cors());
app.use(express.json());
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

app.get("/api/stations/search", async (req, res) => {
  const query = String(req.query.q || "").trim();

  if (query.length < 2) {
    return res.status(400).json({
      error: "Enter at least 2 characters to search stations"
    });
  }

  try {
    const data = await railradar.stationSearch(
      query,
      10,
      API_KEY
    );
    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
});

app.get("/api/station/:code/live", async (req, res) => {
  try {
    const hours = Math.min(
      24,
      Math.max(1, Number(req.query.hours) || 4)
    );

    const data = await railradar.stationLive(
      req.params.code,
      hours,
      API_KEY
    );

    res.json(data);
  } catch (error) {
    handleError(res, error);
  }
});


app.get("/api/news", async (req, res) => {
  try {
    const feedUrl =
      "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3";

    const response = await fetch(feedUrl, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml"
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Official news source returned ${response.status}`);
    }

    const xml = await response.text();

    const decode = (value) =>
      value
        .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();

    const getTag = (item, tag) => {
      const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(
        "<" + escapedTag + "\\b[^>]*>([\\s\\S]*?)</" + escapedTag + "\\s*>",
        "i"
      );
      const match = item.match(regex);
      return match ? decode(match[1]) : "";
    };

    const items = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)]
      .slice(0, 15)
      .map((match) => {
        const item = match[1];
        return {
          title: getTag(item, "title"),
          link: getTag(item, "link"),
          date: getTag(item, "pubDate"),
          description: getTag(item, "description")
        };
      })
      .filter((item) => item.title && /^https?:\/\//i.test(item.link));

    res.json({
      success: true,
      source: "Press Information Bureau RSS",
      sourceUrl: feedUrl,
      count: items.length,
      items
    });
  } catch (error) {
    console.error("Railway news error:", error.message);
    res.status(502).json({
      error: "Official news is temporarily unavailable. Please try again later."
    });
  }
});


    if (!response.ok) {
      throw new Error(`Official news source returned ${response.status}`);
    }

    const xml = await response.text();

function getTag(item, tag) {
  const match = item.match(
    new RegExp(
      "<" + tag + "[^>]*>([\\s\\S]*?)</" + tag + ">",
      "i"
    )
  );

  if (!match) return "";

  let value = match[1];

  value = value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  value = value.replace(/<[^>]*>/g, "");
  value = value.replace(/&amp;/g, "&");
  value = value.replace(/&quot;/g, '"');
  value = value.replace(/&#39;|&apos;/g, "'");
  value = value.replace(/&lt;/g, "<");
  value = value.replace(/&gt;/g, ">");

  return value.trim();
}

}))

    }

    const items = [...xml.matchAll(/<item\\b[^>]*>([\\s\\S]*?)<\\/item>/gi)]
      .slice(0, 15)
      .map(match => {
        const item = match[1];
        return {
          title: getTag(item, "title"),
          link: getTag(item, "link"),
          date: getTag(item, "pubDate"),
          description: getTag(item, "description")
        };
      })
      .filter(item =>
        item.title &&
        /^https?:\\/\\//i.test(item.link)
      );

    res.json({
      success: true,
      source: "Press Information Bureau RSS",
      sourceUrl: feedUrl,
      count: items.length,
      items
    });
  } catch (error) {
    console.error("Railway news error:", error.message);
    res.status(502).json({
      error: "Official news is temporarily unavailable. Please try again later."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Rail Darpan running at http://localhost:${PORT}`);
});

