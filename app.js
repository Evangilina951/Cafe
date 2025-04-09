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
    const authForm = document.getElementById('auth-form');
    const orderInterface = document.getElementById('order-interface');
    const adminBtn = document.querySelector('.admin-btn');
    
    if (user) {
        currentUser = user;
        
        hideElement(authForm);
        showElement(orderInterface);
        
        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement) {
            userEmailElement.textContent = user.email;
        }
        
        // Проверка прав администратора
        if (user.email === 'admin@dismail.com' && adminBtn) {
            adminBtn.style.display = 'block';
            adminBtn.onclick = showAdminPanel;
        } else if (adminBtn) {
            adminBtn.style.display = 'none';
        }
        
        loadMenuFromFirebase();
    } else {
        currentUser = null;
        showElement(authForm);
        hideElement(orderInterface);
        if (adminBtn) adminBtn.style.display = 'none';
        order = [];
        updateOrderList();
    }
});

// Работа с меню
function loadMenuFromFirebase() {
    const menuRef = db.ref('menu');
    
    menuRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            menuCategories = data.categories || [];
            menuItems = data.items ? Object.values(data.items) : [];
            updateMainMenu();
            
            const adminPanel = document.getElementById('admin-panel');
            if (adminPanel && !adminPanel.classList.contains('hidden')) {
                loadMenuData();
            }
        } else {
            // Инициализация базы данных при первом запуске
            const initialData = {
                categories: ["Кофе", "Чай", "Десерты"],
                items: {
                    item1: { id: 1, name: "Кофе", price: 100, category: "Кофе" },
                    item2: { id: 2, name: "Чай", price: 50, category: "Чай" },
                    item3: { id: 3, name: "Капучино", price: 150, category: "Кофе" },
                    item4: { id: 4, name: "Латте", price: 200, category: "Кофе" }
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
}

function loadMenuData() {
    const categoriesList = document.getElementById('categories-list');
    const itemsList = document.getElementById('menu-items-list');
    const categorySelect = document.getElementById('new-item-category');
    
    if (!categoriesList || !itemsList || !categorySelect) return;
    
    // Очищаем и заполняем категории
    categoriesList.innerHTML = '<h3>Категории</h3>';
    categorySelect.innerHTML = '';
    
    menuCategories.forEach(category => {
        // Добавляем в список категорий
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.innerHTML = `
            <span>${category}</span>
            <button onclick="deleteCategory('${category}')">×</button>
        `;
        categoriesList.appendChild(categoryCard);
        
        // Добавляем в выпадающий список
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
    
    // Очищаем и заполняем список напитков
    itemsList.innerHTML = '<h3>Напитки</h3>';
    menuItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'menu-item-card';
        itemCard.innerHTML = `
            <div>
                <strong>${item.name}</strong>
                <div>${item.price} ₽ • ${item.category}</div>
            </div>
            <button onclick="deleteMenuItem(${item.id})">×</button>
        `;
        itemsList.appendChild(itemCard);
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

function addMenuItem() {
    const nameInput = document.getElementById('new-item-name');
    const priceInput = document.getElementById('new-item-price');
    const categorySelect = document.getElementById('new-item-category');
    
    if (!nameInput || !priceInput || !categorySelect) return;
    
    const name = nameInput.value.trim();
    const price = parseInt(priceInput.value);
    const category = categorySelect.value;
    
    if (!name || isNaN(price)) {
        alert('Заполните все поля корректно!');
        return;
    }
    
    const newItem = {
        id: Date.now(),
        name,
        price,
        category
    };
    
    menuItems.push(newItem);
    saveMenuItemsToFirebase();
    
    // Очищаем форму
    nameInput.value = '';
    priceInput.value = '';
    const form = document.getElementById('add-item-form');
    if (form) form.classList.add('hidden');
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
    // Назначаем обработчики для кнопок входа/выхода
    const loginBtn = document.querySelector('#auth-form button');
    if (loginBtn) loginBtn.onclick = login;
    
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) logoutBtn.onclick = logout;
    
    // Проверяем состояние авторизации
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("User is logged in:", user.email);
        } else {
            console.log("User is logged out");
        }
    });
});
