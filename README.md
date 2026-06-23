# QUIKService 🚀
### AI-Powered Local Service Provider Platform

> Connect customers with the best verified local service professionals — electricians, plumbers, cleaners, and 10+ more categories — with AI-matched ranking, OTP-verified login, UPI/COD/Card payments, real-time booking, and a help assistant.

---

## ✨ Features

### 🔐 Auth (all 3 roles)
- Register as **Customer**, **Provider**, or **Admin**
- **Two-step OTP verification** (email OTP — simulated in dev, plug in SendGrid/SES for production)
- JWT-secured sessions (7-day expiry)

### 👤 Customer Portal
- **Home dashboard** — browse categories
- **AI Provider Search** — 📍 location-aware ranking using distance + rating + experience + price fit + verified badge
- **Book a service** — pick provider, date/time, address, description
- **Payments** — UPI / Card / Cash on Delivery (COD) — simulated flow, plug in Razorpay/Stripe for production
- **My Bookings** — track status (pending → accepted → in_progress → completed)
- **Reviews & Feedback** — star rating + comment after completed booking
- **Help Tickets** — raise support tickets per booking
- **AI Help Assistant** — floating 🤖 chat widget, available everywhere

### 🛠️ Provider Portal
- **Dashboard** — total bookings, completed, pending, earnings, average rating
- **Profile Editor** — name, bio, photo URL, category, skills (chip list), experience, hourly rate, languages, ID proof, city, address, coordinates (auto-detect via GPS), service area, weekly availability
- **Booking Management** — Accept / Start Job / Mark Complete / Decline — per booking
- **Reviews** — see all customer reviews and overall rating

### ⚙️ Admin Portal
- **Overview** — platform-wide stats (customers, providers, bookings, revenue, open tickets, avg rating)
- **User Management** — list by role, block/unblock any user
- **Provider Management** — grant/revoke Verified badge, block providers
- **Booking Records** — full table of all bookings with status and payment
- **Payment Records** — txn refs, amounts, methods, status
- **Reviews** — all platform reviews
- **Help Tickets** — mark In Review / Resolve

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js + Express.js |
| Database | SQLite via `better-sqlite3` (file-based, zero config) |
| Auth | JWT + bcryptjs |
| Frontend | Vanilla JS + CSS (no framework, no build step) |
| Fonts | Space Grotesk + Inter + JetBrains Mono |

---

## 🚀 Quick Start

### Requirements
- **Node.js 18+** (check: `node -v`)
- No database setup needed (SQLite is file-based)

### Steps

```bash
# 1. Go to backend folder
cd quikservice/backend

# 2. Install dependencies
npm install

# 3. Seed demo data (admin + 10 providers + 1 customer)
node seed.js

# 4. Start the server
node server.js

# 5. Open in browser
# → http://localhost:4000
```

The Express server serves both the API (`/api/*`) and the frontend (`/frontend`) from one port.

---

## 🔑 Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@quikservice.com | Password@123 |
| Customer | customer@quikservice.com | Password@123 |
| Provider | ramesh.electrician@quikservice.com | Password@123 |
| Provider | suresh.plumber@quikservice.com | Password@123 |
| Provider (+ 8 more) | see `seed.js` | Password@123 |

> **OTP in demo mode**: The OTP is printed to the server console (terminal) and returned as `dev_otp` in the API response. Open DevTools → Network → click the `/auth/login/start` call → see `dev_otp` in the response JSON.

---

## 🔌 Production Integrations (plug-in points)

### Real Email OTP (SendGrid / Nodemailer)
In `backend/utils/otp.js`, replace the `console.log` block:
```js
// Replace this:
console.log(`[SIMULATED EMAIL] OTP: ${code}`);

// With:
await transporter.sendMail({ to: email, subject: 'Your OTP', text: `Your OTP: ${code}` });
```

### Real Payments (Razorpay / Stripe)
In `backend/routes/customer.js` → `POST /bookings/:id/pay`, replace the simulated txn with:
```js
const order = await razorpay.orders.create({ amount: booking.price * 100, currency: 'INR' });
// return order.id to frontend → complete with Razorpay checkout SDK
```

### Real Location Map (Leaflet.js / Google Maps)
The `.map-box` placeholder in the frontend is ready for a real map embed — drop in Leaflet.js and initialize with the provider coordinates from the API.

---

## 📁 Project Structure

```
quikservice/
├── backend/
│   ├── db.js              # SQLite schema
│   ├── server.js          # Express entry point
│   ├── seed.js            # Demo data
│   ├── middleware/
│   │   └── auth.js        # JWT middleware
│   ├── routes/
│   │   ├── auth.js        # Register, Login, OTP
│   │   ├── customer.js    # Search, Book, Pay, Review, Help
│   │   ├── provider.js    # Profile, Bookings, Reviews
│   │   └── admin.js       # Dashboard, Users, Records
│   └── utils/
│       ├── otp.js         # OTP generation & verify
│       └── aiMatch.js     # AI ranking engine + assistant replies
├── frontend/
│   ├── index.html
│   ├── css/
│   │   ├── styles.css     # Design tokens + base
│   │   ├── launch.css     # Landing page styles
│   │   └── dashboard.css  # Auth + portal styles
│   └── js/
│       ├── api.js         # Fetch wrapper
│       ├── store.js       # State + router + toast
│       ├── components.js  # Nav, Footer, AI widget, Modal
│       ├── views.launch.js
│       ├── views.auth.js
│       ├── views.customer.js
│       ├── views.provider.js
│       ├── views.admin.js
│       └── app.js         # Route definitions + boot
└── README.md
```

---

## 🌐 Deployment

To deploy to a VPS / cloud server:

1. Push the `quikservice/` folder to your server
2. Run `cd backend && npm install && node seed.js`
3. Set `PORT=80` (or use nginx as reverse proxy on port 4000)
4. Set `JWT_SECRET` in a `.env` file: `JWT_SECRET=your_random_secret_here`
5. Use `pm2 start server.js` for process management

For Render / Railway free-tier deployment, add a `Procfile`:
```
web: cd backend && npm install && node seed.js && node server.js
```

---

*Built with ❤️ — QUIKService, your neighbourhood AI-powered services platform.*
