import { initAuth, isAdmin } from '/Cafe/js/auth.js';
import { loadMenuFromFirebase } from '/Cafe/js/menu.js';
import { initOrder } from '/Cafe/js/order.js';
import { auth } from '/Cafe/js/firebase-config.js'; // Импортируем auth

document.addEventListener('DOMContentLoaded', () => {
    // Инициализация модулей
    initAuth();
    initOrder();

    // Обработчик кнопки управления меню
    document.getElementById('menu-management-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (!isAdmin()) {
            alert("Доступ разрешен только администратору");
            return;
        }
        window.location.href = '/Cafe/admin.html';
    });

    // Обработчик кнопки управления промокодами
    document.getElementById('promo-management-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (!isAdmin()) {
            alert("Доступ разрешен только администратору");
            return;
        }
        window.location.href = '/Cafe/admin-promocodes.html';
    });

    // Загрузка меню при изменении состояния аутентификации
    auth.onAuthStateChanged(user => {
        console.log('Auth state changed:', user);
        if (user) {
            console.log('User logged in, loading menu...');
            loadMenuFromFirebase().catch(error => {
                console.error('Menu loading error:', error);
            });
        }
    });
}); 
