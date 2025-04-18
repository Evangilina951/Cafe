import { db, auth } from '/Cafe/js/firebase-config.js';
import { menuItems } from '/Cafe/js/menu.js';

// DOM элементы
const elements = {
    promocodesPanel: document.getElementById('promocodes-panel'),
    backBtn: document.querySelector('.back-btn'),
    addPromocodeBtn: document.querySelector('.add-promocode-btn'),
    addPromocodeForm: document.getElementById('add-promocode-form'),
    promocodeName: document.getElementById('promocode-name'),
    discountTypePercent: document.getElementById('discount-type-percent'),
    discountTypeFixed: document.getElementById('discount-type-fixed'),
    discountTypeItem: document.getElementById('discount-type-item'),
    discountPercent: document.getElementById('discount-percent'),
    discountFixed: document.getElementById('discount-fixed'),
    freeItemSelect: document.getElementById('free-item'),
    itemSearchInput: document.getElementById('item-search-input'),
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

// Вспомогательные функции
function showElement(element) {
    if (element) {
        element.style.display = 'block';
        element.classList.remove('hidden');
    }
}

function hideElement(element) {
    if (element) {
        element.style.display = 'none';
        element.classList.add('hidden');
    }
}

function isAdmin() {
    return auth.currentUser?.email === 'admin@dismail.com';
}

let promocodes = [];

export async function initPromocodes() {
    if (!isAdmin()) {
        alert("Доступ разрешен только администратору");
        window.location.href = '/Cafe/index.html';
        return;
    }

    try {
        await loadPromocodesFromFirebase();
        setupEventListeners();
        renderPromocodesInterface();
    } catch (error) {
        handleFirebaseError(error);
    }
}

async function loadPromocodesFromFirebase() {
    return new Promise((resolve, reject) => {
        db.ref('promocodes').on('value', 
            (snapshot) => {
                promocodes = snapshot.val() ? Object.entries(snapshot.val()).map(([code, data]) => ({ code, ...data })) : [];
                resolve();
            },
            (error) => {
                reject(error);
            }
        );
    });
}

function handleFirebaseError(error) {
    console.error("Ошибка Firebase:", error);
    
    switch (error.code) {
        case 'PERMISSION_DENIED':
            alert("Ошибка доступа: недостаточно прав");
            window.location.href = '/Cafe/index.html';
            break;
        case 'NETWORK_ERROR':
            alert("Ошибка сети: проверьте подключение");
            break;
        default:
            alert("Ошибка загрузки данных");
    }
}

async function loadMenuItems() {
    return new Promise((resolve) => {
        if (elements.freeItemSelect) {
            elements.freeItemSelect.innerHTML = '<option value="">Выберите блюдо</option>';
            
            // Группировка по категориям
            const categories = {};
            menuItems
                .filter(item => item.visible !== false)
                .sort((a, b) => a.name.localeCompare(b.name))
                .forEach(item => {
                    if (!categories[item.category]) {
                        categories[item.category] = [];
                    }
                    categories[item.category].push(item);
                });

            // Добавление в select с группами
            Object.keys(categories).sort().forEach(category => {
                const optgroup = document.createElement('optgroup');
                optgroup.label = category;
                
                categories[category].forEach(item => {
                    const option = document.createElement('option');
                    option.value = item.id;
                    option.textContent = `${item.name} (${item.price} ₽)`;
                    option.setAttribute('data-search', `${item.name} ${item.category}`.toLowerCase());
                    optgroup.appendChild(option);
                });
                
                elements.freeItemSelect.appendChild(optgroup);
            });
        }
        resolve();
    });
}

function setupEventListeners() {
    // Кнопка "Назад"
    if (elements.backBtn) {
        elements.backBtn.addEventListener('click', () => {
            window.location.href = '/Cafe/index.html';
        });
    }

    // Кнопка "Добавить промокод"
    if (elements.addPromocodeBtn) {
        elements.addPromocodeBtn.addEventListener('click', async () => {
            await loadMenuItems();
            showElement(elements.addPromocodeForm);
            resetPromocodeForm();
        });
    }

    // Переключение типа скидки
    if (elements.discountTypePercent && elements.discountTypeFixed && elements.discountTypeItem) {
        elements.discountTypePercent.addEventListener('change', toggleDiscountFields);
        elements.discountTypeFixed.addEventListener('change', toggleDiscountFields);
        elements.discountTypeItem.addEventListener('change', toggleDiscountFields);
    }

    // Поиск блюд
    if (elements.itemSearchInput) {
        elements.itemSearchInput.addEventListener('input', (e) => {
            const searchText = e.target.value.toLowerCase();
            Array.from(elements.freeItemSelect.options).forEach(option => {
                if (option.value && option.getAttribute('data-search')) {
                    option.style.display = option.getAttribute('data-search').includes(searchText) ? '' : 'none';
                }
            });
        });
    }

    // Ограничения использования
    if (elements.usageLimit) {
        elements.usageLimit.addEventListener('change', () => {
            elements.maxUses.classList.toggle('hidden', elements.usageLimit.value !== 'limited');
        });
    }

    // Ограничение по времени
    if (elements.timeLimit) {
        elements.timeLimit.addEventListener('change', () => {
            elements.expiryDate.classList.toggle('hidden', elements.timeLimit.value !== 'limited');
            if (elements.timeLimit.value === 'limited') {
                const today = new Date().toISOString().split('T')[0];
                elements.expiryDate.min = today;
            }
        });
    }

    // Кнопка "Сохранить промокод"
    if (elements.savePromocodeBtn) {
        elements.savePromocodeBtn.addEventListener('click', savePromocode);
    }
}

function toggleDiscountFields() {
    document.querySelectorAll('.discount-field-group').forEach(group => {
        group.classList.add('hidden');
    });

    const selectedType = document.querySelector('input[name="discount-type"]:checked').value;
    document.getElementById(`${selectedType}-fields`).classList.remove('hidden');
}

function resetPromocodeForm() {
    if (elements.promocodeName) elements.promocodeName.value = '';
    if (elements.discountTypePercent) elements.discountTypePercent.checked = true;
    if (elements.discountPercent) elements.discountPercent.value = '';
    if (elements.discountFixed) elements.discountFixed.value = '';
    if (elements.itemSearchInput) elements.itemSearchInput.value = '';
    if (elements.minOrder) elements.minOrder.value = '';
    if (elements.maxOrder) elements.maxOrder.value = '';
    if (elements.usageLimit) elements.usageLimit.value = 'unlimited';
    if (elements.maxUses) elements.maxUses.value = '';
    if (elements.maxUses) elements.maxUses.classList.add('hidden');
    if (elements.timeLimit) elements.timeLimit.value = 'unlimited';
    if (elements.expiryDate) elements.expiryDate.value = '';
    if (elements.expiryDate) elements.expiryDate.classList.add('hidden');
    if (elements.isActive) elements.isActive.checked = true;

    toggleDiscountFields();
}

function savePromocode() {
    const code = elements.promocodeName.value.trim().toUpperCase();
    
    // Валидация
    if (!code || !/^[A-Z0-9]{3,20}$/.test(code)) {
        alert('Название промокода должно содержать только латинские буквы и цифры (3-20 символов)');
        return;
    }
    
    if (promocodes.some(p => p.code === code)) {
        alert('Промокод с таким названием уже существует');
        return;
    }
    
    const type = document.querySelector('input[name="discount-type"]:checked').value;
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
                alert('Пожалуйста, выберите блюдо из списка');
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
    
    // Сохранение в Firebase
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
                discountInfo = item ? `Бесплатно: ${item.name}` : '[Блюдо удалено]';
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
                <button class="toggle-active-btn" title="${promo.isActive ? 'Деактивировать' : 'Активировать'}">
                    ${promo.isActive ? '✖' : '✓'}
                </button>
                <button class="delete-promocode-btn" title="Удалить">×</button>
            </div>
        `;
        
        // Обработчики действий
        card.querySelector('.copy-promocode-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(promo.code)
                .then(() => alert(`Промокод "${promo.code}" скопирован!`))
                .catch(err => console.error('Ошибка копирования:', err));
        });
        
        card.querySelector('.toggle-active-btn').addEventListener('click', () => {
            const newStatus = !promo.isActive;
            db.ref(`promocodes/${promo.code}/isActive`).set(newStatus)
                .then(() => loadPromocodesFromFirebase().then(renderPromocodesInterface))
                .catch(error => console.error("Ошибка изменения статуса:", error));
        });
        
        card.querySelector('.delete-promocode-btn').addEventListener('click', () => {
            if (confirm(`Удалить промокод "${promo.code}"?`)) {
                db.ref(`promocodes/${promo.code}`).remove()
                    .then(() => loadPromocodesFromFirebase().then(renderPromocodesInterface))
                    .catch(error => console.error("Ошибка удаления:", error));
            }
        });
        
        elements.promocodesList.appendChild(card);
    });
}

// Инициализация
if (window.location.pathname.includes('promocodes.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        auth.onAuthStateChanged(user => {
            if (user?.email === 'admin@dismail.com') {
                initPromocodes();
            } else {
                window.location.href = '/Cafe/index.html';
            }
        });
    });
}
