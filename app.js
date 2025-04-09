// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDB8Vtxg3SjVyHRJ3ZOXT8osnHYrO_uw4A",
    authDomain: "cafe-90de8.firebaseapp.com",
    databaseURL: "https://cafe-90de8-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "cafe-90de8",
    storageBucket: "cafe-90de8.firebasestorage.app",
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

// DOM элементы
const elements = {
    authForm: document.getElementById('auth-form'),
    orderInterface: document.getElementById('order-interface'),
    adminPanel: document.getElementById('admin-panel'),
    userEmail: document.getElementById('user-email'),
    menuButtons: document.getElementById('menu-buttons'),
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
    addIngredientBtn: document.getElementById('add-ingredient-btn')
};

// Функции для работы с DOM
function showElement(element) {
    if (!element) return;
    element.style.display = 'block';
    element.style.visibility = 'visible';
    element.style.opacity = '1';
    element.classList.remove('hidden');
}

function hideElement(element) {
    if (!element) return;
    element.style.display = 'none';
    element.style.visibility = 'hidden';
    element.style.opacity = '0';
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
        
        // Проверка прав администратора
        if (user.email === 'admin@dismail.com' && elements.adminBtn) {
            elements.adminBtn.style.display = 'block';
        } else if (elements.adminBtn) {
            elements.adminBtn.style.display = 'none';
        }
        
        loadMenuFromFirebase();
        
        // Для админа сразу загружаем данные админ-панели
        if (user.email === 'admin@dismail.com') {
            loadMenuData();
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
        elements.addCategoryBtn.addEventListener('click', showAddCategoryForm);
    }
    
    if (elements.addItemBtn) {
        elements.addItemBtn.addEventListener('click', showAddItemForm);
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
    const menuRef = db.ref('menu');
    
    menuRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            menuCategories = data.categories || [];
            menuItems = data.items ? Object.values(data.items) : [];
            updateMainMenu();
            
            if (elements.adminPanel && !elements.adminPanel.classList.contains('hidden')) {
                loadMenuData();
            }
        } else {
            // Инициализация базы данных при первом запуске
            const initialData = {
                categories: ["Кофе", "Чай", "Десерты"],
                items: {
                    item1: { id: 1, name: "Кофе", price: 100, category: "Кофе", ingredients: ["Арабика", "Вода"] },
                    item2: { id: 2, name: "Чай", price: 50, category: "Чай", ingredients: ["Чайные листья", "Вода"] },
                    item3: { id: 3, name: "Капучино", price: 150, category: "Кофе", ingredients: ["Эспрессо", "Молоко", "Пена"] },
                    item4: { id: 4, name: "Латте", price: 200, category: "Кофе", ingredients: ["Эспрессо", "Молоко"] }
                }
            };
            
            db.ref('menu').set(initialData)
                .then(() => {
                    menuCategories = initialData.categories;
                    menuItems = Object.values(initialData.items);
                    updateMainMenu();
                });
        }
    });
}

function updateMainMenu() {
    const menuButtons = document.querySelector('.menu-buttons');
    if (!menuButtons) return;
    
    menuButtons.innerHTML = '';
    
    if (menuItems.length > 0) {
        menuItems.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'menu-btn';
            btn.textContent = `${item.name} - ${item.price} ₽`;
            btn.onclick = () => addDrink(item.name, item.price);
            menuButtons.appendChild(btn);
        });
    } else {
        // Стандартные кнопки, если меню пустое
        menuButtons.innerHTML = `
            <button class="menu-btn" onclick="addDrink('Кофе', 100)">Кофе - 100 ₽</button>
            <button class="menu-btn" onclick="addDrink('Чай', 50)">Чай - 50 ₽</button>
            <button class="menu-btn" onclick="addDrink('Капучино', 150)">Капучино - 150 ₽</button>
            <button class="menu-btn" onclick="addDrink('Латте', 200)">Латте - 200 ₽</button>
        `;
    }
}

// Админ-панель
function showAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    const orderInterface = document.getElementById('order-interface');
    
    if (!adminPanel || !orderInterface) return;
    
    adminPanel.classList.remove('hidden');
    orderInterface.classList.add('hidden');
    loadMenuData();
}

function hideAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    const orderInterface = document.getElementById('order-interface');
    
    if (!adminPanel || !orderInterface) return;
    
    adminPanel.classList.add('hidden');
    orderInterface.classList.remove('hidden');
}

function showAddCategoryForm() {
    const form = document.getElementById('add-category-form');
    if (form) form.classList.remove('hidden');
}

function showAddItemForm() {
    const form = document.getElementById('add-item-form');
    if (form) form.classList.remove('hidden');
    resetAddItemForm();
}

// Доработанная функция добавления напитка
function addMenuItem() {
    const name = document.getElementById('new-item-name').value.trim();
    const price = parseInt(document.getElementById('new-item-price').value);
    const category = document.getElementById('new-item-category').value;
    
    // Собираем ингредиенты
    const ingredients = [];
    const ingredientInputs = document.querySelectorAll('.ingredient-input');
    ingredientInputs.forEach(input => {
        if (input.value.trim()) {
            ingredients.push(input.value.trim());
        }
    });

    if (!name || isNaN(price) || !category) {
        alert('Заполните все обязательные поля!');
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
    saveMenuItemsToFirebase();
    resetAddItemForm();
}

// Функция сброса формы добавления напитка
function resetAddItemForm() {
    document.getElementById('new-item-name').value = '';
    document.getElementById('new-item-price').value = '';
    
    const ingredientsList = document.getElementById('ingredients-list');
    ingredientsList.innerHTML = `
        <div class="ingredient-item">
            <input type="text" class="ingredient-input" placeholder="Ингредиент 1">
            <button class="remove-ingredient-btn">×</button>
        </div>
    `;
    
    document.getElementById('add-item-form').classList.add('hidden');
    initIngredientsHandlers();
}

// Инициализация обработчиков для ингредиентов
function initIngredientsHandlers() {
    // Добавление нового ингредиента
    document.getElementById('add-ingredient-btn').addEventListener('click', () => {
        const ingredientsList = document.getElementById('ingredients-list');
        const count = ingredientsList.children.length + 1;
        const newIngredient = document.createElement('div');
        newIngredient.className = 'ingredient-item';
        newIngredient.innerHTML = `
            <input type="text" class="ingredient-input" placeholder="Ингредиент ${count}">
            <button class="remove-ingredient-btn">×</button>
        `;
        ingredientsList.appendChild(newIngredient);
        
        // Назначаем обработчик для новой кнопки удаления
        newIngredient.querySelector('.remove-ingredient-btn').addEventListener('click', function() {
            if (ingredientsList.children.length > 1) {
                ingredientsList.removeChild(newIngredient);
            }
        });
    });
    
    // Удаление ингредиентов
    document.querySelectorAll('.remove-ingredient-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (document.querySelectorAll('.ingredient-item').length > 1) {
                this.parentElement.remove();
            }
        });
    });
}

// Доработанная функция загрузки данных меню в админ-панель
function loadMenuData() {
    const categoriesList = document.getElementById('categories-list');
    const itemsList = document.getElementById('menu-items-list');
    const categorySelect = document.getElementById('new-item-category');
    
    categoriesList.innerHTML = '<h3>Категории</h3>';
    itemsList.innerHTML = '<h3>Напитки</h3>';
    categorySelect.innerHTML = '';
    
    // Заполняем категории
    menuCategories.forEach(category => {
        // Список категорий
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <span>${category}</span>
            <button class="delete-category-btn">×</button>
        `;
        categoriesList.appendChild(categoryCard);
        
        // Выпадающий список
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // Заполняем напитки с возможностью редактирования
    menuItems.forEach(item => {
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
                    <div>${item.price} ₽ • ${item.category}</div>
                    ${ingredientsHtml}
                </div>
                <div class="item-actions">
                    <button class="edit-item-btn">✏️</button>
                    <button class="delete-item-btn">×</button>
                </div>
            </div>
            <div class="edit-form hidden" data-id="${item.id}">
                <input type="text" value="${item.name}" class="edit-name">
                <input type="number" value="${item.price}" class="edit-price">
                <select class="edit-category">
                    ${menuCategories.map(cat => 
                        `<option value="${cat}" ${cat === item.category ? 'selected' : ''}>${cat}</option>`
                    ).join('')}
                </select>
                <div class="edit-ingredients">
                    <h4>Состав:</h4>
                    <div class="edit-ingredients-list">
                        ${item.ingredients ? item.ingredients.map((ing, idx) => `
                            <div class="ingredient-item">
                                <input type="text" value="${ing}" class="ingredient-input" placeholder="Ингредиент ${idx+1}">
                                <button class="remove-ingredient-btn">×</button>
                            </div>
                        `).join('') : ''}
                    </div>
                    <button class="add-edit-ingredient-btn">+ Добавить ингредиент</button>
                </div>
                <button class="save-edit-btn">Сохранить</button>
                <button class="cancel-edit-btn">Отмена</button>
            </div>
        `;
        
        itemsList.appendChild(itemCard);
    });
    
    // Инициализация обработчиков для админ-панели
    initAdminPanelHandlers();
}

// Инициализация обработчиков админ-панели
function initAdminPanelHandlers() {
    // Обработчики для кнопок удаления
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
    
    // Обработчики для кнопок редактирования
    document.querySelectorAll('.edit-item-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemCard = this.closest('.menu-item-card');
            itemCard.querySelector('.item-main-info').classList.add('hidden');
            itemCard.querySelector('.edit-form').classList.remove('hidden');
        });
    });
    
    document.querySelectorAll('.cancel-edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemCard = this.closest('.menu-item-card');
            itemCard.querySelector('.item-main-info').classList.remove('hidden');
            itemCard.querySelector('.edit-form').classList.add('hidden');
        });
    });
    
    // Обработчики для сохранения изменений
    document.querySelectorAll('.save-edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemCard = this.closest('.menu-item-card');
            const itemId = parseInt(itemCard.dataset.id);
            const editForm = itemCard.querySelector('.edit-form');
            
            const updatedItem = {
                id: itemId,
                name: editForm.querySelector('.edit-name').value.trim(),
                price: parseInt(editForm.querySelector('.edit-price').value),
                category: editForm.querySelector('.edit-category').value,
                ingredients: Array.from(editForm.querySelectorAll('.edit-ingredients-list .ingredient-input'))
                    .map(input => input.value.trim())
                    .filter(ing => ing)
            };
            
            // Находим и обновляем элемент
            const index = menuItems.findIndex(item => item.id === itemId);
            if (index !== -1) {
                menuItems[index] = updatedItem;
                saveMenuItemsToFirebase();
            }
        });
    });
    
    // Обработчики для ингредиентов в форме редактирования
    document.querySelectorAll('.add-edit-ingredient-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const ingredientsList = this.previousElementSibling;
            const count = ingredientsList.children.length + 1;
            const newIngredient = document.createElement('div');
            newIngredient.className = 'ingredient-item';
            newIngredient.innerHTML = `
                <input type="text" class="ingredient-input" placeholder="Ингредиент ${count}">
                <button class="remove-ingredient-btn">×</button>
            `;
            ingredientsList.appendChild(newIngredient);
            
            newIngredient.querySelector('.remove-ingredient-btn').addEventListener('click', function() {
                if (ingredientsList.children.length > 1) {
                    ingredientsList.removeChild(newIngredient.parentElement);
                }
            });
        });
    });
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
                const form = document.getElementById('add-category-form');
                if (form) form.classList.add('hidden');
            })
            .catch(error => console.error("Ошибка сохранения категории:", error));
    }
}

function deleteCategory(category) {
    if (!confirm(`Удалить категорию "${category}"? Все напитки этой категории также будут удалены.`)) {
        return;
    }
    
    // Удаляем напитки этой категории
    menuItems = menuItems.filter(item => item.category !== category);
    saveMenuItemsToFirebase();
    
    // Удаляем саму категорию
    menuCategories = menuCategories.filter(c => c !== category);
    db.ref('menu/categories').set(menuCategories)
        .catch(error => console.error("Ошибка удаления категории:", error));
}

function deleteMenuItem(id) {
    if (!confirm('Удалить этот напиток?')) return;
    
    menuItems = menuItems.filter(item => item.id !== id);
    saveMenuItemsToFirebase();
}

function saveMenuItemsToFirebase() {
    const itemsObj = {};
    menuItems.forEach(item => {
        itemsObj['item' + item.id] = item;
    });
    
    db.ref('menu/items').set(itemsObj)
        .catch(error => console.error("Ошибка сохранения меню:", error));
}

// Функции заказа
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
        .then(() => console.log("Login successful"))
        .catch(error => {
            console.error("Login error:", error);
            errorMessage.textContent = error.message;
        });
}

function logout() {
    auth.signOut()
        .then(() => console.log("User logged out"))
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
});
