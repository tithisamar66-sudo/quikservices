// views.customer.js

function customerShell(activeKey, contentHtml) {
  const user = Store.state.user;
  const navItems = [
    { key: 'home', ico: '🏠', label: 'Home', path: '/customer/home' },
    { key: 'find', ico: '🔍', label: 'Find Provider', path: '/customer/find' },
    { key: 'bookings', ico: '📋', label: 'My Bookings', path: '/customer/bookings' },
    { key: 'help', ico: '🆘', label: 'Help & Support', path: '/customer/help' },
  ];
  return `
    <div class="dash-shell">
      <aside class="dash-sidebar">
        <div class="dash-brand">
          <span class="brand-mark">Q</span>
          <span class="dash-brand-text">QUIKService</span>
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
            <div class="role">Customer</div>
          </div>
        </div>
        <button class="dash-logout" onclick="Store.logout()">← Log out</button>
      </aside>
      <main class="dash-main">${contentHtml}</main>
    </div>`;
}

// ---- Customer Home ----
async function renderCustomerHome(container) {
  container.innerHTML = customerShell('home', `<div style="display:flex;align-items:center;justify-content:center;height:60vh"><span class="spinner spinner-dark" style="width:32px;height:32px"></span></div>`);
  Assistant.mount();
}

// ---- Find Provider (AI Matching) ----
function renderCustomerFind(container) {
  let providers = [];
  let userLat = null, userLng = null;
  let category = '', maxBudget = '';
  let locationGranted = false;

  function render(loading = false) {
    container.innerHTML = customerShell('find', `
      <div class="dash-topbar">
        <div class="dash-title"><h2>🔍 Find a Provider</h2><p>AI-ranked results based on your location, ratings and fit</p></div>
        <button class="btn btn-primary btn-sm" id="get-location">📍 Use My Location</button>
      </div>
      <div class="search-bar">
        <div class="field"><label>Category</label>
          <select id="cat-filter">
            <option value="">All categories</option>
            ${['Electrician','Plumber','House Cleaning','AC Repair','Pest Control','Beauty & Salon','Carpenter','Car Wash','Appliance Repair','Painting']
              .map(c=>`<option value="${c}" ${category===c?'selected':''}>${categoryEmoji(c)} ${c}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Max Budget (₹/hr)</label>
          <input id="budget-filter" type="number" placeholder="e.g. 500" value="${maxBudget}" />
        </div>
        <button class="btn btn-primary" id="search-btn">Search</button>
      </div>
      ${locationGranted ? `<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;font-size:0.84rem;color:var(--teal-600)">📍 Location enabled — results ranked by proximity</div>` : ''}
      ${loading ? `<div style="text-align:center;padding:60px"><span class="spinner spinner-dark" style="width:28px;height:28px"></span><p style="margin-top:12px;color:var(--slate-500)">AI is ranking providers…</p></div>` :
        providers.length === 0 ? `<div class="empty-state"><div class="emoji">🔍</div><p>Click Search to find providers near you</p></div>` :
        `<div style="margin-bottom:12px;font-size:0.86rem;color:var(--slate-500)">${providers.length} providers found · sorted by AI match score</div>
        <div class="results-grid">${providers.map(p => renderProviderCard(p)).join('')}</div>`}
    `);
    bindFindEvents();
    Assistant.mount();
  }

  function renderProviderCard(p) {
    let skills = [];
    try { skills = JSON.parse(p.skills || '[]'); } catch(e) {}
    return `
      <div class="provider-card">
        <div class="provider-top">
          <div class="avatar" style="width:48px;height:48px">${initials(p.name)}</div>
          <div style="flex:1;min-width:0">
            <div class="provider-name">
              ${escapeHtml(p.name)}
              ${p.verified_badge ? '<span style="color:var(--teal-500);font-size:0.8rem" title="Verified">✓</span>' : ''}
            </div>
            <div class="provider-cat">${categoryEmoji(p.category)} ${escapeHtml(p.category||'')}</div>
          </div>
        </div>
        <div class="provider-meta">
          <span class="item">⭐ ${Number(p.rating_avg||0).toFixed(1)} (${p.rating_count||0})</span>
          <span class="item">📅 ${p.experience_years||0} yrs exp</span>
          ${p.distanceKm!==null&&p.distanceKm!==undefined ? `<span class="item">📍 ${p.distanceKm} km</span>` : ''}
          <span class="item">💰 ₹${p.hourly_rate||0}/hr</span>
        </div>
        ${skills.length ? `<div class="chip-list" style="margin-top:10px">${skills.slice(0,3).map(s=>`<span class="chip" style="font-size:0.74rem;padding:4px 10px">${s}</span>`).join('')}</div>` : ''}
        <div class="ai-score-pill">🤖 AI Match Score: ${p.aiScore || '--'} · ${escapeHtml(p.aiReason||'')}</div>
        <button class="btn btn-primary btn-block btn-sm" style="margin-top:14px" data-book="${p.user_id||p.id}" data-name="${escapeHtml(p.name)}" data-cat="${escapeHtml(p.category||'')}" data-rate="${p.hourly_rate||0}">Book Now →</button>
      </div>`;
  }

  function bindFindEvents() {
    document.getElementById('get-location').onclick = () => {
      navigator.geolocation.getCurrentPosition(pos => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        locationGranted = true;
        toast('Location enabled! Results re-ranked by proximity.', 'success');
        doSearch();
      }, () => toast('Location access denied — results ranked by rating only.', 'error'));
    };
    document.getElementById('search-btn').onclick = doSearch;
    document.getElementById('cat-filter').onchange = e => { category = e.target.value; };
    document.getElementById('budget-filter').oninput = e => { maxBudget = e.target.value; };

    document.querySelectorAll('[data-book]').forEach(btn => {
      btn.onclick = () => openBookingModal(btn.dataset.book, btn.dataset.name, btn.dataset.cat, parseFloat(btn.dataset.rate));
    });
  }

  async function doSearch() {
    render(true);
    try {
      category = document.getElementById('cat-filter')?.value || category;
      maxBudget = document.getElementById('budget-filter')?.value || maxBudget;
      let url = '/customer/providers/search';
      const qs = [];
      if (category) qs.push(`category=${encodeURIComponent(category)}`);
      if (maxBudget) qs.push(`maxBudget=${maxBudget}`);
      if (userLat) qs.push(`lat=${userLat}&lng=${userLng}`);
      if (qs.length) url += '?' + qs.join('&');
      const res = await Api.get(url);
      providers = res.providers;
    } catch (e) { toast(e.message, 'error'); providers = []; }
    render(false);
  }

  function openBookingModal(providerId, providerName, category, rate) {
    openModal(`
      <div class="modal-head">
        <div><h3 style="font-size:1.2rem">Book ${escapeHtml(providerName)}</h3><p style="color:var(--slate-500);font-size:0.86rem;margin-top:4px">${categoryEmoji(category)} ${escapeHtml(category)} · ₹${rate}/hr</p></div>
        <button class="modal-close" onclick="closeModal()">✕</button>
      </div>
      <div class="field"><label>Date</label><input id="b-date" type="date" min="${new Date().toISOString().split('T')[0]}" /></div>
      <div class="field"><label>Time</label><input id="b-time" type="time" /></div>
      <div class="field"><label>Service Address</label><input id="b-addr" type="text" placeholder="Full address for the visit" /></div>
      <div class="field"><label>Describe the problem</label><textarea id="b-desc" rows="3" placeholder="e.g. Fan not working, need wiring check"></textarea></div>
      <div class="field"><label>Estimated hours</label><input id="b-hrs" type="number" min="1" max="8" value="1" /></div>
      <p style="font-size:0.82rem;color:var(--slate-500);margin-bottom:14px">Estimated total: <b id="b-total">₹${rate}</b></p>
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" style="flex:1" id="book-confirm">Confirm Booking →</button>
      </div>
    `, () => {
      document.getElementById('b-hrs').oninput = e => {
        document.getElementById('b-total').textContent = `₹${Math.round(rate * (parseFloat(e.target.value)||1))}`;
      };
      document.getElementById('book-confirm').onclick = async () => {
        const btn = document.getElementById('book-confirm');
        btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Booking…`;
        const date = document.getElementById('b-date').value;
        const time = document.getElementById('b-time').value;
        const addr = document.getElementById('b-addr').value;
        const desc = document.getElementById('b-desc').value;
        const hrs = parseFloat(document.getElementById('b-hrs').value)||1;
        if (!date || !time) { toast('Please pick a date and time', 'error'); btn.disabled=false; btn.textContent='Confirm Booking →'; return; }
        try {
          const res = await Api.post('/customer/bookings', {
            provider_id: providerId, category, description: desc,
            scheduled_date: date, scheduled_time: time,
            address: addr, price: Math.round(rate * hrs),
          });
          closeModal();
          toast('Booking created! Go to My Bookings to pay.', 'success');
          Router.go('/customer/bookings');
        } catch(e) { toast(e.message,'error'); btn.disabled=false; btn.textContent='Confirm Booking →'; }
      };
    });
  }

  render();
}

// ---- Customer Bookings ----
async function renderCustomerBookings(container) {
  container.innerHTML = customerShell('bookings', `<div style="padding:60px;text-align:center"><span class="spinner spinner-dark" style="width:28px;height:28px"></span></div>`);
  let bookings = [];
  try { bookings = (await Api.get('/customer/bookings')).bookings; } catch(e) { toast(e.message,'error'); }

  function render() {
    const tabs = ['all','pending','accepted','in_progress','completed','cancelled'];
    const activeTab = window._custBookTab || 'all';
    const filtered = activeTab === 'all' ? bookings : bookings.filter(b=>b.status===activeTab);

    container.innerHTML = customerShell('bookings', `
      <div class="dash-topbar"><div class="dash-title"><h2>📋 My Bookings</h2><p>Track and manage all your service bookings</p></div></div>
      <div class="tabs">
        ${tabs.map(t=>`<button class="tab-btn ${activeTab===t?'active':''}" data-tab="${t}">${t.replace('_',' ')}</button>`).join('')}
      </div>
      ${filtered.length === 0 ? `<div class="empty-state"><div class="emoji">📭</div><p>No bookings here yet.<br><a href="#/customer/find" style="color:var(--teal-600);font-weight:600">Find a provider →</a></p></div>` :
        filtered.map(b => renderBookingRow(b)).join('')}
    `);
    bindBookingEvents();
    Assistant.mount();
  }

  function renderBookingRow(b) {
    const canPay = b.status !== 'cancelled' && b.payment_status === 'unpaid';
    const canCancel = ['pending','accepted'].includes(b.status);
    const canReview = b.status === 'completed';
    return `
      <div class="list-row">
        <div class="left">
          <div class="avatar" style="width:42px;height:42px;font-size:0.8rem">${categoryEmoji(b.category)}</div>
          <div>
            <div style="font-weight:700">${escapeHtml(b.category)}</div>
            <div style="font-size:0.86rem;color:var(--slate-700)">Provider: ${escapeHtml(b.provider_name)}</div>
            <div class="meta-line">
              <span>📅 ${b.scheduled_date} ${b.scheduled_time}</span>
              <span>💰 ₹${b.price}</span>
              <span class="status-pill status-${b.status}">${b.status.replace('_',' ')}</span>
              <span class="badge ${b.payment_status==='paid'?'badge-success':'badge-amber'}">${b.payment_status}</span>
            </div>
            <div style="font-size:0.74rem;color:var(--slate-400);margin-top:4px" class="mono">ID: ${b.id.slice(0,12)}…</div>
          </div>
        </div>
        <div class="actions">
          ${canPay ? `<button class="btn btn-primary btn-sm" data-pay="${b.id}" data-amt="${b.price}">💳 Pay ₹${b.price}</button>` : ''}
          ${canCancel ? `<button class="btn btn-ghost btn-sm" data-cancel="${b.id}">Cancel</button>` : ''}
          ${canReview ? `<button class="btn btn-amber btn-sm" data-review="${b.id}" data-pid="${b.provider_id}">⭐ Review</button>` : ''}
          <button class="btn btn-ghost btn-sm" data-help="${b.id}">🆘 Help</button>
        </div>
      </div>`;
  }

  function bindBookingEvents() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => { window._custBookTab = btn.dataset.tab; render(); };
    });
    document.querySelectorAll('[data-pay]').forEach(btn => openPayModal(btn));
    document.querySelectorAll('[data-cancel]').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Cancel this booking?')) return;
        try {
          await Api.put(`/customer/bookings/${btn.dataset.cancel}/cancel`);
          bookings = (await Api.get('/customer/bookings')).bookings;
          toast('Booking cancelled.', 'success'); render();
        } catch(e) { toast(e.message,'error'); }
      };
    });
    document.querySelectorAll('[data-review]').forEach(btn => openReviewModal(btn.dataset.review));
    document.querySelectorAll('[data-help]').forEach(btn => openHelpModal(btn.dataset.help));
  }

  function openPayModal(btn) {
    btn.onclick = () => {
      let method = 'UPI';
      openModal(`
        <div class="modal-head"><h3>💳 Make Payment</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
        <p style="color:var(--slate-500);font-size:0.9rem;margin-bottom:16px">Amount: <b>₹${btn.dataset.amt}</b></p>
        <div class="pay-methods">
          <div class="pay-method selected" data-m="UPI"><div class="pic">📱</div>UPI</div>
          <div class="pay-method" data-m="CARD"><div class="pic">💳</div>Card</div>
          <div class="pay-method" data-m="COD"><div class="pic">💵</div>Cash (COD)</div>
        </div>
        <div style="display:flex;gap:10px;margin-top:8px">
          <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" style="flex:1" id="pay-confirm">Pay Now →</button>
        </div>
      `, () => {
        document.querySelectorAll('.pay-method').forEach(m => {
          m.onclick = () => {
            document.querySelectorAll('.pay-method').forEach(x=>x.classList.remove('selected'));
            m.classList.add('selected'); method = m.dataset.m;
          };
        });
        document.getElementById('pay-confirm').onclick = async () => {
          const b = document.getElementById('pay-confirm');
          b.disabled=true; b.innerHTML=`<span class="spinner"></span> Processing…`;
          try {
            const res = await Api.post(`/customer/bookings/${btn.dataset.pay}/pay`, { method });
            closeModal();
            toast(`Payment via ${method} successful! Ref: ${res.txnRef}`, 'success');
            bookings = (await Api.get('/customer/bookings')).bookings; render();
          } catch(e) { toast(e.message,'error'); b.disabled=false; b.textContent='Pay Now →'; }
        };
      });
    };
  }

  function openReviewModal(bookingId) {
    let rating = 5;
    openModal(`
      <div class="modal-head"><h3>⭐ Leave a Review</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
      <p style="color:var(--slate-500);font-size:0.86rem;margin-bottom:14px">How was your experience?</p>
      <div class="star-input" id="star-row">
        ${[1,2,3,4,5].map(i=>`<span class="${i<=5?'active':''}" data-star="${i}">★</span>`).join('')}
      </div>
      <div class="field" style="margin-top:16px"><label>Comments (optional)</label>
        <textarea id="rev-comment" rows="3" placeholder="Tell others about your experience…"></textarea>
      </div>
      <div style="display:flex;gap:10px;margin-top:4px">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" style="flex:1" id="rev-submit">Submit Review</button>
      </div>
    `, () => {
      document.querySelectorAll('#star-row span').forEach(star => {
        star.onclick = () => {
          rating = parseInt(star.dataset.star);
          document.querySelectorAll('#star-row span').forEach((s,i)=>{
            s.className = i < rating ? 'active' : '';
          });
        };
      });
      document.getElementById('rev-submit').onclick = async () => {
        const btn = document.getElementById('rev-submit');
        btn.disabled=true; btn.innerHTML=`<span class="spinner"></span> Submitting…`;
        try {
          await Api.post('/customer/reviews', { booking_id: bookingId, rating, comment: document.getElementById('rev-comment').value });
          closeModal(); toast('Review submitted! Thank you 🙏', 'success');
          bookings = (await Api.get('/customer/bookings')).bookings; render();
        } catch(e) { toast(e.message,'error'); btn.disabled=false; btn.textContent='Submit Review'; }
      };
    });
  }

  function openHelpModal(bookingId) {
    openModal(`
      <div class="modal-head"><h3>🆘 Raise Help Ticket</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
      <div class="field"><label>Subject</label><input id="help-subj" type="text" placeholder="e.g. Provider not arrived" /></div>
      <div class="field"><label>Message</label><textarea id="help-msg" rows="4" placeholder="Describe your issue…"></textarea></div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" style="flex:1" id="help-submit">Submit Ticket</button>
      </div>
    `, () => {
      document.getElementById('help-submit').onclick = async () => {
        const btn = document.getElementById('help-submit');
        btn.disabled=true; btn.innerHTML=`<span class="spinner"></span>`;
        try {
          await Api.post('/customer/help', { booking_id: bookingId, subject: document.getElementById('help-subj').value, message: document.getElementById('help-msg').value });
          closeModal(); toast('Help ticket raised! Support will respond soon.', 'success');
        } catch(e) { toast(e.message,'error'); btn.disabled=false; btn.textContent='Submit Ticket'; }
      };
    });
  }

  render();
}

// ---- Customer Help ----
async function renderCustomerHelp(container) {
  let tickets = [];
  try { tickets = (await Api.get('/customer/help')).tickets; } catch(e) {}

  container.innerHTML = customerShell('help', `
    <div class="dash-topbar">
      <div class="dash-title"><h2>🆘 Help & Support</h2><p>View your tickets or start a new one</p></div>
      <button class="btn btn-primary btn-sm" id="new-ticket">+ New Ticket</button>
    </div>
    <div style="margin-bottom:24px;padding:18px;background:linear-gradient(135deg,rgba(20,184,166,0.08),rgba(245,158,11,0.05));border:1px solid var(--teal-200);border-radius:var(--radius-lg)">
      <b>💬 Try the AI Assistant first!</b> Click the 🤖 button at the bottom-right — it can instantly answer most questions about bookings, payments and cancellations.
    </div>
    ${tickets.length === 0 ? `<div class="empty-state"><div class="emoji">🎉</div><p>No open tickets — all good!</p></div>` :
      tickets.map(t => `
        <div class="list-row">
          <div><div style="font-weight:700">${escapeHtml(t.subject)}</div>
          <div style="font-size:0.84rem;color:var(--slate-500);margin-top:4px">${escapeHtml(t.message.slice(0,80))}…</div>
          <div style="font-size:0.76rem;color:var(--slate-400);margin-top:4px">${timeAgo(t.created_at)}</div></div>
          <span class="status-pill status-${t.status==='resolved'?'completed':t.status==='in_review'?'accepted':'pending'}">${t.status}</span>
        </div>`).join('')}
  `);

  document.getElementById('new-ticket').onclick = () => openHelpModalStandalone();
  Assistant.mount();

  function openHelpModalStandalone() {
    openModal(`
      <div class="modal-head"><h3>🆘 New Help Ticket</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
      <div class="field"><label>Subject</label><input id="help-subj" type="text" placeholder="e.g. Refund query" /></div>
      <div class="field"><label>Message</label><textarea id="help-msg" rows="4" placeholder="Describe your issue…"></textarea></div>
      <button class="btn btn-primary btn-block" id="help-submit">Submit Ticket</button>
    `, () => {
      document.getElementById('help-submit').onclick = async () => {
        const btn = document.getElementById('help-submit');
        btn.disabled=true;
        try {
          await Api.post('/customer/help', { subject: document.getElementById('help-subj').value, message: document.getElementById('help-msg').value });
          closeModal(); toast('Ticket raised!', 'success');
          renderCustomerHelp(container);
        } catch(e) { toast(e.message,'error'); btn.disabled=false; }
      };
    });
  }
}
