// store.js — tiny global state + hash router + toast helper

const Store = {
  state: {
    user: null,
    token: null,
  },
  init() {
    const token = localStorage.getItem('qs_token');
    const userRaw = localStorage.getItem('qs_user');
    if (token && userRaw) {
      this.state.token = token;
      this.state.user = JSON.parse(userRaw);
    }
  },
  login(token, user) {
    this.state.token = token;
    this.state.user = user;
    localStorage.setItem('qs_token', token);
    localStorage.setItem('qs_user', JSON.stringify(user));
  },
  logout() {
    this.state.token = null;
    this.state.user = null;
    localStorage.removeItem('qs_token');
    localStorage.removeItem('qs_user');
    Router.go('/');
  },
  isAuthed() { return !!this.state.token; },
  role() { return this.state.user ? this.state.user.role : null; },
};

const Router = {
  routes: {},
  add(path, handler) { this.routes[path] = handler; },
  go(path) {
    window.location.hash = path;
  },
  resolve() {
    let hash = window.location.hash.replace('#', '') || '/';
    const [path, query] = hash.split('?');
    const params = {};
    if (query) {
      query.split('&').forEach((p) => {
        const [k, v] = p.split('=');
        params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }

    // protected route prefixes
    if (path.startsWith('/customer') && (!Store.isAuthed() || Store.role() !== 'customer')) {
      return this.go('/login');
    }
    if (path.startsWith('/provider') && (!Store.isAuthed() || Store.role() !== 'provider')) {
      return this.go('/login');
    }
    if (path.startsWith('/admin') && (!Store.isAuthed() || Store.role() !== 'admin')) {
      return this.go('/login');
    }

    const handler = this.routes[path] || this.routes['/404'];
    const app = document.getElementById('app');
    app.innerHTML = '';
    handler(app, params);
    window.scrollTo(0, 0);
  },
};

window.addEventListener('hashchange', () => Router.resolve());

function toast(message, type = 'info') {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icon = type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
  el.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  root.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    el.style.transition = 'all 0.25s ease';
    setTimeout(() => el.remove(), 250);
  }, 3200);
}
