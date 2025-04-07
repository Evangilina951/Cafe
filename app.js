let order = []; // Здесь храним заказ

// 1. Добавление напитка в заказ
function addDrink(name, price) {
  order.push({ name, price }); // Добавляем в массив
  updateOrderList(); // Обновляем список на странице
}

// 2. Обновление списка заказов
function updateOrderList() {
  const list = document.getElementById("order-list");
  list.innerHTML = ""; // Очищаем список

  order.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.name} - ${item.price} руб.`;
    list.appendChild(li); // Добавляем каждый напиток
  });

  // Считаем общую сумму
  const total = order.reduce((sum, item) => sum + item.price, 0);
  document.getElementById("total").textContent = total;
}

// 3. Отправка данных в Google Таблицу
function pay() {
  if (order.length === 0) {
    alert("Добавьте напитки!");
    return;
  }

  if (confirm("Подтвердите оплату")) {
    order.forEach(item => {
      fetch("ВАШ_URL_СКРИПТА", {
        method: "POST",
        body: JSON.stringify({ name: item.name, price: item.price })
      });
    });

    alert("Оплачено! Данные сохранены.");
    order = []; // Очищаем заказ
    updateOrderList();
  }
}