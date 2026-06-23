// views.launch.js — Landing page

function renderLaunchPage(container) {
  container.innerHTML = `
    ${renderPublicNav()}
    <!-- HERO -->
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-content">
          <div class="hero-eyebrow"><span class="dot"></span> AI-Powered Local Services Platform</div>
          <h1>Your neighbourhood experts, <span class="accent">found instantly</span></h1>
          <p class="hero-sub">QUIKService uses AI matching to connect you with the best verified service professionals near you — electricians, plumbers, cleaners, and 20+ more categories.</p>
          <div class="hero-ctas">
            <a href="#/register" class="btn btn-primary btn-lg">Book a Service ↗</a>
            <a href="#/register" class="btn btn-ghost-light btn-lg">Join as Provider</a>
          </div>
          <div class="hero-trust">
            <div><div class="stat-num">10K+</div><div class="stat-label">Bookings Done</div></div>
            <div><div class="stat-num">1,200+</div><div class="stat-label">Verified Providers</div></div>
            <div><div class="stat-num">4.8★</div><div class="stat-label">Average Rating</div></div>
            <div><div class="stat-num">50+</div><div class="stat-label">Cities Covered</div></div>
          </div>
        </div>
        <div class="hero-visual">
          <div class="radar-wrap">
            <div class="radar-ring r1"></div>
            <div class="radar-ring r2"></div>
            <div class="radar-ring r3"></div>
            <div class="radar-ring r4"></div>
            <div class="radar-pulse"></div>
            <div class="radar-pulse delay2"></div>
            <div class="radar-pulse delay3"></div>
            <div class="radar-center">📍</div>
            <div class="radar-pin p1"><div class="icon">⚡</div><div class="tag">Electrician</div></div>
            <div class="radar-pin p2"><div class="icon">🔧</div><div class="tag">Plumber</div></div>
            <div class="radar-pin p3"><div class="icon">🧹</div><div class="tag">Cleaner</div></div>
            <div class="radar-pin p4"><div class="icon">❄️</div><div class="tag">AC Repair</div></div>
            <div class="radar-pin p5"><div class="icon">🎨</div><div class="tag">Painter</div></div>
            <div class="radar-score">🤖 AI Score <b>97</b> · Best match found</div>
          </div>
        </div>
      </div>
      <div class="logo-strip">
        <div class="container logo-strip-inner">
          <span>Trusted by customers across</span>
          ${['Bengaluru','Mumbai','Delhi','Hyderabad','Chennai','Pune','Ahmedabad','Kolkata']
            .map(c => `<span style="color:var(--slate-300);font-weight:700">${c}</span>`).join('')}
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section class="section" id="how-it-works">
      <div class="container">
        <div class="section-head">
          <span class="section-eyebrow">How QUIKService works</span>
          <h2>Three steps to a fixed home</h2>
          <p>From search to service completion — the fastest, most transparent booking experience for home services.</p>
        </div>
        <div class="how-grid">
          <div class="how-card">
            <div class="how-step">STEP 01</div>
            <div style="font-size:2rem;margin-top:14px">🔍</div>
            <h3>Describe what you need</h3>
            <p>Search by category or describe the problem — the AI understands your request and filters providers accordingly.</p>
          </div>
          <div class="how-card">
            <div class="how-step">STEP 02</div>
            <div style="font-size:2rem;margin-top:14px">🤖</div>
            <h3>AI finds your best match</h3>
            <p>Our algorithm ranks providers by distance, rating, experience, price-fit and availability — personalised for you.</p>
          </div>
          <div class="how-card">
            <div class="how-step">STEP 03</div>
            <div style="font-size:2rem;margin-top:14px">✅</div>
            <h3>Book, pay & track</h3>
            <p>Confirm your slot, pay via UPI / Card / COD, and track the job live. Leave a review when it's done.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CATEGORIES -->
    <section class="section section-alt" id="categories">
      <div class="container">
        <div class="section-head">
          <span class="section-eyebrow">Service categories</span>
          <h2>Everything your home needs</h2>
          <p>From urgent repairs to regular maintenance — all categories are AI-matched to verified local providers.</p>
        </div>
        <div class="cat-grid">
          ${[
            {e:'⚡',n:'Electrician',c:'340+ providers'},
            {e:'🔧',n:'Plumber',c:'280+ providers'},
            {e:'🧹',n:'House Cleaning',c:'420+ providers'},
            {e:'❄️',n:'AC Repair',c:'190+ providers'},
            {e:'🐜',n:'Pest Control',c:'150+ providers'},
            {e:'💇',n:'Beauty & Salon',c:'260+ providers'},
            {e:'🪚',n:'Carpenter',c:'210+ providers'},
            {e:'🚗',n:'Car Wash',c:'180+ providers'},
            {e:'🔌',n:'Appliance Repair',c:'230+ providers'},
            {e:'🎨',n:'Painting',c:'200+ providers'},
          ].map(c => `
            <a href="#/register" class="cat-card">
              <div class="emoji">${c.e}</div>
              <div class="name">${c.n}</div>
              <div class="count">${c.c}</div>
            </a>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- AI SPOTLIGHT -->
    <section class="section" id="ai-features">
      <div class="container">
        <div class="ai-spotlight">
          <div>
            <span class="section-eyebrow" style="color:var(--teal-300)">Powered by AI matching</span>
            <h2>We don't just list providers — we rank the right one for you</h2>
            <p style="color:var(--slate-400);margin-top:14px;line-height:1.65">Our AI scoring engine analyses real-time distance, verified ratings, years of experience, pricing fit, and availability to surface the best match for every booking — not just the nearest or cheapest.</p>
            <div class="ai-feature-list">
              <div class="ai-feature-item"><div class="ico">📍</div><div><b>Location-aware ranking</b><span>Weights providers within your service radius, down to the street level.</span></div></div>
              <div class="ai-feature-item"><div class="ico">⭐</div><div><b>Trust scoring</b><span>Verified badges, rating history and repeat-customer ratio feed the AI score.</span></div></div>
              <div class="ai-feature-item"><div class="ico">💬</div><div><b>AI Help Assistant</b><span>Ask about bookings, payments, or complaints — answered instantly, 24/7.</span></div></div>
              <div class="ai-feature-item"><div class="ico">🔄</div><div><b>Dynamic re-ranking</b><span>Scores update after every review and booking to keep results fresh.</span></div></div>
            </div>
          </div>
          <div class="ai-chat-mock">
            <div style="font-size:0.74rem;color:var(--slate-500);margin-bottom:14px;font-weight:600">QUIKService AI Assistant</div>
            <div class="bubble bot">Hi! I'm looking for an electrician — my lights keep tripping at night. 🏠</div>
            <div class="bubble user">Need an Electrician in Koramangala, Bengaluru</div>
            <div class="bubble bot">🤖 Found <b>8 verified electricians</b> near you.<br><br>Top match: <b>Ramesh Kumar</b> — 4.9★ · 8 yrs exp · 2.4 km away · ₹350/hr · <span style="color:var(--teal-300)">Available today</span></div>
            <div class="bubble user">Book Ramesh for 4 PM today</div>
            <div class="bubble bot">✅ Booking confirmed! Ramesh will arrive at <b>4:00 PM</b>. Pay via UPI or Cash. Booking ID: <span style="font-family:monospace">#QS-29471</span></div>
            <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
              <span style="background:rgba(20,184,166,0.1);color:var(--teal-300);padding:6px 12px;border-radius:99px;font-size:0.74rem;font-weight:700">📍 Location matched</span>
              <span style="background:rgba(245,158,11,0.12);color:var(--amber-500);padding:6px 12px;border-radius:99px;font-size:0.74rem;font-weight:700">⚡ AI Score: 97</span>
              <span style="background:rgba(34,197,94,0.1);color:#16803c;padding:6px 12px;border-radius:99px;font-size:0.74rem;font-weight:700">✅ Verified Provider</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TESTIMONIALS -->
    <section class="section section-alt">
      <div class="container">
        <div class="section-head">
          <span class="section-eyebrow">Customer reviews</span>
          <h2>What our community says</h2>
        </div>
        <div class="testimonial-grid">
          ${[
            {q:"The AI matched me with an electrician within 3 minutes and he arrived on time. The OTP-verified login gave me extra confidence. Will book again!",n:"Priya Sharma",r:"Customer, Bengaluru",s:5},
            {q:"As a provider, my bookings went up 3x after joining QUIKService. The profile section lets me showcase all my skills and customers trust the verified badge.",n:"Ramesh Kumar",r:"Electrician, Bengaluru",s:5},
            {q:"I used the AI assistant to cancel a booking — it handled everything instantly and my refund came through in 2 days. Super smooth experience.",n:"Aditya Nair",r:"Customer, Pune",s:4},
          ].map(t => `
            <div class="testimonial-card">
              <div class="stars">${'★'.repeat(t.s)}</div>
              <p class="quote">"${t.q}"</p>
              <div class="testimonial-who">
                <div class="avatar" style="width:38px;height:38px;font-size:0.86rem">${initials(t.n)}</div>
                <div><div class="name">${t.n}</div><div class="role">${t.r}</div></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- FOR PROVIDERS -->
    <section class="section" id="for-providers">
      <div class="container">
        <div class="provider-cta">
          <div>
            <h2>Turn your skills into a thriving business</h2>
            <p>Join 1,200+ verified providers on QUIKService. Set your own hours, build your reputation, and grow your customer base with AI-matched bookings.</p>
            <div style="display:flex;gap:12px;margin-top:28px;flex-wrap:wrap">
              <a href="#/register" class="btn btn-primary btn-lg">Join as Provider →</a>
              <a href="#/login" class="btn btn-ghost-light btn-lg">Provider Login</a>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:14px">
            ${[
              {i:'🗓️', t:'Flexible Scheduling', d:'Set your own availability — days, hours, holidays.'},
              {i:'💰', t:'Transparent Earnings', d:'No hidden cuts. Track every rupee earned in your dashboard.'},
              {i:'🏅', t:'Build your reputation', d:'Verified badge + star ratings help you win more bookings.'},
              {i:'🤝', t:'Instant Bookings', d:'Customers find and book you in minutes — no cold calling.'},
            ].map(f => `
              <div style="display:flex;gap:14px;align-items:center">
                <div style="width:42px;height:42px;border-radius:12px;background:rgba(20,184,166,0.12);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">${f.i}</div>
                <div><div style="color:white;font-weight:700;font-size:0.9rem">${f.t}</div><div style="color:var(--slate-400);font-size:0.82rem;margin-top:2px">${f.d}</div></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>

    <!-- FINAL CTA -->
    <section class="section-tight section-alt">
      <div class="container" style="text-align:center">
        <h2 style="font-size:2rem">Ready to get started?</h2>
        <p style="color:var(--slate-500);margin-top:12px;font-size:1.05rem">Create your free account — takes less than 2 minutes.</p>
        <div style="display:flex;gap:14px;justify-content:center;margin-top:28px;flex-wrap:wrap">
          <a href="#/register" class="btn btn-primary btn-lg">I need a service</a>
          <a href="#/register" class="btn btn-dark btn-lg">I am a provider</a>
        </div>
      </div>
    </section>

    ${renderFooter()}
  `;

  // Mount AI assistant on launch page too
  Assistant.mount();
}
