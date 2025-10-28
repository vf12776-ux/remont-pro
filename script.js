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
  
  // Стандартные цены с новыми услугами
  return {
    prices: {
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
    masterInfo.textContent = `Цены мастера: ${masterName}`;
    masterInfo.style.display = 'block';
  } else {
    masterInfo.textContent = 'Стандартные цены';
    masterInfo.style.display = 'block';
  }
}

function updatePriceDisplay() {
  const { prices } = loadPricesForCalculation();
  
  // Обновляем отображение цен в интерфейсе
  const priceElements = {
    'price-painting': `${prices.painting} ₽/м²`,
    'price-floor': `${prices.floor} ₽/м²`,
    'price-plumbing': `${prices.plumbing.toLocaleString()} ₽`,
    'price-plaster': `${prices.plaster} ₽/м²`,      // НОВАЯ УСЛУГА
    'price-putty': `${prices.putty} ₽/м²`,          // НОВАЯ УСЛУГА
    'price-demolition': `${prices.demolition} ₽/м²`, // НОВАЯ УСЛУГА
    'price-primer': `${prices.primer} ₽/м²`,
    'price-protection': `${prices.protection} ₽/м²`,
    'price-cleaning': `${prices.cleaning.toLocaleString()} ₽`,
    'price-garbage': `${prices.garbage.toLocaleString()} ₽`
  };
  
  Object.entries(priceElements).forEach(([id, text]) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = text;
    }
  });
}

// ===== РАСЧЕТ СТОИМОСТИ =====
function calculateTotal() {
  const area = parseFloat(document.getElementById('area').value) || 0;
  
  if (area <= 0) {
    document.getElementById('results-section').style.display = 'none';
    return;
  }
  
  const { prices, multipliers } = loadPricesForCalculation();
  
  let total = 0;
  let breakdown = [];
  
  // Базовая стоимость
  const baseCost = area * prices.base;
  total += baseCost;
  breakdown.push({ name: 'Базовая стоимость ремонта', cost: baseCost });
  
  // Основные услуги
  const services = [
    { id: 'service-painting', name: 'Покраска стен', price: prices.painting, unit: 'м²' },
    { id: 'service-floor', name: 'Укладка пола', price: prices.floor, unit: 'м²' },
    { id: 'service-plumbing', name: 'Сантехнические работы', price: prices.plumbing, unit: 'фикс' },
    { id: 'service-plaster', name: 'Штукатурка стен', price: prices.plaster, unit: 'м²' },      // НОВАЯ УСЛУГА
    { id: 'service-putty', name: 'Шпаклевка стен', price: prices.putty, unit: 'м²' },          // НОВАЯ УСЛУГА
    { id: 'service-demolition', name: 'Демонтаж', price: prices.demolition, unit: 'м²' }       // НОВАЯ УСЛУГА
  ];
  
  services.forEach(service => {
    const element = document.getElementById(service.id);
    if (element && element.checked) {
      let cost = service.unit === 'м²' ? area * service.price : service.price;
      total += cost;
      breakdown.push({ 
        name: service.name, 
        cost: cost 
      });
    }
  });
  
  // Дополнительные услуги
  const additionalServices = [
    { id: 'service-primer', name: 'Грунтовка поверхностей', price: prices.primer, unit: 'м²' },
    { id: 'service-protection', name: 'Укрывание поверхностей', price: prices.protection, unit: 'м²' },
    { id: 'service-cleaning', name: 'Уборка после ремонта', price: prices.cleaning, unit: 'фикс' },
    { id: 'service-garbage', name: 'Вынос мусора', price: prices.garbage, unit: 'фикс' }
  ];
  
  additionalServices.forEach(service => {
    const element = document.getElementById(service.id);
    if (element && element.checked) {
      let cost = service.unit === 'м²' ? area * service.price : service.price;
      total += cost;
      breakdown.push({ 
        name: service.name, 
        cost: cost 
      });
    }
  });
  
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
    // Плавная прокрутка к результатам
    setTimeout(() => {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
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
