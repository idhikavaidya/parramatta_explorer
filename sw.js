/* Parramatta Explorer service worker. GENERATED into ../sw.js by `npm run build` — edit this template.
 *
 * What it does
 *  1. Install: precaches every page, script, style, font and the MapLibre library, so the whole app
 *     (including every access plan) opens with no signal after the first visit.
 *  2. Pages: network first (so updates show up), falling back to the cached copy, then offline.html.
 *  3. Static files: stale-while-revalidate.
 *  4. Map tiles/style/sprites/glyphs from OpenFreeMap: cached as they are used (size-capped).
 *  5. SAVE_PLAN message: pre-fetches the map tiles around the venue so the live map also works offline.
 *     Anything not cached falls back to the schematic map in the page.
 */
const VERSION = "8e1ff92e8c";
const SHELL_CACHE = "pe-shell-" + VERSION;
const TILE_CACHE = "pe-tiles-v1";
const PRECACHE = [
  "./",
  "404.html",
  "about.html",
  "assets/css/styles.css",
  "assets/fonts/inter-latin-400-normal.woff2",
  "assets/fonts/inter-latin-500-normal.woff2",
  "assets/fonts/inter-latin-600-normal.woff2",
  "assets/fonts/inter-latin-700-normal.woff2",
  "assets/fonts/opendyslexic-latin-400-normal.woff2",
  "assets/fonts/opendyslexic-latin-700-normal.woff2",
  "assets/fonts/space-grotesk-latin-500-normal.woff2",
  "assets/fonts/space-grotesk-latin-700-normal.woff2",
  "assets/img/icon.svg",
  "assets/js/booking.js",
  "assets/js/core.js",
  "assets/js/data.js",
  "assets/js/explore.js",
  "assets/js/map.js",
  "assets/js/organiser.js",
  "assets/js/plan.js",
  "assets/js/render.js",
  "assets/js/report.js",
  "assets/js/settings.js",
  "assets/js/signin.js",
  "assets/js/store.js",
  "assets/vendor/maplibre-gl.css",
  "assets/vendor/maplibre-gl.js",
  "favicon.ico",
  "guide.html",
  "index.html",
  "landing.html",
  "manifest.webmanifest",
  "offline.html",
  "organiser/australia-day.html",
  "organiser/burramatta-naidoc.html",
  "organiser/christmas-in-parramatta.html",
  "organiser/community-day.html",
  "organiser/diwali.html",
  "organiser/family-movie-night.html",
  "organiser/farmers-market.html",
  "organiser/lunar-new-year.html",
  "organiser/make-music-day.html",
  "organiser/new-years-eve.html",
  "organiser/parramatta-lanes.html",
  "organiser/riverside-food-market.html",
  "organiser/seniors-festival.html",
  "organiser/warami.html",
  "organiser/winterlight.html",
  "organiser/youth-week.html",
  "plan/australia-day.html",
  "plan/burramatta-naidoc.html",
  "plan/christmas-in-parramatta.html",
  "plan/community-day.html",
  "plan/diwali.html",
  "plan/family-movie-night.html",
  "plan/farmers-market.html",
  "plan/lunar-new-year.html",
  "plan/make-music-day.html",
  "plan/new-years-eve.html",
  "plan/parramatta-lanes.html",
  "plan/riverside-food-market.html",
  "plan/seniors-festival.html",
  "plan/warami.html",
  "plan/winterlight.html",
  "plan/youth-week.html",
  "report.html",
  "settings.html",
  "signin.html"
];
const MAX_TILE_ENTRIES = 600;
const TILE_HOSTS = ["tiles.openfreemap.org"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("pe-shell-") && k !== SHELL_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const fresh = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000))
    ]);
    if (fresh && fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    return (await cache.match(new URL("offline.html", self.registration.scope).href)) || Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request).then((res) => {
    if (res && (res.ok || res.type === "opaque")) {
      cache.put(request, res.clone());
      if (cacheName === TILE_CACHE) trimCache(TILE_CACHE, MAX_TILE_ENTRIES);
    }
    return res;
  }).catch(() => null);
  if (cached) { refresh.catch(() => {}); return cached; }
  return (await refresh) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (request.mode === "navigate") event.respondWith(networkFirst(request));
    else event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
    return;
  }
  if (TILE_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, TILE_CACHE));
  }
});

/* ---------- Save a plan for offline: pre-fetch map data around the venue ---------- */
function lngToTileX(lng, z) { return Math.floor(((lng + 180) / 360) * Math.pow(2, z)); }
function latToTileY(lat, z) {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * Math.pow(2, z));
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
  return { res, json: await res.clone().json() };
}

async function prewarm(styleUrl, bbox) {
  const cache = await caches.open(TILE_CACHE);
  const urls = new Set();
  const store = async (url) => {
    try {
      const res = await fetch(url);
      if (res.ok) { await cache.put(url, res); return true; }
    } catch (e) { /* offline or blocked: skip */ }
    return false;
  };

  const { res: styleRes, json: style } = await fetchJson(styleUrl);
  await cache.put(styleUrl, styleRes);

  if (style.sprite) {
    ["", "@2x"].forEach((suffix) => { urls.add(style.sprite + suffix + ".json"); urls.add(style.sprite + suffix + ".png"); });
  }
  if (style.glyphs) {
    const stacks = new Set();
    (style.layers || []).forEach((l) => {
      const f = l.layout && l.layout["text-font"];
      if (Array.isArray(f) && f.every((x) => typeof x === "string")) stacks.add(f.join(","));
    });
    stacks.forEach((stack) => {
      ["0-255", "256-511"].forEach((range) => {
        urls.add(style.glyphs.replace("{fontstack}", encodeURIComponent(stack)).replace("{range}", range));
      });
    });
  }
  for (const source of Object.values(style.sources || {})) {
    let tiles = source.tiles, maxzoom = source.maxzoom, minzoom = source.minzoom || 0;
    if (!tiles && source.url) {
      try {
        const tj = await fetchJson(source.url);
        await cache.put(source.url, tj.res);
        tiles = tj.json.tiles; maxzoom = tj.json.maxzoom; minzoom = tj.json.minzoom || 0;
      } catch (e) { continue; }
    }
    if (!tiles || !tiles.length) continue;
    const top = Math.min(maxzoom == null ? 14 : maxzoom, 16);
    for (let z = Math.max(minzoom, 12); z <= top; z++) {
      const x0 = lngToTileX(bbox.minLng, z), x1 = lngToTileX(bbox.maxLng, z);
      const y0 = latToTileY(bbox.maxLat, z), y1 = latToTileY(bbox.minLat, z);
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
        urls.add(tiles[0].replace("{z}", z).replace("{x}", x).replace("{y}", y));
      }
    }
  }

  let ok = 0;
  const queue = Array.from(urls);
  const worker = async () => { while (queue.length) { if (await store(queue.shift())) ok++; } };
  await Promise.all([worker(), worker(), worker(), worker()]);
  trimCache(TILE_CACHE, MAX_TILE_ENTRIES);
  return { tiles: ok, requested: urls.size };
}

self.addEventListener("message", (event) => {
  const msg = event.data || {};
  const reply = (payload) => event.ports && event.ports[0] && event.ports[0].postMessage(payload);
  if (msg.type === "SAVE_PLAN") {
    event.waitUntil(
      prewarm(msg.styleUrl, msg.bbox)
        .then((r) => reply({ ok: true, tiles: r.tiles, requested: r.requested }))
        .catch((err) => reply({ ok: true, tiles: 0, requested: 0, note: String(err && err.message || err) }))
    );
  } else if (msg.type === "PING") {
    reply({ ok: true, version: VERSION });
  }
});
