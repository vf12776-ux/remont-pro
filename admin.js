document.addEventListener('DOMContentLoaded', () => {
  // Загружаем текущие цены
  loadPrices();
  
  // Кнопка сохранения
  document.getElementById('save-prices').addEventListener('click', savePrices);
  
  // Кнопка сброса
  document.getElementById('reset-prices').addEventListener('click', resetPrices);
  
  // Тестовый расчёт
  document.getElementById('test-calc').addEventListener('click', testCalculation);
  
  // Автосохранение при изменении
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('change', () => {
      document.getElementById('preview').style.display = 'block';
      updatePreview();
    });
  });
});

function loadPrices() {
  const saved = localStorage.getItem('repairPrices');
  const prices = saved ? JSON.parse(saved) : getDefaultPrices();
  
  // Заполняем форму
  Object.keys(prices).forEach(key => {
    const element = document.getElementById(`price-${key}`);
    if (element) element.value = prices[key];
  });
  
  // Множители срочности
  const multipliers = JSON.parse(localStorage.getItem('urgencyMultipliers') || '{"priority": 1.2, "urgent": 1.5}');
  document.getElementById('multiplier-priority').value = Math.round((multipliers.priority - 1) * 100);
  document.getElementById('multiplier-urgent').value = Math.round((multipliers.urgent - 1) * 100);
}

function getDefaultPrices() {
  return {
    base: 1500,
    painting: 300,
    floor: 800,
    plumbing: 15000,
    primer: 50,
    protection: 30,
    cleaning: 5000,
    garbage: 3000
  };
}

function savePrices() {
  const prices = {
    base: parseInt(document.getElementById('price-base').value),
    painting: parseInt(document.getElementById('price-painting').value),
    floor: parseInt(document.getElementById('price-floor').value),
    plumbing: parseInt(document.getElementById('price-plumbing').value),
    primer: parseInt(document.getElementById('price-primer').value),
    protection: parseInt(document.getElementById('price-protection').value),
    cleaning: parseInt(document.getElementById('price-cleaning').value),
    garbage: parseInt(document.getElementById('price-garbage').value)
  };
  
  const multipliers = {
    priority: 1 + (parseInt(document.getElementById('multiplier-priority').value) / 100),
    urgent: 1 + (parseInt(document.getElementById('multiplier-urgent').value) / 100)
  };
  
  localStorage.setItem('repairPrices', JSON.stringify(prices));
  localStorage.setItem('urgencyMultipliers', JSON.stringify(multipliers));
  
  alert('✅ Цены успешно сохранены!');
  updatePreview();
}

function resetPrices() {
  if (confirm('Сбросить все цены к стандартным значениям?')) {
    localStorage.removeItem('repairPrices');
    localStorage.removeItem('urgencyMultipliers');
    loadPrices();
    alert('Цены сброшены к стандартным');
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
    primer: parseInt(document.getElementById('price-primer').value),
    protection: parseInt(document.getElementById('price-protection').value),
    cleaning: parseInt(document.getElementById('price-cleaning').value),
    garbage: parseInt(document.getElementById('price-garbage').value)
  };
}

function updatePreview() {
  testCalculation();
}
