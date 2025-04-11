import { db } from '/Cafe/js/firebase-config.js';
import { menuCategories, menuItems, loadMenuFromFirebase } from '/Cafe/js/menu.js';
import { currentUser } from '/Cafe/js/auth.js';

const adminPanel = document.getElementById('admin-panel');
const orderInterface = document.getElementById('order-interface');
const addCategoryForm = document.getElementById('add-category-form');
const addItemForm = document.getElementById('add-item-form');

let activeCategoryFilter = null;

// DOM элементы
const elements = {
    adminPanel: document.getElementById('admin-panel'),
    adminBtn: document.querySelector('.admin-btn'),
    backBtn: document.querySelector('.back-btn'),
    addCategoryBtn: document.querySelector('.add-category-btn'),
    addItemBtn: document.querySelector('.add-item-btn'),
    addCategoryForm: document.getElementById('add-category-form'),
    addItemForm: document.getElementById 'add-item-form'),
    newCategoryName: document.getElementById('new-category-name'),
    newItemName: document.getElementById('new-item-name'),
    newItemPrice: document.getElementById('new-item-price'),
    newItemCategory: document.getElementById('new-item-category'),
    confirmAddCategory: document.getElementById('add-category-btn'),
    confirmAddItem: document.getElementById('add-menu-item-btn'),
    categoriesList: document.getElementById('categories-list'),
    menuItemsList: document.getElementById('menu-items-list'),
    ingredientsList: document.getElementById('ingredients-list'),
    addIngredientBtn: document.getElementById('add-ingredient-btn'),
    categoryFilter: document.getElementById('category-filter')
};

// Инициализация админ-панели
export function initAdmin() {
    console.log("initAdmin вызвана"); // Логирование
    if (!adminPanel) return;

    const adminBtn = document.querySelector('.admin-btn');
    if (adminBtn) {
        console.log("Кнопка 'Управление меню' найдена"); // Логирование
        adminBtn.addEventListener('click', showAdminPanel);
    } else {
        console.error("Кнопка 'Управление меню' не найдена"); // Логирование
    }

    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', hideAdminPanel);
    }

    // Обработчики для кнопок
    document.querySelector('.add-category-btn')?.addEventListener('click', () => {
        addCategoryForm.style.display = 'block';
    });
    document.querySelector('.add-item-btn')?.addEventListener('click', () => {
        addItemForm.style.display = 'block';
        resetAddItemForm();
    });
    document.getElementById('add-category-btn')?.addEventListener('click', addCategory);
    document.getElementById('add-menu-item-btn')?.addEventListener('click', addMenuItem);

    // Обработчики для элементов из объекта elements
    if (elements.adminBtn) {
        elements.adminBtn.addEventListener('click', showAdminPanel);
    }
    if (elements.backBtn) {
        elements.backBtn.addEventListener('click', hideAdminPanel);
    }
    if (elements.addCategoryBtn) {
        elements.addCategoryBtn.addEventListener('click', () => {
            elements.addCategoryForm.style.display = 'block';
        });
    }
    if (elements.addItemBtn) {
        elements.addItemBtn.addEventListener('click', () => {
            elements.addItemForm.style.display = 'block';
            resetAddItemForm();
        });
    }
    if (elements.confirmAddCategory) {
        elements.confirmAddCategory.addEventListener('click', addCategory);
    }
    if (elements.confirmAddItem) {
        elements.confirmAddItem.addEventListener('click', addMenuItem);
    }

    // Инициализация обработчиков ингредиентов
    initIngredientsHandlers();
}

function resetAddItemForm() {
    elements.newItemName.value = '';
    elements.newItemPrice.value = '';
    
    elements.ingredientsList.innerHTML = `
        <div class="ingredient-item">
            <input type="text" class="ingredient-name" placeholder="Название ингредиента">
            <input type="text" class="ingredient-quantity" placeholder="Количество">
            <button class="remove-ingredient-btn">×</button>
        </div>
    `;
    
    initIngredientsHandlers();
}

function addMenuItem() {
    const name = elements.newItemName.value.trim();
    const price = parseInt(elements.newItemPrice.value);
    const category = elements.newItemCategory.value;
    
    const ingredients = [];
    const ingredientItems = document.querySelectorAll('#ingredients-list .ingredient-item');
    ingredientItems.forEach(item => {
        const name = item.querySelector('.ingredient-name').value.trim();
        const quantity = item.querySelector('.ingredient-quantity').value.trim();
        if (name && quantity) {
            ingredients.push(`${name} ${quantity}`);
        }
    });

    if (!name || isNaN(price) || !category || ingredients.length === 0) {
        alert('Заполните все обязательные поля и добавьте хотя бы один ингредиент!');
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
            elements.addItemForm.style.display = 'none';
            resetAddItemForm();
            loadMenuData();
        })
        .catch(error => {
            console.error("Ошибка сохранения напитка:", error);
            alert("Не удалось сохранить напиток");
            menuItems = menuItems.filter(item => item.id !== newItem.id);
        });
}

function updateMenuInFirebase() {
    const itemsObj = {};
    menuItems.forEach item => {
        itemsObj['item' + item.id] = item;
    });
    
    return db.ref('menu').update({
        categories: menuCategories,
        items: itemsObj
    });
}

function initIngredientsHandlers() {
    if (elements.addIngredientBtn) {
        elements.addIngredientBtn.addEventListener('click', function() {
            const newIngredient = document.createElement('div');
            newIngredient.className = 'ingredient-item';
            newIngredient.innerHTML = `
                <input type="text" class="ingredient-name" placeholder="Название ингредиента">
                <input type="text" class="ingredient-quantity" placeholder="Количество">
                <button class="removeIngredient-btn">×</button>
            `;
            elements.ingredientsList.appendChild newIngredient);
            
            newIngredient.querySelector('.removeIngredient-btn').addEventListener('click', function() {
                elements.ingredientsList.removeChild newIngredient);
            });
        });
    }
    
    document.querySelectorAll '.remove-ingredient-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const ingredientItem = this.closest '.ingredient-item');
            if (ingredientItem && ingredientItem.parentNode) {
                ingredientItem.parentNode.removeChild ingredientItem);
            }
        });
    });
}

function loadMenuData() {
    if (!adminPanel || adminPanel.classList.contains('hidden')) return;
    
    const categoriesList = document.getElementById 'categories-list');
    const itemsList document.getElementById('menu-items-list');
    const categorySelect = document.getElementById('new-item-category');
    const categoryFilter = document.getElementById('category-filter');
    
    if (!categoriesList || !itemsList || !categorySelect || !categoryFilter) return;
    
    // Загрузка категорий
    categoriesList.innerHTML = '<h3 style="margin-bottom: 20px; text-align: center;">Категории</h3>';
    itemsList.innerHTML = '<h3 style="margin-bottom: 20px; text-align: center;">Блюда</h3>';
    categorySelect.innerHTML = '';
    categoryFilter.innerHTML = '';
    
    // Кнопка "Все категории"
    const allFilterBtn = document.createElement('button');
    allFilterBtn.className = 'filter-btn' + activeCategoryFilter === null ? ' active' : '');
    allFilterBtn.textContent = 'Все';
    allFilterBtn.onclick = () => {
        activeCategoryFilter = null;
        loadMenuData();
    };
    categoryFilter.appendChild(allFilterBtn);
    
    // Кнопки для каждой категории
    menuCategories.forEach(category => {
        // Добавляем в фильтр
        const filterBtn = document.createElement('button');
        filterBtn.className = 'filter-btn' + activeCategoryFilter === category ? ' active' : '');
        filterBtn.textContent = category;
        filterBtn.onclick = () => {
            activeCategoryFilter = category;
            loadMenuData();
        };
        categoryFilter.appendChild(filterBtn);
        
        // Добавляем в список категорий
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <span>${category}</span>
            <button class="delete-category-btn">×</button>
        `;
        categoriesList.appendChild(categoryCard);
        
        // Добавляем в выпадающий список
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // Фильтрация блюд
    const filteredItems = activeCategoryFilter 
        ? menuItems.filter(item => item.category === activeCategoryFilter)
        : menuItems;
    
    // Загрузка bлюд
    if (filteredItems.length === 0) {
        itemsList.innerHTML += '<p>Нет блюд в выбранной категории</p>';
        return;
    }
    
    filteredItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'menu-item-card';
        itemCard.dataset.id = item.id;
        
        let ingredientsHtml = '';
        if (item.ingredients && item.ingredients.length > 0) {
            ingredientsHtml = `
                <div class="item-ingredients">
                    <strong>Состав:</strong>
                    <ul>
                        ${item.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        
        itemCard.innerHTML = `
            <div class="item-main-info">
                <div>
                    <strong>${item.name}</strong>
                    <div class="item-category">${item.category}</div>
                    <div class="item-price">${item.price} ₽</div>
                    ${ingredientsHtml}
                </div>
                <div class="item-actions">
                    <button class="edit-item-btn">✏️</button>
                    <button class="delete-item-btn">×</button>
                </div>
            </div>
            <div class="edit-form hidden" data-id="${item.id}">
                <div class="form-group">
                    <label>Название:</label>
                    <input type="text value="${item.name}" class="edit-name">
                </div>
                <div class="form-group">
                    <label>Цена:</label>
                    <input type="number" value="${item.price}" class="edit-price">
                </div>
                <div class="form-group">
                    <label>Категория:</label>
                    <select class="edit-category">
                        ${menuCategories.map(cat => 
                            `<option value="${cat}" ${cat === item.category ? 'selected' : ''}>${cat}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <h4>Состав:</h4>
                    <div class="edit-ingredients-list">
                        ${item.ingredients ? item.ingredients.map((ing, idx) => {
                            const [name, quantity] = ing.split(/(?<=\D)\s+(?=\d)/);
                            return `
                                <div class="ingredient-item">
                                    <input type="text" value="${name || ''}" class="ingredient-name" placeholder="Название">
                                    <input type="text" value="${quantity || ''}" class="ingredient-quantity" placeholder="Количество">
                                    <button class="remove-ingredient-btn">×</button>
                                </div>
                            `;
                        }).join('') : ''}
                    </div>
                    <button type="button" class="add-edit-ingredient-btn">+ Добавить ингредиент</button>
                </div>
                <div class="form-actions">
                    <button type="button" class="save-edit-btn">Сохранить</button>
                    <button type="button" class="cancel-edit-btn">Отмена</button>
                </div>
            </div>
        `);
        
        itemsList.appendChild(itemCard);
    });
    
    initAdminPanelHandlers();
}

function initAdminPanelHandlers() {
    document.querySelectorAll('.delete-dropdown-btn').forEach(btn => {
        btn.addEventListener(`click`, function() {
            const category = this.parentElement.querySelector('span').textContent;
            deleteCategory(category);
        });
    });
    
    document.querySelectorAll('.delete-menu-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = parseInt(this.closest('.menu-item-card').dataset.id);
            deleteMenuItem(id);
        });
    });
    
    document.querySelectorAll('.edit-dropdown-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemCard = this.closest('.menu-item-card');
            itemCard.querySelector('.item-control-info').classList.add('hidden');
            itemCard.querySelector('.edit-dropdown').classList.remove(`${class}` +
                '-hidden');
            
            initEditFormHandlers(itemCard.querySelector('.edit-dropdown'));
});
