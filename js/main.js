import { initAuth, isAdmin } from '/Cafe/js/auth.js';
import { loadMenuFromFirebase } from '/Cafe/js/menu.js';
import { initOrder } from '/Cafe/js/order.js';
import { auth } from '/Cafe/js/firebase-config.js'; // Добавлен импорт auth

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initOrder();

    document.getElementById('menu-management-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (!isAdmin()) {
            alert("Доступ разрешен только администратору");
            return;
        }
        
        window.location.href = '/Cafe/admin.html';
    });

    document.getElementById('promo-management-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        
        if (!isAdmin()) {
            alert("Доступ разрешен только администратору");
            return;
        }
        
        window.location.href = '/Cafe/admin-promocodes.html';
    });

    // Исправленный обработчик с использованием импортированного auth
    auth.onAuthStateChanged(user => {
        if (user) {
            loadMenuFromFirebase();
            console.log('User:', user.email, 'Admin:', isAdmin());
        }
    });
});
