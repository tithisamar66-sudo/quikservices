// utils/aiMatch.js
// Simulated "AI" engine: scores providers using a weighted blend of
// distance, rating, experience, and price-fit — no external API needed.
// This mirrors how a real recommendation model's output would be consumed,
// so it can be swapped for a real ML/LLM call later without changing callers.

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some((v) => v === null || v === undefined)) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * rankProviders
 * @param {Array} providers - rows joined from users + provider_profiles
 * @param {Object} opts - { lat, lng, category, maxBudget }
 */
function rankProviders(providers, opts = {}) {
  const { lat, lng, category, maxBudget } = opts;

  const scored = providers
    .filter((p) => !category || p.category === category)
    .map((p) => {
      const distanceKm =
        lat && lng ? haversineDistanceKm(lat, lng, p.latitude, p.longitude) : null;

      // Normalize sub-scores 0-100
      const distanceScore =
        distanceKm === null ? 50 : Math.max(0, 100 - Math.min(distanceKm, 50) * 2);
      const ratingScore = (p.rating_avg || 0) * 20; // 5-star -> 100
      const experienceScore = Math.min((p.experience_years || 0) * 10, 100);
      const priceScore =
        maxBudget && p.hourly_rate
          ? Math.max(0, 100 - Math.max(0, p.hourly_rate - maxBudget) * 2)
          : 70;
      const verifiedBoost = p.verified_badge ? 10 : 0;

      const aiScore =
        distanceScore * 0.35 +
        ratingScore * 0.3 +
        experienceScore * 0.15 +
        priceScore * 0.15 +
        verifiedBoost;

      let reason = [];
      if (distanceKm !== null) reason.push(`${distanceKm.toFixed(1)} km away`);
      if (p.rating_avg) reason.push(`${p.rating_avg.toFixed(1)}★ rating`);
      if (p.experience_years) reason.push(`${p.experience_years} yrs experience`);
      if (p.verified_badge) reason.push('verified');

      return {
        ...p,
        distanceKm: distanceKm === null ? null : Number(distanceKm.toFixed(2)),
        aiScore: Math.round(aiScore),
        aiReason: reason.join(' · ') || 'Good match based on category',
      };
    })
    .sort((a, b) => b.aiScore - a.aiScore);

  return scored;
}

// Simple scripted AI Help Assistant (rule/keyword based, no external API)
function assistantReply(message, context = {}) {
  const m = (message || '').toLowerCase();

  const rules = [
    { keys: ['cancel'], reply: "To cancel a booking, go to 'My Bookings' and tap Cancel on the relevant booking. Cancellations made 2+ hours before the scheduled time are fully refundable if paid online." },
    { keys: ['refund', 'money back'], reply: "Refunds for cancelled or disputed bookings are processed back to your original payment method within 3-5 business days. For COD bookings, no charge is made unless service was completed." },
    { keys: ['payment', 'pay', 'upi', 'cod'], reply: "We support UPI, Card, and Cash on Delivery (COD). You can choose your preferred method at checkout when booking a service." },
    { keys: ['late', 'delay', 'not arrived', 'no show'], reply: "Sorry about the delay! Please raise a Help ticket from the booking page with the booking ID — our team (and the provider) will be notified immediately, and you can also message the provider directly." },
    { keys: ['best', 'recommend', 'near me', 'find provider'], reply: "I can help with that — head to 'Find a Provider', enable location access, and our AI matching will rank the best providers near you by distance, rating, and experience." },
    { keys: ['rate', 'review', 'feedback'], reply: "Once a booking is marked Completed, you'll see a 'Leave Review' button on that booking — your rating helps other customers and helps providers build trust." },
    { keys: ['safety', 'verified', 'trust'], reply: "All providers with a 'Verified' badge have completed ID verification with QUIKService. We recommend booking verified providers for sensitive in-home services." },
    { keys: ['become a provider', 'join as provider', 'register as provider'], reply: "Great! Register on QUIKService and choose 'Provider' as your role, verify your email with OTP, then complete your profile with skills, experience, and availability to start receiving bookings." },
    { keys: ['contact', 'support', 'human', 'agent'], reply: "I can raise a help ticket for you right now, or you can reach our support team via the Help Center — would you like me to open a ticket?" },
  ];

  for (const rule of rules) {
    if (rule.keys.some((k) => m.includes(k))) return rule.reply;
  }

  if (m.includes('hi') || m.includes('hello') || m.includes('hey')) {
    return "Hi there! I'm the QUIKService AI Assistant 🤖 — I can help you find providers, track bookings, explain payments, or raise a support ticket. What do you need help with?";
  }

  return "I'm not 100% sure about that, but I can connect you with our support team or help you with bookings, payments, provider matching, or reviews. Could you tell me a bit more, or shall I open a help ticket?";
}

module.exports = { rankProviders, haversineDistanceKm, assistantReply };
