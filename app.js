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
    element.style.display = 'block';
    element.style.visibility = 'visible';
    element.style.opacity = '1';
    element.classList.remove('hidden');
}

function hideElement(element) {
    element.style.display = 'none';
    element.style.visibility = 'hidden';
    element.style.opacity = '0';
    element.classList.add('hidden');
}

// Обработчик состояния авторизации
auth.onAuthStateChanged(user => {
    console.log("Auth state changed:", user);
    
    const authForm = document.getElementById('auth-form');
    const orderInterface = document.getElementById('order-interface');
    const adminBtn = document.querySelector('.admin-btn');
    
    if (user) {
        console.log("User logged in");
        currentUser = user;
        
        hideElement(authForm);
        showElement(orderInterface);
        document.getElementById('user-email').textContent = user.email;
        
        // Проверка прав администратора
        if (user.email === 'admin@dismail.com') {
            adminBtn.style.display = 'block';
        } else {
            adminBtn.style.display = 'none';
        }
        
        loadMenuFromFirebase();
        
        setTimeout(() => {
            if (window.getComputedStyle(orderInterface).display === 'none') {
                orderInterface.style.display = 'flex';
            }
        }, 50);
    } else {
        console.log("User logged out");
        currentUser = null;
        showElement(authForm);
        hideElement(orderInterface);
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
            
            if (document.getElementById('admin-panel') && 
                !document.getElementById('admin-panel').classList.contains('hidden')) {
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
    menuButtons.innerHTML = '';
    
    menuItems.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'menu-btn';
        btn.innerHTML = `${item.name} - ${item.price} ₽`;
        btn.onclick = () => addDrink(item.name, item.price);
        menuButtons.appendChild(btn);
    });
}

// Админ-панель
function showAdminPanel() {
    document.getElementById('admin-panel').classList.remove('hidden');
    document.getElementById('order-interface').classList.add('hidden');
    loadMenuData();
}

function hideAdminPanel() {
    document.getElementById('admin-panel').classList.add('hidden');
    document.getElementById('order-interface').classList.remove('hidden');
}

function showAddCategoryForm() {
    document.getElementById('add-category-form').classList.remove('hidden');
}

function showAddItemForm() {
    document.getElementById('add-item-form').classList.remove('hidden');
}

function loadMenuData() {
    const categoriesList = document.getElementById('categories-list');
    const itemsList = document.getElementById('menu-items-list');
    const categorySelect = document.getElementById('new-item-category');
    
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
    const name = document.getElementById('new-category-name').value.trim();
    if (!name) return alert('Введите название категории');
    
    if (!menuCategories.includes(name)) {
        menuCategories.push(name);
        db.ref('menu/categories').set(menuCategories)
            .then(() => {
                document.getElementById('new-category-name').value = '';
                document.getElementById('add-category-form').classList.add('hidden');
            });
    }
}

function addMenuItem() {
    const name = document.getElementById('new-item-name').value.trim();
    const price = parseInt(document.getElementById('new-item-price').value);
    const category = document.getElementById('new-item-category').value;
    
    if (!name || isNaN(price)) return alert('Заполните все поля корректно!');
    
    const newItem = {
        id: Date.now(),
        name,
        price,
        category
    };
    
    menuItems.push(newItem);
    saveMenuItemsToFirebase();
    
    // Очищаем форму
    document.getElementById('new-item-name').value = '';
    document.getElementById('new-item-price').value = '';
    document.getElementById('add-item-form').classList.add('hidden');
}

function deleteCategory(category) {
    if (!confirm(`Удалить категорию "${category}"? Все напитки этой категории также будут удалены.`)) return;
    
    // Удаляем напитки этой категории
    menuItems = menuItems.filter(item => item.category !== category);
    saveMenuItemsToFirebase();
    
    // Удаляем саму категорию
    menuCategories = menuCategories.filter(c => c !== category);
    db.ref('menu/categories').set(menuCategories);
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
    db.ref('menu/items').set(itemsObj);
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

    const total = order.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById("total").textContent = total;
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
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    
    errorMessage.textContent = '';
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => console.log("Login successful"))
        .catch(error => {
            console.error("Login error:", error);
            errorMessage.textContent = error.message;
        });
}

function logout() {
    auth.signOut();
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
