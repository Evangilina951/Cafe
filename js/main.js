import { initAuth, isAdmin } from '/Cafe/js/auth.js';
import { loadMenuFromFirebase } from '/Cafe/js/menu.js';
import { initOrder } from '/Cafe/js/order.js';

document.addEventListener('DOMContentLoaded', () => {
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
        if (user) {
            loadMenuFromFirebase();
        }
    });
});
