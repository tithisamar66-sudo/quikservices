// routes/admin.js
const express = require('express');
const db = require('../db');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, requireRole('admin'));

// Dashboard summary
router.get('/dashboard', (req, res) => {
  const totalCustomers = db.prepare(`SELECT COUNT(*) c FROM users WHERE role='customer'`).get().c;
  const totalProviders = db.prepare(`SELECT COUNT(*) c FROM users WHERE role='provider'`).get().c;
  const totalBookings = db.prepare(`SELECT COUNT(*) c FROM bookings`).get().c;
  const completedBookings = db.prepare(`SELECT COUNT(*) c FROM bookings WHERE status='completed'`).get().c;
  const totalRevenue = db.prepare(`SELECT COALESCE(SUM(amount),0) s FROM payments WHERE status='success'`).get().s;
  const openTickets = db.prepare(`SELECT COUNT(*) c FROM help_tickets WHERE status='open'`).get().c;
  const avgRating = db.prepare(`SELECT COALESCE(AVG(rating),0) a FROM reviews`).get().a;

  res.json({
    totalCustomers, totalProviders, totalBookings, completedBookings,
    totalRevenue, openTickets, avgRating,
  });
});

// All users (filter by role)
router.get('/users', (req, res) => {
  const { role } = req.query;
  const rows = role
    ? db.prepare('SELECT id, name, email, phone, role, is_verified, is_blocked, created_at FROM users WHERE role = ? ORDER BY created_at DESC').all(role)
    : db.prepare('SELECT id, name, email, phone, role, is_verified, is_blocked, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users: rows });
});

// Block / unblock a user
router.put('/users/:id/block', (req, res) => {
  const { blocked } = req.body;
  db.prepare('UPDATE users SET is_blocked = ? WHERE id = ?').run(blocked ? 1 : 0, req.params.id);
  res.json({ message: blocked ? 'User blocked' : 'User unblocked' });
});

// Verify provider (verified badge)
router.put('/providers/:id/verify', (req, res) => {
  const { verified } = req.body;
  db.prepare('UPDATE provider_profiles SET verified_badge = ? WHERE user_id = ?').run(verified ? 1 : 0, req.params.id);
  res.json({ message: verified ? 'Provider verified' : 'Verification removed' });
});

// All bookings (records)
router.get('/bookings', (req, res) => {
  const rows = db
    .prepare(
      `SELECT b.*, c.name as customer_name, p.name as provider_name
       FROM bookings b
       JOIN users c ON c.id = b.customer_id
       JOIN users p ON p.id = b.provider_id
       ORDER BY b.created_at DESC`
    )
    .all();
  res.json({ bookings: rows });
});

// All payments (records)
router.get('/payments', (req, res) => {
  const rows = db
    .prepare(
      `SELECT pay.*, b.category, c.name as customer_name FROM payments pay
       JOIN bookings b ON b.id = pay.booking_id
       JOIN users c ON c.id = b.customer_id
       ORDER BY pay.created_at DESC`
    )
    .all();
  res.json({ payments: rows });
});

// All reviews
router.get('/reviews', (req, res) => {
  const rows = db
    .prepare(
      `SELECT r.*, c.name as customer_name, p.name as provider_name FROM reviews r
       JOIN users c ON c.id = r.customer_id
       JOIN users p ON p.id = r.provider_id
       ORDER BY r.created_at DESC`
    )
    .all();
  res.json({ reviews: rows });
});

// Help tickets (all)
router.get('/help-tickets', (req, res) => {
  const rows = db
    .prepare(
      `SELECT h.*, u.name as user_name, u.email as user_email, u.role as user_role
       FROM help_tickets h JOIN users u ON u.id = h.user_id
       ORDER BY h.created_at DESC`
    )
    .all();
  res.json({ tickets: rows });
});

router.put('/help-tickets/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['open', 'in_review', 'resolved'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE help_tickets SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: 'Ticket status updated' });
});

// Provider profiles list (for admin to browse)
router.get('/providers', (req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, u.is_blocked, p.* FROM users u
       JOIN provider_profiles p ON p.user_id = u.id WHERE u.role = 'provider'
       ORDER BY p.updated_at DESC`
    )
    .all();
  res.json({ providers: rows });
});

module.exports = router;
