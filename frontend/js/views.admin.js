// views.admin.js

function adminShell(activeKey, contentHtml) {
  const user = Store.state.user;
  const navItems = [
    { key: 'dashboard', ico: '📊', label: 'Overview', path: '/admin/dashboard' },
    { key: 'users', ico: '👥', label: 'Users', path: '/admin/users' },
    { key: 'providers', ico: '🛠️', label: 'Providers', path: '/admin/providers' },
    { key: 'bookings', ico: '📋', label: 'Bookings', path: '/admin/bookings' },
    { key: 'payments', ico: '💰', label: 'Payments', path: '/admin/payments' },
    { key: 'reviews', ico: '⭐', label: 'Reviews', path: '/admin/reviews' },
    { key: 'tickets', ico: '🆘', label: 'Help Tickets', path: '/admin/tickets' },
  ];
  return `
    <div class="dash-shell">
      <aside class="dash-sidebar">
        <div class="dash-brand">
          <span class="brand-mark">Q</span>
          <span class="dash-brand-text">Admin Panel</span>
        </div>
        <nav class="dash-nav">
          ${navItems.map(n => `
            <a href="#${n.path}" class="dash-nav-item ${activeKey===n.key?'active':''}">
              <span class="ico">${n.ico}</span><span class="label">${n.label}</span>
            </a>`).join('')}
        </nav>
        <div class="dash-user-box">
          <div class="av">${initials(user.name)}</div>
          <div class="info">
            <div class="name">${escapeHtml(user.name)}</div>
            <div class="role">Admin</div>
          </div>
        </div>
        <button class="dash-logout" onclick="Store.logout()">← Log out</button>
      </aside>
      <main class="dash-main">${contentHtml}</main>
    </div>`;
}

// ---- Admin Dashboard Overview ----
async function renderAdminDashboard(container) {
  let stats = {};
  try { stats = await Api.get('/admin/dashboard'); } catch(e) { toast(e.message,'error'); }

  container.innerHTML = adminShell('dashboard', `
    <div class="dash-topbar">
      <div class="dash-title"><h2>📊 Platform Overview</h2><p>Real-time metrics and health of QUIKService</p></div>
    </div>
    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card"><div class="label">Total Customers</div><div class="value">${stats.totalCustomers||0}</div></div>
      <div class="stat-card"><div class="label">Total Providers</div><div class="value">${stats.totalProviders||0}</div></div>
      <div class="stat-card"><div class="label">Total Bookings</div><div class="value">${stats.totalBookings||0}</div></div>
      <div class="stat-card"><div class="label">Completed</div><div class="value" style="color:var(--success)">${stats.completedBookings||0}</div></div>
    </div>
    <div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat-card"><div class="label">Total Revenue (paid)</div><div class="value">₹${Number(stats.totalRevenue||0).toFixed(0)}</div></div>
      <div class="stat-card"><div class="label">Open Help Tickets</div><div class="value" style="color:var(--danger)">${stats.openTickets||0}</div></div>
      <div class="stat-card"><div class="label">Avg Platform Rating</div><div class="value" style="color:var(--amber-500)">${Number(stats.avgRating||0).toFixed(1)} ⭐</div></div>
    </div>
    <div style="padding:20px;background:var(--ink-900);border-radius:var(--radius-lg);color:white;margin-top:8px">
      <div style="font-weight:700;margin-bottom:12px;color:var(--teal-300)">Quick Links</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <a href="#/admin/users" class="btn btn-ghost-light btn-sm">👥 Manage Users</a>
        <a href="#/admin/providers" class="btn btn-ghost-light btn-sm">🛠️ Verify Providers</a>
        <a href="#/admin/tickets" class="btn btn-ghost-light btn-sm">🆘 Help Tickets</a>
        <a href="#/admin/payments" class="btn btn-ghost-light btn-sm">💰 Payment Records</a>
      </div>
    </div>
  `);
}

// ---- Admin Users ----
async function renderAdminUsers(container) {
  let users = [];
  const roleFilter = window._adminUserRole || '';
  try { users = (await Api.get(`/admin/users${roleFilter ? '?role='+roleFilter : ''}`)).users; } catch(e) { toast(e.message,'error'); }

  container.innerHTML = adminShell('users', `
    <div class="dash-topbar">
      <div class="dash-title"><h2>👥 Users</h2><p>${users.length} total users</p></div>
      <div style="display:flex;gap:8px">
        ${['','customer','provider','admin'].map(r=>`<button class="btn btn-sm ${roleFilter===r?'btn-primary':'btn-ghost'}" data-role="${r}">${r||'All'}</button>`).join('')}
      </div>
    </div>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:0.86rem">
        <thead>
          <tr style="background:var(--slate-100);color:var(--slate-500);font-size:0.76rem;text-transform:uppercase;letter-spacing:0.04em">
            <th style="padding:10px 14px;text-align:left">Name</th>
            <th style="padding:10px 14px;text-align:left">Email</th>
            <th style="padding:10px 14px;text-align:left">Role</th>
            <th style="padding:10px 14px;text-align:left">Status</th>
            <th style="padding:10px 14px;text-align:left">Joined</th>
            <th style="padding:10px 14px;text-align:left">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(u=>`
            <tr style="border-bottom:1px solid var(--slate-200)">
              <td style="padding:12px 14px"><div style="display:flex;align-items:center;gap:10px"><div class="avatar" style="width:32px;height:32px;font-size:0.72rem">${initials(u.name)}</div>${escapeHtml(u.name)}</div></td>
              <td style="padding:12px 14px;color:var(--slate-500)">${escapeHtml(u.email)}</td>
              <td style="padding:12px 14px"><span class="badge ${u.role==='admin'?'badge-teal':u.role==='provider'?'badge-amber':'badge-slate'}">${u.role}</span></td>
              <td style="padding:12px 14px">
                ${u.is_blocked ? `<span class="badge badge-danger">Blocked</span>` : u.is_verified ? `<span class="badge badge-success">Active</span>` : `<span class="badge badge-amber">Unverified</span>`}
              </td>
              <td style="padding:12px 14px;color:var(--slate-500)">${timeAgo(u.created_at)}</td>
              <td style="padding:12px 14px">
                <button class="btn btn-sm ${u.is_blocked?'btn-primary':'btn-danger'}" data-block="${u.id}" data-blocked="${u.is_blocked}">
                  ${u.is_blocked ? 'Unblock' : 'Block'}
                </button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `);

  container.querySelectorAll('[data-role]').forEach(btn => {
    btn.onclick = () => { window._adminUserRole = btn.dataset.role; renderAdminUsers(container); };
  });
  container.querySelectorAll('[data-block]').forEach(btn => {
    btn.onclick = async () => {
      const blocked = btn.dataset.blocked === '1';
      try {
        await Api.put(`/admin/users/${btn.dataset.block}/block`, { blocked: !blocked });
        toast(`User ${!blocked ? 'blocked' : 'unblocked'}`, 'success');
        renderAdminUsers(container);
      } catch(e) { toast(e.message,'error'); }
    };
  });
}

// ---- Admin Providers ----
async function renderAdminProviders(container) {
  let providers = [];
  try { providers = (await Api.get('/admin/providers')).providers; } catch(e) { toast(e.message,'error'); }

  container.innerHTML = adminShell('providers', `
    <div class="dash-topbar"><div class="dash-title"><h2>🛠️ Providers</h2><p>${providers.length} registered providers</p></div></div>
    <div class="results-grid">
      ${providers.map(p => {
        let skills = [];
        try { skills = JSON.parse(p.skills||'[]'); } catch(e) {}
        return `
          <div class="provider-card">
            <div class="provider-top">
              <div class="avatar">${initials(p.name)}</div>
              <div>
                <div class="provider-name">${escapeHtml(p.name)} ${p.verified_badge?'<span style="color:var(--teal-500)">✓</span>':''}</div>
                <div class="provider-cat">${categoryEmoji(p.category||'')} ${escapeHtml(p.category||'N/A')}</div>
              </div>
            </div>
            <div class="provider-meta">
              <span>⭐ ${Number(p.rating_avg||0).toFixed(1)} (${p.rating_count||0})</span>
              <span>📅 ${p.experience_years||0} yrs</span>
              <span>💰 ₹${p.hourly_rate||0}/hr</span>
              <span>📍 ${escapeHtml(p.city||'—')}</span>
            </div>
            ${skills.length?`<div class="chip-list" style="margin-top:10px">${skills.slice(0,3).map(s=>`<span class="chip" style="font-size:0.72rem;padding:3px 9px">${s}</span>`).join('')}</div>`:''}
            ${p.is_blocked?`<div style="margin-top:10px"><span class="badge badge-danger">Blocked</span></div>`:''}
            <div style="display:flex;gap:8px;margin-top:14px">
              <button class="btn btn-sm ${p.verified_badge?'btn-ghost':'btn-primary'}" data-verify="${p.id}" data-cur="${p.verified_badge}">
                ${p.verified_badge?'Unverify':'Verify ✓'}
              </button>
              <button class="btn btn-sm ${p.is_blocked?'btn-primary':'btn-danger'}" data-block="${p.id}" data-blocked="${p.is_blocked}">
                ${p.is_blocked?'Unblock':'Block'}
              </button>
            </div>
          </div>`;
      }).join('')}
    </div>
  `);

  container.querySelectorAll('[data-verify]').forEach(btn => {
    btn.onclick = async () => {
      try {
        await Api.put(`/admin/providers/${btn.dataset.verify}/verify`, { verified: btn.dataset.cur !== '1' });
        toast('Verification updated', 'success'); renderAdminProviders(container);
      } catch(e) { toast(e.message,'error'); }
    };
  });
  container.querySelectorAll('[data-block]').forEach(btn => {
    btn.onclick = async () => {
      try {
        await Api.put(`/admin/users/${btn.dataset.block}/block`, { blocked: btn.dataset.blocked !== '1' });
        toast('User status updated', 'success'); renderAdminProviders(container);
      } catch(e) { toast(e.message,'error'); }
    };
  });
}

// ---- Admin Bookings ----
async function renderAdminBookings(container) {
  let bookings = [];
  try { bookings = (await Api.get('/admin/bookings')).bookings; } catch(e) { toast(e.message,'error'); }

  container.innerHTML = adminShell('bookings', `
    <div class="dash-topbar"><div class="dash-title"><h2>📋 All Bookings</h2><p>${bookings.length} total bookings</p></div></div>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:0.84rem;min-width:700px">
        <thead>
          <tr style="background:var(--slate-100);font-size:0.74rem;text-transform:uppercase;color:var(--slate-500)">
            <th style="padding:10px 14px;text-align:left">ID</th>
            <th style="padding:10px 14px;text-align:left">Category</th>
            <th style="padding:10px 14px;text-align:left">Customer</th>
            <th style="padding:10px 14px;text-align:left">Provider</th>
            <th style="padding:10px 14px;text-align:left">Date</th>
            <th style="padding:10px 14px;text-align:left">Amount</th>
            <th style="padding:10px 14px;text-align:left">Status</th>
            <th style="padding:10px 14px;text-align:left">Payment</th>
          </tr>
        </thead>
        <tbody>
          ${bookings.map(b=>`
            <tr style="border-bottom:1px solid var(--slate-200)">
              <td style="padding:10px 14px;font-family:var(--font-mono);font-size:0.72rem;color:var(--slate-400)">${b.id.slice(0,10)}…</td>
              <td style="padding:10px 14px">${categoryEmoji(b.category)} ${escapeHtml(b.category)}</td>
              <td style="padding:10px 14px">${escapeHtml(b.customer_name)}</td>
              <td style="padding:10px 14px">${escapeHtml(b.provider_name)}</td>
              <td style="padding:10px 14px;color:var(--slate-500)">${b.scheduled_date}</td>
              <td style="padding:10px 14px;font-weight:700">₹${b.price}</td>
              <td style="padding:10px 14px"><span class="status-pill status-${b.status}">${b.status.replace('_',' ')}</span></td>
              <td style="padding:10px 14px"><span class="badge ${b.payment_status==='paid'?'badge-success':'badge-amber'}">${b.payment_status}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `);
}

// ---- Admin Payments ----
async function renderAdminPayments(container) {
  let payments = [];
  try { payments = (await Api.get('/admin/payments')).payments; } catch(e) { toast(e.message,'error'); }
  const total = payments.filter(p=>p.status==='success').reduce((s,p)=>s+p.amount,0);

  container.innerHTML = adminShell('payments', `
    <div class="dash-topbar"><div class="dash-title"><h2>💰 Payment Records</h2><p>Total collected: <b>₹${total.toFixed(0)}</b></p></div></div>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:0.84rem;min-width:600px">
        <thead>
          <tr style="background:var(--slate-100);font-size:0.74rem;text-transform:uppercase;color:var(--slate-500)">
            <th style="padding:10px 14px;text-align:left">Txn Ref</th>
            <th style="padding:10px 14px;text-align:left">Customer</th>
            <th style="padding:10px 14px;text-align:left">Category</th>
            <th style="padding:10px 14px;text-align:left">Method</th>
            <th style="padding:10px 14px;text-align:left">Amount</th>
            <th style="padding:10px 14px;text-align:left">Status</th>
            <th style="padding:10px 14px;text-align:left">Date</th>
          </tr>
        </thead>
        <tbody>
          ${payments.map(p=>`
            <tr style="border-bottom:1px solid var(--slate-200)">
              <td style="padding:10px 14px;font-family:var(--font-mono);font-size:0.72rem;color:var(--slate-400)">${escapeHtml(p.txn_ref||'—')}</td>
              <td style="padding:10px 14px">${escapeHtml(p.customer_name)}</td>
              <td style="padding:10px 14px">${categoryEmoji(p.category)} ${escapeHtml(p.category)}</td>
              <td style="padding:10px 14px"><span class="badge badge-slate">${p.method}</span></td>
              <td style="padding:10px 14px;font-weight:700;color:var(--success)">₹${p.amount}</td>
              <td style="padding:10px 14px"><span class="badge ${p.status==='success'?'badge-success':'badge-amber'}">${p.status}</span></td>
              <td style="padding:10px 14px;color:var(--slate-400)">${timeAgo(p.created_at)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  `);
}

// ---- Admin Reviews ----
async function renderAdminReviews(container) {
  let reviews = [];
  try { reviews = (await Api.get('/admin/reviews')).reviews; } catch(e) { toast(e.message,'error'); }

  container.innerHTML = adminShell('reviews', `
    <div class="dash-topbar"><div class="dash-title"><h2>⭐ All Reviews</h2><p>${reviews.length} reviews across platform</p></div></div>
    ${reviews.map(r=>`
      <div class="review-card">
        <div class="top">
          <div style="display:flex;gap:14px;align-items:center">
            <div class="avatar" style="width:36px;height:36px;font-size:0.76rem">${initials(r.customer_name)}</div>
            <div>
              <div style="font-weight:700;font-size:0.88rem">${escapeHtml(r.customer_name)} → ${escapeHtml(r.provider_name)}</div>
              <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
            </div>
          </div>
          <div style="font-size:0.76rem;color:var(--slate-400)">${timeAgo(r.created_at)}</div>
        </div>
        ${r.comment?`<p style="margin-top:10px;font-size:0.86rem;color:var(--slate-600)">"${escapeHtml(r.comment)}"</p>`:''}
      </div>`).join('')}
  `);
}

// ---- Admin Help Tickets ----
async function renderAdminTickets(container) {
  let tickets = [];
  try { tickets = (await Api.get('/admin/help-tickets')).tickets; } catch(e) { toast(e.message,'error'); }

  container.innerHTML = adminShell('tickets', `
    <div class="dash-topbar"><div class="dash-title"><h2>🆘 Help Tickets</h2><p>${tickets.filter(t=>t.status==='open').length} open tickets</p></div></div>
    ${tickets.map(t=>`
      <div class="list-row">
        <div>
          <div style="display:flex;gap:10px;align-items:center">
            <div style="font-weight:700">${escapeHtml(t.subject)}</div>
            <span class="badge ${t.status==='resolved'?'badge-success':t.status==='in_review'?'badge-teal':'badge-amber'}">${t.status}</span>
          </div>
          <div style="font-size:0.84rem;color:var(--slate-500);margin-top:4px">${escapeHtml(t.user_name)} (${t.user_role}) · ${timeAgo(t.created_at)}</div>
          <div style="font-size:0.84rem;color:var(--slate-700);margin-top:6px">${escapeHtml((t.message||'').slice(0,120))}</div>
        </div>
        <div class="actions">
          ${t.status!=='in_review'?`<button class="btn btn-ghost btn-sm" data-tid="${t.id}" data-ts="in_review">Mark In Review</button>`:''}
          ${t.status!=='resolved'?`<button class="btn btn-primary btn-sm" data-tid="${t.id}" data-ts="resolved">Resolve ✓</button>`:''}
        </div>
      </div>`).join('')}
  `);

  container.querySelectorAll('[data-tid]').forEach(btn => {
    btn.onclick = async () => {
      try {
        await Api.put(`/admin/help-tickets/${btn.dataset.tid}/status`, { status: btn.dataset.ts });
        toast('Ticket status updated', 'success'); renderAdminTickets(container);
      } catch(e) { toast(e.message,'error'); }
    };
  });
}
