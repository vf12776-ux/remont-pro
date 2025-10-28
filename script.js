
document.addEventListener('DOMContentLoaded', function() {
  // Инициализация
  updateMasterInfo();
  updatePriceDisplay();
  
  // Обработчики событий
  document.getElementById('calculate-btn').addEventListener('click', calculateTotal);
  document.getElementById('area').addEventListener('input', debounce(calculateTotal, 300));
  
  // Обновление при изменении услуг и срочности
  document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
    input.addEventListener('change', calculateTotal);
  });
});

// ===== СИСТЕМА МАСТЕРОВ =====
function loadPricesForCalculation() {
  const currentMaster = localStorage.getItem('currentMaster');
  if (currentMaster) {
    try {
      const master = JSON.parse(currentMaster);
      const prices = localStorage.getItem(`repairPrices_${master.pin}`);
      const multipliers = localStorage.getItem(`urgencyMultipliers_${master.pin}`);
      
      if (prices && multipliers) {
        return {
          prices: JSON.parse(prices),
          multipliers: JSON.parse(multipliers),
          masterName: master.name
        };
      }
    } catch (e) {
      console.error('Ошибка загрузки цен мастера:', e);
    }
  }
  
  // Стандартные цены
  return {
    prices: {
      base: 1500,
      painting: 300,
      floor: 800,
      plumbing: 15000,
      primer: 50,
      protection: 30,
      cleaning: 5000,
      garbage: 3000
    },
    multipliers: { priority: 1.2, urgent: 1.5 },
    masterName: null
  };
}

function updateMasterInfo() {
  const masterInfo = document.getElementById('master-info');
  if (!masterInfo) return;
  
  const { masterName } = loadPricesForCalculation();
  if (masterName) {
    masterInfo.textContent = `Расчет по ценам мастера: ${masterName}`;
    masterInfo.style.display = 'block';
  } else {
    masterInfo.textContent = 'Расчет по стандартным ценам';
    masterInfo.style.display = 'block';
  }
}

function updatePriceDisplay() {
  const { prices } = loadPricesForCalculation();
  
  // Обновляем отображение цен в интерфейсе
  if (document.getElementById('price-painting')) {
    document.getElementById('price-painting').textContent = `${prices.painting} ₽/м²`;
  }
  if (document.getElementById('price-floor')) {
    document.getElementById('price-floor').textContent = `${prices.floor} ₽/м²`;
  }
  if (document.getElementById('price-plumbing')) {
    document.getElementById('price-plumbing').textContent = `${prices.plumbing.toLocaleString()} ₽`;
  }
  if (document.getElementById('price-primer')) {
    document.getElementById('price-primer').textContent = `${prices.primer} ₽/м²`;
  }
  if (document.getElementById('price-protection')) {
    document.getElementById('price-protection').textContent = `${prices.protection} ₽/м²`;
  }
  if (document.getElementById('price-cleaning')) {
    document.getElementById('price-cleaning').textContent = `${prices.cleaning.toLocaleString()} ₽`;
  }
  if (document.getElementById('price-garbage')) {
    document.getElementById('price-garbage').textContent = `${prices.garbage.toLocaleString()} ₽`;
  }
}

// ===== РАСЧЕТ СТОИМОСТИ =====
function calculateTotal() {
  const area = parseFloat(document.getElementById('area').value) || 0;
  
  if (area <= 0) {
    document.getElementById('results-section').style.display = 'none';
    return;
  }
  
  const { prices, multipliers } = loadPricesForCalculation();
  const roomType = document.getElementById('room-type').value;
  
  let total = 0;
  let breakdown = [];
  
  // Базовая стоимость
  const baseCost = area * prices.base;
  total += baseCost;
  breakdown.push({ name: 'Базовая стоимость ремонта', cost: baseCost });
  
  // Основные услуги
  if (document.getElementById('service-painting') && document.getElementById('service-painting').checked) {
    const paintingCost = area * prices.painting;
    total += paintingCost;
    breakdown.push({ name: 'Покраска стен', cost: paintingCost });
  }
  
  if (document.getElementById('service-floor') && document.getElementById('service-floor').checked) {
    const floorCost = area * prices.floor;
    total += floorCost;
    breakdown.push({ name: 'Укладка пола', cost: floorCost });
  }
  
  if (document.getElementById('service-plumbing') && document.getElementById('service-plumbing').checked) {
    total += prices.plumbing;
    breakdown.push({ name: 'Сантехнические работы', cost: prices.plumbing });
  }
  
  // Дополнительные услуги
  if (document.getElementById('service-primer') && document.getElementById('service-primer').checked) {
    const primerCost = area * prices.primer;
    total += primerCost;
    breakdown.push({ name: 'Грунтовка поверхностей', cost: primerCost });
  }
  
  if (document.getElementById('service-protection') && document.getElementById('service-protection').checked) {
    const protectionCost = area * prices.protection;
    total += protectionCost;
    breakdown.push({ name: 'Укрывание поверхностей', cost: protectionCost });
  }
  
  if (document.getElementById('service-cleaning') && document.getElementById('service-cleaning').checked) {
    total += prices.cleaning;
    breakdown.push({ name: 'Уборка после ремонта', cost: prices.cleaning });
  }
  
  if (document.getElementById('service-garbage') && document.getElementById('service-garbage').checked) {
    total += prices.garbage;
    breakdown.push({ name: 'Вынос мусора', cost: prices.garbage });
  }
  
  // Срочность
  const urgencyElement = document.querySelector('input[name="urgency"]:checked');
  if (urgencyElement) {
    const urgency = urgencyElement.value;
    let urgencyMultiplier = 1;
    let urgencyText = '';
    
    if (urgency === 'priority') {
      urgencyMultiplier = multipliers.priority;
      urgencyText = ' (приоритетная)';
    } else if (urgency === 'urgent') {
      urgencyMultiplier = multipliers.urgent;
      urgencyText = ' (срочная)';
    }
    
    const urgencyCost = total * (urgencyMultiplier - 1);
    if (urgencyCost > 0) {
      breakdown.push({ name: `Наценка за срочность${urgencyText}`, cost: urgencyCost });
      total *= urgencyMultiplier;
    }
  }
  
  total = Math.round(total);
  
  displayResults(total, breakdown);
}

function displayResults(total, breakdown) {
  const totalPriceElement = document.getElementById('total-price');
  const breakdownElement = document.getElementById('price-breakdown');
  const resultsSection = document.getElementById('results-section');
  
  if (totalPriceElement) {
    totalPriceElement.textContent = `${total.toLocaleString('ru-RU')} ₽`;
  }
  
  if (breakdownElement) {
    breakdownElement.innerHTML = '';
    
    breakdown.forEach((item, index) => {
      const itemElement = document.createElement('div');
      itemElement.className = `breakdown-item ${index === breakdown.length - 1 ? 'breakdown-total' : ''}`;
      itemElement.innerHTML = `
        <span>${item.name}</span>
        <span>${Math.round(item.cost).toLocaleString('ru-RU')} ₽</span>
      `;
      breakdownElement.appendChild(itemElement);
    });
  }
  
  if (resultsSection) {
    resultsSection.style.display = 'block';
  }
}

// Вспомогательные функции
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Добавляем CSS для анимаций
const style = document.createElement('style');
style.textContent = `
  .breakdown-total {
    border-top: 2px solid rgba(255, 255, 255, 0.3) !important;
    font-weight: bold;
    font-size: 1.1em;
    margin-top: 10px;
    padding-top: 10px;
  }
`;
document.head.appendChild(style);
