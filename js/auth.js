import { auth } from '/Cafe/js/firebase-config.js';

let currentUser = null;

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

// Показываем/скрываем элементы интерфейса
function showElement(element) {
    if (element) {
        element.style.display = 'block';
        element.classList.remove('hidden');
    }
}

function hideElement(element) {
    if (element) {
        element.style.display = 'none';
        element.classList.add('hidden');
    }
}

// Основной обработчик авторизации
function handleAuthStateChanged(user) {
    if (user) {
        currentUser = user;
        hideElement(elements.authForm);
        showElement(elements.orderInterface);
        
        if (elements.userEmail) {
            elements.userEmail.textContent = user.email;
        }

        // Всегда показываем кнопки админа, проверка будет при клике
        document.querySelectorAll('.admin-btn').forEach(btn => {
            btn.style.display = 'block';
        });

        console.log('Авторизован пользователь:', user.email); // Отладочная информация
    } else {
        currentUser = null;
        showElement(elements.authForm);
        hideElement(elements.orderInterface);
    }
}

// Функция входа
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
    
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            console.error("Ошибка входа:", error);
            if (elements.errorMessage) {
                elements.errorMessage.textContent = error.message;
            }
        });
}

// Функция выхода
export function signOut() {
    return auth.signOut();
}

// Проверка прав администратора (простая и надежная)
export function isAdmin() {
    return currentUser && currentUser.email === 'admin@dismail.com';
}

// Инициализация модуля авторизации
export function initAuth() {
    auth.onAuthStateChanged(handleAuthStateChanged);
    
    if (elements.loginBtn) {
        elements.loginBtn.addEventListener('click', login);
    }
    
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', signOut);
    }

    if (elements.authForm) {
        elements.authForm.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login(e);
        });
    }
}

export { currentUser };
