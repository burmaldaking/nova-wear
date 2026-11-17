// Admin panel logic for NOVA WEAR
// NOTE: client-side password is NOT real security. Change ADMIN_PASSWORD and, for real protection, put the panel behind server-side auth.

const ADMIN_PASSWORD = 'novawear'; // CHANGE THIS before publishing

const $ = (id) => document.getElementById(id);

function loadOrders() {
  let orders = [];
  try { orders = JSON.parse(localStorage.getItem('nova_orders') || '[]'); } catch (e) { orders = []; }
  return orders;
}
function saveOrders(orders) {
  localStorage.setItem('nova_orders', JSON.stringify(orders));
}

function digits(phone) { return (phone || '').replace(/\D/g, ''); }

function messengerLink(order) {
  const ph = digits(order.phone);
  switch (order.messenger) {
    case 'Telegram': return `https://t.me/+${ph}`;
    case 'WhatsApp': return `https://wa.me/${ph}`;
    case 'SMS': return `sms:${order.phone}`;
    default: return null; // VK has no direct phone link
  }
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return iso; }
}

function statusLabel(s) {
  return s === 'new' ? 'Новый' : s === 'progress' ? 'В работе' : s === 'done' ? 'Выполнен' : s;
}

function renderStats(orders) {
  const el = $('stats');
  const total = orders.length;
  const neu = orders.filter(o => o.status === 'new').length;
  const prog = orders.filter(o => o.status === 'progress').length;
  const done = orders.filter(o => o.status === 'done').length;
  el.innerHTML = `
    <div class="stat-card"><strong>${total}</strong><span>Всего</span></div>
    <div class="stat-card"><strong>${neu}</strong><span>Новые</span></div>
    <div class="stat-card"><strong>${prog}</strong><span>В работе</span></div>
    <div class="stat-card"><strong>${done}</strong><span>Выполнены</span></div>
  `;
}

function renderOrders() {
  const filter = $('statusFilter').value;
  let orders = loadOrders();
  if (filter !== 'all') orders = orders.filter(o => o.status === filter);

  const list = $('ordersList');
  const empty = $('emptyState');
  list.innerHTML = '';
  if (orders.length === 0) { empty.hidden = false; return; }
  empty.hidden = true;

  orders.forEach(order => {
    const card = document.createElement('article');
    card.className = `order-card ${order.status || 'new'}`;
    const writeLink = messengerLink(order);
    const writeBtn = writeLink
      ? `<a class="btn btn-ghost" href="${writeLink}" target="_blank" rel="noopener noreferrer">Написать (${order.messenger || '—'})</a>`
      : `<button type="button" class="btn btn-ghost" data-action="copy-phone" data-id="${order.id}">Скопировать телефон (VK)</button>`;
    card.innerHTML = `
      <div class="order-head">
        <h3>${escapeHtml(order.name || '—')}</h3>
        <span class="order-meta">${formatDate(order.created)}</span>
      </div>
      <div class="order-row"><strong>Товар:</strong> ${escapeHtml(order.product || '—')} · размер ${escapeHtml(order.size || '—')} · ${escapeHtml(order.price || '—')}</div>
      <div class="order-row"><strong>Телефон:</strong> <a href="tel:${escapeAttr(order.phone)}">${escapeHtml(order.phone || '—')}</a></div>
      <div class="order-row"><strong>Связь:</strong> <span class="contact-badge">${order.contactPref === 'call' ? 'Позвонить' : 'Написать'}</span> ${order.contactPref === 'call' ? escapeHtml(order.callTime || '') : escapeHtml(order.messenger || '')}</div>
      ${order.comment ? `<div class="order-row"><strong>Комментарий:</strong> ${escapeHtml(order.comment)}</div>` : ''}
      <div class="order-row">
        <label for="st-${order.id}" class="muted">Статус:</label>
        <select id="st-${order.id}" data-action="status" data-id="${order.id}">
          <option value="new" ${order.status==='new'?'selected':''}>Новый</option>
          <option value="progress" ${order.status==='progress'?'selected':''}>В работе</option>
          <option value="done" ${order.status==='done'?'selected':''}>Выполнен</option>
        </select>
      </div>
      <div class="order-actions">
        <a class="btn btn-primary" href="tel:${escapeAttr(order.phone)}">Позвонить</a>
        ${writeBtn}
        <button type="button" class="btn btn-ghost" data-action="delete" data-id="${order.id}">Удалить</button>
      </div>
    `;
    list.appendChild(card);
  });

  list.querySelectorAll('select[data-action="status"]').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const id = +e.target.dataset.id;
      const orders = loadOrders();
      const o = orders.find(x => x.id === id);
      if (o) { o.status = e.target.value; saveOrders(orders); renderStats(loadOrders()); }
    });
  });
  list.querySelectorAll('button[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = +e.target.dataset.id;
      if (!confirm('Удалить заказ?')) return;
      const orders = loadOrders().filter(x => x.id !== id);
      saveOrders(orders);
      renderOrders();
      renderStats(loadOrders());
    });
  });
  list.querySelectorAll('button[data-action="copy-phone"]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = +e.target.dataset.id;
      const o = loadOrders().find(x => x.id === id);
      if (!o) return;
      try { await navigator.clipboard.writeText(o.phone); alert('Телефон скопирован. Найдите клиента в VK и напишите.'); }
      catch (err) { alert('Телефон: ' + o.phone); }
    });
  });
}

function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s) { return String(s == null ? '' : s).replace(/"/g, '%22'); }

function exportCSV() {
  const orders = loadOrders();
  const header = ['Дата','Имя','Телефон','Товар','Размер','Цена','Связь','Мессенджер/время','Комментарий','Статус'];
  const rows = orders.map(o => [
    formatDate(o.created), o.name, o.phone, o.product, o.size, o.price,
    o.contactPref === 'call' ? 'Позвонить' : 'Написать',
    o.contactPref === 'call' ? (o.callTime || '') : (o.messenger || ''),
    o.comment || '', statusLabel(o.status)
  ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'nova-orders.csv';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// Login
function initLogin() {
  const form = $('loginForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const pass = $('adminPass').value;
    if (pass === ADMIN_PASSWORD) {
      sessionStorage.setItem('nova_admin', '1');
      showDash();
    } else {
      $('loginError').textContent = 'Неверный пароль.';
    }
  });
}

function showDash() {
  $('loginView').hidden = true;
  $('dashView').hidden = false;
  renderStats(loadOrders());
  renderOrders();
}

function logout() {
  sessionStorage.removeItem('nova_admin');
  location.reload();
}

// Optional: fetch orders from backend
async function fetchRemote() {
  // placeholder: if you configure ORDER_API with a GET endpoint, fetch here
}

document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('nova_admin') === '1') {
    showDash();
  } else {
    initLogin();
  }

  $('statusFilter').addEventListener('change', () => { renderOrders(); renderStats(loadOrders()); });
  $('refreshBtn').addEventListener('click', () => { renderOrders(); renderStats(loadOrders()); });
  $('exportBtn').addEventListener('click', exportCSV);
  $('clearBtn').addEventListener('click', () => {
    if (!confirm('Удалить все локальные заказы?')) return;
    localStorage.removeItem('nova_orders');
    renderOrders(); renderStats(loadOrders());
  });
  $('logoutBtn').addEventListener('click', logout);
});
