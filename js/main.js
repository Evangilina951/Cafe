import { initAuth, currentUser } from '/Cafe/js/auth.js';
import { loadMenuFromFirebase } from '/Cafe/js/menu.js';
import { initOrder } from '/Cafe/js/order.js';
import { initAdmin } from '/Cafe/js/admin.js';
import { auth } from '/Cafe/js/firebase-config.js'; // Явный импорт auth
import { showAdminPanel, hideAdminPanel } from '/Cafe/js/admin.js'; //Импорт входа в Админ-панель

//Для работы входа в Админ-панель
document.addEventListener('DOMContentLoaded', () => {
    const adminBtn = document.querySelector('.admin-btn');
    const backBtn = document.querySelector('.back-btn');

    if (adminBtn) {
        adminBtn.addEventListener('click', showAdminPanel);
    }

    if (backBtn) {
        backBtn.addEventListener('click', hideAdminPanel);
    }
});

//Для работы кнопки оплаты
document.addEventListener('DOMContentLoaded', () => {
    initOrder();
});

// Функция для показа админ-панели (добавлена, так как она используется)
function showAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    const orderInterface = document.getElementById('order-interface');
    if (adminPanel && orderInterface) {
        adminPanel.style.display = 'block';
        adminPanel.classList.remove('hidden');
        orderInterface.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Инициализация модулей
    initAuth();
    initOrder();
    initAdmin();
    
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
