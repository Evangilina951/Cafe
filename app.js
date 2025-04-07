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

    // ================== ОТПРАВКА ДАННЫХ (без прокси) ================== //
     async function pay() {
      if (!currentUser || order.length === 0) return;
      
      try {
        const URL = "https://script.google.com/macros/s/AKfycbxI4A__-HxfMHvEfUDJ1loQP9QRQJ9YR2AcKsiV01wwfO7c-Lri215L8ukYyY5K6IP_MA/exec";
        const formData = new FormData();
        formData.append('name', order.map(item => item.name).join(", "));
        formData.append('price', order.reduce((sum, item) => sum + item.price, 0));
        formData.append('email', currentUser.email);
        formData.append('date', new Date().toISOString());

        // Используем старый добрый XHR для обхода CORS
        const xhr = new XMLHttpRequest();
        xhr.open('POST', URL, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        xhr.onload = function() {
          if (xhr.status === 200 || xhr.status === 0) {
            alert("Заказ сохранен!");
            order = [];
            updateOrderList();
          } else {
            alert("Ошибка при отправке");
          }
        };
        
        xhr.send(new URLSearchParams(formData));
      } catch (error) {
        console.error(error);
        alert("Ошибка: " + error.message);
      }
    }
