    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.getElementById('navLinks');
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      menuBtn.textContent = navLinks.classList.contains('open') ? 'Закрыть' : 'Меню';
    });
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      menuBtn.textContent = 'Меню';
    }));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    const products = {
      hoodie: {
        name: 'Худи «Orbit»',
        price: '4 990 ₽',
        tag: 'New',
        desc: 'Свободное худи из плотного хлопка с начёсом. Мягкая посадка оверсайз, заниженная линия плеча и глубокий капюшон — для комфорта в движении.',
        sizes: ['S', 'M', 'L', 'XL'],
        meta: [['Цвет', 'Графит'], ['Состав', '80% хлопок, 20% полиэстер'], ['Плотность', '420 г/м²'], ['Уход', 'Деликатная стирка 30°']],
        palette: ['#2a2640', '#5b4bb7', '#8e7dff'],
        images: ['assets/hoodie.svg', 'assets/hoodie-back.svg', 'assets/hoodie-side.svg', 'assets/hoodie-detail.svg']
      },
      tee: {
        name: 'Футболка «Pulse»',
        price: '2 290 ₽',
        tag: 'Hit',
        desc: 'Базовая футболка прямого кроя из дышащего хлопка. Контрастный акцент и плотная горловина держат форму после множества стирок.',
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        meta: [['Цвет', 'Лайм / чёрный'], ['Состав', '100% хлопок'], ['Плотность', '240 г/м²'], ['Уход', 'Стирка 30°']],
        palette: ['#2b3320', '#7da62b', '#c8ff4d'],
        images: ['assets/tee.svg', 'assets/tee-back.svg', 'assets/tee-side.svg', 'assets/tee-detail.svg']
      },
      cargo: {
        name: 'Брюки-карго «Vector»',
        price: '5 490 ₽',
        tag: 'Drop',
        desc: 'Функциональные карго с регулируемым поясом и объёмными карманами. Ткань с небольшим стрейчем не сковывает движения в течение дня.',
        sizes: ['28', '30', '32', '34', '36'],
        meta: [['Цвет', 'Терракота'], ['Состав', '97% хлопок, 3% эластан'], ['Посадка', 'Relaxed fit'], ['Уход', 'Стирка 30°']],
        palette: ['#3a2328', '#b85c6a', '#e6a0a8'],
        images: ['assets/cargo.svg', 'assets/cargo-back.svg', 'assets/cargo-side.svg', 'assets/cargo-detail.svg']
      },
      jacket: {
        name: 'Ветровка «Flow»',
        price: '6 790 ₽',
        tag: 'Basic',
        desc: 'Лёгкая ветровка с водоотталкивающей пропиткой и скрытым капюшоном. Защищает от ветра и легко складывается в сумку.',
        sizes: ['S', 'M', 'L', 'XL'],
        meta: [['Цвет', 'Синий сталь'], ['Состав', '100% нейлон'], ['Подклад', 'Сетчатая'], ['Уход', 'Бережная стирка 30°']],
        palette: ['#20303a', '#3d8fb8', '#8fd3f4'],
        images: ['assets/jacket.svg', 'assets/jacket-back.svg', 'assets/jacket-side.svg', 'assets/jacket-detail.svg']
      }
    };
    const views = [
      { name: 'Спереди', inset: '30px 60px', transform: 'none', extra: 'linear-gradient(to bottom, rgba(255,255,255,0.18), transparent 40%)' },
      { name: 'Сзади', inset: '34px 64px', transform: 'scaleX(0.98)', extra: 'linear-gradient(to top, rgba(0,0,0,0.25), transparent 45%)' },
      { name: 'Сбоку', inset: '30px 90px 30px 40px', transform: 'skewY(-1deg)', extra: 'linear-gradient(90deg, rgba(0,0,0,0.35), transparent 55%)' },
      { name: 'Детали', inset: '70px 70px', transform: 'scale(1.05)', extra: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), transparent 40%)' }
    ];

    const modal = document.getElementById('productModal');
    const viewMain = document.getElementById('viewMain');
    const viewThumbs = document.getElementById('viewThumbs');
    const orderBtn = document.getElementById('orderBtn');
    const orderOverlay = document.getElementById('orderOverlay');
    const orderForm = document.getElementById('orderForm');
    const sizeHint = document.getElementById('sizeHint');
    const orderFields = document.getElementById('orderFields');
    const orderSuccess = document.getElementById('orderSuccess');
    const orderText = document.getElementById('orderText');
    const vkLink = document.getElementById('vkLink');
    const copyStatus = document.getElementById('copyStatus');
    let currentProduct = null;
    let modalMouseDownTarget = null;
    let orderMouseDownTarget = null;
    let currentView = 0;
    let selectedSize = null;
    const VK_GROUP = 'https://vk.ru/nightsf';
    // Backend endpoint for receiving orders (Google Apps Script Web app).
    const ORDER_API = 'https://script.google.com/macros/s/AKfycbytaHjnKE7rlpedfBmEVAiAWSbzbF7-EBlo7NfQU85YXOZHf2RDVgpfoDUsfUnReko/exec';

    function renderView() {
      if (!currentProduct) return;
      const p = products[currentProduct];
      const v = views[currentView];
      const img = p.images && p.images[currentView];
      if (img) {
        viewMain.innerHTML = `<div class="view-layer" style="background:#101015;">
          <img src="${img}" alt="${p.name} — ${v.name}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">
          <span class="view-label">${v.name}</span>
          <span class="view-hint">${currentView + 1} / ${views.length}</span>
        </div>`;
      } else {
        viewMain.innerHTML = `<div class="view-layer" style="background: linear-gradient(160deg, ${p.palette[0]}, ${p.palette[1]});">
          <div class="silhouette" style="inset:${v.inset};transform:${v.transform};background:linear-gradient(135deg, ${p.palette[2]}, ${p.palette[1]}), ${v.extra};"></div>
          <span class="view-label">${v.name}</span>
          <span class="view-hint">${currentView + 1} / ${views.length}</span>
        </div>`;
      }
      [...viewThumbs.children].forEach((btn, i) => btn.classList.toggle('active', i === currentView));
    }

    function setSelectedSize(size, btn) {
      selectedSize = size;
      document.querySelectorAll('#modalSizes .size').forEach(b => b.classList.toggle('selected', b === btn));
      orderBtn.disabled = !selectedSize;
      sizeHint.textContent = selectedSize ? `Выбран размер: ${selectedSize}` : 'Сначала выберите размер';
    }

    function openModal(id) {
      currentProduct = id;
      currentView = 0;
      selectedSize = null;
      orderBtn.disabled = true;
      sizeHint.textContent = 'Сначала выберите размер';
      orderOverlay.classList.remove('open');
      orderForm.reset();
      const p = products[id];
      document.getElementById('modalTitle').textContent = p.name;
      document.getElementById('modalPrice').textContent = p.price;
      document.getElementById('modalDesc').textContent = p.desc;
      document.getElementById('modalTag').textContent = p.tag;
      document.getElementById('modalSizes').innerHTML = p.sizes.map(s => `<button type="button" class="size" data-size="${s}">${s}</button>`).join('');
      document.getElementById('modalMeta').innerHTML = p.meta.map(([k,val]) => `<li><strong>${k}:</strong> ${val}</li>`).join('');
      document.querySelectorAll('#modalSizes .size').forEach(btn => btn.addEventListener('click', () => setSelectedSize(btn.dataset.size, btn)));
      viewThumbs.innerHTML = views.map((v, i) => {
        const thumbImg = p.images && p.images[i];
        const bg = thumbImg ? `<img src="${thumbImg}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">` : `<div style="position:absolute;inset:0;background:linear-gradient(135deg, ${p.palette[0]}, ${p.palette[2]});"></div>`;
        return `<button class="thumb-btn ${i===0?'active':''}" data-i="${i}" aria-label="${v.name}">${bg}<span>${v.name}</span></button>`;
      }).join('');
      viewThumbs.querySelectorAll('.thumb-btn').forEach(btn => btn.addEventListener('click', () => { currentView = +btn.dataset.i; renderView(); }));
      renderView();
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      orderOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    document.querySelectorAll('.product[data-id]').forEach(card => {
      card.addEventListener('click', () => openModal(card.dataset.id));
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(card.dataset.id); } });
    });
    document.getElementById('modalClose').addEventListener('click', closeModal);
    modal.addEventListener('mousedown', (e) => { modalMouseDownTarget = e.target; });
    modal.addEventListener('click', (e) => { if (e.target === modal && modalMouseDownTarget === modal) closeModal(); });
    document.getElementById('prevView').addEventListener('click', () => { currentView = (currentView - 1 + views.length) % views.length; renderView(); });
    document.getElementById('nextView').addEventListener('click', () => { currentView = (currentView + 1) % views.length; renderView(); });
    document.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('open')) return;
      if (e.key === 'Escape') {
        if (orderOverlay.classList.contains('open')) orderOverlay.classList.remove('open');
        else closeModal();
      }
      if (!orderOverlay.classList.contains('open')) {
        if (e.key === 'ArrowLeft') { currentView = (currentView - 1 + views.length) % views.length; renderView(); }
        if (e.key === 'ArrowRight') { currentView = (currentView + 1) % views.length; renderView(); }
      }
    });

    function fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (err) {}
      ta.remove();
    }
    function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
      } else {
        fallbackCopy(text);
      }
    }

    function openOrder() {
      if (!currentProduct || !selectedSize) return;
      const p = products[currentProduct];
      orderForm.reset();
      document.getElementById('orderSummary').textContent = `${p.name} · размер ${selectedSize} · ${p.price}`;
      orderFields.hidden = false;
      orderSuccess.hidden = true;
      copyStatus.textContent = '';
      vkLink.href = VK_GROUP;
      orderOverlay.classList.add('open');
    }
    function closeOrder() { orderOverlay.classList.remove('open'); }
    orderBtn.addEventListener('click', openOrder);
    document.getElementById('orderClose').addEventListener('click', closeOrder);
    document.getElementById('orderCancel').addEventListener('click', closeOrder);
    document.getElementById('orderDone').addEventListener('click', closeOrder);
    orderOverlay.addEventListener('mousedown', (e) => { orderMouseDownTarget = e.target; });
    orderOverlay.addEventListener('click', (e) => { if (e.target === orderOverlay && orderMouseDownTarget === orderOverlay) closeOrder(); });

    // Contact preference is a client wish; both fields stay visible.
    document.getElementById('copyOrder').addEventListener('click', () => {
      copyText(orderText.value);
      copyStatus.textContent = 'Текст скопирован.';
    });
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!document.getElementById('consent').checked) return;
      const p = products[currentProduct];
      const name = document.getElementById('custName').value.trim();
      const phone = document.getElementById('custPhone').value.trim();
      const address = document.getElementById('custAddress').value.trim();
      const comment = document.getElementById('custComment').value.trim();
      const contactPref = document.querySelector('input[name="contactPref"]:checked').value;
      const messenger = document.getElementById('custMessenger').value;
      const callTime = document.getElementById('custCallTime').value.trim();
      const contactLine = contactPref === 'call'
        ? `Связь: позвонить${callTime ? ' (' + callTime + ')' : ''}`
        : `Связь: написать (${messenger})`;
      const msg = [
        'Здравствуйте! Хочу оформить заказ в NOVA WEAR.',
        `Товар: ${p.name}`,
        `Размер: ${selectedSize}`,
        `Цена: ${p.price}`,
        `Имя: ${name}`,
        `Телефон: ${phone}`,
        address ? `Адрес доставки: ${address}` : null,
        contactLine,
        comment ? `Комментарий: ${comment}` : null
      ].filter(Boolean).join('\n');

      const orderRecord = {
        id: Date.now(),
        created: new Date().toISOString(),
        product: p.name,
        size: selectedSize,
        price: p.price,
        name, phone, address, comment,
        contactPref, messenger, callTime,
        status: 'new'
      };
      try {
        const list = JSON.parse(localStorage.getItem('nova_orders') || '[]');
        list.unshift(orderRecord);
        localStorage.setItem('nova_orders', JSON.stringify(list));
      } catch (e) {}
      if (typeof ORDER_API !== 'undefined' && ORDER_API) {
        // no-cors + text/plain avoids a CORS preflight (Apps Script does not handle OPTIONS).
        fetch(ORDER_API, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(orderRecord), mode: 'no-cors' }).catch(() => {});
      }

      copyText(msg);
      orderText.value = msg;
      vkLink.href = VK_GROUP;
      orderFields.hidden = true;
      orderSuccess.hidden = false;
      copyStatus.textContent = 'Текст скопирован. Проверьте сообщение и нажмите «Открыть VK», чтобы перейти в чат и отправить его.';
    });
