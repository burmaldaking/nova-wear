// Admin panel logic for NOVA WEAR
// NOTE: client-side password is NOT real security. Change ADMIN_PASSWORD and, for real protection, put the panel behind server-side auth.

const ADMIN_PASSWORD = 'devion'; // CHANGE THIS before publishing
// Must match ORDER_API in script.js.
const ORDER_API = 'https://script.google.com/macros/s/AKfycbytaHjnKE7rlpedfBmEVAiAWSbzbF7-EBlo7NfQU85YXOZHf2RDVgpfoDUsfUnReko/exec';

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
  const m = (order.messenger || '').toLowerCase();
  if (m.includes('telegram')) {
    const u = (order.messenger || '').match(/@([A-Za-z0-9_]+)/);
    if (u) return `https://t.me/${u[1]}`;
    return `https://t.me/+${ph}`;
  }
  if (m.includes('whatsapp') || m.includes('whats app') || m.includes('ватсап') || m.includes('вотсап')) {
    return `https://wa.me/${ph}`;
  }
  if (m.includes('sms') || m.includes('смс')) {
    return `sms:${order.phone}`;
  }
  return null; // VK / other: copy phone
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

function updateTabCounts() {
  const orders = loadOrders();
  const counts = {
    all: orders.length,
    new: orders.filter(o => o.status === 'new').length,
    progress: orders.filter(o => o.status === 'progress').length,
    done: orders.filter(o => o.status === 'done').length
  };
  document.querySelectorAll('.status-tab').forEach(tab => {
    const s = tab.dataset.status;
    const base = tab.textContent.replace(/\s*\(\d+\)$/, '');
    tab.textContent = `${base} (${counts[s]})`;
  });
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

let currentFilter = 'all';

function renderOrders() {
  const filter = currentFilter;
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
    card.innerHTML = `
      <div class="order-head">
        <h3>${escapeHtml(order.name || '—')}</h3>
        <span class="order-meta">${formatDate(order.created)}</span>
      </div>
      <div class="order-row"><strong>Товар:</strong> ${escapeHtml(order.product || '—')} · размер ${escapeHtml(order.size || '—')} · ${escapeHtml(order.price || '—')}</div>
      <div class="order-row"><strong>Телефон:</strong> <a href="tel:${escapeAttr(order.phone)}">${escapeHtml(order.phone || '—')}</a></div>
      ${order.address ? `<div class="order-row"><strong>Адрес доставки:</strong> ${escapeHtml(order.address)}</div>` : ''}
      <div class="order-row"><strong>Связь:</strong> <span class="contact-badge">${order.contactPref === 'call' ? 'Позвонить' : 'Написать'}</span></div>
      ${order.messenger ? `<div class="order-row"><strong>Куда написать:</strong> ${escapeHtml(order.messenger)}</div>` : ''}
      ${order.callTime ? `<div class="order-row"><strong>Удобное время:</strong> ${escapeHtml(order.callTime)}</div>` : ''}
      ${order.comment ? `<div class="order-row"><strong>Комментарий:</strong> ${escapeHtml(order.comment)}</div>` : ''}
      <div class="order-row">
        <label for="st-${order.id}" class="muted">Статус:</label>
        <select id="st-${order.id}" data-action="status" data-id="${order.id}" class="status-${order.status || 'new'}">
          <option value="new" ${order.status==='new'?'selected':''}>Новый</option>
          <option value="progress" ${order.status==='progress'?'selected':''}>В работе</option>
          <option value="done" ${order.status==='done'?'selected':''}>Выполнен</option>
        </select>
      </div>
      <div class="order-actions">
        <a class="btn btn-primary" href="tel:${escapeAttr(order.phone)}">Позвонить</a>
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
      if (o) { o.status = e.target.value; e.target.className = 'status-' + e.target.value; saveOrders(orders); renderStats(loadOrders()); updateTabCounts(); }
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

async function showDash() {
  $('loginView').hidden = true;
  $('dashView').hidden = false;
  await fetchRemote();
  renderStats(loadOrders());
  renderOrders();
  updateTabCounts();
}

function logout() {
  sessionStorage.removeItem('nova_admin');
  location.reload();
}

// Fetch orders from backend (shared across browsers) when ORDER_API is configured
async function fetchRemote() {
  if (typeof ORDER_API === 'undefined' || !ORDER_API) return;
  try {
    const res = await fetch(ORDER_API + '?action=list', { method: 'GET', mode: 'cors' });
    if (!res.ok) return;
    const remote = await res.json();
    if (!Array.isArray(remote)) return;
    const local = loadOrders();
    const byId = new Map(local.map(o => [o.id, o]));
    remote.forEach(r => { if (!byId.has(r.id)) byId.set(r.id, r); });
    const merged = [...byId.values()].sort((a, b) => (b.id || 0) - (a.id || 0));
    saveOrders(merged);
  } catch (e) {
    // backend unavailable; keep local data
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('nova_admin') === '1') {
    showDash();
  } else {
    initLogin();
  }

  document.querySelectorAll('.status-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentFilter = tab.dataset.status;
      document.querySelectorAll('.status-tab').forEach(t => t.classList.toggle('active', t === tab));
      updateTabCounts();
      renderOrders();
      renderStats(loadOrders());
    });
  });
  updateTabCounts();
  $('refreshBtn').addEventListener('click', async () => { await fetchRemote(); renderOrders(); renderStats(loadOrders()); updateTabCounts(); });
  $('exportBtn').addEventListener('click', exportCSV);
  $('clearBtn').addEventListener('click', () => {
    if (!confirm('Удалить все локальные заказы?')) return;
    localStorage.removeItem('nova_orders');
    renderOrders(); renderStats(loadOrders());
  });
  $('logoutBtn').addEventListener('click', logout);
});
