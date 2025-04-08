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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

let order = [];
let currentUser = null;

// Авторизация
auth.onAuthStateChanged(user => {
  currentUser = user;
  if (user) {
    document.getElementById('auth-form').classList.add('hidden');
    document.getElementById('order-interface').classList.remove('hidden');
    document.getElementById('user-email').textContent = user.email;
  } else {
    document.getElementById('auth-form').classList.remove('hidden');
    document.getElementById('order-interface').classList.add('hidden');
  }
});

function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('error-message');
  
  errorMessage.textContent = '';
  
  auth.signInWithEmailAndPassword(email, password)
    .catch(error => {
      errorMessage.textContent = error.message;
    });
}

function logout() {
  auth.signOut();
}

// Функционал заказа
function addDrink(name, price) {
  if (!currentUser) {
    alert("Сначала войдите в систему!");
    return;
  }
  order.push({ name, price });
  updateOrderList();
}

function updateOrderList() {
  const list = document.getElementById("order-list");
  list.innerHTML = "";

  order.forEach((item, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${item.name} - ${item.price} руб.
      <button onclick="removeItem(${index})" class="remove-btn">×</button>
    `;
    list.appendChild(li);
  });

  document.getElementById("total").textContent = 
    order.reduce((sum, item) => sum + item.price, 0);
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

// JSONP-отправка данных
function pay() {
  if (!currentUser) {
    alert("Войдите в систему");
    return;
  }

  if (order.length === 0) {
    alert("Добавьте напитки");
    return;
  }

  const callbackName = 'jsonpCallback_' + Date.now();
  window[callbackName] = function(response) {
    delete window[callbackName];
    if (response.status === "success") {
      alert("Заказ сохранен!");
      order = [];
      updateOrderList();
    } else {
      alert("Ошибка: " + (response.message || "Неизвестная ошибка"));
    }
  };

  const params = new URLSearchParams({
    name: order.map(i => i.name).join(", "),
    price: order.reduce((sum, i) => sum + i.price, 0),
    email: currentUser.email,
    date: new Date().toISOString(),
    callback: callbackName
  });

  const script = document.createElement('script');
  script.src = `https://script.google.com/macros/s/AKfycbyVSEyq7_3pbSqlAcYR0SO1pgbUno63xTzK6vjYJmllmiGpfANxhSfvKpO-2fYaJq5F8Q/exec?${params}`;
  document.body.appendChild(script);
}
