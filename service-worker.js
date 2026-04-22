const CACHE_NAME = 'jabi-converted-v1';
const FILES = [
  './',
  './index.html',
  './blog.html',
  './privacy.html',
  './styles.css',
  './script.js',
  './manifest.json',
  './post1_responsive_seo.html',
  './post2_color_psychology.html',
  './post3_open_source_advantage.html',
  './post4_landing_page_elements.html'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(FILES)));
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
