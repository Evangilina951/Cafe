import { db } from '/Cafe/js/firebase-config.js';
import { menuCategories, menuItems } from '/Cafe/js/menu.js';
import { currentUser } from '/Cafe/js/auth.js';

// Получаем DOM элементы
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

let activeCategoryFilter = null;

// Вспомогательные функции
function showElement(element) {
    if (element) {
        element.style.display = 'block';
        element.classList.remove('hidden');
    }
}

function hideElement(element) {
    if (element) {
        element.style.display = 'none';
        element.classList.add('hidden');
    }
}

function setupButton(selector, handler) {
    const btn = document.querySelector(selector);
    if (btn) btn.addEventListener('click', handler);
}

// Основные функции админ-панели
export function initAdmin() {
    // Проверяем, находимся ли мы на странице админ-панели
    if (!window.location.pathname.includes('admin.html')) {
        return;
    }

    if (!elements.adminPanel) {
        console.error("Admin panel element not found");
        return;
    }

    // Проверка прав администратора
    if (!currentUser || currentUser.email !== 'admin@dismail.com') {
        alert("Доступ разрешен только администратору");
        window.location.href = '/Cafe/index.html';
        return;
    }

    // Настройка обработчиков кнопок
    setupButton('.back-btn', () => {
        window.location.href = '/Cafe/index.html';
    });
    
    setupButton('.add-category-btn', () => showElement(elements.addCategoryForm));
    setupButton('.add-item-btn', () => {
        showElement(elements.addItemForm);
        resetAddItemForm();
    });
    setupButton('#add-category-btn', addCategory);
    setupButton('#add-menu-item-btn', addMenuItem);

    initIngredientsHandlers();
    loadMenuData();
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

function initIngredientsHandlers() {
    // Обработчик добавления ингредиента
    document.getElementById('add-ingredient-btn')?.addEventListener('click', function() {
        const ingredientsList = document.getElementById('ingredients-list');
        const newIngredient = document.createElement('div');
        newIngredient.className = 'ingredient-item';
        newIngredient.innerHTML = `
            <input type="text" class="ingredient-name" placeholder="Название ингредиента">
            <input type="text" class="ingredient-quantity" placeholder="Количество">
            <button class="remove-ingredient-btn">×</button>
        `;
        ingredientsList.appendChild(newIngredient);
        
        // Обработчик удаления
        newIngredient.querySelector('.remove-ingredient-btn').addEventListener('click', function() {
            this.closest('.ingredient-item').remove();
        });
    });

    // Инициализация существующих кнопок удаления
    document.querySelectorAll('.remove-ingredient-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.ingredient-item').remove();
        });
    });
}

function addMenuItem() {
    const name = elements.newItemName.value.trim();
    const price = parseInt(elements.newItemPrice.value);
    const category = elements.newItemCategory.value;
    const ingredients = getIngredientsList();

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
            hideElement(elements.addItemForm);
            resetAddItemForm();
            loadMenuData();
        })
        .catch(error => {
            console.error("Ошибка сохранения:", error);
            alert("Не удалось сохранить товар");
            menuItems.pop();
        });
}

function getIngredientsList() {
    const ingredients = [];
    document.querySelectorAll('.ingredient-item').forEach(item => {
        const name = item.querySelector('.ingredient-name')?.value.trim();
        const quantity = item.querySelector('.ingredient-quantity')?.value.trim();
        if (name && quantity) ingredients.push(`${name} ${quantity}`);
    });
    return ingredients;
}

function updateMenuInFirebase() {
    const itemsObj = {};
    menuItems.forEach(item => {
        itemsObj['item' + item.id] = item;
    });
    return db.ref('menu').update({
        categories: menuCategories,
        items: itemsObj
    });
}

function loadMenuData() {
    if (!elements.adminPanel || !elements.categoriesList || !elements.menuItemsList) return;

    // Очищаем списки
    elements.categoriesList.innerHTML = '<h3>Категории</h3>';
    elements.menuItemsList.innerHTML = '';
    elements.newItemCategory.innerHTML = '';
    elements.categoryFilter.innerHTML = '';

    // Кнопка "Все категории"
    const allBtn = document.createElement('button');
    allBtn.className = `filter-btn ${!activeCategoryFilter ? 'active' : ''}`;
    allBtn.textContent = 'Все';
    allBtn.onclick = () => {
        activeCategoryFilter = null;
        loadMenuData();
    };
    elements.categoryFilter.appendChild(allBtn);

    // Добавляем категории
    menuCategories.forEach(category => {
        // Кнопка фильтра
        const filterBtn = document.createElement('button');
        filterBtn.className = `filter-btn ${activeCategoryFilter === category ? 'active' : ''}`;
        filterBtn.textContent = category;
        filterBtn.onclick = () => {
            activeCategoryFilter = category;
            loadMenuData();
        };
        elements.categoryFilter.appendChild(filterBtn);

        // Элемент списка категорий
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <span>${category}</span>
            <button class="delete-category-btn">×</button>
        `;
        elements.categoriesList.appendChild(categoryCard);

        // Опция в выпадающем списке
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        elements.newItemCategory.appendChild(option);
    });

    // Фильтрация и отображение товаров
    const filteredItems = activeCategoryFilter
        ? menuItems.filter(item => item.category === activeCategoryFilter)
        : menuItems;

    if (filteredItems.length === 0) {
        elements.menuItemsList.innerHTML = '<p>Нет товаров в выбранной категории</p>';
        return;
    }

    filteredItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'menu-item-card';
        itemCard.dataset.id = item.id;
        itemCard.innerHTML = `
            <div class="item-main-info">
                <div class="item-category">${item.category}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-price">${item.price} ₽</div>
                ${Array.isArray(item.ingredients) && item.ingredients.length ? `
                    <div class="item-ingredients">
                        <strong>Состав:</strong>
                        <ul>
                            ${item.ingredients.map(ing => `<li>- ${ing}</li>`).join('')}
                        </ul>
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
                        ${Array.isArray(item.ingredients) ? item.ingredients.map(ing => {
                            const [name, ...quantityParts] = ing.split(' ');
                            const quantity = quantityParts.join(' ');
                            return `
                                <div class="ingredient-item">
                                    <input type="text" class="ingredient-name" value="${name}">
                                    <input type="text" class="ingredient-quantity" value="${quantity}">
                                    <button class="remove-ingredient-btn">×</button>
                                </div>
                            `;
                        }).join('') : ''}
                    </div>
                    <button class="add-edit-ingredient-btn">+ Добавить ингредиент</button>
                </div>
                
                <div class="form-actions">
                    <button class="save-edit-btn">Сохранить</button>
                    <button class="cancel-edit-btn">Отмена</button>
                </div>
            </div>
        `;
        elements.menuItemsList.appendChild(itemCard);
    });

    initAdminPanelHandlers();
}

function initAdminPanelHandlers() {
    // Удаление категории
    document.querySelectorAll('.delete-category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.previousElementSibling.textContent;
            if (confirm(`Удалить категорию "${category}"? Все товары также будут удалены.`)) {
                const categoryIndex = menuCategories.indexOf(category);
                if (categoryIndex !== -1) {
                    menuCategories.splice(categoryIndex, 1);
                    menuItems = menuItems.filter(item => item.category !== category);
                    updateMenuInFirebase().then(loadMenuData);
                }
            }
        });
    });

    // Удаление товара
    document.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = parseInt(this.closest('.menu-item-card').dataset.id);
            if (confirm('Удалить этот товар?')) {
                const itemIndex = menuItems.findIndex(item => item.id === itemId);
                if (itemIndex !== -1) {
                    menuItems.splice(itemIndex, 1);
                    updateMenuInFirebase().then(loadMenuData);
                }
            }
        });
    });

    // Редактирование товара
    document.querySelectorAll('.edit-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemCard = this.closest('.menu-item-card');
            const editForm = itemCard.querySelector('.edit-form');
            editForm.classList.toggle('hidden');
            
            // Инициализация обработчиков для формы редактирования
            const addIngredientBtn = editForm.querySelector('.add-edit-ingredient-btn');
            const ingredientsList = editForm.querySelector('.edit-ingredients-list');
            
            addIngredientBtn.addEventListener('click', () => {
                const newIngredient = document.createElement('div');
                newIngredient.className = 'ingredient-item';
                newIngredient.innerHTML = `
                    <input type="text" class="ingredient-name" placeholder="Название ингредиента">
                    <input type="text" class="ingredient-quantity" placeholder="Количество">
                    <button class="remove-ingredient-btn">×</button>
                `;
                ingredientsList.appendChild(newIngredient);
                
                newIngredient.querySelector('.remove-ingredient-btn').addEventListener('click', function() {
                    this.closest('.ingredient-item').remove();
                });
            });
            
            editForm.querySelectorAll('.remove-ingredient-btn').forEach(ingBtn => {
                ingBtn.addEventListener('click', function() {
                    this.closest('.ingredient-item').remove();
                });
            });
            
            // Обработчик сохранения
            editForm.querySelector('.save-edit-btn').addEventListener('click', function() {
                saveEditedItem(itemCard);
            });
            
            // Обработчик отмены
            editForm.querySelector('.cancel-edit-btn').addEventListener('click', function() {
                editForm.classList.add('hidden');
            });
        });
    });
}

function saveEditedItem(itemCard) {
    const itemId = parseInt(itemCard.dataset.id);
    const editForm = itemCard.querySelector('.edit-form');
    
    const category = editForm.querySelector('.edit-item-category').value;
    const name = editForm.querySelector('.edit-item-name').value.trim();
    const price = parseInt(editForm.querySelector('.edit-item-price').value);
    
    const ingredients = [];
    editForm.querySelectorAll('.ingredient-item').forEach(item => {
        const ingName = item.querySelector('.ingredient-name').value.trim();
        const ingQuantity = item.querySelector('.ingredient-quantity').value.trim();
        if (ingName && ingQuantity) {
            ingredients.push(`${ingName} ${ingQuantity}`);
        }
    });
    
    if (!name || isNaN(price) || !category || ingredients.length === 0) {
        alert('Заполните все обязательные поля и добавьте хотя бы один ингредиент!');
        return;
    }
    
    const itemIndex = menuItems.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
        menuItems[itemIndex] = {
            ...menuItems[itemIndex],
            name,
            price,
            category,
            ingredients
        };
        
        updateMenuInFirebase()
            .then(() => {
                editForm.classList.add('hidden');
                loadMenuData();
            })
            .catch(error => {
                console.error("Ошибка сохранения:", error);
                alert("Не удалось сохранить изменения");
            });
    }
}

function addCategory() {
    const name = elements.newCategoryName.value.trim();
    if (!name) {
        alert('Введите название категории');
        return;
    }

    if (!menuCategories.includes(name)) {
        menuCategories.push(name);
        db.ref('menu/categories').set(menuCategories)
            .then(() => {
                elements.newCategoryName.value = '';
                hideElement(elements.addCategoryForm);
                loadMenuData();
            })
            .catch(error => {
                console.error("Ошибка сохранения:", error);
                alert("Не удалось сохранить категорию");
            });
    } else {
        alert('Категория с таким названием уже существует');
    }
}

// Инициализация админ-панели только если мы на нужной странице
if (window.location.pathname.includes('admin.html')) {
    // Ждем проверки авторизации перед инициализацией
    const auth = (await import('/Cafe/js/firebase-config.js')).auth;
    auth.onAuthStateChanged(user => {
        if (user && user.email === 'admin@dismail.com') {
            initAdmin();
        } else {
            window.location.href = '/Cafe/index.html';
        }
    });
}
