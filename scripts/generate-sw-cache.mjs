// Genera un Service Worker que precachea los archivos hasheados del build de Vite
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');

// Lee el manifest generado por Vite
let manifest;
try {
  manifest = JSON.parse(readFileSync(join(distDir, '.vite', 'manifest.json'), 'utf-8'));
} catch {
  console.warn('⚠️ No se encontró manifest.json en dist/.vite/. Usando lista por defecto.');
  manifest = {};
}

// Extrae todos los archivos del manifest (hasheados), con / al inicio
const precacheEntries = Object.values(manifest).flatMap((entry) => {
  const files = ['/' + entry.file];
  if (entry.css) files.push(...entry.css.map((f) => '/' + f));
  if (entry.assets) files.push(...entry.assets.map((f) => '/' + f));
  return files;
});

// Archivos estáticos que siempre deben estar precacheados
const staticAssets = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable.png',
  '/apple-touch-icon.png',
];

// Combinar sin duplicados
const allAssets = [...new Set([...staticAssets, ...precacheEntries.filter(Boolean)])];

const swContent = `const CACHE_NAME = 'financefunnel-v2';
const STATIC_ASSETS = ${JSON.stringify(allAssets, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW: Falló al precachear algunos recursos:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// Cache-first strategy with network fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
    })
  );
});
`;

const swPath = join(distDir, 'sw.js');
writeFileSync(swPath, swContent);
console.log(`✅ SW generado en ${swPath} — ${allAssets.length} recursos precacheados`);
