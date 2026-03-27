const CACHE_NAME = 'todo-cache-v2';  // Обновляем версию кэша

// Добавляем манифест и все иконки в список ресурсов
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/icons/icns.png',
];

// Событие INSTALL
self.addEventListener('install', (event) => {
    console.log('[SW] Установка');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Кэширование ресурсов');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[SW] Установка завершена, активация');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Ошибка кэширования:', error);
            })
    );
});

// Событие ACTIVATE
self.addEventListener('activate', (event) => {
    console.log('[SW] Активация');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Удаление старого кэша:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[SW] Активация завершена');
            return self.clients.claim();
        })
    );
});

// Событие FETCH
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    console.log('[SW] Ответ из кэша для:', event.request.url);
                    return response;
                }
                console.log('[SW] Запрос в сеть для:', event.request.url);
                return fetch(event.request).catch((error) => {
                    console.error('[SW] Ошибка сети:', error);
                    // Возвращаем fallback-ответ при отсутствии сети
                    return new Response('Нет соединения с интернетом и ресурс не найден в кэше.', {
                        status: 404,
                        statusText: 'Not Found',
                    });
                });
            })
    );
});