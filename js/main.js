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
            
            const adminBtn = document.querySelector('.admin-btn');
            const userInfoContainer = document.querySelector('.user-info');
            
            // Удаляем старую кнопку промокодов, если есть
            const oldPromocodesBtn = document.querySelector('.promocodes-btn');
            if (oldPromocodesBtn) {
                oldPromocodesBtn.remove();
            }

            if (adminBtn && userInfoContainer) {
                // Обработчик для кнопки управления меню
                adminBtn.addEventListener('click', (e) => {
                    if (user.email === 'admin@dismail.com') {
                        window.location.href = '/Cafe/admin.html';
                    } else {
                        alert("Доступ разрешен только администратору");
                    }
                });

                // Создаем кнопку промокодов ТОЛЬКО для админа
                if (user.email === 'admin@dismail.com') {
                    const promocodesBtn = document.createElement('button');
                    promocodesBtn.className = 'admin-btn promocodes-btn';
                    promocodesBtn.textContent = 'Управление промокодами';

                    promocodesBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        window.location.href = '/Cafe/promocodes.html';
                    });

                    // Вставляем кнопку после кнопки админ-панели
                    adminBtn.insertAdjacentElement('afterend', promocodesBtn);
                    
                    // Добавляем отступ между кнопками
                    const spacer = document.createElement('span');
                    spacer.style.marginLeft = '5px';
                    adminBtn.insertAdjacentElement('afterend', spacer);
                }
            }
        } else {
            // Удаляем кнопку промокодов при выходе
            const promocodesBtn = document.querySelector('.promocodes-btn');
            if (promocodesBtn) {
                promocodesBtn.remove();
            }
        }
    });
});
