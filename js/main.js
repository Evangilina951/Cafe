import { initAuth } from '/Cafe/js/auth.js';
import { loadMenuFromFirebase } from '/Cafe/js/menu.js';
import { initOrder } from '/Cafe/js/order.js';
import { auth } from '/Cafe/js/firebase-config.js';
import { checkAdminAccess } from '/Cafe/js/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initOrder();

    auth.onAuthStateChanged(user => {
        if (user) {
            loadMenuFromFirebase();
            
            const isAdmin = user.email === 'admin@dismail.com';
            
            // Обработчик кнопки управления меню
            const menuManagementBtn = document.getElementById('menu-management-btn');
            if (menuManagementBtn) {
                menuManagementBtn.style.display = isAdmin ? 'block' : 'none';
                menuManagementBtn.addEventListener('click', () => {
                    if (isAdmin) {
                        window.location.href = '/Cafe/admin.html';
                    } else {
                        alert("Доступ разрешен только администратору");
                        window.location.href = '/Cafe/404.html';
                    }
                });
            }

            // Обработчик кнопки управления промокодами
            const promoManagementBtn = document.getElementById('promo-management-btn');
            if (promoManagementBtn) {
                promoManagementBtn.style.display = isAdmin ? 'block' : 'none';
                promoManagementBtn.addEventListener('click', () => {
                    if (isAdmin) {
                        window.location.href = '/Cafe/admin-promocodes.html';
                    } else {
                        alert("Доступ разрешен только администратору");
                        window.location.href = '/Cafe/404.html';
                    }
                });
            }
        }
    });
});
