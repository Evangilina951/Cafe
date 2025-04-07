// Конфигурация Firebase (замените на свои данные)
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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Переменные
let order = [];
let currentUser = null;

// Проверка состояния авторизации
auth.onAuthStateChanged(user => {
  currentUser = user;
  if (user) {
    // Показываем интерфейс заказов
    document.getElementById('auth-form').classList.add('hidden');
    document.getElementById('order-interface').classList.remove('hidden');
    document.getElementById('user-email').textContent = user.email;
  } else {
    // Показываем форму входа
    document.getElementById('auth-form').classList.remove('hidden');
    document.getElementById('order-interface').classList.add('hidden');
  }
});

// Функция входа
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  auth.signInWithEmailAndPassword(email, password)
    .catch(error => {
      document.getElementById('error-message').textContent = error.message;
    });
}

// Функция выхода
function logout() {
  auth.signOut();
}

// 1. Добавление напитка в заказ
function addDrink(name, price) {
  if (!currentUser) {
    alert("Сначала войдите в систему!");
    return;
  }
  
  order.push({ name, price });
  updateOrderList();
}

// 2. Обновление списка заказов
function updateOrderList() {
  const list = document.getElementById("order-list");
  list.innerHTML = "";

  order.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.name} - ${item.price} руб.`;
    list.appendChild(li);
  });

  const total = order.reduce((sum, item) => sum + item.price, 0);
  document.getElementById("total").textContent = total;
}

// 3. Отправка данных в Google Таблицу
async function pay() {
  if (!currentUser) {
    alert("Сначала войдите в систему!");
    return;
  }

  if (order.length === 0) {
    alert("Добавьте напитки!");
    return;
  }

  if (confirm("Подтвердите оплату")) {
    try {
      // Отправляем каждый товар с email пользователя
      for (const item of order) {
        await fetch("https://script.google.com/macros/s/AKfycbxk40vLFzdMtAlJNowi5A02Ea4drKtlCWkzsbwmsnrxjHcm7bS2GuPuIYvg3ENk-ylaPg/exec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: item.name,
            price: item.price,
            email: currentUser.email
          })
        });
      }
      
      alert("Оплачено! Данные сохранены.");
      order = [];
      updateOrderList();
    } catch (err) {
      console.error("Ошибка:", err);
      alert("Ошибка при сохранении данных");
    }
  }
}
