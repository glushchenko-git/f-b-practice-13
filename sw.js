const CACHE_NAME = 'todo-cache-v3';
const ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json'
];

self.addEventListener('install', event => {
    console.log('[SW] Установка');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Кэшируем файлы');
                return cache.addAll(ASSETS);
            })
            .then(() => {
                console.log('[SW] Установка завершена');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[SW] Ошибка кэширования:', error);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('[SW] Активация');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => {
                    console.log('[SW] Удаляем старый кэш:', key);
                    return caches.delete(key);
                })
            );
        }).then(() => {
            console.log('[SW] Активация завершена');
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    console.log('[SW] Из кэша:', event.request.url);
                    return response;
                }
                console.log('[SW] Из сети:', event.request.url);
                return fetch(event.request);
            })
            .catch(() => {
                return new Response('Нет соединения', { status: 404 });
            })
    );
});