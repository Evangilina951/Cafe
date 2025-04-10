import { db } from '/Cafe/js//firebase-config.js';
import { menuCategories, menuItems } from '/Cafe/js/menu.js';

// DOM элементы
const elements = {
    adminPanel: document.getElementById('admin-panel'),
    adminBtn: document.querySelector('.admin-btn'),
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

let activeCategoryFilter = null;

function showAdminPanel() {
    elements.adminPanel.style.display = 'block';
    elements.adminPanel.classList.remove('hidden');
    document.getElementById('order-interface').style.display = 'none';
    loadMenuData();
    window.location.hash = 'admin';
}

function hideAdminPanel() {
    elements.adminPanel.style.display = 'none';
    elements.adminPanel.classList.add('hidden');
    document.getElementById('order-interface').style.display = 'block';
    window.location.hash = '';
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
    menuItems.forEach(item => {
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
                <button class="remove-ingredient-btn">×</button>
            `;
            elements.ingredientsList.appendChild(newIngredient);
            
            newIngredient.querySelector('.remove-ingredient-btn').addEventListener('click', function() {
                elements.ingredientsList.removeChild(newIngredient);
            });
        });
    }
    
    document.querySelectorAll('.remove-ingredient-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const ingredientItem = this.closest('.ingredient-item');
            if (ingredientItem && ingredientItem.parentNode) {
                ingredientItem.parentNode.removeChild(ingredientItem);
            }
        });
    });
}

function loadMenuData() {
    if (!elements.adminPanel || elements.adminPanel.classList.contains('hidden')) return;
    
    const categoriesList = document.getElementById('categories-list');
    const itemsList = document.getElementById('menu-items-list');
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
    allFilterBtn.className = 'filter-btn' + (activeCategoryFilter === null ? ' active' : '');
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
        filterBtn.className = 'filter-btn' + (activeCategoryFilter === category ? ' active' : '');
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
    
    // Загрузка блюд
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
                    <input type="text" value="${item.name}" class="edit-name">
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
        `;
        
        itemsList.appendChild(itemCard);
    });
    
    initAdminPanelHandlers();
}

function initAdminPanelHandlers() {
    document.querySelectorAll('.delete-category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.parentElement.querySelector('span').textContent;
            deleteCategory(category);
        });
    });
    
    document.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = parseInt(this.closest('.menu-item-card').dataset.id);
            deleteMenuItem(itemId);
        });
    });
    
    document.querySelectorAll('.edit-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemCard = this.closest('.menu-item-card');
            itemCard.querySelector('.item-main-info').classList.add('hidden');
            itemCard.querySelector('.edit-form').classList.remove('hidden');
            
            initEditFormHandlers(itemCard.querySelector('.edit-form'));
        });
    });
    
    document.querySelectorAll('.cancel-edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemCard = this.closest('.menu-item-card');
            itemCard.querySelector('.item-main-info').classList.remove('hidden');
            itemCard.querySelector('.edit-form').classList.add('hidden');
        });
    });
    
    document.querySelectorAll('.save-edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemCard = this.closest('.menu-item-card');
            const itemId = parseInt(itemCard.dataset.id);
            const editForm = itemCard.querySelector('.edit-form');
            
            const ingredients = [];
            const ingredientItems = editForm.querySelectorAll('.ingredient-item');
            ingredientItems.forEach(item => {
                const name = item.querySelector('.ingredient-name').value.trim();
                const quantity = item.querySelector('.ingredient-quantity').value.trim();
                if (name && quantity) {
                    ingredients.push(`${name} ${quantity}`);
                }
            });

            const updatedItem = {
                id: itemId,
                name: editForm.querySelector('.edit-name').value.trim(),
                price: parseInt(editForm.querySelector('.edit-price').value),
                category: editForm.querySelector('.edit-category').value,
                ingredients
            };
            
            const index = menuItems.findIndex(item => item.id === itemId);
            if (index !== -1) {
                menuItems[index] = updatedItem;
                
                updateMenuInFirebase()
                    .then(() => {
                        itemCard.querySelector('.item-main-info').classList.remove('hidden');
                        itemCard.querySelector('.edit-form').classList.add('hidden');
                        loadMenuData();
                    })
                    .catch(error => {
                        console.error("Ошибка сохранения изменений:", error);
                        alert("Не удалось сохранить изменения");
                    });
            }
        });
    });
}

function initEditFormHandlers(editForm) {
    if (!editForm) return;
    
    editForm.querySelectorAll('.remove-ingredient-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.ingredient-item').remove();
        });
    });
    
    const addBtn = editForm.querySelector('.add-edit-ingredient-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            const ingredientsList = this.previousElementSibling;
            const newIngredient = document.createElement('div');
            newIngredient.className = 'ingredient-item';
            newIngredient.innerHTML = `
                <input type="text" class="ingredient-name" placeholder="Название">
                <input type="text" class="ingredient-quantity" placeholder="Количество">
                <button class="remove-ingredient-btn">×</button>
            `;
            ingredientsList.appendChild(newIngredient);
            
            newIngredient.querySelector('.remove-ingredient-btn').addEventListener('click', function() {
                this.closest('.ingredient-item').remove();
            });
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
                elements.addCategoryForm.style.display = 'none';
                loadMenuData();
            })
            .catch(error => {
                console.error("Ошибка сохранения категории:", error);
                alert("Не удалось сохранить категорию");
            });
    }
}

function deleteCategory(category) {
    if (!confirm(`Удалить категорию "${category}"? Все напитки этой категории также будут удалены.`)) {
        return;
    }
    
    const itemsToKeep = menuItems.filter(item => item.category !== category);
    menuItems = itemsToKeep;
    menuCategories = menuCategories.filter(c => c !== category);
    
    updateMenuInFirebase()
        .then(() => {
            loadMenuData();
        })
        .catch(error => {
            console.error("Ошибка удаления категории:", error);
            alert("Не удалось удалить категорию");
        });
}

function deleteMenuItem(id) {
    if (!confirm('Удалить этот напиток?')) return;
    
    menuItems = menuItems.filter(item => item.id !== id);
    
    updateMenuInFirebase()
        .then(() => {
            loadMenuData();
        })
        .catch(error => {
            console.error("Ошибка удаления напитка:", error);
            alert("Не удалось удалить напиток");
        });
}

export function initAdmin() {
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
    
    initIngredientsHandlers();
}
