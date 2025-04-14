import { auth } from '/Cafe/js/firebase-config.js';

export let currentUser = null;

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

export function isAdmin() {
    return currentUser?.email === 'admin@dismail.com';
}

function handleAuthStateChanged(user) {
    currentUser = user;
    
    if (user) {
        console.log('User logged in:', user.email);
        // Убедимся, что элементы существуют
        const authForm = document.getElementById('auth-form');
        const orderInterface = document.getElementById('order-interface');
        
        if (authForm) authForm.style.display = 'none';
        if (orderInterface) {
            orderInterface.style.display = 'flex'; // Важно: используем flex или block
            orderInterface.classList.remove('hidden'); // Дополнительная гарантия
        }
        
        const userEmail = document.getElementById('user-email');
        if (userEmail) userEmail.textContent = user.email;

        // Показываем кнопки админа только для админа
        document.querySelectorAll('.admin-btn').forEach(btn => {
            btn.style.display = isAdmin() ? 'block' : 'none';
        });
        
        // Принудительно запускаем загрузку меню
        if (typeof loadMenuFromFirebase === 'function') {
            loadMenuFromFirebase();
        }
    } else {
        console.log('User logged out');
        const authForm = document.getElementById('auth-form');
        const orderInterface = document.getElementById('order-interface');
        
        if (authForm) authForm.style.display = 'block';
        if (orderInterface) {
            orderInterface.style.display = 'none';
            orderInterface.classList.add('hidden');
        }
    }
}

function login(e) {
    e.preventDefault();
    const email = elements.emailInput.value;
    const password = elements.passwordInput.value;

    if (!email || !password) {
        if (elements.errorMessage) elements.errorMessage.textContent = 'Заполните все поля';
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .then(user => {
            console.log('Login successful:', user);
            if (elements.errorMessage) elements.errorMessage.textContent = '';
        })
        .catch(error => {
            console.error('Login error:', error);
            if (elements.errorMessage) elements.errorMessage.textContent = error.message;
        });
}

export function signOut() {
    return auth.signOut()
        .then(() => console.log('User signed out'))
        .catch(error => console.error('Sign out error:', error));
}

export function initAuth() {
    console.log('Initializing auth...');
    
    // Проверяем существование элементов
    if (!elements.authForm || !elements.orderInterface) {
        console.error('Critical elements not found!');
        return;
    }

    auth.onAuthStateChanged(handleAuthStateChanged);

    if (elements.loginBtn) elements.loginBtn.addEventListener('click', login);
    if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', signOut);
    if (elements.authForm) {
        elements.authForm.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login(e);
        });
    }
}

export function getCurrentUser() {
    return currentUser;
}
