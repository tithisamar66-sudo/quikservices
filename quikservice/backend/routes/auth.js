// routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const db = require('../db');
const { createAndSendOtp, verifyOtp } = require('../utils/otp');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function publicUser(u) {
  const { password_hash, ...rest } = u;
  return rest;
}

// STEP 1: Start registration -> create unverified user + send OTP
router.post('/register/start', (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ error: 'name, email, password, role are required' });
  if (!['customer', 'provider', 'admin'].includes(role))
    return res.status(400).json({ error: 'Invalid role' });

  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (existing && existing.is_verified)
    return res.status(409).json({ error: 'Email already registered. Please login.' });

  const password_hash = bcrypt.hashSync(password, 10);

  if (existing && !existing.is_verified) {
    db.prepare(
      `UPDATE users SET name=?, phone=?, password_hash=?, role=? WHERE email=?`
    ).run(name, phone || null, password_hash, role, email);
  } else {
    db.prepare(
      `INSERT INTO users (id, name, email, phone, password_hash, role, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, 0)`
    ).run(uuid(), name, email, phone || null, password_hash, role);
  }

  const devOtp = createAndSendOtp(email, 'register');

  res.json({
    message: 'OTP sent to your email. Please verify to complete registration.',
    dev_otp: devOtp, // SIMULATED: shown only because no real email service is connected
  });
});

// STEP 2: Verify OTP -> mark verified, return token
router.post('/register/verify', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'email and otp required' });

  const result = verifyOtp(email, otp, 'register');
  if (!result.ok) return res.status(400).json({ error: result.reason });

  db.prepare('UPDATE users SET is_verified = 1 WHERE email = ?').run(email);
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (user.role === 'provider') {
    const existingProfile = db
      .prepare('SELECT user_id FROM provider_profiles WHERE user_id = ?')
      .get(user.id);
    if (!existingProfile) {
      db.prepare(
        `INSERT INTO provider_profiles (user_id, skills, availability) VALUES (?, '[]', '{}')`
      ).run(user.id);
    }
  }

  const token = signToken(user);
  res.json({ message: 'Registration complete', token, user: publicUser(user) });
});

// LOGIN STEP 1: password check -> send OTP
router.post('/login/start', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(404).json({ error: 'No account found with this email' });
  if (!user.is_verified)
    return res.status(403).json({ error: 'Account not verified. Please complete registration OTP.' });
  if (user.is_blocked) return res.status(403).json({ error: 'Account blocked. Contact support.' });

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Incorrect password' });

  const devOtp = createAndSendOtp(email, 'login');
  res.json({ message: 'OTP sent to your email', dev_otp: devOtp, role: user.role });
});

// LOGIN STEP 2: verify OTP -> issue token
router.post('/login/verify', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'email and otp required' });

  const result = verifyOtp(email, otp, 'login');
  if (!result.ok) return res.status(400).json({ error: result.reason });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  const token = signToken(user);
  res.json({ message: 'Login successful', token, user: publicUser(user) });
});

// Resend OTP (works for both register & login purpose)
router.post('/otp/resend', (req, res) => {
  const { email, purpose } = req.body;
  if (!email || !purpose) return res.status(400).json({ error: 'email and purpose required' });
  const devOtp = createAndSendOtp(email, purpose);
  res.json({ message: 'OTP resent', dev_otp: devOtp });
});

module.exports = router;
