import { initAuth, isAdmin } from '/Cafe/js/auth.js';
import { loadMenuFromFirebase } from '/Cafe/js/menu.js';
import { initOrder } from '/Cafe/js/order.js';

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initOrder();

    // Обработчики для админских кнопок
    document.getElementById('menu-management-btn')?.addEventListener('click', (e) => {
        if (!isAdmin()) {
            alert("Доступ разрешен только администратору");
            e.preventDefault();
            return;
        }
        window.location.href = '/Cafe/admin.html';
    });

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
            console.log('Текущий пользователь:', user.email); // Отладка
        }
    });
});
