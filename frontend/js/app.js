// app.js — boot and routing

Store.init();

// ---- Register all routes ----
Router.add('/', (c) => renderLaunchPage(c));
Router.add('/login', (c) => renderLoginPage(c));
Router.add('/register', (c) => renderRegisterPage(c));

// Customer
Router.add('/customer/home', (c) => {
  c.innerHTML = customerShell('home', `
    <div class="dash-topbar">
      <div class="dash-title">
        <h2>👋 Welcome, ${escapeHtml(Store.state.user?.name||'')}</h2>
        <p>What service do you need today?</p>
      </div>
    </div>
    <div style="background:linear-gradient(135deg,var(--ink-900),#0F2438);border-radius:var(--radius-lg);padding:36px;margin-bottom:28px;position:relative;overflow:hidden">
      <div style="position:absolute;inset:0;opacity:0.06;background-image:radial-gradient(circle at 60% 50%,rgba(45,212,191,1) 0%,transparent 60%)"></div>
      <h2 style="color:white;font-size:1.5rem">Find the best provider near you 🤖</h2>
      <p style="color:var(--slate-400);margin-top:8px">Our AI ranks providers by distance, rating and experience — personalised for you.</p>
      <a href="#/customer/find" class="btn btn-primary btn-lg" style="margin-top:20px;display:inline-flex">Search Providers →</a>
    </div>
    <h3 style="margin-bottom:18px">Browse by Category</h3>
    <div class="cat-grid">
      ${[
        {e:'⚡',n:'Electrician'},{e:'🔧',n:'Plumber'},{e:'🧹',n:'House Cleaning'},
        {e:'❄️',n:'AC Repair'},{e:'🐜',n:'Pest Control'},{e:'💇',n:'Beauty & Salon'},
        {e:'🪚',n:'Carpenter'},{e:'🚗',n:'Car Wash'},{e:'🔌',n:'Appliance Repair'},{e:'🎨',n:'Painting'},
      ].map(c=>`
        <a href="#/customer/find" class="cat-card" data-cat="${c.n}">
          <div class="emoji">${c.e}</div>
          <div class="name">${c.n}</div>
        </a>`).join('')}
    </div>
  `);
  Assistant.mount();
});
Router.add('/customer/find', (c) => renderCustomerFind(c));
Router.add('/customer/bookings', (c) => renderCustomerBookings(c));
Router.add('/customer/help', (c) => renderCustomerHelp(c));

// Provider
Router.add('/provider/dashboard', (c) => renderProviderDashboard(c));
Router.add('/provider/profile', (c) => renderProviderProfile(c));
Router.add('/provider/bookings', (c) => renderProviderBookings(c));
Router.add('/provider/reviews', (c) => renderProviderReviews(c));

// Admin
Router.add('/admin/dashboard', (c) => renderAdminDashboard(c));
Router.add('/admin/users', (c) => renderAdminUsers(c));
Router.add('/admin/providers', (c) => renderAdminProviders(c));
Router.add('/admin/bookings', (c) => renderAdminBookings(c));
Router.add('/admin/payments', (c) => renderAdminPayments(c));
Router.add('/admin/reviews', (c) => renderAdminReviews(c));
Router.add('/admin/tickets', (c) => renderAdminTickets(c));

Router.add('/404', (c) => {
  c.innerHTML = `<div style="text-align:center;padding:100px 20px">
    <div style="font-size:4rem">🔍</div>
    <h2 style="margin-top:16px">Page not found</h2>
    <p style="color:var(--slate-500);margin-top:8px">This route doesn't exist.</p>
    <a href="#/" class="btn btn-primary" style="margin-top:24px;display:inline-flex">Back to home</a>
  </div>`;
});

// Boot
Router.resolve();

// If already authed and on /, redirect to dashboard
if (window.location.hash === '' || window.location.hash === '#/') {
  if (Store.isAuthed()) redirectByRole(Store.role());
}
