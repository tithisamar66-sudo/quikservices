// components.js — shared building blocks reused across views

function renderPublicNav() {
  return `
  <header class="nav">
    <div class="container nav-inner">
      <a href="#/" class="brand">
        <span class="brand-mark">Q</span> QUIKService
      </a>
      <nav class="nav-links">
        <a href="#/#how-it-works">How it works</a>
        <a href="#/#ai-features">AI Matching</a>
        <a href="#/#categories">Services</a>
        <a href="#/#for-providers">For Providers</a>
      </nav>
      <div class="nav-actions">
        <a href="#/login" class="btn btn-ghost btn-sm">Log in</a>
        <a href="#/register" class="btn btn-primary btn-sm">Get started</a>
      </div>
    </div>
  </header>`;
}

function renderFooter() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a href="#/" class="brand"><span class="brand-mark">Q</span> <span style="color:white">QUIKService</span></a>
          <p class="footer-brand-desc">AI-matched local service providers — electricians, plumbers, cleaners and more — booked in minutes, trusted every time.</p>
        </div>
        <div>
          <h4>Company</h4>
          <ul><li><a href="#/#how-it-works">How it works</a></li><li><a href="#/#for-providers">For providers</a></li><li><a href="#/register">Careers</a></li></ul>
        </div>
        <div>
          <h4>For Customers</h4>
          <ul><li><a href="#/register">Book a service</a></li><li><a href="#/login">Track booking</a></li><li><a href="#/register">Leave feedback</a></li></ul>
        </div>
        <div>
          <h4>For Providers</h4>
          <ul><li><a href="#/register">Join as provider</a></li><li><a href="#/login">Provider login</a></li><li><a href="#/login">Manage bookings</a></li></ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} QUIKService. All rights reserved.</span>
        <span>Made for local communities, powered by AI matching.</span>
      </div>
    </div>
  </footer>`;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function timeAgo(dateStr) {
  const d = new Date(dateStr.includes('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z');
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function categoryEmoji(cat) {
  const map = {
    'Electrician': '⚡', 'Plumber': '🔧', 'House Cleaning': '🧹', 'AC Repair': '❄️',
    'Pest Control': '🐜', 'Beauty & Salon': '💇', 'Carpenter': '🪚', 'Car Wash': '🚗',
    'Appliance Repair': '🔌', 'Painting': '🎨',
  };
  return map[cat] || '🛠️';
}

// ---------------- Modal ----------------
function openModal(innerHtml, onMount) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'active-modal';
  overlay.innerHTML = `<div class="modal-box">${innerHtml}</div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  if (onMount) onMount(overlay);
}
function closeModal() {
  const existing = document.getElementById('active-modal');
  if (existing) existing.remove();
}

// ---------------- AI Help Assistant widget ----------------
const Assistant = {
  open: false,
  history: [],
  mount() {
    if (document.getElementById('ai-fab')) return; // already mounted
    const fab = document.createElement('button');
    fab.id = 'ai-fab';
    fab.className = 'ai-fab';
    fab.innerHTML = `<span class="ping"></span><span style="position:relative;z-index:2;">🤖</span>`;
    fab.onclick = () => Assistant.toggle();
    document.body.appendChild(fab);
  },
  toggle() {
    this.open = !this.open;
    const existing = document.getElementById('ai-panel');
    if (existing) { existing.remove(); }
    if (this.open) this.renderPanel();
  },
  renderPanel() {
    const panel = document.createElement('div');
    panel.id = 'ai-panel';
    panel.className = 'ai-panel';
    panel.innerHTML = `
      <div class="ai-panel-head">
        <div>
          <div class="title">🤖 QUIKService AI Assistant</div>
          <div class="status"><span class="dot"></span> Online — usually replies instantly</div>
        </div>
        <button class="ai-panel-close" id="ai-close">✕</button>
      </div>
      <div class="ai-panel-body" id="ai-body"></div>
      <div class="ai-suggestions" id="ai-suggestions">
        ${['Find a provider near me','Payment options','Cancel a booking','Talk to support']
          .map((s) => `<button class="ai-suggestion-chip" data-msg="${s}">${s}</button>`).join('')}
      </div>
      <div class="ai-panel-input">
        <input id="ai-input" type="text" placeholder="Ask me anything..." />
        <button class="ai-panel-send" id="ai-send">➤</button>
      </div>
    `;
    document.body.appendChild(panel);
    document.getElementById('ai-close').onclick = () => Assistant.toggle();

    if (this.history.length === 0) {
      this.history.push({ from: 'bot', text: "Hi! I'm the QUIKService AI Assistant 🤖. I can help you find providers, manage bookings, payments, or connect you to support. What do you need?" });
    }
    this.renderMessages();

    document.querySelectorAll('.ai-suggestion-chip').forEach((chip) => {
      chip.onclick = () => Assistant.send(chip.dataset.msg);
    });
    document.getElementById('ai-send').onclick = () => {
      const input = document.getElementById('ai-input');
      if (input.value.trim()) Assistant.send(input.value.trim());
    };
    document.getElementById('ai-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.value.trim()) Assistant.send(e.target.value.trim());
    });
  },
  renderMessages() {
    const body = document.getElementById('ai-body');
    if (!body) return;
    body.innerHTML = this.history.map((m) => `<div class="ai-msg ${m.from}">${escapeHtml(m.text)}</div>`).join('');
    body.scrollTop = body.scrollHeight;
  },
  async send(text) {
    this.history.push({ from: 'user', text });
    const input = document.getElementById('ai-input');
    if (input) input.value = '';
    this.renderMessages();

    // typing indicator
    this.history.push({ from: 'bot', text: '···' });
    this.renderMessages();

    try {
      let reply;
      if (Store.isAuthed() && Store.role() === 'customer') {
        const res = await Api.post('/customer/assistant', { message: text });
        reply = res.reply;
      } else {
        // local fallback for logged-out / non-customer users
        reply = localAssistantReply(text);
      }
      this.history.pop();
      this.history.push({ from: 'bot', text: reply });
    } catch (e) {
      this.history.pop();
      this.history.push({ from: 'bot', text: "I'm having trouble right now, but you can raise a help ticket from your dashboard and our team will follow up." });
    }
    this.renderMessages();
  },
};

function localAssistantReply(message) {
  const m = message.toLowerCase();
  if (m.includes('find') || m.includes('near')) return "Once you log in as a customer, head to 'Find Provider' — our AI ranks the best matches near you by distance, rating and experience!";
  if (m.includes('payment') || m.includes('pay')) return "QUIKService supports UPI, Card, and Cash on Delivery (COD) for every booking.";
  if (m.includes('cancel')) return "You can cancel a booking anytime before it's accepted, free of charge, from 'My Bookings' after logging in.";
  if (m.includes('provider') && (m.includes('join') || m.includes('become'))) return "Register and choose 'Provider' as your role — verify your email with OTP, then build your profile with skills & availability!";
  if (m.includes('support') || m.includes('human') || m.includes('talk')) return "I can raise a help ticket once you're logged in — or email support@quikservice.com anytime.";
  return "Great question! Log in or create an account to unlock personalized help — or ask me about finding providers, payments, or bookings.";
}
