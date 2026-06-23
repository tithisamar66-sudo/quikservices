// routes/customer.js
const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');
const { rankProviders, assistantReply } = require('../utils/aiMatch');

const router = express.Router();
router.use(authRequired, requireRole('customer'));

// AI-powered "find best providers near me"
router.get('/providers/search', (req, res) => {
  const { category, lat, lng, maxBudget } = req.query;

  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, p.* FROM users u
       JOIN provider_profiles p ON p.user_id = u.id
       WHERE u.role = 'provider' AND u.is_blocked = 0`
    )
    .all();

  const ranked = rankProviders(rows, {
    lat: lat ? parseFloat(lat) : null,
    lng: lng ? parseFloat(lng) : null,
    category: category || null,
    maxBudget: maxBudget ? parseFloat(maxBudget) : null,
  });

  res.json({ providers: ranked, count: ranked.length });
});

// list available categories (for filter UI)
router.get('/categories', (req, res) => {
  const rows = db
    .prepare(`SELECT DISTINCT category FROM provider_profiles WHERE category IS NOT NULL`)
    .all();
  res.json({ categories: rows.map((r) => r.category) });
});

// Create booking
router.post('/bookings', (req, res) => {
  const {
    provider_id, category, description, scheduled_date, scheduled_time,
    address, latitude, longitude, price,
  } = req.body;

  if (!provider_id || !category || !scheduled_date || !scheduled_time)
    return res.status(400).json({ error: 'provider_id, category, scheduled_date, scheduled_time required' });

  const provider = db.prepare(`SELECT * FROM users WHERE id = ? AND role = 'provider'`).get(provider_id);
  if (!provider) return res.status(404).json({ error: 'Provider not found' });

  const id = uuid();
  db.prepare(
    `INSERT INTO bookings (id, customer_id, provider_id, category, description, scheduled_date, scheduled_time, address, latitude, longitude, price)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.id, provider_id, category, description || '', scheduled_date, scheduled_time, address || '', latitude || null, longitude || null, price || 0);

  res.json({ message: 'Booking created', bookingId: id });
});

// Customer's bookings
router.get('/bookings', (req, res) => {
  const rows = db
    .prepare(
      `SELECT b.*, u.name as provider_name, u.phone as provider_phone, p.category as provider_category
       FROM bookings b JOIN users u ON u.id = b.provider_id
       LEFT JOIN provider_profiles p ON p.user_id = u.id
       WHERE b.customer_id = ? ORDER BY b.created_at DESC`
    )
    .all(req.user.id);
  res.json({ bookings: rows });
});

// Cancel booking
router.put('/bookings/:id/cancel', (req, res) => {
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND customer_id = ?').get(req.params.id, req.user.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  db.prepare(`UPDATE bookings SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`).run(req.params.id);
  res.json({ message: 'Booking cancelled' });
});

// Make payment (simulated gateway: UPI / CARD / COD)
router.post('/bookings/:id/pay', (req, res) => {
  const { method } = req.body; // 'UPI' | 'CARD' | 'COD'
  if (!['UPI', 'CARD', 'COD'].includes(method))
    return res.status(400).json({ error: 'Invalid payment method' });

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND customer_id = ?').get(req.params.id, req.user.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  const paymentId = uuid();
  const status = method === 'COD' ? 'pending_collection' : 'success';
  const txnRef = `TXN-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

  db.prepare(
    `INSERT INTO payments (id, booking_id, amount, method, status, txn_ref) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(paymentId, req.params.id, booking.price, method, status, txnRef);

  db.prepare(
    `UPDATE bookings SET payment_method = ?, payment_status = ? WHERE id = ?`
  ).run(method, method === 'COD' ? 'unpaid' : 'paid', req.params.id);

  res.json({
    message: method === 'COD' ? 'Booking confirmed — pay cash on service completion' : 'Payment successful',
    txnRef,
    status,
  });
});

// Leave a review
router.post('/reviews', (req, res) => {
  const { booking_id, rating, comment } = req.body;
  if (!booking_id || !rating) return res.status(400).json({ error: 'booking_id and rating required' });

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND customer_id = ?').get(booking_id, req.user.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.status !== 'completed')
    return res.status(400).json({ error: 'Can only review completed bookings' });

  const existing = db.prepare('SELECT id FROM reviews WHERE booking_id = ?').get(booking_id);
  if (existing) return res.status(409).json({ error: 'Review already submitted for this booking' });

  db.prepare(
    `INSERT INTO reviews (booking_id, customer_id, provider_id, rating, comment) VALUES (?, ?, ?, ?, ?)`
  ).run(booking_id, req.user.id, booking.provider_id, rating, comment || '');

  // recompute provider rating
  const agg = db
    .prepare('SELECT AVG(rating) avg, COUNT(*) cnt FROM reviews WHERE provider_id = ?')
    .get(booking.provider_id);
  db.prepare('UPDATE provider_profiles SET rating_avg = ?, rating_count = ? WHERE user_id = ?')
    .run(agg.avg || 0, agg.cnt || 0, booking.provider_id);

  res.json({ message: 'Review submitted' });
});

// Raise a help ticket
router.post('/help', (req, res) => {
  const { booking_id, subject, message } = req.body;
  if (!subject || !message) return res.status(400).json({ error: 'subject and message required' });
  db.prepare(
    `INSERT INTO help_tickets (booking_id, user_id, subject, message) VALUES (?, ?, ?, ?)`
  ).run(booking_id || null, req.user.id, subject, message);
  res.json({ message: 'Help ticket raised. Our support team will reach out shortly.' });
});

router.get('/help', (req, res) => {
  const rows = db.prepare('SELECT * FROM help_tickets WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json({ tickets: rows });
});

// AI Help Assistant chat (rule-based simulated AI)
router.post('/assistant', (req, res) => {
  const { message } = req.body;
  const reply = assistantReply(message);
  res.json({ reply });
});

module.exports = router;
