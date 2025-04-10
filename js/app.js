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
    clearBtn: document.querySelector('.clear-btn'),
    payBtn: document.querySelector('.pay-btn')
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
    
    if (elements.clearBtn) {
        elements.clearBtn.addEventListener('click', clearOrder);
    }
    
    if (elements.payBtn) {
        elements.payBtn.addEventListener('click', pay);
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
    showElement(adminElements.adminPanel);
    initAdminPanel();
}
    
    // Создаем контейнер для админ-панели
    const adminPanel = document.createElement('div');
    adminPanel.id = 'admin-panel';
    document.body.appendChild(adminPanel);
    
    // Загружаем админ-панель
    fetch('admin.html')
        .then(response => response.text())
        .then(html => {
            adminPanel.innerHTML = html;
            // Инициализируем админ-панель
            initAdminPanel();
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
    
    if (window.location.hash === '#admin') {
        const user = auth.currentUser;
        if (user && user.email === 'admin@dismail.com') {
            showAdminPanel();
        }
    }
});

// Глобальные функции для использования в HTML
window.changeQuantity = changeQuantity;
window.removeItem = removeItem;
window.showAdminPanel = showAdminPanel;
