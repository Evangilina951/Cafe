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
            const userInfoContainer = document.querySelector('.user-info');
            const adminBtn = document.querySelector('.admin-btn');
            
            // Добавляем console.log здесь (перед проверкой элементов)
            console.log('Admin button:', adminBtn);
            console.log('User info container:', userInfoContainer);
            console.log('User email:', user?.email);
            
            if (userInfoContainer && adminBtn) {
                // Обработчик для кнопки управления меню
                adminBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (user.email === 'admin@dismail.com') {
                        window.location.href = '/Cafe/admin.html';
                    } else {
                        alert("Доступ разрешен только администратору");
                    }
                });

                // Создаем кнопку управления промокодами только если её ещё нет
                if (!document.querySelector('.promocodes-btn')) {
                    const promocodesBtn = document.createElement('button');
                    promocodesBtn.className = 'admin-btn promocodes-btn';
                    promocodesBtn.textContent = 'Управление промокодами';

                    promocodesBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (user.email === 'admin@dismail.com') {
                            window.location.href = '/Cafe/promocodes.html';
                        } else {
                            alert("Доступ разрешен только администратору");
                        }
                    });

                    // Вставляем кнопку после кнопки админ-панели
                    adminBtn.insertAdjacentElement('afterend', promocodesBtn);
                    
                    // Логируем создание кнопки
                    console.log('Promocodes button created:', promocodesBtn);
                }
            }
        }
    });
});
