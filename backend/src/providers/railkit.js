import {
  configure,
  checkPNRStatus,
  trackTrain,
  stationByCode,
  stationAmenities,
  stationsByName,
  trainByNumber,
  trainsByName,
  getTrainInfo,
  searchTrainBetweenStations,
  liveAtStation,
  cancelList
} from "railkit";

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

export async function railkitTrackTrain(number, date) {
  ensureRailKitConfigured();
  return await trackTrain(number, date);
}


// RailKit Lookup API wrappers
export async function railkitStationByCode(code) {
  ensureRailKitConfigured();
  return await stationByCode(code);
}

export async function railkitStationAmenities(code) {
  ensureRailKitConfigured();
  return await stationAmenities(code);
}

export async function railkitStationsByName(name) {
  ensureRailKitConfigured();
  return await stationsByName(name);
}

export async function railkitTrainByNumber(number) {
  ensureRailKitConfigured();
  return await trainByNumber(number);
}

export async function railkitTrainsByName(name) {
  ensureRailKitConfigured();
  return await trainsByName(name);
}


export async function railkitGetTrainInfo(number) {
  ensureRailKitConfigured();
  return await getTrainInfo(number);
}

export async function railkitSearchTrainBetweenStations(from, to, date) {
  ensureRailKitConfigured();
  return await searchTrainBetweenStations(from, to, date);
}

export async function railkitLiveAtStation(code, hours) {
  ensureRailKitConfigured();
  return await liveAtStation(code, hours);
}

export async function railkitCancelList() {
  ensureRailKitConfigured();
  return await cancelList();
}
