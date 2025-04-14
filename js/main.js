import { initAuth } from '/Cafe/js/auth.js';
import { loadMenuFromFirebase } from '/Cafe/js/menu.js';
import { initOrder } from '/Cafe/js/order.js';
import { auth } from '/Cafe/js/firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    // Инициализация модулей
    initAuth();
    initOrder();

    // Проверка авторизации и загрузка меню
    auth.onAuthStateChanged(user => {
        if (user) {
            loadMenuFromFirebase();
            
            // Настройка кнопки админ-панели
            const adminBtn = document.querySelector('.admin-btn');
            if (adminBtn) {
                adminBtn.addEventListener('click', () => {
                    if (user.email === 'admin@dismail.com') {
                        window.location.href = '/Cafe/admin.html';
                    } else {
                        alert("Доступ разрешен только администратору");
                    }
                });
            }
        }
    });

    // Стили для формы добавления напитка (если есть на странице)
    const addItemForm = document.getElementById('add-item-form');
    if (addItemForm) {
        addItemForm.style.display = 'flex';
        addItemForm.style.flexDirection = 'column';
        addItemForm.style.gap = '10px';
    }
});
