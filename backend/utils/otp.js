// utils/otp.js
const db = require('../db');

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
}

// Creates an OTP record and "sends" it via email.
// SIMULATED: in dev mode we don't have a real SMTP/email API key, so the OTP is
// returned directly in the API response (clearly marked dev_otp) and logged to
// the server console — exactly where a real provider (SendGrid/SES/Nodemailer)
// would plug in. Swap sendRealEmail() in for production.
function createAndSendOtp(email, purpose) {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min
  db.prepare(
    `INSERT INTO otp_codes (email, code, purpose, expires_at) VALUES (?, ?, ?, ?)`
  ).run(email, code, purpose, expiresAt);

  console.log(`\n[SIMULATED EMAIL] To: ${email} | Subject: QUIKService OTP Verification`);
  console.log(`[SIMULATED EMAIL] Your OTP for ${purpose} is: ${code} (valid 5 minutes)\n`);

  // TODO (production): replace with real email send, e.g.:
  // await transporter.sendMail({ to: email, subject: 'Your OTP', text: `Code: ${code}` });

  return code;
}

function verifyOtp(email, code, purpose) {
  const row = db
    .prepare(
      `SELECT * FROM otp_codes WHERE email = ? AND purpose = ? AND used = 0
       ORDER BY id DESC LIMIT 1`
    )
    .get(email, purpose);

  if (!row) return { ok: false, reason: 'No OTP found, please request a new one' };
  if (row.code !== String(code)) return { ok: false, reason: 'Incorrect OTP' };
  if (new Date(row.expires_at).getTime() < Date.now())
    return { ok: false, reason: 'OTP expired, please request a new one' };

  db.prepare(`UPDATE otp_codes SET used = 1 WHERE id = ?`).run(row.id);
  return { ok: true };
}

module.exports = { createAndSendOtp, verifyOtp };
