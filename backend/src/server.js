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
