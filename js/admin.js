import { db } from '/Cafe/js/firebase-config.js';
import { currentUser } from '/Cafe/js/auth.js';

// DOM элементы
const elements = {
    adminPanel: document.getElementById('admin-panel'),
    backBtn: document.querySelector('.back-btn'),
    addCategoryForm: document.getElementById('add-category-form'),
    addItemForm: document.getElementById('add-item-form'),
    newCategoryName: document.getElementById('new-category-name'),
    newItemName: document.getElementById('new-item-name'),
    newItemPrice: document.getElementById('new-item-price'),
    newItemCategory: document.getElementById('new-item-category'),
    ingredientsList: document.getElementById('ingredients-list'),
    categoriesList: document.getElementById('categories-list'),
    menuItemsList: document.getElementById('menu-items-list'),
    categoryFilter: document.getElementById('category-filter')
};

// Состояние приложения
let menuCategories = [];
let menuItems = [];
let activeCategoryFilter = null;

// Вспомогательные функции
function showElement(element) {
    element?.classList.remove('hidden');
    element?.style.removeProperty('display');
}

function hideElement(element) {
    element?.classList.add('hidden');
    element?.style.setProperty('display', 'none', 'important');
}

function setupButton(selector, handler) {
    document.querySelector(selector)?.addEventListener('click', handler);
}

// Инициализация админ-панели
export async function initAdmin() {
    if (!window.location.pathname.includes('admin.html')) return;
    if (!elements.adminPanel) return;

    // Проверка прав администратора
    if (!currentUser || currentUser.email !== 'admin@dismail.com') {
        alert("Доступ разрешен только администратору");
        window.location.href = '/Cafe/index.html';
        return;
    }

    try {
        // Загрузка данных меню
        await loadMenuDataFromFirebase();
        
        // Настройка обработчиков
        setupEventListeners();
        
        // Первоначальная загрузка интерфейса
        renderMenuInterface();
    } catch (error) {
        console.error("Ошибка инициализации:", error);
        alert("Ошибка загрузки данных меню");
    }
}

async function loadMenuDataFromFirebase() {
    try {
        const snapshot = await db.ref('menu').once('value');
        const menuData = snapshot.val() || {};
        
        menuCategories = menuData.categories || [];
        menuItems = menuData.items ? Object.values(menuData.items) : [];
        
        console.log("Данные загружены:", { menuCategories, menuItems });
    } catch (error) {
        console.error("Ошибка загрузки меню:", error);
        throw error;
    }
}

function setupEventListeners() {
    setupButton('.back-btn', () => window.location.href = '/Cafe/index.html');
    setupButton('.add-category-btn', () => showElement(elements.addCategoryForm));
    setupButton('.add-item-btn', () => {
        showElement(elements.addItemForm);
        resetAddItemForm();
    });
    setupButton('#add-category-btn', addCategory);
    setupButton('#add-menu-item-btn', addMenuItem);
}

function resetAddItemForm() {
    elements.newItemName.value = '';
    elements.newItemPrice.value = '';
    elements.ingredientsList.innerHTML = `
        <div class="ingredient-item">
            <input type="text" class="ingredient-name" placeholder="Название">
            <input type="text" class="ingredient-quantity" placeholder="Количество">
            <button class="remove-ingredient-btn">×</button>
        </div>
    `;
    setupIngredientsHandlers();
}

function setupIngredientsHandlers() {
    // Добавление ингредиента
    document.getElementById('add-ingredient-btn')?.addEventListener('click', addIngredientField);
    
    // Удаление ингредиентов
    document.querySelectorAll('.remove-ingredient-btn').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.ingredient-item')?.remove());
    });
}

function addIngredientField() {
    const newIngredient = document.createElement('div');
    newIngredient.className = 'ingredient-item';
    newIngredient.innerHTML = `
        <input type="text" class="ingredient-name" placeholder="Название">
        <input type="text" class="ingredient-quantity" placeholder="Количество">
        <button class="remove-ingredient-btn">×</button>
    `;
    elements.ingredientsList.appendChild(newIngredient);
    newIngredient.querySelector('.remove-ingredient-btn')?.addEventListener('click', 
        () => newIngredient.remove());
}

function addMenuItem() {
    const name = elements.newItemName.value.trim();
    const price = parseInt(elements.newItemPrice.value);
    const category = elements.newItemCategory.value;
    const ingredients = getIngredientsList();

    if (!name || isNaN(price) || !category || ingredients.length === 0) {
        alert('Заполните все поля и добавьте ингредиенты!');
        return;
    }

    const newItem = {
        id: Date.now(),
        name,
        price,
        category,
        ingredients
    };

    menuItems.push(newItem);
    updateMenuInFirebase()
        .then(() => {
            hideElement(elements.addItemForm);
            resetAddItemForm();
            renderMenuInterface();
        })
        .catch(error => {
            console.error("Ошибка сохранения:", error);
            alert("Не удалось сохранить товар");
            menuItems.pop();
        });
}

function getIngredientsList() {
    return Array.from(document.querySelectorAll('.ingredient-item'))
        .map(item => {
            const name = item.querySelector('.ingredient-name')?.value.trim();
            const quantity = item.querySelector('.ingredient-quantity')?.value.trim();
            return name && quantity ? `${name} ${quantity}` : null;
        })
        .filter(Boolean);
}

function updateMenuInFirebase() {
    const itemsObj = menuItems.reduce((acc, item) => {
        acc[`item${item.id}`] = item;
        return acc;
    }, {});

    return db.ref('menu').update({
        categories: menuCategories,
        items: itemsObj
    });
}

function renderMenuInterface() {
    if (!elements.categoriesList || !elements.menuItemsList) return;

    // Очистка интерфейса
    elements.categoriesList.innerHTML = '<h3>Категории</h3>';
    elements.menuItemsList.innerHTML = '';
    elements.newItemCategory.innerHTML = '';
    elements.categoryFilter.innerHTML = '';

    // Фильтр "Все категории"
    const allBtn = createFilterButton('Все', !activeCategoryFilter);
    allBtn.onclick = () => {
        activeCategoryFilter = null;
        renderMenuInterface();
    };
    elements.categoryFilter.appendChild(allBtn);

    // Отображение категорий
    menuCategories.forEach(category => {
        // Кнопка фильтра
        const filterBtn = createFilterButton(category, activeCategoryFilter === category);
        filterBtn.onclick = () => {
            activeCategoryFilter = category;
            renderMenuInterface();
        };
        elements.categoryFilter.appendChild(filterBtn);

        // Карточка категории
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <span>${category}</span>
            <button class="delete-category-btn">×</button>
        `;
        elements.categoriesList.appendChild(categoryCard);

        // Опция в select
        const option = new Option(category, category);
        elements.newItemCategory.appendChild(option);
    });

    // Отображение товаров
    const filteredItems = activeCategoryFilter
        ? menuItems.filter(item => item.category === activeCategoryFilter)
        : menuItems;

    if (filteredItems.length === 0) {
        elements.menuItemsList.innerHTML = '<p>Нет товаров в выбранной категории</p>';
    } else {
        filteredItems.forEach(item => {
            elements.menuItemsList.appendChild(createMenuItemCard(item));
        });
    }

    setupAdminPanelHandlers();
}

function createFilterButton(text, isActive) {
    const btn = document.createElement('button');
    btn.className = `filter-btn ${isActive ? 'active' : ''}`;
    btn.textContent = text;
    return btn;
}

function createMenuItemCard(item) {
    const card = document.createElement('div');
    card.className = 'menu-item-card';
    card.dataset.id = item.id;
    
    card.innerHTML = `
        <div class="item-main-info">
            <div class="item-category">${item.category}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-price">${item.price} ₽</div>
            ${item.ingredients?.length ? `
                <div class="item-ingredients">
                    <strong>Состав:</strong>
                    <ul>${item.ingredients.map(ing => `<li>- ${ing}</li>`).join('')}</ul>
                </div>
            ` : ''}
        </div>
        <div class="item-actions">
            <button class="edit-item-btn">Редактировать</button>
            <button class="delete-item-btn">Удалить</button>
        </div>
    `;
    
    return card;
}

function setupAdminPanelHandlers() {
    // Удаление категории
    document.querySelectorAll('.delete-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.previousElementSibling?.textContent;
            if (category && confirm(`Удалить категорию "${category}"?`)) {
                const index = menuCategories.indexOf(category);
                if (index !== -1) {
                    menuCategories.splice(index, 1);
                    menuItems = menuItems.filter(item => item.category !== category);
                    updateMenuInFirebase().then(renderMenuInterface);
                }
            }
        });
    });

    // Удаление товара - ИСПРАВЛЕННАЯ ВЕРСИЯ
    document.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const itemId = parseInt(btn.closest('.menu-item-card')?.dataset.id);
            if (!isNaN(itemId)) {
                const index = menuItems.findIndex(item => item.id === itemId);
                if (index !== -1 && confirm('Удалить этот товар?')) {
                    menuItems.splice(index, 1);
                    updateMenuInFirebase().then(renderMenuInterface);
                }
            }
        });
    });
}

function addCategory() {
    const name = elements.newCategoryName.value.trim();
    if (!name) return alert('Введите название категории');
    if (menuCategories.includes(name)) return alert('Категория уже существует');

    menuCategories.push(name);
    db.ref('menu/categories').set(menuCategories)
        .then(() => {
            elements.newCategoryName.value = '';
            hideElement(elements.addCategoryForm);
            renderMenuInterface();
        })
        .catch(error => {
            console.error("Ошибка сохранения:", error);
            alert("Не удалось сохранить категорию");
        });
}

// Инициализация при загрузке страницы
if (window.location.pathname.includes('admin.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const { auth } = await import('/Cafe/js/firebase-config.js');
            auth.onAuthStateChanged(user => {
                if (user?.email === 'admin@dismail.com') {
                    initAdmin();
                } else {
                    window.location.href = '/Cafe/index.html';
                }
            });
        } catch (error) {
            console.error("Ошибка инициализации Firebase:", error);
        }
    });
}
