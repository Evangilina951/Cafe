// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDB8Vtxg3SjVyHRJ3ZOXT8osnHYrO_uw4A",
    authDomain: "cafe-90de8.firebaseapp.com",
    databaseURL: "https://cafe-90de8-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "cafe-90de8",
    storageBucket: "cafe-90de8.appspot.com",
    messagingSenderId: "1086414728245",
    appId: "1:1086414728245:web:fbbec8b3adf4eba659957c",
    measurementId: "G-2FVD2KRF16"
};

// Инициализация Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let order = [];
let currentUser = null;
let menuCategories = [];
let menuItems = [];
let isLoadingMenu = true;
let activeCategoryFilter = null;

// DOM элементы
const elements = {
    authForm: document.getElementById('auth-form'),
    orderInterface: document.getElementById('order-interface'),
    adminPanel: document.getElementById('admin-panel'),
    userEmail: document.getElementById('user-email'),
    menuColumns: document.getElementById('menu-columns'),
    orderList: document.getElementById('order-list'),
    totalElement: document.getElementById('total'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    errorMessage: document.getElementById('error-message'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.querySelector('.logout-btn'),
    adminBtn: document.querySelector('.admin-btn'),
    backBtn: document.querySelector('.back-btn'),
    clearBtn: document.querySelector('.clear-btn'),
    payBtn: document.querySelector('.pay-btn'),
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

// Функции для работы с DOM
function showElement(element) {
    if (!element) return;
    element.style.display = 'block';
    element.classList.remove('hidden');
}

function hideElement(element) {
    if (!element) return;
    element.style.display = 'none';
    element.classList.add('hidden');
}

// Обработчик состояния авторизации
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        hideElement(elements.authForm);
        showElement(elements.orderInterface);
        
        if (elements.userEmail) {
            elements.userEmail.textContent = user.email;
        }
        
        if (user.email === 'admin@dismail.com') {
            if (elements.adminBtn) elements.adminBtn.style.display = 'block';
            loadMenuFromFirebase();
        } else if (elements.adminBtn) {
            elements.adminBtn.style.display = 'none';
        }
    } else {
        currentUser = null;
        showElement(elements.authForm);
        hideElement(elements.orderInterface);
        hideElement(elements.adminPanel);
        if (elements.adminBtn) elements.adminBtn.style.display = 'none';
        order = [];
        updateOrderList();
    }
});

// Инициализация обработчиков событий
function initEventListeners() {
    if (elements.loginBtn) {
        elements.loginBtn.addEventListener('click', login);
    }
    
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', logout);
    }
    
    if (elements.adminBtn) {
        elements.adminBtn.addEventListener('click', showAdminPanel);
    }
    
    if (elements.backBtn) {
        elements.backBtn.addEventListener('click', hideAdminPanel);
    }
    
    if (elements.clearBtn) {
        elements.clearBtn.addEventListener('click', clearOrder);
    }
    
    if (elements.payBtn) {
        elements.payBtn.addEventListener('click', pay);
    }
    
    if (elements.addCategoryBtn) {
        elements.addCategoryBtn.addEventListener('click', () => {
            showElement(elements.addCategoryForm);
        });
    }
    
    if (elements.addItemBtn) {
        elements.addItemBtn.addEventListener('click', () => {
            showElement(elements.addItemForm);
            resetAddItemForm();
        });
    }
    
    if (elements.confirmAddCategory) {
        elements.confirmAddCategory.addEventListener('click', addCategory);
    }
    
    if (elements.confirmAddItem) {
        elements.confirmAddItem.addEventListener('click', addMenuItem);
    }
}

// Работа с меню
function loadMenuFromFirebase() {
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
            
            if (elements.adminPanel && !elements.adminPanel.classList.contains('hidden')) {
                loadMenuData();
            }
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
                btn.onclick = () => addDrink(item.name, item.price);
                buttonsContainer.appendChild(btn);
            });
            
            column.appendChild(buttonsContainer);
            elements.menuColumns.appendChild(column);
        });
    } else {
        elements.menuColumns.innerHTML = '<div class="menu-error">Ошибка: Меню не загружено</div>';
    }
}

// Админ-панель
function showAdminPanel() {
    hideElement(elements.orderInterface);
    showElement(elements.adminPanel);
    loadMenuData();
    window.location.hash = 'admin';
}

function hideAdminPanel() {
    hideElement(elements.adminPanel);
    showElement(elements.orderInterface);
    window.location.hash = '';
}

function resetAddItemForm() {
    document.getElementById('new-item-name').value = '';
    document.getElementById('new-item-price').value = '';
    
    const ingredientsList = document.getElementById('ingredients-list');
    ingredientsList.innerHTML = `
        <div class="ingredient-item">
            <input type="text" class="ingredient-name" placeholder="Название ингредиента">
            <input type="text" class="ingredient-quantity" placeholder="Количество">
            <button class="remove-ingredient-btn">×</button>
        </div>
    `;
    
    initIngredientsHandlers();
}

function addMenuItem() {
    const name = document.getElementById('new-item-name').value.trim();
    const price = parseInt(document.getElementById('new-item-price').value);
    const category = document.getElementById('new-item-category').value;
    
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
            hideElement(elements.addItemForm);
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
    // Обработчик для кнопки добавления ингредиента
    if (elements.addIngredientBtn) {
        elements.addIngredientBtn.addEventListener('click', function addIngredientHandler() {
            const ingredientsList = document.getElementById('ingredients-list');
            const newIngredient = document.createElement('div');
            newIngredient.className = 'ingredient-item';
            newIngredient.innerHTML = `
                <input type="text" class="ingredient-name" placeholder="Название ингредиента">
                <input type="text" class="ingredient-quantity" placeholder="Количество">
                <button class="remove-ingredient-btn">×</button>
            `;
            ingredientsList.appendChild(newIngredient);
            
            // Обработчик для кнопки удаления ингредиента
            newIngredient.querySelector('.remove-ingredient-btn').addEventListener('click', function() {
                ingredientsList.removeChild(newIngredient);
            });
        });
    }
    
    // Обработчики для существующих кнопок удаления
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
    itemsList.innerHTML = ''; // Убираем дублирующий заголовок "Блюда"
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
    itemsList.innerHTML = '<h3 style="margin-bottom: 20px; text-align: center;">Блюда</h3>';
    
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
            
            // Инициализируем обработчики для формы редактирования
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
    
    // Обработчики для существующих кнопок удаления
    editForm.querySelectorAll('.remove-ingredient-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.ingredient-item').remove();
        });
    });
    
    // Обработчик для кнопки добавления ингредиента
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
            
            // Обработчик для новой кнопки удаления
            newIngredient.querySelector('.remove-ingredient-btn').addEventListener('click', function() {
                this.closest('.ingredient-item').remove();
            });
        });
    }
}

function addCategory() {
    const nameInput = document.getElementById('new-category-name');
    if (!nameInput) return;
    
    const name = nameInput.value.trim();
    if (!name) {
        alert('Введите название категории');
        return;
    }
    
    if (!menuCategories.includes(name)) {
        menuCategories.push(name);
        db.ref('menu/categories').set(menuCategories)
            .then(() => {
                nameInput.value = '';
                hideElement(elements.addCategoryForm);
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

function addDrink(name, price) {
    if (!currentUser) {
        alert("Сначала войдите в систему!");
        return;
    }
    
    const existingItem = order.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        order.push({ name, price, quantity: 1 });
    }
    updateOrderList();
}

function updateOrderList() {
    const list = document.getElementById("order-list");
    if (!list) return;
    
    list.innerHTML = "";

    order.forEach((item, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="item-name">${item.name}</span>
            <span class="item-price">${item.price} ₽</span>
            <div class="item-controls">
                <button class="quantity-btn minus-btn" onclick="changeQuantity(${index}, -1)">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn plus-btn" onclick="changeQuantity(${index}, 1)">+</button>
                <button class="remove-btn" onclick="removeItem(${index})">×</button>
            </div>
        `;
        list.appendChild(li);
    });

    const totalElement = document.getElementById("total");
    if (totalElement) {
        const total = order.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalElement.textContent = total;
    }
}

function changeQuantity(index, delta) {
    const newQuantity = order[index].quantity + delta;
    if (newQuantity <= 0) {
        removeItem(index);
    } else {
        order[index].quantity = newQuantity;
        updateOrderList();
    }
}

function removeItem(index) {
    order.splice(index, 1);
    updateOrderList();
}

function clearOrder() {
    if (order.length === 0) return;
    if (confirm("Очистить заказ?")) {
        order = [];
        updateOrderList();
    }
}

function login() {
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    
    if (!email || !password || !errorMessage) return;
    
    errorMessage.textContent = '';
    
    auth.signInWithEmailAndPassword(email.value, password.value)
        .then(() => {
            console.log("Login successful");
        })
        .catch(error => {
            console.error("Login error:", error);
            errorMessage.textContent = error.message;
        });
}

function logout() {
    auth.signOut()
        .then(() => {
            console.log("User logged out");
        })
        .catch(error => console.error("Logout error:", error));
}

function pay() {
    if (!currentUser) {
        alert("Войдите в систему");
        return;
    }

    if (order.length === 0) {
        alert("Добавьте напитки");
        return;
    }

    let processedItems = 0;
    const totalItems = order.reduce((sum, item) => sum + item.quantity, 0);
    
    order.forEach((item, index) => {
        for (let i = 0; i < item.quantity; i++) {
            const callbackName = `jsonpCallback_${Date.now()}_${index}_${i}`;
            window[callbackName] = function(response) {
                delete window[callbackName];
                if (response.status !== "success") {
                    console.error("Ошибка сохранения:", item.name, response.message);
                }
                
                if (++processedItems === totalItems) {
                    alert("Заказ сохранен!");
                    order = [];
                    updateOrderList();
                }
            };

            const params = new URLSearchParams({
                name: item.name,
                price: item.price,
                email: currentUser.email,
                date: new Date().toISOString(),
                callback: callbackName
            });

            const script = document.createElement('script');
            script.src = `https://script.google.com/macros/s/AKfycbyVSEyq7_3pbSqlAcYR0SO1pgbUno63xTzK6vjYJmllmiGpfANxhSfvKpO-2fYaJq5F8Q/exec?${params}`;
            document.body.appendChild(script);
        }
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    initIngredientsHandlers();
    
    // Обновляем CSS для формы добавления напитка
    const addItemForm = document.getElementById('add-item-form');
    if (addItemForm) {
        addItemForm.style.display = 'flex';
        addItemForm.style.flexDirection = 'column';
        addItemForm.style.gap = '10px';
    }
    
    if (window.location.hash === '#admin') {
        const user = auth.currentUser;
        if (user && user.email === 'admin@dismail.com') {
            showAdminPanel();
        }
    }
});
