document.addEventListener('DOMContentLoaded', () => {
  // Элементы
  const steps = document.querySelectorAll('.step');
  const nextButtons = document.querySelectorAll('.next-step');
  const backButtons = document.querySelectorAll('.back-step');
  const submitButton = document.querySelector('.submit');
  const newOrderButton = document.querySelector('.new-order');
  const progressBar = document.getElementById('progress-bar');
  let currentStep = 1;

  // Показать первый шаг
  document.getElementById(`step-${currentStep}`).classList.add('active');
  progressBar.style.width = `${(currentStep / 5) * 100}%`;

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
      masterInfo.innerHTML = `👨‍🔧 Расчет по ценам мастера: <strong>${masterName}</strong>`;
      masterInfo.style.display = 'block';
    } else {
      masterInfo.innerHTML = '💡 Расчет по стандартным ценам';
      masterInfo.style.display = 'block';
    }
  }

  // Инициализация информации о мастере
  updateMasterInfo();

  // ===== ОСНОВНАЯ ЛОГИКА ФОРМЫ =====
  // Логика кнопок "Далее"
  nextButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        steps[currentStep - 1].classList.remove('active');
        currentStep++;
        steps[currentStep - 1].classList.add('active');
        if (currentStep === 2) updateCost();
        if (currentStep === 4) updateSummary();
        progressBar.style.width = `${(currentStep / 5) * 100}%`;
      }
    });
  });

  // Логика кнопок "Назад"
  backButtons.forEach(button => {
    button.addEventListener('click', () => {
      steps[currentStep - 1].classList.remove('active');
      currentStep--;
      steps[currentStep - 1].classList.add('active');
      progressBar.style.width = `${(currentStep / 5) * 100}%`;
    });
  });

  // Логика кнопки "Оформить заказ"
  submitButton.addEventListener('click', () => {
    if (validateStep(currentStep)) {
      const { masterName } = loadPricesForCalculation();
      
      fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        body: JSON.stringify({
          premise: document.querySelector('input[name="premise-type"]:checked')?.value,
          area: document.querySelector('#area').value,
          services: Array.from(document.querySelectorAll('input[name="services"]:checked')).map(s => s.value),
          additional: Array.from(document.querySelectorAll('input[name="additional"]:checked')).map(s => s.value),
          paintingType: document.querySelector('input[name="painting-type"]:checked')?.value,
          urgency: document.querySelector('input[name="urgency"]:checked')?.value,
          date: document.querySelector('#date').value,
          time: document.querySelector('#time').value,
          name: document.querySelector('#name').value,
          phone: document.querySelector('#phone').value,
          master: masterName || 'Стандартные цены',
          totalCost: document.getElementById('final-cost').textContent
        }),
        headers: { 'Content-Type': 'application/json' }
      })
        .then(() => {
          steps[currentStep - 1].classList.remove('active');
          currentStep++;
          steps[currentStep - 1].classList.add('active');
          document.getElementById('order-number').textContent = Math.floor(Math.random() * 10000);
          localStorage.setItem('lastOrder', JSON.stringify({
            premise: document.querySelector('input[name="premise-type"]:checked')?.value,
            area: document.querySelector('#area').value,
            cost: document.getElementById('final-cost').textContent,
            master: masterName || 'Стандартные цены'
          }));
        })
        .catch(() => alert('Ошибка при отправке!'));
    }
  });

  // Логика кнопки "Новый заказ"
  newOrderButton.addEventListener('click', () => {
    steps[currentStep - 1].classList.remove('active');
    currentStep = 1;
    steps[currentStep - 1].classList.add('active');
    document.querySelector('form').reset();
    document.getElementById('painting-details').style.display = 'none';
    updateCost();
    updateSummary();
    progressBar.style.width = `${(currentStep / 5) * 100}%`;
  });

  // Тёмная тема
  document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
    document.body.classList.toggle('dark-mode', e.target.checked);
  });

  // Валидация шага
  function validateStep(step) {
    if (step === 1) {
      const premise = document.querySelector('input[name="premise-type"]:checked');
      const area = document.querySelector('#area').value;
      if (!premise || !area || area <= 0) {
        alert('Выберите тип помещения и укажите площадь!');
        return false;
      }
    } else if (step === 2) {
      const services = document.querySelectorAll('input[name="services"]:checked');
      if (services.length === 0) {
        alert('Выберите хотя бы одну услугу!');
        return false;
      }
    } else if (step === 3) {
      const date = document.querySelector('#date').value;
      const time = document.querySelector('#time').value;
      if (!date || !time) {
        alert('Укажите дату и время!');
        return false;
      }
    } else if (step === 4) {
      const name = document.querySelector('#name').value;
      const phone = document.querySelector('#phone').value;
      if (!name || !phone) {
        alert('Укажите имя и телефон!');
        return false;
      }
    }
    return true;
  }

  // ПРАВИЛЬНЫЙ подсчёт стоимости с детализацией (ОБНОВЛЕННЫЙ)
  function updateCost() {
    const area = parseFloat(document.querySelector('#area').value) || 0;
    const services = document.querySelectorAll('input[name="services"]:checked');
    const urgency = document.querySelector('input[name="urgency"]:checked')?.value || 'normal';
    
    // Загружаем цены с учетом мастера
    const { prices: PRICES, multipliers: MULTIPLIERS } = loadPricesForCalculation();
    
    // Базовая стоимость
    let basePrice = area * PRICES.base;
    
    // Стоимость основных услуг
    let servicesPrice = 0;
    services.forEach(service => {
      switch(service.value) {
        case 'Покраска стен':
          const paintingType = document.querySelector('input[name="painting-type"]:checked');
          const paintingMultiplier = paintingType ? parseFloat(paintingType.dataset.multiplier) : 1;
          servicesPrice += area * PRICES.painting * paintingMultiplier;
          break;
        case 'Укладка пола':
          servicesPrice += area * PRICES.floor;
          break;
        case 'Сантехника':
          servicesPrice += PRICES.plumbing;
          break;
      }
    });
    
    // Дополнительные услуги (ОБНОВЛЕНО - используем цены мастера)
    let additionalPrice = 0;
    document.querySelectorAll('input[name="additional"]:checked').forEach(additional => {
      const serviceType = additional.value;
      
      switch(serviceType) {
        case 'primer':
          additionalPrice += area * PRICES.primer;
          break;
        case 'protection':
          additionalPrice += area * PRICES.protection;
          break;
        case 'cleaning':
          additionalPrice += PRICES.cleaning;
          break;
        case 'garbage':
          additionalPrice += PRICES.garbage;
          break;
      }
    });
    
    // Умножитель срочности
    let multiplier = 1;
    if (urgency === 'priority') multiplier = MULTIPLIERS.priority;
    if (urgency === 'urgent') multiplier = MULTIPLIERS.urgent;
    
    const total = Math.round((basePrice + servicesPrice + additionalPrice) * multiplier);
    
    document.getElementById('cost').textContent = `${total.toLocaleString()} ₽`;
    document.getElementById('final-cost').textContent = `${total.toLocaleString()} ₽`;
  }

  // Обновление сводки
  function updateSummary() {
    const premise = document.querySelector('input[name="premise-type"]:checked')?.value || 'Не выбрано';
    const area = document.querySelector('#area').value || 0;
    const services = Array.from(document.querySelectorAll('input[name="services"]:checked')).map(s => s.value);
    const additional = Array.from(document.querySelectorAll('input[name="additional"]:checked')).map(s => s.value);
    const paintingType = document.querySelector('input[name="painting-type"]:checked')?.value;
    const urgency = document.querySelector('input[name="urgency"]:checked')?.value || 'normal';
    const date = document.querySelector('#date').value;
    const time = document.querySelector('#time').value;
    const { masterName } = loadPricesForCalculation();
    
    let paintingDetail = '';
    if (services.includes('Покраска стен') && paintingType) {
      paintingDetail = paintingType === 'one-layer' ? ' (в один слой)' : 
                      paintingType === 'two-layers' ? ' (в два слоя)' : 
                      ' (покраска обоев)';
    }
    
    let masterInfo = '';
    if (masterName) {
      masterInfo = `<p><strong>Мастер:</strong> ${masterName}</p>`;
    }
    
    document.getElementById('summary-content').innerHTML = `
      ${masterInfo}
      <p>Тип помещения: ${premise}</p>
      <p>Площадь: ${area} м²</p>
      <p>Услуги: ${services.map((s, i) => s + (i === services.indexOf('Покраска стен') ? paintingDetail : '')).join(', ') || 'Не выбрано'}</p>
      <p>Дополнительно: ${additional.join(', ') || 'Нет'}</p>
      <p>Срочность: ${urgency === 'normal' ? 'Обычная' : urgency === 'priority' ? 'Приоритетная' : 'Срочная'}</p>
      <p>Дата и время: ${date} ${time}</p>
    `;
  }

  // Показ/скрытие деталей покраски
  document.querySelectorAll('input[name="services"]').forEach(service => {
    service.addEventListener('change', function() {
      const paintingDetails = document.getElementById('painting-details');
      if (this.value === 'Покраска стен' && this.checked) {
        paintingDetails.style.display = 'block';
      } else if (this.value === 'Покраска стен' && !this.checked) {
        paintingDetails.style.display = 'none';
      }
      updateCost();
    });
  });

  // Обновление стоимости при изменении ЛЮБЫХ параметров
  document.querySelectorAll('#area, input[name="services"], input[name="urgency"], input[name="painting-type"], input[name="additional"]').forEach(input => {
    input.addEventListener('change', updateCost);
    input.addEventListener('input', updateCost);
  });
});
