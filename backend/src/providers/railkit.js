import { configure, checkPNRStatus } from "railkit";

let configuredKey = null;

function ensureRailKitConfigured() {
  const apiKey = process.env.RAILKIT_API_KEY;

  if (!apiKey) {
    throw new Error("RAILKIT_API_KEY is not configured");
  }

  if (configuredKey !== apiKey) {
    configure(apiKey);
    configuredKey = apiKey;
  }
}

export async function railkitPnr(pnr) {
  ensureRailKitConfigured();
  return await checkPNRStatus(pnr);
}
