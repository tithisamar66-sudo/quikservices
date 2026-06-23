// seed.js — populates demo data: 1 admin + several verified providers across categories
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const db = require('./db');

const passwordHash = bcrypt.hashSync('Password@123', 10);

function upsertUser({ name, email, phone, role }) {
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    const id = uuid();
    db.prepare(
      `INSERT INTO users (id, name, email, phone, password_hash, role, is_verified) VALUES (?, ?, ?, ?, ?, ?, 1)`
    ).run(id, name, email, phone, passwordHash, role);
    user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  }
  return user;
}

// Admin
const admin = upsertUser({ name: 'QUIKService Admin', email: 'admin@quikservice.com', phone: '9000000000', role: 'admin' });

// Sample providers (Bengaluru-area coordinates, varied categories)
const providers = [
  { name: 'Ramesh Kumar', email: 'ramesh.electrician@quikservice.com', phone: '9000000001', category: 'Electrician', skills: ['Wiring','Fan Installation','Inverter Setup'], exp: 8, rate: 350, city: 'Bengaluru', lat: 12.9716, lng: 77.5946, bio: 'Licensed electrician with 8 years of residential & commercial experience.' },
  { name: 'Suresh Plumbing Works', email: 'suresh.plumber@quikservice.com', phone: '9000000002', category: 'Plumber', skills: ['Pipe Fitting','Leak Repair','Bathroom Fitting'], exp: 6, rate: 300, city: 'Bengaluru', lat: 12.9352, lng: 77.6245, bio: 'Reliable plumbing services for homes and offices, quick response time.' },
  { name: 'Lakshmi Home Cleaning', email: 'lakshmi.cleaning@quikservice.com', phone: '9000000003', category: 'House Cleaning', skills: ['Deep Cleaning','Sofa Cleaning','Kitchen Cleaning'], exp: 4, rate: 250, city: 'Bengaluru', lat: 12.9279, lng: 77.6271, bio: 'Professional home cleaning team using eco-friendly products.' },
  { name: 'Anil AC Repair', email: 'anil.acrepair@quikservice.com', phone: '9000000004', category: 'AC Repair', skills: ['AC Service','Gas Refill','Installation'], exp: 10, rate: 400, city: 'Bengaluru', lat: 12.9698, lng: 77.7500, bio: 'Certified AC technician, all brands serviced, same-day visits.' },
  { name: 'GreenLeaf Pest Control', email: 'pest.control@quikservice.com', phone: '9000000005', category: 'Pest Control', skills: ['Cockroach Control','Termite Treatment','Rodent Control'], exp: 7, rate: 500, city: 'Bengaluru', lat: 12.9141, lng: 77.6411, bio: 'Safe, eco-conscious pest control for homes and offices.' },
  { name: 'Pooja Beauty At Home', email: 'pooja.beauty@quikservice.com', phone: '9000000006', category: 'Beauty & Salon', skills: ['Haircut','Facial','Bridal Makeup'], exp: 5, rate: 450, city: 'Bengaluru', lat: 13.0067, lng: 77.5667, bio: 'Salon-quality beauty services delivered at your doorstep.' },
  { name: 'Manoj Carpentry', email: 'manoj.carpenter@quikservice.com', phone: '9000000007', category: 'Carpenter', skills: ['Furniture Repair','Modular Kitchen','Door Fitting'], exp: 12, rate: 380, city: 'Bengaluru', lat: 12.8997, lng: 77.5950, bio: 'Master carpenter specializing in custom furniture & repairs.' },
  { name: 'SparkleWash Car Care', email: 'carcare@quikservice.com', phone: '9000000008', category: 'Car Wash', skills: ['Exterior Wash','Interior Detailing','Polishing'], exp: 3, rate: 200, city: 'Bengaluru', lat: 12.9786, lng: 77.6408, bio: 'Doorstep car wash & detailing using waterless techniques.' },
  { name: 'Geeta Appliance Repair', email: 'geeta.appliance@quikservice.com', phone: '9000000009', category: 'Appliance Repair', skills: ['Washing Machine','Refrigerator','Microwave'], exp: 9, rate: 320, city: 'Bengaluru', lat: 12.9550, lng: 77.6088, bio: 'Quick and affordable repair for all home appliances.' },
  { name: 'Vikram Painting Co.', email: 'vikram.painter@quikservice.com', phone: '9000000010', category: 'Painting', skills: ['Wall Painting','Texture Design','Waterproofing'], exp: 11, rate: 280, city: 'Bengaluru', lat: 12.9089, lng: 77.6477, bio: 'Quality painting services with premium, long-lasting finishes.' },
];

let count = 0;
for (const p of providers) {
  const user = upsertUser({ name: p.name, email: p.email, phone: p.phone, role: 'provider' });
  const existing = db.prepare('SELECT user_id FROM provider_profiles WHERE user_id = ?').get(user.id);
  const ratingAvg = (3.8 + Math.random() * 1.2).toFixed(1);
  const ratingCount = Math.floor(15 + Math.random() * 80);

  if (!existing) {
    db.prepare(
      `INSERT INTO provider_profiles
        (user_id, bio, category, skills, experience_years, hourly_rate, service_area, city, latitude, longitude, address, availability, profile_photo_url, languages, rating_avg, rating_count, verified_badge)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
    ).run(
      user.id, p.bio, p.category, JSON.stringify(p.skills), p.exp, p.rate, `${p.city} & nearby (10km)`, p.city,
      p.lat, p.lng, `${p.city}, Karnataka`,
      JSON.stringify({ mon: ['09:00-18:00'], tue: ['09:00-18:00'], wed: ['09:00-18:00'], thu: ['09:00-18:00'], fri: ['09:00-18:00'], sat: ['10:00-16:00'], sun: [] }),
      '', 'English, Hindi, Kannada', ratingAvg, ratingCount
    );
    count++;
  }
}

// Demo customer
upsertUser({ name: 'Demo Customer', email: 'customer@quikservice.com', phone: '9111111111', role: 'customer' });

console.log(`✅ Seed complete.`);
console.log(`   Admin login:    admin@quikservice.com / Password@123`);
console.log(`   Customer login: customer@quikservice.com / Password@123`);
console.log(`   Provider login: ramesh.electrician@quikservice.com / Password@123 (and 9 more, see seed.js)`);
console.log(`   ${count} new provider profiles created.`);
