// views.auth.js — Login & Registration with OTP

// ==================== REGISTER ====================
function renderRegisterPage(container) {
  let role = 'customer';
  let step = 1; // 1 = form, 2 = OTP verify

  function render() {
    container.innerHTML = `
      <div class="auth-screen">
        <div class="auth-side">
          <div class="brand"><span class="brand-mark">Q</span> <span style="color:white">QUIKService</span></div>
          <div>
            <div class="auth-side-quote">Join <span>1,200+ verified providers</span> or book trusted help in your city — today.</div>
            <div class="auth-side-who">— The QUIKService community</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:16px">
            ${['OTP-verified accounts','AI-matched bookings','Secure payments (UPI/Card/COD)','24/7 AI Help Assistant']
              .map(f => `<div style="display:flex;gap:10px;color:var(--slate-300);font-size:0.88rem"><span style="color:var(--teal-300);font-weight:700">✓</span>${f}</div>`).join('')}
          </div>
        </div>
        <div class="auth-form-wrap">
          <div class="auth-card">
            <a href="#/" class="auth-back">← Back to home</a>
            ${step === 1 ? renderStep1() : renderStep2()}
            <div class="divider-text">Already have an account?</div>
            <a href="#/login" class="btn btn-ghost btn-block">Log in instead</a>
            <div class="demo-creds"><b>Demo accounts (seed.js):</b><br>customer@quikservice.com / Password@123<br>admin@quikservice.com / Password@123</div>
          </div>
        </div>
      </div>`;
    bindEvents();
    Assistant.mount();
  }

  function renderStep1() {
    return `
      <h1>Create account</h1>
      <p class="sub">Choose your role and verify with OTP</p>
      <div class="role-tabs">
        <button class="role-tab ${role==='customer'?'active':''}" data-role="customer">👤 Customer</button>
        <button class="role-tab ${role==='provider'?'active':''}" data-role="provider">🛠️ Provider</button>
        <button class="role-tab ${role==='admin'?'active':''}" data-role="admin">⚙️ Admin</button>
      </div>
      <div class="field-row">
        <div class="field"><label>Full Name</label><input id="reg-name" type="text" placeholder="e.g. Priya Sharma" /></div>
        <div class="field"><label>Phone</label><input id="reg-phone" type="tel" placeholder="9XXXXXXXXX" /></div>
      </div>
      <div class="field"><label>Email address</label><input id="reg-email" type="email" placeholder="you@email.com" /></div>
      <div class="field"><label>Password</label><input id="reg-pass" type="password" placeholder="Min 8 characters" /></div>
      <button class="btn btn-primary btn-block btn-lg" id="reg-submit" style="margin-top:6px">Send OTP →</button>`;
  }

  function renderStep2() {
    return `
      <h1>Verify your email</h1>
      <p class="sub">We sent a 6-digit code to <b id="email-shown"></b>.<br>In demo mode the code is shown below.</p>
      <div style="background:rgba(20,184,166,0.08);border:1px solid rgba(20,184,166,0.3);border-radius:10px;padding:12px 16px;margin:16px 0;font-size:0.86rem">
        🔔 <b>Demo mode:</b> The OTP is printed in the server console and also returned in the API response as <code>dev_otp</code>. Check the browser DevTools Network tab or terminal.
      </div>
      <div class="field"><label>6-digit OTP</label>
        <div class="otp-inputs" id="otp-wrap">
          ${[0,1,2,3,4,5].map(i=>`<input class="otp-digit" maxlength="1" type="text" inputmode="numeric" data-idx="${i}" />`).join('')}
        </div>
      </div>
      <button class="btn btn-primary btn-block btn-lg" id="otp-submit" style="margin-top:6px">Verify & Create Account ✓</button>
      <div style="text-align:center;margin-top:14px"><button id="resend-otp" class="btn btn-ghost btn-sm">Resend OTP</button></div>`;
  }

  let pendingEmail = '';

  function bindEvents() {
    // role tabs
    document.querySelectorAll('.role-tab').forEach(btn => {
      btn.onclick = () => { role = btn.dataset.role; render(); };
    });

    if (step === 1) {
      document.getElementById('reg-submit').onclick = async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Sending…`;
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const password = document.getElementById('reg-pass').value;
        try {
          const res = await Api.post('/auth/register/start', { name, email, phone, password, role });
          pendingEmail = email;
          localStorage.setItem('qs_pending_email', email);
          toast(`OTP sent! Check console or DevTools for dev_otp: ${res.dev_otp}`, 'success');
          step = 2;
          render();
          document.getElementById('email-shown').textContent = email;
        } catch (err) {
          toast(err.message, 'error');
          btn.disabled = false; btn.textContent = 'Send OTP →';
        }
      };
    } else {
      // OTP tab-through
      document.querySelectorAll('.otp-digit').forEach((inp, i, all) => {
        inp.oninput = () => { if (inp.value && i < 5) all[i+1].focus(); };
        inp.onkeydown = (e) => { if (e.key==='Backspace' && !inp.value && i > 0) all[i-1].focus(); };
      });
      document.getElementById('email-shown').textContent = localStorage.getItem('qs_pending_email') || '';

      document.getElementById('otp-submit').onclick = async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Verifying…`;
        const digits = [...document.querySelectorAll('.otp-digit')].map(i=>i.value).join('');
        const email = localStorage.getItem('qs_pending_email');
        try {
          const res = await Api.post('/auth/register/verify', { email, otp: digits });
          Store.login(res.token, res.user);
          toast('Account created! Welcome to QUIKService 🎉', 'success');
          redirectByRole(res.user.role);
        } catch (err) {
          toast(err.message, 'error');
          btn.disabled = false; btn.textContent = 'Verify & Create Account ✓';
        }
      };

      document.getElementById('resend-otp').onclick = async () => {
        try {
          const email = localStorage.getItem('qs_pending_email');
          const res = await Api.post('/auth/otp/resend', { email, purpose: 'register' });
          toast(`OTP resent! dev_otp: ${res.dev_otp}`, 'success');
        } catch (err) { toast(err.message, 'error'); }
      };
    }
  }

  render();
}

// ==================== LOGIN ====================
function renderLoginPage(container) {
  let step = 1;
  let pendingRole = '';

  function render() {
    container.innerHTML = `
      <div class="auth-screen">
        <div class="auth-side">
          <div class="brand"><span class="brand-mark">Q</span> <span style="color:white">QUIKService</span></div>
          <div>
            <div class="auth-side-quote">Welcome back. Your <span>trusted local services</span> are waiting.</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            ${['Two-step OTP login for security','Access your bookings & history','AI-matched providers ready to help']
              .map(f => `<div style="display:flex;gap:10px;color:var(--slate-300);font-size:0.88rem"><span style="color:var(--teal-300);font-weight:700">✓</span>${f}</div>`).join('')}
          </div>
        </div>
        <div class="auth-form-wrap">
          <div class="auth-card">
            <a href="#/" class="auth-back">← Back to home</a>
            ${step === 1 ? renderLoginStep1() : renderLoginStep2()}
            <div class="divider-text">Don't have an account?</div>
            <a href="#/register" class="btn btn-ghost btn-block">Create account →</a>
            <div class="demo-creds"><b>Quick demo login:</b><br>
              Customer: customer@quikservice.com / Password@123<br>
              Admin: admin@quikservice.com / Password@123<br>
              Provider: ramesh.electrician@quikservice.com / Password@123
            </div>
          </div>
        </div>
      </div>`;
    bindLoginEvents();
    Assistant.mount();
  }

  function renderLoginStep1() {
    return `
      <h1>Welcome back</h1>
      <p class="sub">Log in with your email and password, then verify with OTP.</p>
      <div class="field" style="margin-top:24px"><label>Email address</label><input id="login-email" type="email" placeholder="you@email.com" /></div>
      <div class="field"><label>Password</label><input id="login-pass" type="password" placeholder="Your password" /></div>
      <button class="btn btn-primary btn-block btn-lg" id="login-submit" style="margin-top:6px">Continue →</button>`;
  }

  function renderLoginStep2() {
    return `
      <h1>Enter your OTP</h1>
      <p class="sub">We sent a 6-digit code to <b>${localStorage.getItem('qs_pending_email') || 'your email'}</b>.</p>
      <div style="background:rgba(20,184,166,0.08);border:1px solid rgba(20,184,166,0.3);border-radius:10px;padding:12px 16px;margin:16px 0;font-size:0.86rem">
        🔔 <b>Demo mode:</b> OTP visible in server console and in the <code>dev_otp</code> field of the API response.
      </div>
      <div class="field"><label>6-digit OTP</label>
        <div class="otp-inputs">
          ${[0,1,2,3,4,5].map(i=>`<input class="otp-digit" maxlength="1" type="text" inputmode="numeric" data-idx="${i}" />`).join('')}
        </div>
      </div>
      <button class="btn btn-primary btn-block btn-lg" id="otp-login-submit" style="margin-top:6px">Verify & Log In ✓</button>
      <div style="text-align:center;margin-top:14px"><button id="resend-otp" class="btn btn-ghost btn-sm">Resend OTP</button></div>`;
  }

  function bindLoginEvents() {
    if (step === 1) {
      document.getElementById('login-submit').onclick = async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Sending OTP…`;
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-pass').value;
        try {
          const res = await Api.post('/auth/login/start', { email, password });
          localStorage.setItem('qs_pending_email', email);
          pendingRole = res.role;
          toast(`OTP sent! dev_otp shown in terminal. Role: ${res.role}`, 'success');
          step = 2; render();
        } catch (err) {
          toast(err.message, 'error');
          btn.disabled = false; btn.textContent = 'Continue →';
        }
      };
    } else {
      document.querySelectorAll('.otp-digit').forEach((inp, i, all) => {
        inp.oninput = () => { if (inp.value && i < 5) all[i+1].focus(); };
        inp.onkeydown = (e) => { if (e.key==='Backspace' && !inp.value && i > 0) all[i-1].focus(); };
      });
      document.getElementById('otp-login-submit').onclick = async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true; btn.innerHTML = `<span class="spinner"></span> Verifying…`;
        const digits = [...document.querySelectorAll('.otp-digit')].map(i=>i.value).join('');
        const email = localStorage.getItem('qs_pending_email');
        try {
          const res = await Api.post('/auth/login/verify', { email, otp: digits });
          Store.login(res.token, res.user);
          toast(`Welcome back, ${res.user.name}! 👋`, 'success');
          redirectByRole(res.user.role);
        } catch (err) {
          toast(err.message, 'error');
          btn.disabled = false; btn.textContent = 'Verify & Log In ✓';
        }
      };
      document.getElementById('resend-otp').onclick = async () => {
        try {
          const email = localStorage.getItem('qs_pending_email');
          const res = await Api.post('/auth/otp/resend', { email, purpose: 'login' });
          toast(`OTP resent! dev_otp: ${res.dev_otp}`, 'success');
        } catch (err) { toast(err.message, 'error'); }
      };
    }
  }

  render();
}

function redirectByRole(role) {
  if (role === 'customer') Router.go('/customer/home');
  else if (role === 'provider') Router.go('/provider/dashboard');
  else if (role === 'admin') Router.go('/admin/dashboard');
  else Router.go('/');
}
