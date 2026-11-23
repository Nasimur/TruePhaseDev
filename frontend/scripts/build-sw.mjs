import { createHash } from "node:crypto";
import { readdir, writeFile } from "node:fs/promises";

const dist = new URL("../dist/", import.meta.url);
const assetNames = (await readdir(new URL("assets/", dist)))
  .filter((name) => /\.(?:js|css)$/.test(name))
  .sort();
const precache = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  ...assetNames.map((name) => `/assets/${name}`),
];
const version = createHash("sha256")
  .update(precache.join("\n"))
  .digest("hex")
  .slice(0, 12);

// Only the explicit app shell is cached. Navigation uses a network-first
// response with a cached HTML fallback; API and health-data requests are not
// intercepted or added to any cache.
const source = `const CACHE = "truephase-shell-${version}";
const SHELL = ${JSON.stringify(precache)};
const SHELL_PATHS = new Set(SHELL);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (names) => {
      await Promise.all(
        names.filter((name) => name.startsWith("truephase-shell-") && name !== CACHE)
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/index.html")));
    return;
  }

  if (SHELL_PATHS.has(url.pathname)) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
  }
});
`;

await writeFile(new URL("sw.js", dist), source);
console.log(`Generated service worker with ${precache.length} static files.`);
