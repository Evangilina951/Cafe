import { currentUser } from '/Cafe/js/auth.js';

let order = [];

// DOM элементы
const elements = {
    orderList: document.getElementById('order-list'),
    totalElement: document.getElementById('total'),
    clearBtn: document.querySelector('.clear-btn'),
    payBtn: document.querySelector('.pay-btn')
};

export function addToOrder(name, price) {
    const existingItem = order.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        order.push({ name, price, quantity: 1 });
    }
    updateOrderList();
}

function updateOrderList() {
    if (!elements.orderList) return;
    
    elements.orderList.innerHTML = "";

    order.forEach((item, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="item-name">${item.name}</span>
            <span class="item-price">${item.price} ₽</span>
            <div class="item-controls">
                <button class="quantity-btn minus-btn" data-index="${index}" data-delta="-1">-</button>
                <span class="quantity">${item.quantity}</span>
                <button class="quantity-btn plus-btn" data-index="${index}" data-delta="1">+</button>
                <button class="remove-btn" data-index="${index}">×</button>
            </div>
        `;
        elements.orderList.appendChild(li);
    });

    if (elements.totalElement) {
        const total = order.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        elements.totalElement.textContent = total;
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

function pay() {
    if (!currentUser) {
        alert("Войдите в систему");
        return;
    }

    if (order.length === 0) {
        alert("Добавьте напитки");
        return;
    }

    // Здесь должна быть логика оплаты
    alert("Заказ сохранен!");
    order = [];
    updateOrderList();
}

// Инициализация обработчиков событий
export function initOrder() {
    if (elements.clearBtn) {
        elements.clearBtn.addEventListener('click', clearOrder);
    }
    
    if (elements.payBtn) {
        elements.payBtn.addEventListener('click', pay);
    }
    
    // Делегирование событий для кнопок изменения количества
    if (elements.orderList) {
        elements.orderList.addEventListener('click', (e) => {
            if (e.target.classList.contains('quantity-btn')) {
                const index = parseInt(e.target.dataset.index);
                const delta = parseInt(e.target.dataset.delta);
                changeQuantity(index, delta);
            } else if (e.target.classList.contains('remove-btn')) {
                const index = parseInt(e.target.dataset.index);
                removeItem(index);
            }
        });
    }
}
