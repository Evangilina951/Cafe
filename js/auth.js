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
    adminBtn: document.querySelector('.admin-btn')
};

// Функции для работы с DOM
function showElement(element) {
    if (!element) return;
    element.style.display = 'block';
    element.classList.remove('hidden');
}

function hideElement(element) {
    if (!element) return;
    element.style.display = 'none';
    element.classList.add('hidden');
}

// Обработчик состояния авторизации
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        hideElement(elements.authForm);
        showElement(elements.orderInterface);
        
        if (elements.userEmail) {
            elements.userEmail.textContent = user.email;
        }
        
        if (user.email === 'admin@dismail.com') {
            if (elements.adminBtn) {
                elements.adminBtn.style.display = 'block';
                // Показываем админ-панель если в URL есть #admin
                if (window.location.hash === '#admin') {
                    showElement(elements.adminPanel);
                    hideElement(elements.orderInterface);
                }
            }
        } else if (elements.adminBtn) {
            elements.adminBtn.style.display = 'none';
        }
    } else {
        currentUser = null;
        showElement(elements.authForm);
        hideElement(elements.orderInterface);
        hideElement(elements.adminPanel);
        if (elements.adminBtn) elements.adminBtn.style.display = 'none';
    }
});

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
    
    if (elements.errorMessage) {
        elements.errorMessage.textContent = '';
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            console.error("Login error:", error);
            if (elements.errorMessage) {
                elements.errorMessage.textContent = error.message;
            }
        });
}

function logout() {
    auth.signOut()
        .catch(error => {
            console.error("Logout error:", error);
        });
}

// Инициализация обработчиков событий
export function initAuth() {
    if (elements.loginBtn) {
        elements.loginBtn.addEventListener('click', login);
    }
    
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', logout);
    }

    // Обработка формы по нажатию Enter
    if (elements.authForm) {
        elements.authForm.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                login(e);
            }
        });
    }
}

export function onAuthStateChanged(auth, callback) {
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Показываем кнопку промокодов только для админа
            const promoBtn = document.getElementById('promo-management-btn');
            if (promoBtn) {
                promoBtn.style.display = user.email === 'admin@dismail.com' ? 'block' : 'none';
            }
        }
        callback(user);
    });
}

export { currentUser };
