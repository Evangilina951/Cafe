import { db } from '/Cafe/js/firebase-config.js';
import { currentUser } from '/Cafe/js/auth.js';
import { addToOrder } from '/Cafe/js/order.js';

let menuCategories = [];
let menuItems = [];
let isLoadingMenu = true;
let activeCategoryFilter = null;

// DOM элементы
const elements = {
    menuColumns: document.getElementById('menu-columns'),
    categoryFilter: document.getElementById('category-filter')
};

// Загрузка меню из Firebase
export function loadMenuFromFirebase() {
    isLoadingMenu = true;
    updateMainMenu();
    
    const menuRef = db.ref('menu');
    
    menuRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            menuCategories = data.categories || [];
            menuItems = data.items ? Object.values(data.items) : [];
            isLoadingMenu = false;
            updateMainMenu();
        } else {
            initializeMenuData();
        }
    }, (error) => {
        console.error("Ошибка загрузки меню:", error);
        isLoadingMenu = false;
        updateMainMenu();
    });
}

function initializeMenuData() {
    const initialData = {
        categories: ["Кофе", "Чай", "Десерты"],
        items: {
            item1: { id: 1, name: "Кофе", price: 100, category: "Кофе", ingredients: ["Арабика 1", "Вода 2"] },
            item2: { id: 2, name: "Чай", price: 50, category: "Чай", ingredients: ["Чайные листья 1", "Вода 2"] },
            item3: { id: 3, name: "Капучино", price: 150, category: "Кофе", ingredients: ["Эспрессо 1", "Молоко 2", "Пена 1"] },
            item4: { id: 4, name: "Латте", price: 200, category: "Кофе", ingredients: ["Эспрессо 1", "Молоко 3"] }
        }
    };
    
    db.ref('menu').set(initialData)
        .then(() => {
            menuCategories = initialData.categories;
            menuItems = Object.values(initialData.items);
            isLoadingMenu = false;
            updateMainMenu();
        })
        .catch(error => {
            console.error("Ошибка инициализации меню:", error);
            isLoadingMenu = false;
            updateMainMenu();
        });
}

function updateMainMenu() {
    if (!elements.menuColumns) return;
    
    if (isLoadingMenu) {
        elements.menuColumns.innerHTML = '<div class="menu-loading">Загрузка меню...</div>';
        return;
    }
    
    if (menuItems.length > 0) {
        elements.menuColumns.innerHTML = '';
        
        // Группируем блюда по категориям
        const itemsByCategory = {};
        menuItems.forEach(item => {
            if (!itemsByCategory[item.category]) {
                itemsByCategory[item.category] = [];
            }
            itemsByCategory[item.category].push(item);
        });
        
        // Создаем колонки для каждой категории
        Object.keys(itemsByCategory).forEach(category => {
            const column = document.createElement('div');
            column.className = 'menu-column';
            
            const title = document.createElement('h3');
            title.className = 'category-title';
            title.textContent = category;
            column.appendChild(title);
            
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'menu-buttons';
            
            itemsByCategory[category].forEach(item => {
                const btn = document.createElement('button');
                btn.className = 'menu-btn';
                btn.innerHTML = `
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">${item.price} ₽</div>
                `;
                btn.onclick = () => addToOrder(item.name, item.price);
                buttonsContainer.appendChild(btn);
            });
            
            column.appendChild(buttonsContainer);
            elements.menuColumns.appendChild(column);
        });
    } else {
        elements.menuColumns.innerHTML = '<div class="menu-error">Ошибка: Меню не загружено</div>';
    }
}

export { menuCategories, menuItems };

window.menuCategories = menuCategories;
window.menuItems = menuItems;
