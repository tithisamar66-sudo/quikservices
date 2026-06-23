// db.js — Database setup using better-sqlite3 (file-based, zero external setup)
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'quikservice.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------- SCHEMA ----------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('customer','provider','admin')),
  is_verified INTEGER DEFAULT 0,
  is_blocked INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL, -- 'register' | 'login' | 'reset'
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS provider_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  category TEXT,
  skills TEXT,              -- JSON array string
  experience_years INTEGER DEFAULT 0,
  hourly_rate REAL DEFAULT 0,
  service_area TEXT,
  city TEXT,
  latitude REAL,
  longitude REAL,
  address TEXT,
  availability TEXT,        -- JSON object string {mon:[..],tue:[..]}
  id_proof_number TEXT,
  profile_photo_url TEXT,
  languages TEXT,
  rating_avg REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  verified_badge INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES users(id),
  provider_id TEXT NOT NULL REFERENCES users(id),
  category TEXT NOT NULL,
  description TEXT,
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  address TEXT,
  latitude REAL,
  longitude REAL,
  status TEXT DEFAULT 'pending', -- pending, accepted, in_progress, completed, cancelled
  price REAL DEFAULT 0,
  payment_method TEXT,           -- COD, UPI, CARD
  payment_status TEXT DEFAULT 'unpaid', -- unpaid, paid, refunded
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id TEXT REFERENCES bookings(id),
  customer_id TEXT REFERENCES users(id),
  provider_id TEXT REFERENCES users(id),
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS help_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id TEXT REFERENCES bookings(id),
  user_id TEXT REFERENCES users(id),
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'open', -- open, in_review, resolved
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  booking_id TEXT REFERENCES bookings(id),
  amount REAL NOT NULL,
  method TEXT NOT NULL,
  status TEXT DEFAULT 'success',
  txn_ref TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

module.exports = db;
