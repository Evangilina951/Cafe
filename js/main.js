import { initAuth, currentUser } from '/Cafe/js/auth.js';
import { loadMenuFromFirebase } from '/Cafe/js/menu.js';
import { initOrder } from '/Cafe/js/order.js';
import { initAdmin, showAdminPanel, hideAdminPanel } from '/Cafe/js/admin.js';
import { auth } from '/Cafe/js/firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Инициализация модулей
    initAuth();
    initOrder();
    initAdmin();

    // Обработчики для админ-панели
    const adminBtn = document.querySelector('.admin-btn');
    const backBtn = document.querySelector('.back-btn');

    if (adminBtn) {
        adminBtn.addEventListener('click', showAdminPanel);
    }

    if (backBtn) {
        backBtn.addEventListener('click', hideAdminPanel);
    }

    // Проверка авторизации и загрузка меню
    auth.onAuthStateChanged(user => {
        if (user) {
            loadMenuFromFirebase();
            if (window.location.hash === '#admin' && user.email === 'admin@dismail.com') {
                showAdminPanel();
            }
        }
    });

    // Стили для формы добавления напитка
    const addItemForm = document.getElementById('add-item-form');
    if (addItemForm) {
        addItemForm.style.display = 'flex';
        addItemForm.style.flexDirection = 'column';
        addItemForm.style.gap = '10px';
    }
});
