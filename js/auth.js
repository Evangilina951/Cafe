import { auth } from '/Cafe/js/firebase-config.js';

let currentUser = null;

// DOM элементы
const elements = {
    authForm: document.getElementById('auth-form'),
    orderInterface: document.getElementById('order-interface'),
    adminPanel: document.getElementById('admin-panel'),
    userEmail: document.getElementById('user-email'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    errorMessage: document.getElementById('error-message'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.querySelector('.logout-btn'),
    adminBtn: document.querySelector('.admin-btn'),
    promoManagementBtn: document.getElementById('promo-management-btn')
};

// Показать элемент
function showElement(element) {
    if (element) {
        element.style.display = 'block';
        element.classList.remove('hidden');
    }
}

// Скрыть элемент
function hideElement(element) {
    if (element) {
        element.style.display = 'none';
        element.classList.add('hidden');
    }
}

// Обработчик изменения состояния авторизации
function handleAuthStateChanged(user) {
    if (user) {
        currentUser = user;
        hideElement(elements.authForm);
        showElement(elements.orderInterface);
        
        if (elements.userEmail) {
            elements.userEmail.textContent = user.email;
        }
        
        const isAdmin = user.email === 'admin@dismail.com';
        
        // Управление видимостью кнопок админ-панели
        if (elements.adminBtn) {
            elements.adminBtn.style.display = isAdmin ? 'block' : 'none';
        }
        
        if (elements.promoManagementBtn) {
            elements.promoManagementBtn.style.display = isAdmin ? 'block' : 'none';
        }

        // Показать админ-панель если в URL есть #admin
        if (isAdmin && window.location.hash === '#admin') {
            showElement(elements.adminPanel);
            hideElement(elements.orderInterface);
        }
    } else {
        // Пользователь не авторизован
        currentUser = null;
        showElement(elements.authForm);
        hideElement(elements.orderInterface);
        hideElement(elements.adminPanel);
        
        // Скрыть все админ-кнопки
        if (elements.adminBtn) elements.adminBtn.style.display = 'none';
        if (elements.promoManagementBtn) elements.promoManagementBtn.style.display = 'none';
    }
}

// Вход в систему
function login(e) {
    e.preventDefault();
    
    const email = elements.emailInput.value;
    const password = elements.passwordInput.value;
    
    if (!email || !password) {
        if (elements.errorMessage) {
            elements.errorMessage.textContent = 'Заполните все поля';
        }
        return;
    }
    
    // Очистить предыдущие ошибки
    if (elements.errorMessage) {
        elements.errorMessage.textContent = '';
    }
    
    // Выполнить вход
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            console.error("Ошибка входа:", error);
            if (elements.errorMessage) {
                elements.errorMessage.textContent = error.message;
            }
        });
}

// Выход из системы
function logout() {
    auth.signOut().catch(error => {
        console.error("Ошибка выхода:", error);
    });
}

// Инициализация модуля авторизации
export function initAuth() {
    // Подписаться на изменения состояния авторизации
    auth.onAuthStateChanged(handleAuthStateChanged);
    
    // Назначить обработчики событий
    if (elements.loginBtn) {
        elements.loginBtn.addEventListener('click', login);
    }
    
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', logout);
    }

    // Обработка входа по нажатию Enter
    if (elements.authForm) {
        elements.authForm.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login(e);
        });
    }
}

// Функция для подписки на изменения авторизации
export function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(user => {
        if (user && elements.promoManagementBtn) {
            elements.promoManagementBtn.style.display = 
                user.email === 'admin@dismail.com' ? 'block' : 'none';
        }
        callback(user);
    });
}

// Экспорт текущего пользователя
export { currentUser };
