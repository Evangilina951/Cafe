import { db } from '/Cafe/js/firebase-config.js';
import { currentUser } from '/Cafe/js/auth.js';

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

let menuCategories = [];
let menuItems = [];
let activeCategoryFilter = null;

function showElement(element) {
    element?.classList.remove('hidden');
}

function hideElement(element) {
    element?.classList.add('hidden');
}

function setupButton(selector, handler) {
    document.querySelector(selector)?.addEventListener('click', handler);
}

export async function initAdmin() {
    if (!window.location.pathname.includes('admin.html')) return;
    if (!elements.adminPanel) return;

    if (!currentUser || currentUser.email !== 'admin@dismail.com') {
        alert("Доступ разрешен только администратору");
        window.location.href = '/Cafe/index.html';
        return;
    }

    try {
        await loadMenuDataFromFirebase();
        setupEventListeners();
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
            <input type="number" class="ingredient-quantity" placeholder="Количество" min="0.1" step="0.1" value="1">
            <button class="remove-ingredient-btn">×</button>
        </div>
    `;
    setupIngredientsHandlers();
}

function setupIngredientsHandlers() {
    // Удаляем старые обработчики перед добавлением новых
    const addBtn = document.getElementById('add-ingredient-btn');
    addBtn?.replaceWith(addBtn.cloneNode(true));
    
    document.getElementById('add-ingredient-btn')?.addEventListener('click', function() {
        const newIngredient = document.createElement('div');
        newIngredient.className = 'ingredient-item';
        newIngredient.innerHTML = `
            <input type="text" class="ingredient-name" placeholder="Название">
            <input type="number" class="ingredient-quantity" placeholder="Количество" min="0.1" step="0.1" value="1">
            <button class="remove-ingredient-btn">×</button>
        `;
        elements.ingredientsList.appendChild(newIngredient);
        
        // Добавляем обработчик удаления для нового ингредиента
        newIngredient.querySelector('.remove-ingredient-btn').addEventListener('click', function() {
            newIngredient.remove();
        });
    });

    // Обработчики для существующих кнопок удаления
    document.querySelectorAll('.remove-ingredient-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.ingredient-item')?.remove();
        });
    });
}

function addIngredientField() {
    const newIngredient = document.createElement('div');
    newIngredient.className = 'ingredient-item';
    newIngredient.innerHTML = `
        <input type="text" class="ingredient-name" placeholder="Название">
        <input type="number" class="ingredient-quantity" placeholder="Количество" min="0.1" step="0.1" value="1">
        <button class="remove-ingredient-btn">×</button>
    `;
    elements.ingredientsList.appendChild(newIngredient);
    
    // Добавляем обработчик удаления для нового ингредиента
    newIngredient.querySelector('.remove-ingredient-btn').addEventListener('click', function() {
        newIngredient.remove();
    });
}

function addMenuItem() {
    const name = elements.newItemName.value.trim();
    const price = parseInt(elements.newItemPrice.value);
    const category = elements.newItemCategory.value;
    const ingredients = getIngredientsList();

    if (!name || isNaN(price) || !category || ingredients.length === 0) {
        alert('Заполните все поля!');
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
            const quantity = item.querySelector('.ingredient-quantity')?.value;
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

    elements.categoriesList.innerHTML = '<h3>Категории</h3>';
    elements.menuItemsList.innerHTML = '';
    elements.newItemCategory.innerHTML = '';
    elements.categoryFilter.innerHTML = '';

    const allBtn = createFilterButton('Все', !activeCategoryFilter);
    allBtn.onclick = () => {
        activeCategoryFilter = null;
        renderMenuInterface();
    };
    elements.categoryFilter.appendChild(allBtn);

    menuCategories.forEach(category => {
        const filterBtn = createFilterButton(category, activeCategoryFilter === category);
        filterBtn.onclick = () => {
            activeCategoryFilter = category;
            renderMenuInterface();
        };
        elements.categoryFilter.appendChild(filterBtn);

        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <span class="category-name">${category}</span>
            <div class="category-actions">
                <button class="edit-category-btn" title="Редактировать">✏️</button>
                <button class="delete-category-btn" title="Удалить">×</button>
            </div>
            <div class="edit-category-form hidden">
                <input type="text" class="edit-category-input" value="${category}">
                <div class="category-form-actions">
                    <button class="save-category-btn">Сохранить</button>
                    <button class="cancel-category-btn">×</button>
                </div>
            </div>
        `;
        elements.categoriesList.appendChild(categoryCard);

        const option = new Option(category, category);
        elements.newItemCategory.appendChild(option);
    });

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
            <button class="edit-item-btn" title="Редактировать">✏️</button>
            <button class="delete-item-btn" title="Удалить">×</button>
        </div>
        
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
                        const parts = ing.split(' ');
                        const quantity = parts.pop();
                        const name = parts.join(' ');
                        
                        return `
                            <div class="ingredient-item">
                                <input type="text" class="ingredient-name" value="${name}">
                                <input type="number" class="ingredient-quantity" value="${quantity}" min="0.1" step="0.1">
                                <button class="remove-ingredient-btn">×</button>
                            </div>
                        `;
                    }).join('')}
                </div>
                <button class="add-edit-ingredient-btn" type="button">+ Добавить ингредиент</button>
            </div>
            
            <div class="form-actions">
                <button class="save-edit-btn">Сохранить</button>
                <button class="cancel-edit-btn">×</button>
            </div>
        </div>
    `;
    
    return card;
}

function saveEditedItem(itemCard) {
    const itemId = parseInt(itemCard.dataset.id);
    const editForm = itemCard.querySelector('.edit-form');
    
    // Получаем новые значения
    const category = editForm.querySelector('.edit-item-category').value;
    const name = editForm.querySelector('.edit-item-name').value.trim();
    const price = parseFloat(editForm.querySelector('.edit-item-price').value);
    
    // Получаем список ингредиентов
    const ingredients = [];
    let isValid = true;
    
    editForm.querySelectorAll('.ingredient-item').forEach(item => {
        const ingName = item.querySelector('.ingredient-name').value.trim();
        const ingQuantity = parseFloat(item.querySelector('.ingredient-quantity').value);
        
        if (!ingName || isNaN(ingQuantity) || ingQuantity < 0.1) {
            isValid = false;
            item.querySelector('.ingredient-quantity').style.borderColor = 'red';
        } else {
            ingredients.push(`${ingName} ${ingQuantity}`);
        }
    });
    
    if (!isValid || !name || isNaN(price) || !category || ingredients.length === 0) {
        alert('Проверьте данные:\n- Все поля должны быть заполнены\n- Количество должно быть числом ≥ 0.1\n- Должен быть хотя бы один ингредиент');
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

function setupAdminPanelHandlers() {
    // Обработчики для категорий
    document.querySelectorAll('.edit-category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.category-card');
            card.querySelector('.category-name').classList.add('hidden');
            card.querySelector('.category-actions').classList.add('hidden');
            card.querySelector('.edit-category-form').classList.remove('hidden');
        });
    });

    document.querySelectorAll('.save-category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.category-card');
            const newName = card.querySelector('.edit-category-input').value.trim();
            const oldName = card.querySelector('.category-name').textContent;
            
            if (!newName) {
                alert('Введите название категории');
                return;
            }
            
            if (newName !== oldName) {
                if (menuCategories.includes(newName)) {
                    alert('Категория уже существует');
                    return;
                }
                
                const index = menuCategories.indexOf(oldName);
                menuCategories[index] = newName;
                
                menuItems.forEach(item => {
                    if (item.category === oldName) {
                        item.category = newName;
                    }
                });
                
                updateMenuInFirebase()
                    .then(() => renderMenuInterface())
                    .catch(error => {
                        console.error("Ошибка сохранения:", error);
                        alert("Не удалось сохранить изменения");
                    });
            } else {
                card.querySelector('.category-name').classList.remove('hidden');
                card.querySelector('.category-actions').classList.remove('hidden');
                card.querySelector('.edit-category-form').classList.add('hidden');
            }
        });
    });

    document.querySelectorAll('.cancel-category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.category-card');
            card.querySelector('.category-name').classList.remove('hidden');
            card.querySelector('.category-actions').classList.remove('hidden');
            card.querySelector('.edit-category-form').classList.add('hidden');
        });
    });

    document.querySelectorAll('.delete-category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.closest('.category-card').querySelector('.category-name')?.textContent;
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

    // Обработчики для товаров
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

    // Делегирование событий для ингредиентов
    document.addEventListener('click', function(e) {
        // Добавление ингредиента в форме добавления товара
        if (e.target.classList.contains('add-edit-ingredient-btn')) {
            e.preventDefault();
            const ingredientsList = e.target.closest('.form-group').querySelector('.edit-ingredients-list');
            const newIngredient = document.createElement('div');
            newIngredient.className = 'ingredient-item';
            newIngredient.innerHTML = `
                <input type="text" class="ingredient-name" placeholder="Название">
                <input type="number" class="ingredient-quantity" placeholder="Количество" min="0.1" step="0.1" value="1">
                <button class="remove-ingredient-btn">×</button>
            `;
            ingredientsList.appendChild(newIngredient);
            
            // Добавляем обработчик удаления для нового ингредиента
            newIngredient.querySelector('.remove-ingredient-btn').addEventListener('click', function() {
                newIngredient.remove();
            });
        }
        
        // Удаление ингредиента
        if (e.target.classList.contains('remove-ingredient-btn')) {
            e.preventDefault();
            e.target.closest('.ingredient-item')?.remove();
        }
    });

    // Обработчики для редактирования товаров
    document.querySelectorAll('.edit-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemCard = this.closest('.menu-item-card');
            const editForm = itemCard.querySelector('.edit-form');
            
            // Переключаем видимость формы
            editForm.classList.toggle('hidden');
            
            // Удаляем старые обработчики перед добавлением новых
            const saveBtn = editForm.querySelector('.save-edit-btn');
            const cancelBtn = editForm.querySelector('.cancel-edit-btn');
            const addIngredientBtn = editForm.querySelector('.add-edit-ingredient-btn');
            
            saveBtn?.replaceWith(saveBtn.cloneNode(true));
            cancelBtn?.replaceWith(cancelBtn.cloneNode(true));
            addIngredientBtn?.replaceWith(addIngredientBtn.cloneNode(true));
            
            // Назначаем новые обработчики
            editForm.querySelector('.save-edit-btn').addEventListener('click', () => saveEditedItem(itemCard));
            editForm.querySelector('.cancel-edit-btn').addEventListener('click', () => editForm.classList.add('hidden'));
            
            // Обработчик для добавления ингредиента
            editForm.querySelector('.add-edit-ingredient-btn').addEventListener('click', function(e) {
                e.preventDefault();
                const ingredientsList = editForm.querySelector('.edit-ingredients-list');
                const newIngredient = document.createElement('div');
                newIngredient.className = 'ingredient-item';
                newIngredient.innerHTML = `
                    <input type="text" class="ingredient-name" placeholder="Название">
                    <input type="number" class="ingredient-quantity" placeholder="Количество" min="0.1" step="0.1" value="1">
                    <button class="remove-ingredient-btn">×</button>
                `;
                ingredientsList.appendChild(newIngredient);
                
                // Добавляем обработчик удаления для нового ингредиента
                newIngredient.querySelector('.remove-ingredient-btn').addEventListener('click', function() {
                    newIngredient.remove();
                });
            });
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
