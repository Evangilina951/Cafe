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

function handleAuthStateChanged(user) {
    currentUser = user;
    
    if (user) {
        hideElement(elements.authForm);
        showElement(elements.orderInterface);
        
        if (elements.userEmail) {
            elements.userEmail.textContent = user.email;
        }

        // Показываем кнопки админа только для админа
        const adminBtns = document.querySelectorAll('.admin-btn');
        adminBtns.forEach(btn => {
            btn.style.display = user.email === 'admin@dismail.com' ? 'block' : 'none';
        });
    } else {
        showElement(elements.authForm);
        hideElement(elements.orderInterface);
    }
}

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

export function signOut() {
    return auth.signOut();
}

export function isAdmin() {
    return currentUser?.email === 'admin@dismail.com';
}

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

export function getCurrentUser() {
    return currentUser;
}
