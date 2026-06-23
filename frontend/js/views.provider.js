// views.provider.js

function providerShell(activeKey, contentHtml) {
  const user = Store.state.user;
  const navItems = [
    { key: 'dashboard', ico: '📊', label: 'Dashboard', path: '/provider/dashboard' },
    { key: 'profile', ico: '👤', label: 'My Profile', path: '/provider/profile' },
    { key: 'bookings', ico: '📋', label: 'Bookings', path: '/provider/bookings' },
    { key: 'reviews', ico: '⭐', label: 'Reviews', path: '/provider/reviews' },
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
            <div class="role">Provider</div>
          </div>
        </div>
        <button class="dash-logout" onclick="Store.logout()">← Log out</button>
      </aside>
      <main class="dash-main">${contentHtml}</main>
    </div>`;
}

// ---- Provider Dashboard ----
async function renderProviderDashboard(container) {
  let stats = {}, bookings = [];
  try {
    [stats, { bookings }] = await Promise.all([Api.get('/provider/dashboard'), Api.get('/provider/bookings')]);
  } catch(e) { toast(e.message,'error'); }

  const recent = bookings.slice(0,5);

  container.innerHTML = providerShell('dashboard', `
    <div class="dash-topbar">
      <div class="dash-title"><h2>📊 Dashboard</h2><p>Welcome back, ${escapeHtml(Store.state.user.name)}</p></div>
    </div>
    <div class="stat-grid">
      <div class="stat-card"><div class="label">Total Bookings</div><div class="value">${stats.totalBookings||0}</div></div>
      <div class="stat-card"><div class="label">Completed</div><div class="value" style="color:var(--success)">${stats.completed||0}</div></div>
      <div class="stat-card"><div class="label">Pending</div><div class="value" style="color:var(--amber-500)">${stats.pending||0}</div></div>
      <div class="stat-card"><div class="label">Earnings (paid)</div><div class="value">₹${stats.earnings||0}</div></div>
    </div>
    ${stats.rating ? `<div style="margin-bottom:24px;padding:16px 20px;background:white;border:1px solid var(--slate-200);border-radius:var(--radius-lg);display:flex;gap:20px;align-items:center">
      <div style="font-size:2rem">⭐</div>
      <div><div style="font-family:var(--font-mono);font-size:1.6rem;font-weight:700">${Number(stats.rating.rating_avg||0).toFixed(1)}</div>
      <div style="font-size:0.82rem;color:var(--slate-500)">${stats.rating.rating_count||0} reviews</div></div>
      <div style="margin-left:auto"><a href="#/provider/reviews" class="btn btn-ghost btn-sm">View all reviews →</a></div>
    </div>` : ''}
    <h3 style="margin-bottom:16px">Recent Bookings</h3>
    ${recent.length === 0 ? `<div class="empty-state"><div class="emoji">📭</div><p>No bookings yet — complete your profile to appear in search results.</p></div>` :
      recent.map(b => renderProviderBookingRow(b, false)).join('')}
    <div style="margin-top:16px"><a href="#/provider/bookings" class="btn btn-ghost btn-sm">View all bookings →</a></div>
  `);
  bindStatusBtns(container, async () => {
    const res = await Api.get('/provider/bookings');
    bookings = res.bookings;
    renderProviderDashboard(container);
  });
  Assistant.mount();
}

function renderProviderBookingRow(b, showAll = true) {
  const canAccept = b.status === 'pending';
  const canProgress = b.status === 'accepted';
  const canComplete = b.status === 'in_progress';
  return `
    <div class="list-row">
      <div class="left">
        <div class="avatar" style="width:42px;height:42px;font-size:0.8rem">${categoryEmoji(b.category)}</div>
        <div>
          <div style="font-weight:700">${escapeHtml(b.category)}</div>
          <div style="font-size:0.86rem;color:var(--slate-700)">Customer: ${escapeHtml(b.customer_name)} · ${escapeHtml(b.customer_phone||'')}</div>
          <div class="meta-line">
            <span>📅 ${b.scheduled_date} ${b.scheduled_time}</span>
            <span>💰 ₹${b.price}</span>
            <span class="status-pill status-${b.status}">${b.status.replace('_',' ')}</span>
            <span class="badge ${b.payment_status==='paid'?'badge-success':'badge-amber'}">${b.payment_status}</span>
          </div>
          ${b.description ? `<div style="font-size:0.8rem;color:var(--slate-500);margin-top:4px">${escapeHtml(b.description.slice(0,80))}</div>` : ''}
        </div>
      </div>
      <div class="actions">
        ${canAccept ? `<button class="btn btn-primary btn-sm" data-status-btn="${b.id}" data-new-status="accepted">Accept</button><button class="btn btn-ghost btn-sm" data-status-btn="${b.id}" data-new-status="cancelled">Decline</button>` : ''}
        ${canProgress ? `<button class="btn btn-amber btn-sm" data-status-btn="${b.id}" data-new-status="in_progress">Start Job</button>` : ''}
        ${canComplete ? `<button class="btn btn-primary btn-sm" data-status-btn="${b.id}" data-new-status="completed">Mark Complete ✓</button>` : ''}
      </div>
    </div>`;
}

function bindStatusBtns(container, onUpdate) {
  container.querySelectorAll('[data-status-btn]').forEach(btn => {
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        await Api.put(`/provider/bookings/${btn.dataset.statusBtn}/status`, { status: btn.dataset.newStatus });
        toast('Status updated!', 'success');
        if (onUpdate) onUpdate();
      } catch(e) { toast(e.message,'error'); btn.disabled=false; }
    };
  });
}

// ---- Provider Profile Edit ----
async function renderProviderProfile(container) {
  let profile = {};
  try { profile = (await Api.get('/provider/profile')).profile; } catch(e) { toast(e.message,'error'); }

  let skills = [];
  try { skills = JSON.parse(profile.skills || '[]'); } catch(e) {}
  let avail = { mon:true, tue:true, wed:true, thu:true, fri:true, sat:false, sun:false };
  try { const a = JSON.parse(profile.availability||'{}'); if (Object.keys(a).length) { avail.mon=!!a.mon?.length; avail.tue=!!a.tue?.length; avail.wed=!!a.wed?.length; avail.thu=!!a.thu?.length; avail.fri=!!a.fri?.length; avail.sat=!!a.sat?.length; avail.sun=!!a.sun?.length; } } catch(e) {}

  function render() {
    container.innerHTML = providerShell('profile', `
      <div class="dash-topbar"><div class="dash-title"><h2>👤 My Profile</h2><p>Fill in all details to appear higher in customer searches</p></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <!-- Left column -->
        <div style="display:flex;flex-direction:column;gap:18px">
          <div class="card card-pad">
            <h3 style="margin-bottom:18px;font-size:1.05rem">Personal Info</h3>
            <div class="field"><label>Full Name</label><input id="pf-name" type="text" value="${escapeHtml(profile.name||'')}" /></div>
            <div class="field"><label>Phone</label><input id="pf-phone" type="tel" value="${escapeHtml(profile.phone||'')}" /></div>
            <div class="field"><label>Email</label><input type="email" value="${escapeHtml(profile.email||'')}" disabled style="opacity:0.6" /></div>
            <div class="field"><label>Bio / About Me</label><textarea id="pf-bio" rows="3" placeholder="Tell customers about your experience and approach…">${escapeHtml(profile.bio||'')}</textarea></div>
            <div class="field"><label>Profile Photo URL</label><input id="pf-photo" type="url" placeholder="https://… (link to your photo)" value="${escapeHtml(profile.profile_photo_url||'')}" /></div>
            <div class="field"><label>Languages Spoken</label><input id="pf-lang" type="text" placeholder="e.g. English, Hindi, Kannada" value="${escapeHtml(profile.languages||'')}" /></div>
          </div>

          <div class="card card-pad">
            <h3 style="margin-bottom:18px;font-size:1.05rem">ID & Verification</h3>
            <div class="field"><label>Aadhar / ID Proof Number</label><input id="pf-id" type="text" placeholder="XXXX XXXX XXXX" value="${escapeHtml(profile.id_proof_number||'')}" /></div>
            <div style="font-size:0.78rem;color:var(--slate-500)">Your ID is kept private and only used for verification by QUIKService admins.</div>
          </div>
        </div>

        <!-- Right column -->
        <div style="display:flex;flex-direction:column;gap:18px">
          <div class="card card-pad">
            <h3 style="margin-bottom:18px;font-size:1.05rem">Service Details</h3>
            <div class="field"><label>Category</label>
              <select id="pf-cat">
                <option value="">Select category</option>
                ${['Electrician','Plumber','House Cleaning','AC Repair','Pest Control','Beauty & Salon','Carpenter','Car Wash','Appliance Repair','Painting']
                  .map(c=>`<option value="${c}" ${profile.category===c?'selected':''}>${categoryEmoji(c)} ${c}</option>`).join('')}
              </select>
            </div>
            <div class="field-row">
              <div class="field"><label>Experience (years)</label><input id="pf-exp" type="number" min="0" max="50" value="${profile.experience_years||0}" /></div>
              <div class="field"><label>Hourly Rate (₹)</label><input id="pf-rate" type="number" min="0" value="${profile.hourly_rate||0}" /></div>
            </div>
            <div class="field"><label>Skills / Specialisations</label>
              <div class="chip-list" id="skill-chips">
                ${skills.map((s,i)=>`<div class="chip">${escapeHtml(s)}<button data-sk="${i}" class="remove-skill">✕</button></div>`).join('')}
              </div>
              <div class="chip-add" style="margin-top:8px">
                <input id="skill-input" type="text" placeholder="Add a skill…" />
                <button class="btn btn-ghost btn-sm" id="add-skill">+ Add</button>
              </div>
            </div>
          </div>

          <div class="card card-pad">
            <h3 style="margin-bottom:18px;font-size:1.05rem">Location & Service Area</h3>
            <div class="field"><label>City</label><input id="pf-city" type="text" placeholder="e.g. Bengaluru" value="${escapeHtml(profile.city||'')}" /></div>
            <div class="field"><label>Full Address</label><input id="pf-addr" type="text" placeholder="Your area / locality" value="${escapeHtml(profile.address||'')}" /></div>
            <div class="field"><label>Service Area Description</label><input id="pf-sarea" type="text" placeholder="e.g. Bengaluru & nearby (10km)" value="${escapeHtml(profile.service_area||'')}" /></div>
            <div class="field-row">
              <div class="field"><label>Latitude</label><input id="pf-lat" type="number" step="any" placeholder="e.g. 12.9716" value="${profile.latitude||''}" /></div>
              <div class="field"><label>Longitude</label><input id="pf-lng" type="number" step="any" placeholder="e.g. 77.5946" value="${profile.longitude||''}" /></div>
            </div>
            <button class="btn btn-ghost btn-sm" id="detect-location">📍 Auto-detect my location</button>
          </div>

          <div class="card card-pad">
            <h3 style="margin-bottom:18px;font-size:1.05rem">Availability</h3>
            <div class="avail-grid">
              ${['mon','tue','wed','thu','fri','sat','sun'].map(d=>`
                <div class="avail-day">
                  <div class="d">${d.toUpperCase()}</div>
                  <input type="checkbox" class="avail-check" data-day="${d}" ${avail[d]?'checked':''} />
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top:24px;display:flex;gap:12px;justify-content:flex-end">
        <button class="btn btn-ghost">Discard</button>
        <button class="btn btn-primary btn-lg" id="save-profile">Save Profile →</button>
      </div>
    `);

    bindProfileEvents();
    Assistant.mount();
  }

  function bindProfileEvents() {
    document.getElementById('detect-location').onclick = () => {
      navigator.geolocation.getCurrentPosition(pos => {
        document.getElementById('pf-lat').value = pos.coords.latitude.toFixed(6);
        document.getElementById('pf-lng').value = pos.coords.longitude.toFixed(6);
        toast('Location detected!', 'success');
      }, () => toast('Could not detect location. Enter manually.', 'error'));
    };

    document.getElementById('add-skill').onclick = () => {
      const val = document.getElementById('skill-input').value.trim();
      if (val && !skills.includes(val)) { skills.push(val); render(); }
    };

    document.querySelectorAll('.remove-skill').forEach(btn => {
      btn.onclick = () => { skills.splice(parseInt(btn.dataset.sk), 1); render(); };
    });

    document.getElementById('save-profile').onclick = async () => {
      const btn = document.getElementById('save-profile');
      btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Saving…`;

      const availResult = {};
      document.querySelectorAll('.avail-check').forEach(cb => {
        availResult[cb.dataset.day] = cb.checked ? ['09:00-18:00'] : [];
      });

      try {
        await Api.put('/provider/profile', {
          name: document.getElementById('pf-name').value,
          phone: document.getElementById('pf-phone').value,
          bio: document.getElementById('pf-bio').value,
          profile_photo_url: document.getElementById('pf-photo').value,
          languages: document.getElementById('pf-lang').value,
          id_proof_number: document.getElementById('pf-id').value,
          category: document.getElementById('pf-cat').value,
          experience_years: parseInt(document.getElementById('pf-exp').value)||0,
          hourly_rate: parseFloat(document.getElementById('pf-rate').value)||0,
          skills,
          city: document.getElementById('pf-city').value,
          address: document.getElementById('pf-addr').value,
          service_area: document.getElementById('pf-sarea').value,
          latitude: parseFloat(document.getElementById('pf-lat').value)||null,
          longitude: parseFloat(document.getElementById('pf-lng').value)||null,
          availability: availResult,
        });
        toast('Profile saved! ✓', 'success');
        btn.disabled=false; btn.textContent='Save Profile →';
      } catch(e) { toast(e.message,'error'); btn.disabled=false; btn.textContent='Save Profile →'; }
    };
  }

  render();
}

// ---- Provider Bookings ----
async function renderProviderBookings(container) {
  let bookings = [];
  try { bookings = (await Api.get('/provider/bookings')).bookings; } catch(e) { toast(e.message,'error'); }

  const activeTab = window._provBookTab || 'all';
  const tabs = ['all','pending','accepted','in_progress','completed','cancelled'];
  const filtered = activeTab==='all' ? bookings : bookings.filter(b=>b.status===activeTab);

  container.innerHTML = providerShell('bookings', `
    <div class="dash-topbar"><div class="dash-title"><h2>📋 Bookings</h2><p>Manage all incoming and active bookings</p></div></div>
    <div class="tabs">
      ${tabs.map(t=>`<button class="tab-btn ${activeTab===t?'active':''}" data-tab="${t}">${t.replace('_',' ')}</button>`).join('')}
    </div>
    ${filtered.length === 0 ? `<div class="empty-state"><div class="emoji">📭</div><p>No bookings in this category.</p></div>` :
      filtered.map(b=>renderProviderBookingRow(b,true)).join('')}
  `);

  container.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => { window._provBookTab = btn.dataset.tab; renderProviderBookings(container); };
  });
  bindStatusBtns(container, () => renderProviderBookings(container));
  Assistant.mount();
}

// ---- Provider Reviews ----
async function renderProviderReviews(container) {
  let reviews = [], summary = {};
  try { const res = await Api.get('/provider/reviews'); reviews = res.reviews; summary = res.summary; } catch(e) {}

  container.innerHTML = providerShell('reviews', `
    <div class="dash-topbar"><div class="dash-title"><h2>⭐ Reviews & Feedback</h2><p>See what your customers say about you</p></div></div>
    <div style="background:white;border:1px solid var(--slate-200);border-radius:var(--radius-lg);padding:24px;margin-bottom:24px;display:flex;gap:32px;align-items:center">
      <div style="text-align:center">
        <div style="font-family:var(--font-mono);font-size:2.8rem;font-weight:700;color:var(--amber-500)">${Number(summary.rating_avg||0).toFixed(1)}</div>
        <div style="color:var(--amber-400);font-size:1.2rem;letter-spacing:3px">${'★'.repeat(Math.round(summary.rating_avg||0))}</div>
        <div style="font-size:0.82rem;color:var(--slate-500);margin-top:4px">${summary.rating_count||0} reviews</div>
      </div>
      <div style="flex:1;color:var(--slate-500);font-size:0.9rem">Customers rate your punctuality, quality of work, and professionalism. Maintain a high score to appear at the top of AI search results.</div>
    </div>
    ${reviews.length === 0 ? `<div class="empty-state"><div class="emoji">⭐</div><p>No reviews yet — complete bookings to start earning ratings!</p></div>` :
      reviews.map(r => `
        <div class="review-card">
          <div class="top">
            <div style="display:flex;align-items:center;gap:10px">
              <div class="avatar" style="width:36px;height:36px;font-size:0.78rem">${initials(r.customer_name)}</div>
              <div>
                <div style="font-weight:700;font-size:0.9rem">${escapeHtml(r.customer_name)}</div>
                <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
              </div>
            </div>
            <div style="font-size:0.76rem;color:var(--slate-400)">${timeAgo(r.created_at)}</div>
          </div>
          ${r.comment ? `<p style="margin-top:12px;font-size:0.88rem;color:var(--slate-700)">"${escapeHtml(r.comment)}"</p>` : ''}
        </div>`).join('')}
  `);
  Assistant.mount();
}
