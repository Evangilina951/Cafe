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
    const menuButtons = document.querySelector('.menu-buttons');
    if (!menuButtons) return;
    
    if (isLoadingMenu) {
        menuButtons.innerHTML = '<div class="menu-loading">Загрузка меню...</div>';
        return;
    }
    
    if (menuItems.length > 0) {
        menuButtons.innerHTML = '';
        menuItems.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'menu-btn';
            btn.textContent = `${item.name} - ${item.price} ₽`;
            btn.onclick = () => addDrink(item.name, item.price);
            menuButtons.appendChild(btn);
        });
    } else {
        menuButtons.innerHTML = '<div class="menu-error">Ошибка: Меню не загружено</div>';
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
    const ingredientItems = document.querySelectorAll('.ingredient-item');
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
        elements.addIngredientBtn.addEventListener('click', () => {
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
            const removeBtn = newIngredient.querySelector('.remove-ingredient-btn');
            removeBtn.addEventListener('click', function() {
                ingredientsList.removeChild(newIngredient);
            });
        });
    }
    
    // Обработчики для существующих кнопок удаления
    document.querySelectorAll('.remove-ingredient-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const ingredientItem = this.closest('.ingredient-item');
            if (ingredientItem) {
                ingredientItem.remove();
            }
        });
    });
}

function loadMenuData() {
    if (!elements.adminPanel || elements.adminPanel.classList.contains('hidden')) return;
    
    const categoriesList = document.getElementById('categories-list');
    const itemsList = document.getElementById('menu-items-list');
    const categorySelect = document.getElementById('new-item-category');
    
    if (!categoriesList || !itemsList || !categorySelect) return;
    
    categoriesList.innerHTML = '<h3>Категории</h3>';
    itemsList.innerHTML = '<h3>Напитки</h3>';
    categorySelect.innerHTML = '';
    
    menuCategories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <span>${category}</span>
            <button class="delete-category-btn">×</button>
        `;
        categoriesList.appendChild(categoryCard);
        
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
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

// Остальные функции (initAdminPanelHandlers, addCategory, deleteCategory, deleteMenuItem, 
// addDrink, updateOrderList, changeQuantity, removeItem, clearOrder, login, logout, pay) 
// остаются без изменений...

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    initIngredientsHandlers();
    
    if (window.location.hash === '#admin') {
        const user = auth.currentUser;
        if (user && user.email === 'admin@dismail.com') {
            showAdminPanel();
        }
    }
});
