import { auth } from '/Cafe/js/firebase-config.js';

let currentUser = null;

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
    promoManagementBtn: document.getElementById('promo-management-btn'),
    menuManagementBtn: document.getElementById('menu-management-btn')
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
    if (user) {
        currentUser = user;
        hideElement(elements.authForm);
        showElement(elements.orderInterface);
        
        if (elements.userEmail) {
            elements.userEmail.textContent = user.email;
        }
        
        const isAdmin = user.email === 'admin@dismail.com';
        
        [elements.adminBtn, elements.promoManagementBtn, elements.menuManagementBtn].forEach(btn => {
            if (btn) btn.style.display = isAdmin ? 'block' : 'none';
        });

        if (isAdmin && window.location.hash === '#admin') {
            showElement(elements.adminPanel);
            hideElement(elements.orderInterface);
        }
    } else {
        currentUser = null;
        showElement(elements.authForm);
        hideElement(elements.orderInterface);
        hideElement(elements.adminPanel);
        
        [elements.adminBtn, elements.promoManagementBtn, elements.menuManagementBtn].forEach(btn => {
            if (btn) btn.style.display = 'none';
        });
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

export function signOut() {
    return auth.signOut()
        .catch(error => {
            console.error("Logout error:", error);
            throw error;
        });
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

export function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(user => {
        if (user && elements.promoManagementBtn) {
            elements.promoManagementBtn.style.display = 
                user.email === 'admin@dismail.com' ? 'block' : 'none';
        }
        callback(user);
    });
}

export { currentUser };
