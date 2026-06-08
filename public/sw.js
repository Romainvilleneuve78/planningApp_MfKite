const CACHE_VERSION = "v1";
const STATIC_CACHE = `planning-static-${CACHE_VERSION}`;
const API_CACHE = `planning-api-${CACHE_VERSION}`;

const PRE_CACHE_URLS = ["/", "/manifest.webmanifest"];

// Handle SKIP_WAITING message from registration component
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// ── Install ──────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRE_CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== API_CACHE)
            .map((k) => caches.delete(k))
        )
      ),
      self.clients.claim(),
    ])
  );
});

// ── Fetch ─────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET and cross-origin
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // API routes → network first, graceful degradation offline
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Next.js versioned static assets → cache forever
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Icons & manifest → cache first
  if (
    url.pathname.startsWith("/_next/image") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // App shell → stale while revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// ── Strategies ────────────────────────────────────────────
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok && request.method === "GET") {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: "Connexion internet requise pour cette action." }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Ressource non disponible hors ligne.", { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached ?? (await fetchPromise) ?? offlinePage();
}

function offlinePage() {
  return new Response(
    `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mon Planning — Hors ligne</title>
  <style>
    body { margin:0; font-family:-apple-system,sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; background:#f8f9fc; }
    .card { text-align:center; padding:2rem; background:white; border-radius:1.5rem; box-shadow:0 4px 24px rgba(0,0,0,.06); max-width:320px; }
    .icon { width:56px; height:56px; background:linear-gradient(135deg,#6366f1,#8b5cf6); border-radius:1rem; margin:0 auto 1.25rem; display:flex; align-items:center; justify-content:center; }
    svg { width:28px; height:28px; }
    h1 { font-size:1.1rem; font-weight:600; color:#0f172a; margin:0 0 .5rem; }
    p  { font-size:.875rem; color:#94a3b8; margin:0 0 1.25rem; }
    button { padding:.625rem 1.25rem; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:white; border:none; border-radius:.75rem; font-size:.875rem; font-weight:500; cursor:pointer; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
        <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
      </svg>
    </div>
    <h1>Pas de connexion</h1>
    <p>Reconnectez-vous à Internet pour accéder à votre planning.</p>
    <button onclick="window.location.reload()">Réessayer</button>
  </div>
</body>
</html>`,
    { headers: { "Content-Type": "text/html" }, status: 503 }
  );
}
