// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDB8Vtxg3SjVyHRJ3ZOXT8osnHYrO_uw4A",
    authDomain: "cafe-90de8.firebaseapp.com",
    projectId: "cafe-90de8",
    storageBucket: "cafe-90de8.firebasestorage.app",
    messagingSenderId: "1086414728245",
    appId: "1:1086414728245:web:fbbec8b3adf4eba659957c",
    measurementId: "G-2FVD2KRF16"
};

// Инициализация Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

let order = [];
let currentUser = null;

// Функция для гарантированного отображения элемента
function showElement(element) {
    element.style.display = 'block';
    element.style.visibility = 'visible';
    element.style.opacity = '1';
    element.classList.remove('hidden');
}

// Функция для гарантированного скрытия элемента
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
    
    if (user) {
        console.log("User logged in");
        currentUser = user;
        
        // Гарантированное скрытие формы
        hideElement(authForm);
        
        // Гарантированное отображение интерфейса
        showElement(orderInterface);
        
        document.getElementById('user-email').textContent = user.email;
        
        // Дополнительная проверка для Firefox
        setTimeout(() => {
            if (window.getComputedStyle(orderInterface).display === 'none') {
                console.log("Forcing display in Firefox");
                orderInterface.style.display = 'block';
            }
        }, 50);
    } else {
        console.log("User logged out");
        currentUser = null;
        
        // Гарантированное отображение формы
        showElement(authForm);
        
        // Гарантированное скрытие интерфейса
        hideElement(orderInterface);
        
        order = [];
        updateOrderList();
    }
});

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    
    errorMessage.textContent = '';
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            console.log("Login successful");
        })
        .catch(error => {
            console.error("Login error:", error);
            errorMessage.textContent = error.message;
        });
}

function logout() {
  auth.signOut();
}

// Новый функционал заказа с группировкой позиций
function addDrink(name, price) {
  if (!currentUser) {
    alert("Сначала войдите в систему!");
    return;
  }
  
  // Ищем позицию в заказе
  const existingItemIndex = order.findIndex(item => item.name === name);
  
  if (existingItemIndex >= 0) {
    // Если позиция уже есть - увеличиваем количество
    order[existingItemIndex].quantity += 1;
  } else {
    // Если позиции нет - добавляем новую
    order.push({ 
      name, 
      price,
      quantity: 1
    });
  }
  
  updateOrderList();
}

function updateOrderList() {
  const list = document.getElementById("order-list");
  list.innerHTML = "";

  order.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "order-item";
    li.innerHTML = `
      <span class="item-name">${item.name}</span>
      <span class="item-price">${item.price} руб.</span>
      <div class="quantity-controls">
        <button onclick="changeQuantity(${index}, -1)" class="quantity-btn minus">-</button>
        <span class="quantity">${item.quantity}</span>
        <button onclick="changeQuantity(${index}, 1)" class="quantity-btn plus">+</button>
        <button onclick="removeItem(${index})" class="remove-btn">×</button>
      </div>
    `;
    list.appendChild(li);
  });

  document.getElementById("total").textContent = 
    order.reduce((sum, item) => sum + (item.price * item.quantity), 0);
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

// Модифицированная функция оплаты с учетом количества
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
  
  order.forEach((item, index) => {
    // Для каждого экземпляра позиции (с учетом количества)
    for (let i = 0; i < item.quantity; i++) {
      const callbackName = `jsonpCallback_${Date.now()}_${index}_${i}`;
      window[callbackName] = function(response) {
        delete window[callbackName];
        if (response.status !== "success") {
          console.error("Ошибка сохранения позиции:", item.name, response.message);
        }
        
        processedItems++;
        // После сохранения всех позиций показываем уведомление
        if (processedItems === getTotalItems()) {
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

// Вспомогательная функция для подсчета общего количества позиций
function getTotalItems() {
  return order.reduce((sum, item) => sum + item.quantity, 0);
}
