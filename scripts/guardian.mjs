import fs from "node:fs/promises";
import { chromium } from "playwright";

const LIVE = {
  api: "https://raider-rides-api.onrender.com",
  rider: "https://raider-rides-rider.onrender.com",
  driver: "https://raider-rides-driver.onrender.com",
  admin: "https://raider-rides-admin.onrender.com",
};
const failures = [];
const GUARDIAN_AGENT_NAME = process.env.GUARDIAN_AGENT_NAME || "Mike";
const ALERT_CONTACT_NAME = process.env.GUARDIAN_CONTACT_NAME || "Richard";
const ALERT_CONTACT_PHONE = process.env.GUARDIAN_CONTACT_PHONE || "";
const ok = (name, detail) => console.log("PASS", name, detail || "");
const fail = (name, detail) => { failures.push({name, detail}); console.error("FAIL", name, detail || ""); };
async function fetchWithTimeout(url, options = {}, ms = 20000) {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), ms);
  try { return await fetch(url, {...options, signal: controller.signal}); } finally { clearTimeout(timer); }
}
async function checkHttp(name, url, expected = 200) {
  try { const r = await fetchWithTimeout(url); if (r.status !== expected) { fail(name, r.status + " " + r.statusText); return null; } ok(name, r.status + " " + url); return r; }
  catch (e) { fail(name, e.message); return null; }
}
async function checkSource(path, rules) {
  const text = await fs.readFile(path, "utf8");
  for (const rule of rules) { if (rule[1].test(text)) ok("source: " + rule[0]); else fail("source: " + rule[0], "Missing required contract in " + path); }
}
async function main() {
  console.log("Raider Rides Guardian (" + GUARDIAN_AGENT_NAME + ") starting...");
  console.log("Failure alert contact: " + ALERT_CONTACT_NAME + (ALERT_CONTACT_PHONE ? " configured" : " not configured"));
  const health = await checkHttp("API health", LIVE.api + "/api/health");
  if (health) {
    try { const body = await health.json();
      if (body.ok !== true) fail("API health payload", JSON.stringify(body)); else ok("API health payload", JSON.stringify(body));
      if (body.database !== true) fail("Postgres connected", "API reports database=false"); else ok("Postgres connected");
    } catch (e) { fail("API health JSON", e.message); }
  }
  await checkHttp("Rider app", LIVE.rider + "/");
  await checkHttp("Driver app", LIVE.driver + "/");
  await checkHttp("Admin app", LIVE.admin + "/");
  await checkSource("src/rider.js", [
    ["rider destination host", /id="destinationAutocomplete"/],
    ["rider destination value", /id="destination"[^>]*type="hidden"[^>]*required/],
    ["rider destination autocomplete", /new PlaceAutocompleteElement\(\)/],
    ["rider drop-off control", /Tap map to set drop-off/],
    ["rider live GPS control", /Use my live GPS for pickup/],
  ]);
  await checkSource("src/driver.js", [
    ["driver map", /id="driverMap"/],
    ["driver live GPS control", /Use free live GPS/],
    ["driver live ride events", /\/driver\/events/],
    ["driver navigation", /openstreetmap\.org\/directions/],
  ]);
  await checkSource("src/google-maps.js", [
    ["free Leaflet map", /leaflet@1\.9\.4/],
    ["OpenStreetMap tiles", /tile\.openstreetmap\.org/],
    ["Photon place search", /photon\.komoot\.io\/api/],
    ["Map constructor compatibility", /function Map\(el,o=\{\}\)\{return new RaiderMap/],
    ["place autocomplete custom element", /raider-place-autocomplete/],
  ]);
  try {
    const photon = await fetchWithTimeout("https://photon.komoot.io/api/?q=Lubbock%20TX&limit=1");
    if (!photon.ok) fail("Photon place search", photon.status + " " + photon.statusText);
    else { const data = await photon.json(); if (!Array.isArray(data.features)) fail("Photon place search payload", "features missing"); else ok("Photon place search", data.features.length + " result(s)"); }
  } catch (e) { fail("Photon place search", e.message); }
  const browser = await chromium.launch({headless: true});
  try {
    for (const entry of Object.entries({Rider: LIVE.rider, Driver: LIVE.driver, Admin: LIVE.admin})) {
      const name = entry[0], url = entry[1];
      const page = await browser.newPage({viewport: {width: 390, height: 844}});
      const pageErrors = [], firstPartyFailures = []; const origin = new URL(url).origin;
      page.on("pageerror", e => pageErrors.push(e.message));
      page.on("requestfailed", req => { try { if (new URL(req.url()).origin === origin) firstPartyFailures.push(req.url() + " :: " + (req.failure()?.errorText || "request failed")); } catch {} });
      try {
        const response = await page.goto(url + "/", {waitUntil: "domcontentloaded", timeout: 30000});
        if (!response || response.status() >= 400) fail(name + " browser page", "HTTP " + (response?.status() ?? "no response"));
        else { await page.waitForTimeout(1500); const bodyText = await page.locator("body").innerText(); if (!bodyText || bodyText.trim().length < 40) fail(name + " browser page", "Page body is unexpectedly empty"); else ok(name + " browser page", "loaded in Chromium"); }
        if (pageErrors.length) fail(name + " browser JS errors", pageErrors.join(" | ")); else ok(name + " browser JS errors", "none");
        if (firstPartyFailures.length) fail(name + " first-party network failures", firstPartyFailures.join(" | ")); else ok(name + " first-party network failures", "none");
      } catch (e) { fail(name + " browser check", e.message); } finally { await page.close(); }
    }
  } finally { await browser.close(); }
  console.log("Raider Rides Guardian (" + GUARDIAN_AGENT_NAME + ") finished: " + (failures.length ? failures.length + " failure(s)" : "ALL CHECKS PASSED"));
  if (failures.length && ALERT_CONTACT_PHONE) console.log("Alert routing: " + GUARDIAN_AGENT_NAME + " -> " + ALERT_CONTACT_NAME + " at configured phone contact");
  if (failures.length) { console.error(JSON.stringify(failures, null, 2)); process.exit(1); }
}
main().catch(e => { console.error(e); process.exit(1); });