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
        ingredients: ingredients // гарантируем наличие массива
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
    
    // Проверяем наличие ингредиентов и устанавливаем пустой массив, если их нет
    const ingredients = item.ingredients || [];
    
    card.innerHTML = `
        <div class="item-main-info">
            <div class="item-category">${item.category}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-price">${item.price} ₽</div>
            ${ingredients.length ? `
                <div class="item-ingredients">
                    <strong>Состав:</strong>
                    <ul>${ingredients.map(ing => `<li>- ${ing}</li>`).join('')}</ul>
                </div>
            ` : ''}
        </div>
        <div class="item-actions">
            <button class="edit-item-btn">Редактировать</button>
            <button class="delete-item-btn">Удалить</button>
        </div>
        
        <!-- Форма редактирования -->
        <div class="edit-form hidden">
            <div class="form-group">
                <label>Категория</label>
                <select class="edit-item-category">
                    ${menuCategories.map(cat => 
                        `<option value="${cat}" ${cat === item.category ? 'selected' : ''}>${cat}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label>Название</label>
                <input type="text" class="edit-item-name" value="${item.name}">
            </div>
            
            <div class="form-group">
                <label>Цена</label>
                <input type="number" class="edit-item-price" value="${item.price}">
            </div>
            
            <div class="form-group">
                <label>Состав:</label>
                <div class="edit-ingredients-list">
                    ${ingredients.map(ing => {
                        const [name, ...quantityParts] = ing.split(' ');
                        const quantity = quantityParts.join(' ');
                        return `
                            <div class="ingredient-item">
                                <input type="text" class="ingredient-name" value="${name}">
                                <input type="text" class="ingredient-quantity" value="${quantity}">
                                <button class="remove-ingredient-btn">×</button>
                            </div>
                        `;
                    }).join('')}
                </div>
                <button class="add-edit-ingredient-btn">+ Добавить ингредиент</button>
            </div>
            
            <div class="form-actions">
                <button class="save-edit-btn">Сохранить</button>
                <button class="cancel-edit-btn">Отмена</button>
            </div>
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

    // Удаление товара
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

    // Редактирование товара
    document.querySelectorAll('.edit-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemCard = this.closest('.menu-item-card');
            const editForm = itemCard.querySelector('.edit-form');
            
            // Переключаем видимость формы
            editForm.classList.toggle('hidden');
            
            // Инициализация обработчиков для формы редактирования
            const addIngredientBtn = editForm.querySelector('.add-edit-ingredient-btn');
            const ingredientsList = editForm.querySelector('.edit-ingredients-list');
            
            // Обработчик добавления ингредиента
            addIngredientBtn.addEventListener('click', () => {
                const newIngredient = document.createElement('div');
                newIngredient.className = 'ingredient-item';
                newIngredient.innerHTML = `
                    <input type="text" class="ingredient-name" placeholder="Название">
                    <input type="text" class="ingredient-quantity" placeholder="Количество">
                    <button class="remove-ingredient-btn">×</button>
                `;
                ingredientsList.appendChild(newIngredient);
                
                // Обработчик удаления ингредиента
                newIngredient.querySelector('.remove-ingredient-btn').addEventListener('click', function() {
                    this.closest('.ingredient-item').remove();
                });
            });
            
            // Обработчики для существующих кнопок удаления
            editForm.querySelectorAll('.remove-ingredient-btn').forEach(ingBtn => {
                ingBtn.addEventListener('click', function() {
                    this.closest('.ingredient-item').remove();
                });
            });
            
            // Сохранение изменений
            editForm.querySelector('.save-edit-btn').addEventListener('click', () => {
                saveEditedItem(itemCard);
            });
            
            // Отмена редактирования
            editForm.querySelector('.cancel-edit-btn').addEventListener('click', () => {
                editForm.classList.add('hidden');
            });
        });
    });
}

function saveEditedItem(itemCard) {
    const itemId = parseInt(itemCard.dataset.id);
    const editForm = itemCard.querySelector('.edit-form');
    
    // Получаем новые значения
    const category = editForm.querySelector('.edit-item-category').value;
    const name = editForm.querySelector('.edit-item-name').value.trim();
    const price = parseInt(editForm.querySelector('.edit-item-price').value);
    
    // Получаем список ингредиентов
    const ingredients = [];
    editForm.querySelectorAll('.ingredient-item').forEach(item => {
        const ingName = item.querySelector('.ingredient-name').value.trim();
        const ingQuantity = item.querySelector('.ingredient-quantity').value.trim();
        if (ingName && ingQuantity) {
            ingredients.push(`${ingName} ${ingQuantity}`);
        }
    });
    
    // Валидация
    if (!name || isNaN(price) || !category || ingredients.length === 0) {
        alert('Заполните все обязательные поля и добавьте хотя бы один ингредиент!');
        return;
    }
    
    // Обновляем данные
    const itemIndex = menuItems.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
        menuItems[itemIndex] = {
            ...menuItems[itemIndex],
            name,
            price,
            category,
            ingredients
        };
        
        // Сохраняем в Firebase
        updateMenuInFirebase()
            .then(() => {
                editForm.classList.add('hidden');
                renderMenuInterface();
            })
            .catch(error => {
                console.error("Ошибка сохранения:", error);
                alert("Не удалось сохранить изменения");
            });
    }
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
