// Получаем элементы DOM
const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const statusDiv = document.getElementById('status');
const installContainer = document.getElementById('install-container');
const installBtn = document.getElementById('install-btn');

// Переменная для хранения события установки
let deferredPrompt;

// --- Логика работы с задачами (без изменений) ---
function loadTodos() {
    const todos = JSON.parse(localStorage.getItem('todos') || '[]');
    if (todos.length === 0) {
        list.innerHTML = '<li style="text-align: center; color: #888;">Нет задач. Добавьте первую!</li>';
        return;
    }

    list.innerHTML = todos.map((todo, index) => `
        <li>
            <span>${escapeHtml(todo)}</span>
            <button class="delete-btn" data-index="${index}">Удалить</button>
        </li>
    `).join('');

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            deleteTodo(index);
        });
    });
}

function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function addTodo(text) {
    const todos = JSON.parse(localStorage.getItem('todos') || '[]');
    todos.push(text);
    localStorage.setItem('todos', JSON.stringify(todos));
    loadTodos();
}

function deleteTodo(index) {
    const todos = JSON.parse(localStorage.getItem('todos') || '[]');
    if (index >= 0 && index < todos.length) {
        todos.splice(index, 1);
        localStorage.setItem('todos', JSON.stringify(todos));
        loadTodos();
    }
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
        addTodo(text);
        input.value = '';
    }
});

loadTodos();

// --- Регистрация Service Worker ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker зарегистрирован с scope:', registration.scope);
            updateStatus('зарегистрирован и активен', 'success');
        } catch (error) {
            console.error('Ошибка регистрации Service Worker:', error);
            updateStatus('ошибка регистрации', 'error');
        }
    });
} else {
    console.warn('Service Worker не поддерживается в этом браузере.');
    updateStatus('не поддерживается браузером', 'error');
}

// --- Логика установки PWA ---
// Слушаем событие beforeinstallprompt (браузер предлагает установить PWA)
window.addEventListener('beforeinstallprompt', (e) => {
    // Предотвращаем автоматическое отображение диалога установки
    e.preventDefault();
    // Сохраняем событие для использования позже
    deferredPrompt = e;
    // Показываем кнопку установки
    installContainer.style.display = 'block';
    console.log('Событие beforeinstallprompt перехвачено');
});

// Обработчик клика по кнопке установки
if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        
        // Показываем диалог установки
        deferredPrompt.prompt();
        
        // Ждем выбора пользователя
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Пользователь ${outcome === 'accepted' ? 'установил' : 'отклонил'} приложение`);
        
        // Сбрасываем сохраненное событие
        deferredPrompt = null;
        // Скрываем кнопку установки
        installContainer.style.display = 'none';
    });
}

// Слушаем событие appinstalled для аналитики
window.addEventListener('appinstalled', () => {
    console.log('PWA было успешно установлено');
    updateStatus('установлено на устройство', 'success');
});

function updateStatus(message, type = 'info') {
    if (statusDiv) {
        statusDiv.textContent = `Статус SW: ${message}`;
        statusDiv.style.color = type === 'error' ? '#ff6b6b' : '#2ecc71';
    }
}

// Сообщения от Service Worker
navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_STATUS') {
        console.log('Сообщение от SW:', event.data.message);
    }
});