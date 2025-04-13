import { db } from '/Cafe/js/firebase-config.js';
import { auth, onAuthStateChanged, signOut } from '/Cafe/js/auth.js';

// Проверка прав администратора
onAuthStateChanged(auth, (user) => {
    if (user && user.email === 'admin@dismail.com') {
        document.getElementById('admin-promocodes').classList.remove('hidden');
        initPromoPage();
    } else {
        window.location.href = '/Cafe/404.html';
    }
});

// Инициализация страницы
function initPromoPage() {
    loadPromoCodes();
    loadMenuItems();
    setupEventListeners();
}

// Загрузка промокодов
function loadPromoCodes() {
    const promoList = document.getElementById('promo-list');
    promoList.innerHTML = '<div class="loading">Загрузка промокодов...</div>';
    
    db.ref('promocodes').on('value', (snapshot) => {
        const promos = snapshot.val();
        promoList.innerHTML = '';
        
        if (!promos) {
            promoList.innerHTML = '<div class="no-promos">Нет созданных промокодов</div>';
            return;
        }
        
        Object.entries(promos).forEach(([code, promo]) => {
            promoList.appendChild(createPromoCard(code, promo));
        });
    });
}

// Создание карточки промокода
function createPromoCard(code, promo) {
    const card = document.createElement('div');
    card.className = 'promo-card';
    
    const statusClass = promo.isActive ? 'active' : 'inactive';
    const expiryText = promo.expires ? new Date(promo.expires).toLocaleDateString() : 'Нет';
    const usesText = promo.maxUses ? `${promo.usedCount || 0}/${promo.maxUses}` : 'Без ограничений';
    
    let discountText = '';
    if (promo.type === 'percent') {
        discountText = `Скидка: ${promo.value}%`;
    } else if (promo.type === 'item') {
        discountText = `Бесплатно: ${promo.itemName || promo.itemId}`;
    }
    
    card.innerHTML = `
        <div class="promo-card-header">
            <span class="promo-name">${code}</span>
            <span class="promo-status ${statusClass}">${promo.isActive ? 'Активен' : 'Неактивен'}</span>
        </div>
        <div class="promo-details">
            <div class="promo-detail">
                <span class="promo-detail-label">Тип:</span>
                <span>${discountText}</span>
            </div>
            <div class="promo-detail">
                <span class="promo-detail-label">Мин. заказ:</span>
                <span>${promo.minOrder || 0} ₽</span>
            </div>
            <div class="promo-detail">
                <span class="promo-detail-label">Использований:</span>
                <span>${usesText}</span>
            </div>
            <div class="promo-detail">
                <span class="promo-detail-label">Действует до:</span>
                <span>${expiryText}</span>
            </div>
        </div>
        <div class="promo-actions">
            <button class="admin-btn" data-code="${code}">Изменить</button>
            <button class="admin-btn primary" data-code="${code}">Копировать</button>
        </div>
    `;
    
    return card;
}

// Загрузка блюд для выпадающего списка
function loadMenuItems() {
    db.ref('menu/items').once('value').then((snapshot) => {
        const items = snapshot.val();
        const select = document.getElementById('free-item');
        select.innerHTML = '<option value="">Выберите блюдо</option>';
        
        Object.values(items).forEach(item => {
            if (item.visible !== false) {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = `${item.name} (${item.price} ₽)`;
                select.appendChild(option);
            }
        });
    });
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Переключение типа скидки
    document.querySelectorAll('input[name="discount-type"]').forEach(radio => {
        radio.addEventListener('change', toggleDiscountFields);
    });
    
    // Ограничения
    document.getElementById('use-limit-check').addEventListener('change', (e) => {
        document.getElementById('use-limit').disabled = !e.target.checked;
    });
    
    document.getElementById('use-date-check').addEventListener('change', (e) => {
        document.getElementById('expiry-date').disabled = !e.target.checked;
    });
    
    // Модальное окно
    document.getElementById('add-promo-btn').addEventListener('click', () => {
        document.getElementById('promo-modal').classList.remove('hidden');
        document.getElementById('promo-form').reset();
    });
    
    document.querySelector('.close-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-btn').addEventListener('click', closeModal);
    
    // Сохранение
    document.getElementById('promo-form').addEventListener('submit', savePromoCode);
    
    // Выход
    document.getElementById('logout-btn').addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = '/Cafe/');
    });
}

// Переключение полей скидки
function toggleDiscountFields() {
    const type = document.querySelector('input[name="discount-type"]:checked').value;
    document.getElementById('percent-fields').classList.toggle('hidden', type !== 'percent');
    document.getElementById('item-fields').classList.toggle('hidden', type !== 'item');
}

// Закрытие модального окна
function closeModal() {
    document.getElementById('promo-modal').classList.add('hidden');
}

// Сохранение промокода
function savePromoCode(e) {
    e.preventDefault();
    
    const form = e.target;
    const code = form['promo-name'].value.trim().toUpperCase();
    const type = form['discount-type'].value;
    
    const promoData = {
        type,
        isActive: form['is-active'].checked,
        minOrder: parseInt(form['min-order'].value) || 0,
        created: new Date().toISOString()
    };
    
    if (type === 'percent') {
        promoData.value = parseInt(form['discount-value'].value);
    } else if (type === 'item') {
        promoData.itemId = form['free-item'].value;
    }
    
    if (form['use-limit-check'].checked) {
        promoData.maxUses = parseInt(form['use-limit'].value);
        promoData.usedCount = 0;
    }
    
    if (form['use-date-check'].checked) {
        promoData.expires = form['expiry-date'].value;
    }
    
    db.ref(`promocodes/${code}`).set(promoData)
        .then(() => {
            alert('Промокод успешно сохранен!');
            closeModal();
        })
        .catch(error => {
            console.error('Ошибка сохранения:', error);
            alert('Ошибка при сохранении промокода');
        });
}

// Валидация промокода (для использования в order.js)
export function validatePromoCode(code, orderTotal, orderItems) {
    return db.ref(`promocodes/${code}`).once('value').then(snapshot => {
        const promo = snapshot.val();
        
        if (!promo || !promo.isActive) throw new Error('Промокод недействителен');
        if (promo.expires && new Date(promo.expires) < new Date()) throw new Error('Промокод истек');
        if (promo.minOrder && orderTotal < promo.minOrder) throw new Error(`Минимальная сумма: ${promo.minOrder} ₽`);
        if (promo.maxUses && promo.usedCount >= promo.maxUses) throw new Error('Лимит использований исчерпан');
        
        return promo;
    });
}
