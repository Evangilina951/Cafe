import { auth } from './firebase-config.js';

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
            if (elements.adminBtn) elements.adminBtn.style.display = 'block';
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

function login() {
    const email = elements.emailInput.value;
    const password = elements.passwordInput.value;
    
    elements.errorMessage.textContent = '';
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            console.log("Login successful");
        })
        .catch(error => {
            console.error("Login error:", error);
            elements.errorMessage.textContent = error.message;
        });
}

function logout() {
    auth.signOut()
        .then(() => {
            console.log("User logged out");
        })
        .catch(error => console.error("Logout error:", error));
}

// Инициализация обработчиков событий
export function initAuth() {
    if (elements.loginBtn) {
        elements.loginBtn.addEventListener('click', login);
    }
    
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', logout);
    }
}

export { currentUser };
