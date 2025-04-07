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

// Переменные приложения
let order = [];
let currentUser = null;

// ================== АВТОРИЗАЦИЯ ================== //
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

// ================== ФУНКЦИОНАЛ ЗАКАЗА ================== //
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

  const total = order.reduce((sum, item) => sum + item.price, 0);
  document.getElementById("total").textContent = total;
}

function removeItem(index) {
  order.splice(index, 1);
  updateOrderList();
}

function clearOrder() {
  if (order.length === 0) return;
  if (confirm("Вы уверены, что хотите очистить заказ?")) {
    order = [];
    updateOrderList();
  }
}

// ================== ОТПРАВКА ДАННЫХ ================== //
async function pay() {
  if (!currentUser) {
    alert("Пожалуйста, войдите в систему");
    return;
  }

  if (order.length === 0) {
    alert("Добавьте напитки в заказ");
    return;
  }

  if (!confirm(`Подтвердить заказ на ${document.getElementById('total').textContent} руб.?`)) {
    return;
  }

  try {
    const scriptUrl = "https://script.google.com/macros/s/AKfycbxglM-7_EmARAX7Q-3o-88-HstwO9mM8iwq5NUO8vDZH6DWfalK3-Y0gR-gg6c6P_r0/exec";
    
    // Используем GET с параметрами для обхода CORS
    const params = new URLSearchParams();
    params.append('name', order.map(item => item.name).join(', '));
    params.append('price', order.reduce((sum, item) => sum + item.price, 0));
    params.append('email', currentUser.email);
    params.append('date', new Date().toISOString());
    
    const response = await fetch(`${scriptUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Ошибка сервера');
    
    alert('Заказ успешно сохранен!');
    order = [];
    updateOrderList();
    
  } catch (error) {
    console.error('Ошибка:', error);
    alert(`Ошибка сохранения: ${error.message}\n\nПроверьте консоль (F12) для деталей`);
  }
}

// Стили для кнопки удаления
const style = document.createElement('style');
style.textContent = `
  .remove-btn {
    float: right;
    padding: 2px 5px;
    background: #f44336;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
  }
  .remove-btn:hover {
    background: #d32f2f;
  }
`;
document.head.appendChild(style);
