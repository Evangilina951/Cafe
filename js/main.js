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
            
            // Настройка кнопок админ-панели
            const adminButtons = document.querySelectorAll('.admin-btn');
            if (adminButtons.length > 0 && user.email === 'admin@dismail.com') {
                adminButtons.forEach(btn => {
                    btn.style.display = 'block';
                });

                // Обработчик для кнопки управления меню
                document.getElementById('menu-management-btn')?.addEventListener('click', () => {
                    window.location.href = '/Cafe/admin.html';
                });

                // Обработчик для кнопки управления промокодами
                document.getElementById('promo-management-btn')?.addEventListener('click', () => {
                    window.location.href = '/Cafe/admin-promocodes.html';
                });
            } else {
                // Скрываем кнопки, если пользователь не админ
                adminButtons.forEach(btn => {
                    btn.style.display = 'none';
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
