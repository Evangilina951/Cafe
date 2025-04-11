import { db } from '/Cafe/js/firebase-config.js';
import { menuCategories, menuItems } from '/Cafe/js/menu.js';
import { currentUser } from '/Cafe/js/auth.js';

// Получаем все необходимые DOM элементы
const elements = {
  adminPanel: document.getElementById('admin-panel'),
  orderInterface: document.getElementById('order-interface'),
  addCategoryForm: document.getElementById('add-category-form'),
  addItemForm: document.getElementById('add-item-form'),
  newCategoryName: document.getElementById('new-category-name'),
  newItemName: document.getElementById('new-item-name'),
  newItemPrice: document.getElementById('new-item-price'),
  newItemCategory: document.getElementById('new-item-category'),
  ingredientsList: document.getElementById('ingredients-list'),
  categoriesList: document.getElementById('categories-list'),
  menuItemsList: document.getElementById('menu-items-list'),
  categoryFilter: document.getElementById('category-filter')
};

let activeCategoryFilter = null;

// Инициализация админ-панели
if (!adminPanel) return;

    // Обработчики кнопок
    document.querySelector('.admin-btn')?.addEventListener('click', () => {
        if (!currentUser || currentUser.email !== 'admin@dismail.com') {
            alert("Доступ разрешен только администратору");
            return;
        }
        adminPanel.style.display = 'block';
        if (orderInterface) orderInterface.style.display = 'none';
        loadMenuData();
    });

  

  // Назначаем обработчики событий
  document.querySelector('.admin-btn')?.addEventListener('click', showAdminPanel);
  document.querySelector('.back-btn')?.addEventListener('click', () => {
        if (adminPanel) adminPanel.style.display = 'none';
        if (orderInterface) orderInterface.style.display = 'block';
  document.querySelector('.add-category-btn')?.addEventListener('click', () => {
    elements.addCategoryForm.style.display = 'block';
  });
  document.querySelector('.add-item-btn')?.addEventListener('click', () => {
    elements.addItemForm.style.display = 'block';
    resetAddItemForm();
  });
  document.getElementById('add-category-btn')?.addEventListener('click', addCategory);
  document.getElementById('add-menu-item-btn')?.addEventListener('click', addMenuItem);

  initIngredientsHandlers();
}

// Показать админ-панель
export function showAdminPanel() {
  if (!currentUser || currentUser.email !== 'admin@dismail.com') {
    alert("Доступ разрешен только администратору");
    return;
  }

  if (elements.adminPanel && elements.orderInterface) {
    elements.adminPanel.style.display = 'block';
    elements.orderInterface.style.display = 'none';
    loadMenuData();
  }
}

// Скрыть админ-панель
function hideAdminPanel() {
  if (elements.adminPanel && elements.orderInterface) {
    elements.adminPanel.style.display = 'none';
    elements.orderInterface.style.display = 'block';
  }
}

// Сброс формы добавления товара
function resetAddItemForm() {
  elements.newItemName.value = '';
  elements.newItemPrice.value = '';
  elements.ingredientsList.innerHTML = `
    <div class="ingredient-item">
      <input type="text" class="ingredient-name" placeholder="Название">
      <input type="text" class="ingredient-quantity" placeholder="Количество">
      <button class="remove-ingredient-btn">×</button>
    </div>
  `;
  initIngredientsHandlers();
}

// Добавление нового товара
function addMenuItem() {
  const name = elements.newItemName.value.trim();
  const price = parseInt(elements.newItemPrice.value);
  const category = elements.newItemCategory.value;

  const ingredients = [];
  document.querySelectorAll('#ingredients-list .ingredient-item').forEach(item => {
    const ingName = item.querySelector('.ingredient-name').value.trim();
    const quantity = item.querySelector('.ingredient-quantity').value.trim();
    if (ingName && quantity) ingredients.push(`${ingName} ${quantity}`);
  });

  if (!name || isNaN(price) || !category || ingredients.length === 0) {
    alert("Заполните все поля и добавьте хотя бы один ингредиент!");
    return;
  }

  const newItem = {
    id: Date.now(),
    name,
    price,
    category,
    ingredients
  };

  menuItems.push(newItem);
  updateMenuInFirebase()
    .then(() => {
      elements.addItemForm.style.display = 'none';
      resetAddItemForm();
      loadMenuData();
    })
    .catch(error => {
      console.error("Ошибка сохранения:", error);
      alert("Не удалось сохранить товар");
      menuItems.pop(); // Откатываем добавление
    });
}

// Обновление меню в Firebase
function updateMenuInFirebase() {
  const itemsObj = {};
  menuItems.forEach(item => {
    itemsObj['item' + item.id] = item;
  });
  return db.ref('menu').update({
    categories: menuCategories,
    items: itemsObj
  });
}

// Инициализация работы с ингредиентами
function initIngredientsHandlers() {
  // Добавление нового ингредиента
  document.getElementById('add-ingredient-btn')?.addEventListener('click', () => {
    const newIngredient = document.createElement('div');
    newIngredient.className = 'ingredient-item';
    newIngredient.innerHTML = `
      <input type="text" class="ingredient-name" placeholder="Название">
      <input type="text" class="ingredient-quantity" placeholder="Количество">
      <button class="remove-ingredient-btn">×</button>
    `;
    elements.ingredientsList.appendChild(newIngredient);
    
    // Обработчик удаления
    newIngredient.querySelector('.remove-ingredient-btn').addEventListener('click', () => {
      newIngredient.remove();
    });
  });

  // Инициализация существующих кнопок удаления
  document.querySelectorAll('.remove-ingredient-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      this.closest('.ingredient-item').remove();
    });
  });
}

// Загрузка данных меню
function loadMenuData() {
  if (!elements.adminPanel || !elements.categoriesList || !elements.menuItemsList) return;

  // Очищаем списки
  elements.categoriesList.innerHTML = '<h3>Категории</h3>';
  elements.menuItemsList.innerHTML = '<h3>Блюда</h3>';
  elements.newItemCategory.innerHTML = '';
  elements.categoryFilter.innerHTML = '';

  // Добавляем кнопку "Все категории"
  const allBtn = document.createElement('button');
  allBtn.className = 'filter-btn' + (activeCategoryFilter === null ? ' active' : '');
  allBtn.textContent = 'Все';
  allBtn.onclick = () => {
    activeCategoryFilter = null;
    loadMenuData();
  };
  elements.categoryFilter.appendChild(allBtn);

  // Добавляем категории
  menuCategories.forEach(category => {
    // Кнопка фильтра
    const filterBtn = document.createElement('button');
    filterBtn.className = 'filter-btn' + (activeCategoryFilter === category ? ' active' : '');
    filterBtn.textContent = category;
    filterBtn.onclick = () => {
      activeCategoryFilter = category;
      loadMenuData();
    };
    elements.categoryFilter.appendChild(filterBtn);

    // Элемент списка категорий
    const categoryCard = document.createElement('div');
    categoryCard.className = 'category-card';
    categoryCard.innerHTML = `
      <span>${category}</span>
      <button class="delete-category-btn">×</button>
    `;
    elements.categoriesList.appendChild(categoryCard);

    // Опция в выпадающем списке
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    elements.newItemCategory.appendChild(option);
  });

  // Фильтрация товаров
  const filteredItems = activeCategoryFilter
    ? menuItems.filter(item => item.category === activeCategoryFilter)
    : menuItems;

  // Отображение товаров
  if (filteredItems.length === 0) {
    elements.menuItemsList.innerHTML += '<p>Нет товаров в выбранной категории</p>';
    return;
  }

  filteredItems.forEach(item => {
    const itemCard = document.createElement('div');
    itemCard.className = 'menu-item-card';
    itemCard.dataset.id = item.id;
    itemCard.innerHTML = `
      <div class="item-main-info">
        <div>
          <strong>${item.name}</strong>
          <div class="item-category">${item.category}</div>
          <div class="item-price">${item.price} ₽</div>
          ${item.ingredients?.length ? `
            <div class="item-ingredients">
              <strong>Состав:</strong>
              <ul>${item.ingredients.map(ing => `<li>${ing}</li>`).join('')}</ul>
            </div>
          ` : ''}
        </div>
        <div class="item-actions">
          <button class="edit-item-btn">✏️</button>
          <button class="delete-item-btn">×</button>
        </div>
      </div>
    `;
    elements.menuItemsList.appendChild(itemCard);
  });

  initAdminPanelHandlers();
}

// Инициализация обработчиков админ-панели
function initAdminPanelHandlers() {
  // Удаление категории
  document.querySelectorAll('.delete-category-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const category = this.previousElementSibling.textContent;
      if (confirm(`Удалить категорию "${category}"? Все товары также будут удалены.`)) {
        menuCategories = menuCategories.filter(c => c !== category);
        menuItems = menuItems.filter(item => item.category !== category);
        updateMenuInFirebase().then(loadMenuData);
      }
    });
  });

  // Удаление товара
  document.querySelectorAll('.delete-item-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const itemId = parseInt(this.closest('.menu-item-card').dataset.id);
      if (confirm('Удалить этот товар?')) {
        menuItems = menuItems.filter(item => item.id !== itemId);
        updateMenuInFirebase().then(loadMenuData);
      }
    });
  });
}

// Добавление новой категории
function addCategory() {
  const name = elements.newCategoryName.value.trim();
  if (!name) return alert('Введите название категории');
  
  if (!menuCategories.includes(name)) {
    menuCategories.push(name);
    db.ref('menu/categories').set(menuCategories)
      .then(() => {
        elements.newCategoryName.value = '';
        elements.addCategoryForm.style.display = 'none';
        loadMenuData();
      })
      .catch(error => {
        console.error("Ошибка сохранения:", error);
        alert("Не удалось добавить категорию");
      });
  }
}
