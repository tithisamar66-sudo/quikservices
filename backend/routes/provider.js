// routes/provider.js
const express = require('express');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, requireRole('provider'));

// Get own profile
router.get('/profile', (req, res) => {
  const profile = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, p.* FROM users u
       LEFT JOIN provider_profiles p ON p.user_id = u.id WHERE u.id = ?`
    )
    .get(req.user.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  res.json({ profile });
});

// Update profile (the "edit profile" section with extended fields)
router.put('/profile', (req, res) => {
  const {
    name, phone,
    bio, category, skills, experience_years, hourly_rate,
    service_area, city, latitude, longitude, address,
    availability, id_proof_number, profile_photo_url, languages,
  } = req.body;

  if (name || phone) {
    db.prepare(`UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone) WHERE id = ?`)
      .run(name || null, phone || null, req.user.id);
  }

  db.prepare(
    `UPDATE provider_profiles SET
      bio = COALESCE(?, bio),
      category = COALESCE(?, category),
      skills = COALESCE(?, skills),
      experience_years = COALESCE(?, experience_years),
      hourly_rate = COALESCE(?, hourly_rate),
      service_area = COALESCE(?, service_area),
      city = COALESCE(?, city),
      latitude = COALESCE(?, latitude),
      longitude = COALESCE(?, longitude),
      address = COALESCE(?, address),
      availability = COALESCE(?, availability),
      id_proof_number = COALESCE(?, id_proof_number),
      profile_photo_url = COALESCE(?, profile_photo_url),
      languages = COALESCE(?, languages),
      updated_at = datetime('now')
     WHERE user_id = ?`
  ).run(
    bio, category, skills ? JSON.stringify(skills) : null, experience_years, hourly_rate,
    service_area, city, latitude, longitude, address,
    availability ? JSON.stringify(availability) : null, id_proof_number, profile_photo_url,
    languages, req.user.id
  );

  const updated = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, p.* FROM users u
       LEFT JOIN provider_profiles p ON p.user_id = u.id WHERE u.id = ?`
    )
    .get(req.user.id);
  res.json({ message: 'Profile updated', profile: updated });
});

// Provider's bookings (incoming requests + history)
router.get('/bookings', (req, res) => {
  const rows = db
    .prepare(
      `SELECT b.*, u.name as customer_name, u.phone as customer_phone, u.email as customer_email
       FROM bookings b JOIN users u ON u.id = b.customer_id
       WHERE b.provider_id = ? ORDER BY b.created_at DESC`
    )
    .all(req.user.id);
  res.json({ bookings: rows });
});

// Accept / update booking status
router.put('/bookings/:id/status', (req, res) => {
  const { status } = req.body;
  const allowed = ['accepted', 'in_progress', 'completed', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND provider_id = ?')
    .get(req.params.id, req.user.id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });

  db.prepare(`UPDATE bookings SET status = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(status, req.params.id);
  res.json({ message: 'Booking status updated' });
});

// Reviews received
router.get('/reviews', (req, res) => {
  const rows = db
    .prepare(
      `SELECT r.*, u.name as customer_name FROM reviews r
       JOIN users u ON u.id = r.customer_id WHERE r.provider_id = ?
       ORDER BY r.created_at DESC`
    )
    .all(req.user.id);
  const profile = db.prepare('SELECT rating_avg, rating_count FROM provider_profiles WHERE user_id = ?').get(req.user.id);
  res.json({ reviews: rows, summary: profile });
});

// Provider dashboard stats
router.get('/dashboard', (req, res) => {
  const totalBookings = db.prepare('SELECT COUNT(*) c FROM bookings WHERE provider_id = ?').get(req.user.id).c;
  const completed = db.prepare(`SELECT COUNT(*) c FROM bookings WHERE provider_id = ? AND status='completed'`).get(req.user.id).c;
  const pending = db.prepare(`SELECT COUNT(*) c FROM bookings WHERE provider_id = ? AND status='pending'`).get(req.user.id).c;
  const earnings = db.prepare(`SELECT COALESCE(SUM(price),0) s FROM bookings WHERE provider_id = ? AND payment_status='paid'`).get(req.user.id).s;
  const profile = db.prepare('SELECT rating_avg, rating_count FROM provider_profiles WHERE user_id = ?').get(req.user.id);
  res.json({ totalBookings, completed, pending, earnings, rating: profile });
});

module.exports = router;
