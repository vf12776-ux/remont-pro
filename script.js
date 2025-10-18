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
          phone: document.querySelector('#phone').value
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
            cost: document.getElementById('final-cost').textContent
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

  // Загрузка цен из localStorage
  function getPrices() {
    const saved = localStorage.getItem('repairPrices');
    if (saved) {
      return JSON.parse(saved);
    }
    // Стандартные цены
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

  function getMultipliers() {
    const saved = localStorage.getItem('urgencyMultipliers');
    return saved ? JSON.parse(saved) : { priority: 1.2, urgent: 1.5 };
  }

  // ПРАВИЛЬНЫЙ подсчёт стоимости с детализацией
  function updateCost() {
    const area = parseFloat(document.querySelector('#area').value) || 0;
    const services = document.querySelectorAll('input[name="services"]:checked');
    const urgency = document.querySelector('input[name="urgency"]:checked')?.value || 'normal';
    
    const PRICES = getPrices();
    const MULTIPLIERS = getMultipliers();
    
    // Реалистичные цены
    let basePrice = area * PRICES.base; // 1500 ₽/м² базовая стоимость
    
    // Стоимость основных услуг
    let servicesPrice = 0;
    services.forEach(service => {
      switch(service.value) {
        case 'Покраска стен':
          const paintingType = document.querySelector('input[name="painting-type"]:checked');
          const paintingMultiplier = paintingType ? parseFloat(paintingType.dataset.multiplier) : 1;
          servicesPrice += area * PRICES.painting * paintingMultiplier; // 300 ₽/м² × множитель
          break;
        case 'Укладка пола':
          servicesPrice += area * PRICES.floor; // 800 ₽/м²
          break;
        case 'Сантехника':
          servicesPrice += PRICES.plumbing; // Фиксированная стоимость
          break;
      }
    });
    
    // Дополнительные услуги
    let additionalPrice = 0;
    document.querySelectorAll('input[name="additional"]:checked').forEach(additional => {
      const price = parseFloat(additional.dataset.price);
      if (additional.value === 'primer' || additional.value === 'protection') {
        // Услуги с ценой за м²
        additionalPrice += area * price;
      } else {
        // Фиксированная стоимость
        additionalPrice += price;
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
    
    let paintingDetail = '';
    if (services.includes('Покраска стен') && paintingType) {
      paintingDetail = paintingType === 'one-layer' ? ' (в один слой)' : 
                      paintingType === 'two-layers' ? ' (в два слоя)' : 
                      ' (покраска обоев)';
    }
    
    document.getElementById('summary-content').innerHTML = `
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
