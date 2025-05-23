import { db } from '/Cafe/js/firebase-config.js';
import { currentUser } from '/Cafe/js/auth.js';
import { addToOrder } from '/Cafe/js/order.js';

let menuCategories = [];
let menuItems = [];
let isLoadingMenu = true;
let activeCategoryFilter = null;
let searchQuery = '';

// DOM элементы
const elements = {
    menuColumns: document.getElementById('menu-columns'),
    categoryFilter: document.getElementById('category-filter'),
    searchInput: document.getElementById('menu-search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn')
};

// Инициализация поиска
function initSearch() {
    if (elements.searchInput && elements.clearSearchBtn) {
        elements.searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            updateMainMenu();
        });

        elements.clearSearchBtn.addEventListener('click', () => {
            elements.searchInput.value = '';
            searchQuery = '';
            updateMainMenu();
        });
    }
}

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
            item1: { id: 1, name: "Кофе", price: 100, category: "Кофе", ingredients: ["Арабика 1", "Вода 2"], visible: true },
            item2: { id: 2, name: "Чай", price: 50, category: "Чай", ingredients: ["Чайные листья 1", "Вода 2"], visible: true },
            item3: { id: 3, name: "Капучино", price: 150, category: "Кофе", ingredients: ["Эспрессо 1", "Молоко 2", "Пена 1"], visible: true },
            item4: { id: 4, name: "Латте", price: 200, category: "Кофе", ingredients: ["Эспрессо 1", "Молоко 3"], visible: true }
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
    
    if (menuItems.length === 0) {
        elements.menuColumns.innerHTML = '<div class="menu-error">Ошибка: Меню не загружено</div>';
        return;
    }

    elements.menuColumns.innerHTML = '';
    let visibleItems = menuItems.filter(item => item.visible !== false);
    
    // Фильтрация по поисковому запросу
       if (searchQuery) {
        visibleItems = visibleItems.filter(item => 
            item.name.toLowerCase().includes(searchQuery)
        );
    }

    if (visibleItems.length === 0) {
        elements.menuColumns.innerHTML = '<div class="menu-error">Ничего не найдено</div>';
        return;
    }

    // Группируем блюда по категориям
    const itemsByCategory = {};
    visibleItems.forEach(item => {
        if (!itemsByCategory[item.category]) {
            itemsByCategory[item.category] = [];
        }
        itemsByCategory[item.category].push(item);
    });
    
    // Получаем уникальные категории
    const categories = Object.keys(itemsByCategory);
    
    // Создаем строки по 5 категорий в каждой
    for (let i = 0; i < categories.length; i += 5) {
        const rowCategories = categories.slice(i, i + 5);
        
        const row = document.createElement('div');
        row.className = 'menu-row';
        
        // Создаем ровно 5 колонок в каждой строке
        for (let j = 0; j < 5; j++) {
            const column = document.createElement('div');
            column.className = 'menu-column';
            
            if (j < rowCategories.length) {
                const category = rowCategories[j];
                const title = document.createElement('h3');
                title.className = 'category-title';
                title.textContent = category;
                column.appendChild(title);
                
                const buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'menu-buttons';
                
                itemsByCategory[category].forEach(item => {
                    const btn = document.createElement('button');
                    btn.className = 'menu-btn';
                    
                    // Подсветка совпадений в названии
                    let highlightedName = item.name;
                    if (searchQuery) {
                        const regex = new RegExp(searchQuery, 'gi');
                        highlightedName = item.name.replace(regex, 
                            match => `<span class="highlight">${match}</span>`);
                    }
                    
                    btn.innerHTML = `
                        <div class="item-name">${highlightedName}</div>
                        <div class="item-price">${item.price} ₽</div>
                    `;
                    btn.onclick = () => addToOrder(item.name, item.price);
                    buttonsContainer.appendChild(btn);
                });
                
                column.appendChild(buttonsContainer);
            } else {
                // Пустая колонка для выравнивания
                column.style.visibility = 'hidden';
            }
            
            row.appendChild(column);
        }
        
        elements.menuColumns.appendChild(row);
    }
}

// Инициализация при загрузке
initSearch();

export { menuCategories, menuItems };

window.menuCategories = menuCategories;
window.menuItems = menuItems;
