// Глобальные переменные
if (typeof menuCategories === 'undefined') window.menuCategories = [];
if (typeof menuItems === 'undefined') window.menuItems = [];
if (typeof activeCategoryFilter === 'undefined') window.activeCategoryFilter = null;
if (typeof db === 'undefined') console.error('Firebase Database не инициализирован');

// Получение DOM элементов с проверкой
function getAdminElements() {
    const elements = {
        adminPanel: document.getElementById('admin-panel'),
        backBtn: document.querySelector('.back-btn'),
        addCategoryBtn: document.querySelector('.add-category-btn'),
        addItemBtn: document.querySelector('.add-item-btn'),
        addCategoryForm: document.getElementById('add-category-form'),
        addItemForm: document.getElementById('add-item-form'),
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

    // Проверка основных элементов
    if (!elements.adminPanel) console.error('Элемент admin-panel не найден');
    if (!elements.categoriesList) console.error('Элемент categories-list не найден');
    if (!elements.menuItemsList) console.error('Элемент menu-items-list не найден');

    return elements;
}

// Главная функция инициализации
window.initAdminPanel = function() {
    const adminElements = getAdminElements();
    
    if (!adminElements.adminPanel) {
        console.error('Админ-панель не найдена в DOM');
        return;
    }

    loadMenuData(adminElements);
    initAdminEventListeners(adminElements);
};

// Загрузка данных меню
function loadMenuData(adminElements) {
    if (!adminElements.categoriesList || !adminElements.menuItemsList) return;

    // Очистка существующих элементов
    adminElements.categoriesList.innerHTML = '<h3>Категории</h3>';
    adminElements.menuItemsList.innerHTML = '';
    
    if (adminElements.newItemCategory) {
        adminElements.newItemCategory.innerHTML = '';
    }

    // Инициализация фильтра категорий
    initCategoryFilter(adminElements);

    // Загрузка категорий
    loadCategories(adminElements);

    // Загрузка элементов меню
    loadMenuItems(adminElements);
}

function initCategoryFilter(adminElements) {
    if (!adminElements.categoryFilter) return;

    adminElements.categoryFilter.innerHTML = '';
    
    // Кнопка "Все категории"
    const allFilterBtn = document.createElement('button');
    allFilterBtn.className = `filter-btn${activeCategoryFilter === null ? ' active' : ''}`;
    allFilterBtn.textContent = 'Все';
    allFilterBtn.onclick = () => {
        activeCategoryFilter = null;
        loadMenuData(adminElements);
    };
    adminElements.categoryFilter.appendChild(allFilterBtn);

    // Кнопки для каждой категории
    menuCategories.forEach(category => {
        const filterBtn = document.createElement('button');
        filterBtn.className = `filter-btn${activeCategoryFilter === category ? ' active' : ''}`;
        filterBtn.textContent = category;
        filterBtn.onclick = () => {
            activeCategoryFilter = category;
            loadMenuData(adminElements);
        };
        adminElements.categoryFilter.appendChild(filterBtn);
    });
}

function loadCategories(adminElements) {
    if (!adminElements.categoriesList || !adminElements.newItemCategory) return;

    menuCategories.forEach(category => {
        // Добавление в список категорий
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <span>${category}</span>
            <button class="delete-category-btn">×</button>
        `;
        adminElements.categoriesList.appendChild(categoryCard);

        // Добавление в выпадающий список
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        adminElements.newItemCategory.appendChild(option);
    });
}

function loadMenuItems(adminElements) {
    if (!adminElements.menuItemsList) return;

    const filteredItems = activeCategoryFilter 
        ? menuItems.filter(item => item.category === activeCategoryFilter)
        : menuItems;

    if (filteredItems.length === 0) {
        adminElements.menuItemsList.innerHTML = '<p class="no-items">Нет блюд в выбранной категории</p>';
        return;
    }

    filteredItems.forEach(item => {
        adminElements.menuItemsList.appendChild(createMenuItemCard(item));
    });

    initAdminPanelHandlers(adminElements);
}

function createMenuItemCard(item) {
    const itemCard = document.createElement('div');
    itemCard.className = 'menu-item-card';
    itemCard.dataset.id = item.id;
    
    itemCard.innerHTML = `
        <div class="item-main-info">
            ${createItemMainInfoHtml(item)}
            ${createItemActionsHtml()}
        </div>
        ${createEditFormHtml(item)}
    `;
    
    return itemCard;
}

function createItemMainInfoHtml(item) {
    return `
        <div>
            <div class="item-header">
                <h4 class="item-title">${item.name}</h4>
                <div class="item-price">${item.price} ₽</div>
            </div>
            <div class="item-category">${item.category}</div>
            ${item.ingredients?.length ? createIngredientsHtml(item.ingredients) : ''}
        </div>
    `;
}

function createIngredientsHtml(ingredients) {
    return `
        <div class="item-ingredients">
            <strong>Состав:</strong>
            <ul>
                ${ingredients.map(ing => `<li>${ing}</li>`).join('')}
            </ul>
        </div>
    `;
}

function createItemActionsHtml() {
    return `
        <div class="item-actions">
            <button class="edit-item-btn">✏️ Редактировать</button>
            <button class="delete-item-btn">× Удалить</button>
        </div>
    `;
}

function createEditFormHtml(item) {
    return `
        <div class="edit-form hidden" data-id="${item.id}">
            ${createFormGroup('Название:', `<input type="text" value="${item.name}" class="edit-name">`)}
            ${createFormGroup('Цена:', `<input type="number" value="${item.price}" class="edit-price">`)}
            ${createFormGroup('Категория:', createCategorySelectHtml(item.category))}
            ${createIngredientsFormGroup(item.ingredients)}
            <div class="form-actions">
                <button type="button" class="save-edit-btn">Сохранить</button>
                <button type="button" class="cancel-edit-btn">Отмена</button>
            </div>
        </div>
    `;
}

function createFormGroup(label, content) {
    return `
        <div class="form-group">
            <label>${label}</label>
            ${content}
        </div>
    `;
}

function createCategorySelectHtml(selectedCategory) {
    return `
        <select class="edit-category">
            ${menuCategories.map(cat => 
                `<option value="${cat}" ${cat === selectedCategory ? 'selected' : ''}>${cat}</option>`
            ).join('')}
        </select>
    `;
}

function createIngredientsFormGroup(ingredients) {
    return `
        <div class="form-group">
            <label>Состав:</label>
            <div class="edit-ingredients-list">
                ${ingredients?.map(ing => {
                    const [name, quantity] = ing.split(/(?<=\D)\s+(?=\d)/);
                    return `
                        <div class="ingredient-item">
                            <input type="text" value="${name || ''}" class="ingredient-name" placeholder="Название">
                            <input type="text" value="${quantity || ''}" class="ingredient-quantity" placeholder="Количество">
                            <button class="remove-ingredient-btn">×</button>
                        </div>
                    `;
                }).join('') || ''}
            </div>
            <button type="button" class="add-edit-ingredient-btn">+ Добавить ингредиент</button>
        </div>
    `;
}

// Инициализация обработчиков событий
function initAdminEventListeners(adminElements) {
    if (!adminElements) return;

    // Кнопка "Назад"
    if (adminElements.backBtn) {
        adminElements.backBtn.addEventListener('click', () => {
            hideElement(adminElements.adminPanel);
            showElement(document.getElementById('order-interface'));
        });
    }

    // Кнопки добавления
    if (adminElements.addCategoryBtn) {
        adminElements.addCategoryBtn.addEventListener('click', () => {
            showElement(adminElements.addCategoryForm);
            adminElements.newCategoryName?.focus();
        });
    }

    if (adminElements.addItemBtn) {
        adminElements.addItemBtn.addEventListener('click', () => {
            showElement(adminElements.addItemForm);
            resetAddItemForm(adminElements);
            adminElements.newItemName?.focus();
        });
    }

    // Кнопки подтверждения
    if (adminElements.confirmAddCategory) {
        adminElements.confirmAddCategory.addEventListener('click', () => addCategory(adminElements));
    }

    if (adminElements.confirmAddItem) {
        adminElements.confirmAddItem.addEventListener('click', () => addMenuItem(adminElements));
    }

    // Инициализация работы с ингредиентами
    initIngredientsHandlers(adminElements);
}

function initAdminPanelHandlers(adminElements) {
    // Обработчики для кнопок удаления
    document.querySelectorAll('.delete-category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.parentElement.querySelector('span')?.textContent;
            if (category) deleteCategory(category, adminElements);
        });
    });

    document.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = parseInt(this.closest('.menu-item-card')?.dataset.id);
            if (!isNaN(itemId)) deleteMenuItem(itemId, adminElements);
        });
    });

    // Обработчики для редактирования
    document.querySelectorAll('.edit-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemCard = this.closest('.menu-item-card');
            if (!itemCard) return;
            
            itemCard.querySelector('.item-main-info')?.classList.add('hidden');
            itemCard.querySelector('.edit-form')?.classList.remove('hidden');
            
            initEditFormHandlers(itemCard.querySelector('.edit-form'), adminElements);
        });
    });
}

function initEditFormHandlers(editForm, adminElements) {
    if (!editForm) return;

    // Обработчики для ингредиентов
    editForm.querySelectorAll('.remove-ingredient-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.ingredient-item')?.remove();
        });
    });

    const addBtn = editForm.querySelector('.add-edit-ingredient-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            const ingredientsList = this.previousElementSibling;
            if (!ingredientsList) return;

            const newIngredient = document.createElement('div');
            newIngredient.className = 'ingredient-item';
            newIngredient.innerHTML = `
                <input type="text" class="ingredient-name" placeholder="Название">
                <input type="text" class="ingredient-quantity" placeholder="Количество">
                <button class="remove-ingredient-btn">×</button>
            `;
            ingredientsList.appendChild(newIngredient);
            
            newIngredient.querySelector('.remove-ingredient-btn')?.addEventListener('click', function() {
                this.closest('.ingredient-item')?.remove();
            });
        });
    }

    // Обработчики сохранения/отмены
    editForm.querySelector('.cancel-edit-btn')?.addEventListener('click', function() {
        const itemCard = this.closest('.menu-item-card');
        if (!itemCard) return;
        
        itemCard.querySelector('.item-main-info')?.classList.remove('hidden');
        itemCard.querySelector('.edit-form')?.classList.add('hidden');
    });

    editForm.querySelector('.save-edit-btn')?.addEventListener('click', function() {
        const itemCard = this.closest('.menu-item-card');
        if (!itemCard) return;

        const itemId = parseInt(itemCard.dataset.id);
        if (isNaN(itemId)) return;

        const editForm = itemCard.querySelector('.edit-form');
        if (!editForm) return;

        saveItemChanges(itemId, editForm, adminElements);
    });
}

function saveItemChanges(itemId, editForm, adminElements) {
    const ingredients = [];
    editForm.querySelectorAll('.ingredient-item').forEach(item => {
        const name = item.querySelector('.ingredient-name')?.value.trim();
        const quantity = item.querySelector('.ingredient-quantity')?.value.trim();
        if (name && quantity) ingredients.push(`${name} ${quantity}`);
    });

    const updatedItem = {
        id: itemId,
        name: editForm.querySelector('.edit-name')?.value.trim() || '',
        price: parseInt(editForm.querySelector('.edit-price')?.value) || 0,
        category: editForm.querySelector('.edit-category')?.value || '',
        ingredients
    };

    const index = menuItems.findIndex(item => item.id === itemId);
    if (index !== -1) {
        menuItems[index] = updatedItem;
        updateMenuInFirebase().then(() => loadMenuData(adminElements));
    }
}

function initIngredientsHandlers(adminElements) {
    if (!adminElements.addIngredientBtn || !adminElements.ingredientsList) return;

    adminElements.addIngredientBtn.addEventListener('click', function() {
        const newIngredient = document.createElement('div');
        newIngredient.className = 'ingredient-item';
        newIngredient.innerHTML = `
            <input type="text" class="ingredient-name" placeholder="Название ингредиента">
            <input type="text" class="ingredient-quantity" placeholder="Количество">
            <button class="remove-ingredient-btn">×</button>
        `;
        adminElements.ingredientsList.appendChild(newIngredient);
        
        newIngredient.querySelector('.remove-ingredient-btn')?.addEventListener('click', function() {
            this.closest('.ingredient-item')?.remove();
        });
    });
}

function resetAddItemForm(adminElements) {
    if (!adminElements.newItemName || !adminElements.newItemPrice || !adminElements.ingredientsList) return;

    adminElements.newItemName.value = '';
    adminElements.newItemPrice.value = '';
    adminElements.ingredientsList.innerHTML = `
        <div class="ingredient-item">
            <input type="text" class="ingredient-name" placeholder="Название ингредиента">
            <input type="text" class="ingredient-quantity" placeholder="Количество">
            <button class="remove-ingredient-btn">×</button>
        </div>
    `;
}

// Работа с Firebase
function addCategory(adminElements) {
    if (!adminElements.newCategoryName) return;

    const name = adminElements.newCategoryName.value.trim();
    if (!name) {
        alert('Введите название категории');
        return;
    }

    if (!menuCategories.includes(name)) {
        menuCategories.push(name);
        updateMenuInFirebase()
            .then(() => {
                adminElements.newCategoryName.value = '';
                hideElement(adminElements.addCategoryForm);
                loadMenuData(adminElements);
            })
            .catch(error => {
                console.error("Ошибка сохранения категории:", error);
                alert("Не удалось сохранить категорию");
            });
    } else {
        alert('Категория с таким названием уже существует');
    }
}

function deleteCategory(category, adminElements) {
    if (!confirm(`Удалить категорию "${category}"? Все блюда этой категории также будут удалены.`)) {
        return;
    }

    menuItems = menuItems.filter(item => item.category !== category);
    menuCategories = menuCategories.filter(c => c !== category);

    updateMenuInFirebase()
        .then(() => loadMenuData(adminElements))
        .catch(error => {
            console.error("Ошибка удаления категории:", error);
            alert("Не удалось удалить категорию");
        });
}

function addMenuItem(adminElements) {
    if (!adminElements.newItemName || !adminElements.newItemPrice || !adminElements.newItemCategory) return;

    const name = adminElements.newItemName.value.trim();
    const price = parseInt(adminElements.newItemPrice.value);
    const category = adminElements.newItemCategory.value;

    const ingredients = [];
    adminElements.ingredientsList?.querySelectorAll('.ingredient-item').forEach(item => {
        const name = item.querySelector('.ingredient-name')?.value.trim();
        const quantity = item.querySelector('.ingredient-quantity')?.value.trim();
        if (name && quantity) ingredients.push(`${name} ${quantity}`);
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
            hideElement(adminElements.addItemForm);
            resetAddItemForm(adminElements);
            loadMenuData(adminElements);
        })
        .catch(error => {
            console.error("Ошибка сохранения блюда:", error);
            alert("Не удалось сохранить блюдо");
            menuItems = menuItems.filter(item => item.id !== newItem.id);
        });
}

function deleteMenuItem(id, adminElements) {
    if (!confirm('Удалить это блюдо?')) return;

    menuItems = menuItems.filter(item => item.id !== id);
    updateMenuInFirebase()
        .then(() => loadMenuData(adminElements))
        .catch(error => {
            console.error("Ошибка удаления блюда:", error);
            alert("Не удалось удалить блюдо");
        });
}

function updateMenuInFirebase() {
    if (!db) {
        console.error('Firebase Database не доступен');
        return Promise.reject('Firebase Database не доступен');
    }

    const itemsObj = {};
    menuItems.forEach(item => {
        itemsObj['item' + item.id] = item;
    });

    return db.ref('menu').update({
        categories: menuCategories,
        items: itemsObj
    });
}

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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('admin-panel') && typeof initAdminPanel === 'function') {
        initAdminPanel();
    }
});
