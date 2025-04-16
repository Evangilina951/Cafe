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
                // Обработчик для кнопки управления меню
                adminBtn.addEventListener('click', () => {
                    if (user.email === 'admin@dismail.com') {
                        window.location.href = '/Cafe/admin.html';
                    } else {
                        alert("Доступ разрешен только администратору");
                    }
                });

                // Создаем и настраиваем кнопку управления промокодами
                const promocodesBtn = document.createElement('button');
                promocodesBtn.className = 'admin-btn promocodes-btn';
                promocodesBtn.textContent = 'Управление промокодами';

                // Обработчик для кнопки управления промокодами
                promocodesBtn.addEventListener('click', () => {
                    if (user.email === 'admin@dismail.com') {
                        window.location.href = '/Cafe/promocodes.html';
                    } else {
                        alert("Доступ разрешен только администратору");
                    }
                });

                // Вставляем кнопку промокодов после кнопки админ-панели
                adminBtn.insertAdjacentElement('afterend', promocodesBtn);
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
