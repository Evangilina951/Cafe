import { initAuth, isAdmin } from '/Cafe/js/auth.js';
import { loadMenuFromFirebase } from '/Cafe/js/menu.js';
import { initOrder } from '/Cafe/js/order.js';
import { auth } from '/Cafe/js/firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initOrder();

    // Обработчик для кнопки управления меню
    document.getElementById('menu-management-btn')?.addEventListener('click', (e) => {
        if (!isAdmin()) {
            alert("Доступ разрешен только администратору");
            e.preventDefault();
            return;
        }
        window.location.href = '/Cafe/admin.html';
    });

    // Обработчик для кнопки управления промокодами
    document.getElementById('promo-management-btn')?.addEventListener('click', (e) => {
        if (!isAdmin()) {
            alert("Доступ разрешен только администратору");
            e.preventDefault();
            return;
        }
        window.location.href = '/Cafe/admin-promocodes.html';
    });

    // Загрузка меню при авторизации
    auth.onAuthStateChanged(user => {
        if (user) {
            loadMenuFromFirebase();
            console.log('Пользователь:', user.email, 'Админ:', isAdmin());
        }
    });
});
