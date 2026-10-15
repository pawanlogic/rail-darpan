

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

app.listen(PORT, () => {
  console.log(`Rail Darpan running at http://localhost:${PORT}`);
});

