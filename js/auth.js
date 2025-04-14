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
        if (elements.authForm) elements.authForm.style.display = 'none';
        if (elements.orderInterface) {
            elements.orderInterface.style.display = 'flex';
            elements.orderInterface.classList.remove('hidden');
        }
        if (elements.userEmail) elements.userEmail.textContent = user.email;

        document.querySelectorAll('.admin-btn').forEach(btn => {
            if (btn) btn.style.display = isAdmin() ? 'block' : 'none';
        });
    } else {
        console.log('User logged out');
        if (elements.authForm) elements.authForm.style.display = 'block';
        if (elements.orderInterface) {
            elements.orderInterface.style.display = 'none';
            elements.orderInterface.classList.add('hidden');
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
        .then(() => {
            if (elements.errorMessage) elements.errorMessage.textContent = '';
        })
        .catch(error => {
            console.error('Login error:', error);
            if (elements.errorMessage) elements.errorMessage.textContent = error.message;
        });
}

export function signOut() {
    return auth.signOut();
}

export function initAuth() {
    console.log('Initializing auth...');
    
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
