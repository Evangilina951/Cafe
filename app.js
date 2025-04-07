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

// Переменные приложения
let order = [];
let currentUser = null;

// Проверка состояния авторизации при загрузке
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        // Пользователь авторизован
        document.getElementById('auth-form').classList.add('hidden');
        document.getElementById('order-interface').classList.remove('hidden');
        document.getElementById('user-email').textContent = user.email;
    } else {
        // Пользователь не авторизован
        document.getElementById('auth-form').classList.remove('hidden');
        document.getElementById('order-interface').classList.add('hidden');
    }
});

// Функция входа
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');
    
    errorMessage.textContent = '';
    
    if (!email || !password) {
        errorMessage.textContent = 'Введите email и пароль';
        return;
    }

    auth.signInWithEmailAndPassword(email, password)
        .catch(error => {
            console.error('Ошибка входа:', error);
            errorMessage.textContent = 'Ошибка входа: ' + error.message;
        });
}

// Функция выхода
function logout() {
    auth.signOut()
        .then(() => {
            order = [];
            updateOrderList();
        })
        .catch(error => {
            console.error('Ошибка выхода:', error);
        });
}

// Добавление напитка в заказ
function addDrink(name, price) {
    if (!currentUser) {
        alert('Пожалуйста, войдите в систему');
        return;
    }
    
    order.push({ name, price });
    updateOrderList();
}

// Обновление списка заказов
function updateOrderList() {
    const list = document.getElementById('order-list');
    list.innerHTML = '';

    order.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            ${item.name} - ${item.price} руб.
            <button onclick="removeItem(${index})" style="float: right; padding: 2px 5px; background: #f44336;">×</button>
        `;
        list.appendChild(li);
    });

    // Обновляем итоговую сумму
    const total = order.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('total').textContent = total;
}

// Удаление позиции из заказа
function removeItem(index) {
    order.splice(index, 1);
    updateOrderList();
}

// Очистка всего заказа
function clearOrder() {
    if (order.length === 0) return;
    
    if (confirm('Вы уверены, что хотите очистить заказ?')) {
        order = [];
        updateOrderList();
    }
}

// Отправка заказа
async function pay() {
    if (!currentUser) {
        alert('Пожалуйста, войдите в систему');
        return;
    }

    if (order.length === 0) {
        alert('Добавьте напитки в заказ');
        return;
    }

    if (!confirm(`Подтвердить заказ на ${document.getElementById('total').textContent} руб.?`)) {
        return;
    }


try {
        // URL вашего Google Apps Script
        const scriptUrl = "https://script.google.com/macros/s/AKfycbxglM-7_EmARAX7Q-3o-88-HstwO9mM8iwq5NUO8vDZH6DWfalK3-Y0gR-gg6c6P_r0/exec";
        
        // Отправляем каждый товар с email пользователя
        for (const item of order) {
            await fetch(scriptUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: item.name,
                    price: item.price,
                    email: currentUser.email,
                    date: new Date().toISOString()
                })
            });
        }
        
        alert('Заказ успешно сохранен!');
        order = [];
        updateOrderList();
    } catch (error) {
        console.error('Ошибка при сохранении заказа:', error);
        alert('Произошла ошибка при сохранении заказа');
    }
}
