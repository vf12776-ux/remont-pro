// ===== DARK MODE FUNCTIONALITY =====
function initializeDarkMode() {
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (!darkModeToggle) return;
  
  const savedTheme = localStorage.getItem('darkMode');
  
  // Устанавливаем начальную тему
  if (savedTheme === 'true') {
    document.body.classList.add('dark-mode');
    darkModeToggle.checked = true;
  }
  
  // Обработчик переключения темы
  darkModeToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('darkMode', 'false');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeDarkMode();
  checkAuthStatus();
  
  // Обработчики авторизации
  document.getElementById('login-btn').addEventListener('click', login);
  document.getElementById('register-btn').addEventListener('click', register);
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('show-register').addEventListener('click', showRegisterForm);
  document.getElementById('show-login').addEventListener('click', showLoginForm);
  
  // Обработчики PIN-полей
  document.getElementById('pin-input').addEventListener('input', formatPinInput);
  document.getElementById('new-pin').addEventListener('input', formatPinInput);
  document.getElementById('confirm-pin').addEventListener('input', formatPinInput);
});

function checkAuthStatus() {
  const currentMaster = localStorage.getItem('currentMaster');
  if (currentMaster) {
    showAdminPanel(JSON.parse(currentMaster));
  } else {
    showAuthSection();
  }
}

function showAuthSection() {
  document.getElementById('auth-section').style.display = 'block';
  document.getElementById('admin-content').style.display = 'none';
}

function showAdminPanel(master) {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('admin-content').style.display = 'block';
  document.getElementById('current-user').textContent = `Мастер: ${master.name}`;
  
  // Загружаем цены конкретного мастера
  loadPrices(master.pin);
  
  // Инициализируем остальную функциональность
  initAdminFunctionality(master.pin);
}

function initAdminFunctionality(pin) {
  // Кнопка сохранения
  document.getElementById('save-prices').addEventListener('click', () => savePrices(pin));
  
  // Кнопка сброса
  document.getElementById('reset-prices').addEventListener('click', () => resetPrices(pin));
  
  // Тестовый расчёт
  document.getElementById('test-calc').addEventListener('click', testCalculation);
  
  // Автосохранение при изменении
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', () => {
      document.getElementById('preview').style.display = 'block';
      updatePreview();
    });
  });
}

function formatPinInput(e) {
  // Оставляем только цифры
  e.target.value = e.target.value.replace(/\D/g, '');
}

function showRegisterForm(e) {
  e.preventDefault();
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
}

function showLoginForm(e) {
  e.preventDefault();
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
}

function login() {
  const pin = document.getElementById('pin-input').value;
  
  if (pin.length !== 4) {
    alert('PIN-код должен состоять из 4 цифр');
    return;
  }
  
  const masters = JSON.parse(localStorage.getItem('masters') || '[]');
  const master = masters.find(m => m.pin === pin);
  
  if (master) {
    localStorage.setItem('currentMaster', JSON.stringify(master));
    showAdminPanel(master);
    document.getElementById('pin-input').value = '';
  } else {
    alert('❌ Неверный PIN-код или мастер не зарегистрирован');
  }
}

function register() {
  const name = document.getElementById('master-name').value.trim();
  const newPin = document.getElementById('new-pin').value;
  const confirmPin = document.getElementById('confirm-pin').value;
  
  if (!name) {
    alert('Введите имя или название компании');
    return;
  }
  
  if (newPin.length !== 4) {
    alert('PIN-код должен состоять из 4 цифр');
    return;
  }
  
  if (newPin !== confirmPin) {
    alert('PIN-коды не совпадают');
    return;
  }
  
  const masters = JSON.parse(localStorage.getItem('masters') || '[]');
  
  // Проверяем, не занят ли PIN
  if (masters.find(m => m.pin === newPin)) {
    alert('Этот PIN-код уже занят. Выберите другой.');
    return;
  }
  
  const newMaster = {
    id: Date.now(),
    name: name,
    pin: newPin,
    registeredAt: new Date().toISOString()
  };
  
  masters.push(newMaster);
  localStorage.setItem('masters', JSON.stringify(masters));
  localStorage.setItem('currentMaster', JSON.stringify(newMaster));
  
  // Создаем начальные настройки цен для нового мастера
  initializeMasterPrices(newPin);
  
  showAdminPanel(newMaster);
  alert('✅ Регистрация успешна! Теперь вы можете настроить ваши цены.');
}

function initializeMasterPrices(pin) {
  const defaultPrices = getDefaultPrices();
  const defaultMultipliers = {
    priority: 1.2,
    urgent: 1.5
  };
  
  localStorage.setItem(`repairPrices_${pin}`, JSON.stringify(defaultPrices));
  localStorage.setItem(`urgencyMultipliers_${pin}`, JSON.stringify(defaultMultipliers));
}

function logout() {
  localStorage.removeItem('currentMaster');
  showAuthSection();
  document.getElementById('pin-input').value = '';
  document.getElementById('master-name').value = '';
  document.getElementById('new-pin').value = '';
  document.getElementById('confirm-pin').value = '';
  showLoginForm({ preventDefault: () => {} });
}

// ОБНОВЛЕННЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С КОНКРЕТНЫМ MASTER
function loadPrices(pin) {
  const saved = localStorage.getItem(`repairPrices_${pin}`);
  const prices = saved ? JSON.parse(saved) : getDefaultPrices();
  
  Object.keys(prices).forEach(key => {
    const element = document.getElementById(`price-${key}`);
    if (element) element.value = prices[key];
  });
  
  const multipliers = JSON.parse(localStorage.getItem(`urgencyMultipliers_${pin}`) || '{"priority": 1.2, "urgent": 1.5}');
  document.getElementById('multiplier-priority').value = Math.round((multipliers.priority - 1) * 100);
  document.getElementById('multiplier-urgent').value = Math.round((multipliers.urgent - 1) * 100);
}

function getDefaultPrices() {
  return {
    base: 1500,
    painting: 300,
    floor: 800,
    plumbing: 15000,
    plaster: 400,      // НОВАЯ УСЛУГА
    putty: 250,        // НОВАЯ УСЛУГА
    demolition: 350,   // НОВАЯ УСЛУГА
    primer: 50,
    protection: 30,
    cleaning: 5000,
    garbage: 3000
  };
}

function savePrices(pin) {
  const prices = {
    base: parseInt(document.getElementById('price-base').value),
    painting: parseInt(document.getElementById('price-painting').value),
    floor: parseInt(document.getElementById('price-floor').value),
    plumbing: parseInt(document.getElementById('price-plumbing').value),
    plaster: parseInt(document.getElementById('price-plaster').value),      // НОВАЯ УСЛУГА
    putty: parseInt(document.getElementById('price-putty').value),          // НОВАЯ УСЛУГА
    demolition: parseInt(document.getElementById('price-demolition').value), // НОВАЯ УСЛУГА
    primer: parseInt(document.getElementById('price-primer').value),
    protection: parseInt(document.getElementById('price-protection').value),
    cleaning: parseInt(document.getElementById('price-cleaning').value),
    garbage: parseInt(document.getElementById('price-garbage').value)
  };
  
  const multipliers = {
    priority: 1 + (parseInt(document.getElementById('multiplier-priority').value) / 100),
    urgent: 1 + (parseInt(document.getElementById('multiplier-urgent').value) / 100)
  };
  
  localStorage.setItem(`repairPrices_${pin}`, JSON.stringify(prices));
  localStorage.setItem(`urgencyMultipliers_${pin}`, JSON.stringify(multipliers));
  
  alert('✅ Ваши цены успешно сохранены!');
  updatePreview();
}

function resetPrices(pin) {
  if (confirm('Сбросить все ваши цены к стандартным значениям?')) {
    localStorage.removeItem(`repairPrices_${pin}`);
    localStorage.removeItem(`urgencyMultipliers_${pin}`);
    loadPrices(pin);
    alert('Ваши цены сброшены к стандартным');
  }
}

function testCalculation() {
  const prices = getCurrentPrices();
  const multipliers = JSON.parse(localStorage.getItem('urgencyMultipliers') || '{"priority": 1.2, "urgent": 1.5}');
  
  const area = 50; // тестовая площадь
  let total = area * prices.base; // базовая стоимость
  total += area * prices.painting; // покраска
  total += prices.cleaning; // уборка
  
  const totalPriority = Math.round(total * multipliers.priority);
  const totalUrgent = Math.round(total * multipliers.urgent);
  
  document.getElementById('preview-result').innerHTML = `
    <p><strong>Обычная:</strong> ${total.toLocaleString()} ₽</p>
    <p><strong>Приоритетная:</strong> ${totalPriority.toLocaleString()} ₽</p>
    <p><strong>Срочная:</strong> ${totalUrgent.toLocaleString()} ₽</p>
  `;
  document.getElementById('preview').style.display = 'block';
}

function getCurrentPrices() {
  return {
    base: parseInt(document.getElementById('price-base').value),
    painting: parseInt(document.getElementById('price-painting').value),
    floor: parseInt(document.getElementById('price-floor').value),
    plumbing: parseInt(document.getElementById('price-plumbing').value),
    plaster: parseInt(document.getElementById('price-plaster').value),      // НОВАЯ УСЛУГА
    putty: parseInt(document.getElementById('price-putty').value),          // НОВАЯ УСЛУГА
    demolition: parseInt(document.getElementById('price-demolition').value), // НОВАЯ УСЛУГА
    primer: parseInt(document.getElementById('price-primer').value),
    protection: parseInt(document.getElementById('price-protection').value),
    cleaning: parseInt(document.getElementById('price-cleaning').value),
    garbage: parseInt(document.getElementById('price-garbage').value)
  };
}

function updatePreview() {
  testCalculation();
}
