import { initAuth, currentUser } from '/Cafe/js/auth.js';
import { loadMenuFromFirebase } from '/Cafe/js/menu.js';
import { initOrder } from '/Cafe/js/order.js';
import { initAdmin } from '/Cafe/js/admin.js';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация модулей
    initAuth();
    initOrder();
    initAdmin();
    
    // Загрузка меню только для авторизованных пользователей
    auth.onAuthStateChanged(user => {
        if (user) {
            loadMenuFromFirebase();
        }
    });

    // Обновляем CSS для формы добавления напитка
    const addItemForm = document.getElementById('add-item-form');
    if (addItemForm) {
        addItemForm.style.display = 'flex';
        addItemForm.style.flexDirection = 'column';
        addItemForm.style.gap = '10px';
    }
    
    // Проверка хэша для админ-панели
    if (window.location.hash === '#admin') {
        if (currentUser && currentUser.email === 'admin@dismail.com') {
            document.getElementById('admin-panel').style.display = 'block';
            document.getElementById('order-interface').style.display = 'none';
        }
    }
});
