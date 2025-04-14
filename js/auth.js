import { auth } from '/Cafe/js/firebase-config.js';

let currentUser = null; // Текущий авторизованный пользователь

// Получение DOM-элементов
const elements = {
    authForm: document.getElementById('auth-form'),
    orderInterface: document.getElementById('order-interface'),
    userEmail: document.getElementById('user-email'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    errorMessage: document.getElementById('error-message'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.querySelector('.logout-btn')
};

// Функция для проверки авторизации
export function isAdmin() {
    return currentUser?.email === 'admin@dismail.com';
}

// Обработчик изменения состояния авторизации
function handleAuthStateChanged(user) {
    currentUser = user;
    
    if (user) {
        // Показываем интерфейс заказа
        elements.authForm.style.display = 'none';
        elements.orderInterface.style.display = 'block';
        elements.userEmail.textContent = user.email;

        // Показываем/скрываем кнопки админа
        document.querySelectorAll('.admin-btn').forEach(btn => {
            btn.style.display = isAdmin() ? 'block' : 'none';
        });
    } else {
        // Показываем форму авторизации
        elements.authForm.style.display = 'block';
        elements.orderInterface.style.display = 'none';
    }
}

// Функция входа
function login(e) {
    e.preventDefault();
    const email = elements.emailInput.value;
    const password = elements.passwordInput.value;

    if (!email || !password) {
        elements.errorMessage.textContent = 'Заполните все поля';
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            elements.errorMessage.textContent = error.message;
        });
}

// Функция выхода
export function signOut() {
    return auth.signOut();
}

// Инициализация модуля авторизации
export function initAuth() {
    // Подписываемся на изменения состояния авторизации
    auth.onAuthStateChanged(handleAuthStateChanged);

    // Назначаем обработчики событий
    elements.loginBtn.addEventListener('click', login);
    elements.logoutBtn.addEventListener('click', signOut);
    elements.authForm.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login(e);
    });
}

// Экспортируем функцию для получения текущего пользователя
export function getCurrentUser() {
    return currentUser;
}
