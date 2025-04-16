import { db } from '/Cafe/js/firebase-config.js';
import { currentUser } from '/Cafe/js/auth.js';
import { menuItems } from '/Cafe/js/menu.js';

const elements = {
    promocodesPanel: document.getElementById('promocodes-panel'),
    backBtn: document.querySelector('.back-btn'),
    addPromocodeBtn: document.querySelector('.add-promocode-btn'),
    addPromocodeForm: document.getElementById('add-promocode-form'),
    promocodeName: document.getElementById('promocode-name'),
    discountTypeRadios: document.querySelectorAll('input[name="discount-type"]'),
    discountFields: document.querySelectorAll('.discount-fields'),
    discountPercent: document.getElementById('discount-percent'),
    discountFixed: document.getElementById('discount-fixed'),
    freeItemSelect: document.getElementById('free-item'),
    minOrder: document.getElementById('min-order'),
    maxOrder: document.getElementById('max-order'),
    usageLimit: document.getElementById('usage-limit'),
    maxUses: document.getElementById('max-uses'),
    timeLimit: document.getElementById('time-limit'),
    expiryDate: document.getElementById('expiry-date'),
    isActive: document.getElementById('is-active'),
    savePromocodeBtn: document.getElementById('save-promocode-btn'),
    promocodesList: document.getElementById('promocodes-list')
};

let promocodes = [];

// Инициализация админ-панели промокодов
export async function initPromocodes() {
    if (!window.location.pathname.includes('promocodes.html')) return;
    if (!elements.promocodesPanel) return;

    if (!currentUser || currentUser.email !== 'admin@dismail.com') {
        alert("Доступ разрешен только администратору");
        window.location.href = '/Cafe/index.html';
        return;
    }

    try {
        await loadPromocodesFromFirebase();
        setupEventListeners();
        renderPromocodesInterface();
    } catch (error) {
        console.error("Ошибка инициализации:", error);
        alert("Ошибка загрузки промокодов");
    }
}

async function loadPromocodesFromFirebase() {
    try {
        const snapshot = await db.ref('promocodes').once('value');
        promocodes = snapshot.val() ? Object.entries(snapshot.val()).map(([code, data]) => ({ code, ...data })) : [];
    } catch (error) {
        console.error("Ошибка загрузки промокодов:", error);
        throw error;
    }
}

function setupEventListeners() {
    elements.backBtn?.addEventListener('click', () => window.location.href = '/Cafe/index.html');
    elements.addPromocodeBtn?.addEventListener('click', () => {
        showElement(elements.addPromocodeForm);
        resetPromocodeForm();
    });
    
    elements.discountTypeRadios?.forEach(radio => {
        radio.addEventListener('change', toggleDiscountFields);
    });
    
    elements.usageLimit?.addEventListener('change', function() {
        elements.maxUses.classList.toggle('hidden', this.value !== 'limited');
    });
    
    elements.timeLimit?.addEventListener('change', function() {
        elements.expiryDate.classList.toggle('hidden', this.value !== 'limited');
        if (this.value === 'limited') {
            const today = new Date().toISOString().split('T')[0];
            elements.expiryDate.min = today;
        }
    });
    
    elements.savePromocodeBtn?.addEventListener('click', savePromocode);
}

function toggleDiscountFields() {
    const selectedType = document.querySelector('input[name="discount-type"]:checked').value;
    elements.discountFields.forEach(field => {
        field.classList.toggle('hidden', field.id !== `${selectedType}-fields`);
    });
}

function resetPromocodeForm() {
    elements.promocodeName.value = '';
    document.querySelector('input[name="discount-type"][value="percent"]').checked = true;
    elements.discountPercent.value = '';
    elements.discountFixed.value = '';
    elements.freeItemSelect.innerHTML = '';
    elements.minOrder.value = '';
    elements.maxOrder.value = '';
    elements.usageLimit.value = 'unlimited';
    elements.maxUses.value = '';
    elements.maxUses.classList.add('hidden');
    elements.timeLimit.value = 'unlimited';
    elements.expiryDate.value = '';
    elements.expiryDate.classList.add('hidden');
    elements.isActive.checked = true;
    
    // Заполняем список блюд
    menuItems.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.name;
        elements.freeItemSelect.appendChild(option);
    });
    
    toggleDiscountFields();
}

function savePromocode() {
    const code = elements.promocodeName.value.trim().toUpperCase();
    const type = document.querySelector('input[name="discount-type"]:checked').value;
    
    // Валидация
    if (!code || !/^[A-Z0-9]{3,20}$/.test(code)) {
        alert('Название промокода должно содержать только латинские буквы и цифры (3-20 символов)');
        return;
    }
    
    if (promocodes.some(p => p.code === code)) {
        alert('Промокод с таким названием уже существует');
        return;
    }
    
    let value = null;
    let itemId = null;
    
    switch (type) {
        case 'percent':
            value = parseInt(elements.discountPercent.value);
            if (isNaN(value) || value < 0 || value > 100) {
                alert('Укажите корректный процент скидки (0-100)');
                return;
            }
            break;
        case 'fixed':
            value = parseInt(elements.discountFixed.value);
            if (isNaN(value) || value <= 0) {
                alert('Укажите корректную сумму скидки');
                return;
            }
            break;
        case 'item':
            itemId = elements.freeItemSelect.value;
            if (!itemId) {
                alert('Выберите блюдо для бесплатного предложения');
                return;
            }
            break;
    }
    
    const minOrder = elements.minOrder.value ? parseInt(elements.minOrder.value) : null;
    const maxOrder = elements.maxOrder.value ? parseInt(elements.maxOrder.value) : null;
    
    if (minOrder !== null && maxOrder !== null && minOrder > maxOrder) {
        alert('Минимальная сумма не может быть больше максимальной');
        return;
    }
    
    const maxUses = elements.usageLimit.value === 'limited' ? parseInt(elements.maxUses.value) : null;
    if (elements.usageLimit.value === 'limited' && (!maxUses || maxUses < 1)) {
        alert('Укажите корректное количество использований');
        return;
    }
    
    const expires = elements.timeLimit.value === 'limited' ? elements.expiryDate.value : null;
    if (elements.timeLimit.value === 'limited' && !expires) {
        alert('Укажите дату окончания действия');
        return;
    }
    
    const isActive = elements.isActive.checked;
    const created = new Date().toISOString();
    
    const promocodeData = {
        type,
        value,
        itemId,
        minOrder,
        maxOrder,
        maxUses,
        usedCount: 0,
        expires,
        isActive,
        created
    };
    
    // Сохраняем в Firebase
    db.ref(`promocodes/${code}`).set(promocodeData)
        .then(() => {
            alert('Промокод успешно сохранен!');
            hideElement(elements.addPromocodeForm);
            loadPromocodesFromFirebase().then(renderPromocodesInterface);
        })
        .catch(error => {
            console.error("Ошибка сохранения промокода:", error);
            alert("Не удалось сохранить промокод");
        });
}

function renderPromocodesInterface() {
    if (!elements.promocodesList) return;
    
    elements.promocodesList.innerHTML = '';
    
    if (promocodes.length === 0) {
        elements.promocodesList.innerHTML = '<p>Нет созданных промокодов</p>';
        return;
    }
    
    promocodes.forEach(promo => {
        const card = document.createElement('div');
        card.className = `promocode-card ${promo.isActive ? '' : 'inactive'}`;
        
        let discountInfo = '';
        switch (promo.type) {
            case 'percent':
                discountInfo = `Скидка ${promo.value}%`;
                break;
            case 'fixed':
                discountInfo = `Скидка ${promo.value} руб`;
                break;
            case 'item':
                const item = menuItems.find(i => i.id == promo.itemId);
                discountInfo = item ? `Бесплатно: ${item.name}` : 'Бесплатное блюдо';
                break;
        }
        
        let conditions = [];
        if (promo.minOrder) conditions.push(`От ${promo.minOrder} руб`);
        if (promo.maxOrder) conditions.push(`До ${promo.maxOrder} руб`);
        if (promo.maxUses) conditions.push(`Макс. ${promo.maxUses} использований`);
        if (promo.expires) conditions.push(`До ${new Date(promo.expires).toLocaleDateString()}`);
        
        card.innerHTML = `
            <div class="promocode-header">
                <span class="promocode-name">${promo.code}</span>
                <span class="promocode-status">${promo.isActive ? 'Активен' : 'Неактивен'}</span>
            </div>
            <div class="promocode-discount">${discountInfo}</div>
            ${conditions.length ? `
                <div class="promocode-conditions">
                    Условия: ${conditions.join(', ')}
                </div>
            ` : ''}
            <div class="promocode-usage">Использован ${promo.usedCount || 0} раз</div>
            <div class="promocode-actions">
                <button class="copy-promocode-btn" title="Копировать">⎘</button>
                <button class="edit-promocode-btn" title="Редактировать">✏️</button>
                <button class="delete-promocode-btn" title="Удалить">×</button>
                <label class="active-toggle" title="${promo.isActive ? 'Деактивировать' : 'Активировать'}">
                    <input type="checkbox" class="active-checkbox" ${promo.isActive ? 'checked' : ''}>
                </label>
            </div>
        `;
        
        elements.promocodesList.appendChild(card);
    });
    
    setupPromocodeActions();
}

function setupPromocodeActions() {
    // Копирование промокода
    document.querySelectorAll('.copy-promocode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const code = this.closest('.promocode-card').querySelector('.promocode-name').textContent;
            navigator.clipboard.writeText(code)
                .then(() => alert(`Промокод "${code}" скопирован!`))
                .catch(err => console.error('Ошибка копирования:', err));
        });
    });
    
    // Переключение активности
    document.querySelectorAll('.active-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const code = this.closest('.promocode-card').querySelector('.promocode-name').textContent;
            const isActive = this.checked;
            
            db.ref(`promocodes/${code}/isActive`).set(isActive)
                .then(() => {
                    const card = this.closest('.promocode-card');
                    card.classList.toggle('inactive', !isActive);
                    card.querySelector('.promocode-status').textContent = isActive ? 'Активен' : 'Неактивен';
                    this.parentNode.title = isActive ? 'Деактивировать' : 'Активировать';
                })
                .catch(error => {
                    console.error("Ошибка обновления статуса:", error);
                    this.checked = !this.checked;
                    alert("Не удалось изменить статус промокода");
                });
        });
    });
    
    // Удаление промокода
    document.querySelectorAll('.delete-promocode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const code = this.closest('.promocode-card').querySelector('.promocode-name').textContent;
            if (confirm(`Удалить промокод "${code}"?`)) {
                db.ref(`promocodes/${code}`).remove()
                    .then(() => loadPromocodesFromFirebase().then(renderPromocodesInterface))
                    .catch(error => {
                        console.error("Ошибка удаления:", error);
                        alert("Не удалось удалить промокод");
                    });
            }
        });
    });
}

// Инициализация при загрузке страницы
if (window.location.pathname.includes('promocodes.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const { auth } = await import('/Cafe/js/firebase-config.js');
            auth.onAuthStateChanged(user => {
                if (user?.email === 'admin@dismail.com') {
                    initPromocodes();
                } else {
                    window.location.href = '/Cafe/index.html';
                }
            });
        } catch (error) {
            console.error("Ошибка инициализации Firebase:", error);
        }
    });
}
