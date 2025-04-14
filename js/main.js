import { initAuth, checkAdminAccess, currentUser } from '/Cafe/js/auth.js';
import { loadMenuFromFirebase } from '/Cafe/js/menu.js';
import { initOrder } from '/Cafe/js/order.js';
import { auth } from '/Cafe/js/firebase-config.js';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация модулей
    initAuth();
    initOrder();
    
    // Обработка авторизации
    auth.onAuthStateChanged(user => {
        if (!user) return;
        
        loadMenuFromFirebase();
        
        // Проверка и обработка административного доступа
        handleAdminAccess(user);
    });
});

// Обработка административного доступа
function handleAdminAccess(user) {
    const isAdmin = checkAdminAccess();
    console.log(`Пользователь ${user.email} - администратор: ${isAdmin}`); // Логирование
    
    // Управление кнопками админ-панели
    const adminButtons = [
        'menu-management-btn',
        'promo-management-btn'
    ];
    
    adminButtons.forEach(btnId => {
        const button = document.getElementById(btnId);
        if (!button) return;
        
        button.style.display = isAdmin ? 'block' : 'none';
        
        // Удаляем старые обработчики перед добавлением новых
        button.replaceWith(button.cloneNode(true));
        const newButton = document.getElementById(btnId);
        
        newButton.addEventListener('click', (e) => {
            e.preventDefault();
            handleAdminButtonClick(btnId, isAdmin);
        });
    });
}

// Обработка клика по кнопкам админ-панели
function handleAdminButtonClick(buttonId, isAdmin) {
    if (!isAdmin) {
        alert("Доступ разрешен только администратору");
        window.location.href = '/Cafe/404.html';
        return;
    }
    
    const adminPages = {
        'menu-management-btn': '/Cafe/admin.html',
        'promo-management-btn': '/Cafe/admin-promocodes.html'
    };
    
    if (adminPages[buttonId]) {
        window.location.href = adminPages[buttonId];
    } else {
        console.error('Неизвестная кнопка админ-панели:', buttonId);
    }
}

// Глобально доступные функции для отладки
window.debugAuth = () => {
    console.log('Текущий пользователь:', currentUser);
    console.log('Это админ?', checkAdminAccess());
};
