// Seeds categories (3-level taxonomy), homepage content, legal pages & demo data.
const db = require('./db');
const { template } = require('./menuTemplates');

const CATS = [
  ['Restaurants & Food', '🍽️', '#FF6600', ['Pure Veg Restaurants', 'Non-Veg Dhabas', 'Cafes', 'Biryani Houses', 'Ice Cream Parlours', 'Home Kitchens & Home-Cooked Food Deliveries']],
  ['Hotels & Stay', '🛏️', '#0055FF', ['Luxury Hotels', 'Budget Stays', 'Resorts', 'Student PGs & Hostels', 'Homestays']],
  ['Health & Hospitals', '🏥', '#dc2626', ['General Hospitals', 'General Physicians', 'Dentists', '24/7 Pharmacies', 'Diagnostic Labs', 'Ayurvedic Clinics', 'Local Home Nursing Care']],
  ['Education & Training', '🎓', '#7c3aed', ['Schools', 'Colleges', 'Coaching Centers', 'Tutors']],
  ['Home & Construction', '🏠', '#f97316', ['Electricians', 'Plumbers', 'AC Repair', 'Carpenters', 'Pest Control', 'Appliance Technicians', 'Laundry & Dry Cleaning', 'Packers & Movers', 'Builders', 'Interior Designers', 'Architects']],
  ['Automotive & Transport', '🚗', '#0055FF', ['Car Rentals', 'Two-Wheeler/Scooter Rentals', 'Auto-Rickshaw Call Links', 'Local Taxi Services', 'Garages', 'Towing Services', 'Bike Showrooms']],
  ['Shopping & Retail', '🛍️', '#db2777', ['Supermarkets', 'Clothing Stores', 'Electronics', 'Malls']],
  ['Beauty & Wellness', '🌿', '#16a34a', ['Salons', 'Spas', 'Gyms', 'Yoga Centers']],
  ['Professional Services', '💼', '#0055FF', ['Lawyers', 'CA & Accountants', 'Consultants', 'IT Services']],
  ['Events & Entertainment', '⭐', '#7c3aed', ['Kalyana Mantapas (Wedding Halls)', 'Event Decorators', 'Local Photographers', 'DJ Sound Providers', 'Outdoor Caterers', 'Wedding Planners']],
  ['Real Estate', '🏢', '#0055FF', ['Rent Houses', 'Flats & Apartments for Lease', 'Commercial Shops', 'Real Estate Brokers', 'Land Brokers']],
];
const slug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const LEGAL = {
  disclaimer: { title: 'Website Disclaimer', body: `PVRS HUB is an online intermediary directory under Section 79 of the Information Technology Act, 2000. We do not own, operate or endorse any listed business.

THREE-POSSIBILITY RULE (Medical & Healthcare listings): For any doctor, clinic, pharmacy, lab or nursing listing, visitors must assume that (1) the information may be accurate, (2) the information may be outdated, or (3) the information may be incorrect. Always verify registration numbers, qualifications, licence labels and medicine labels directly with the provider and the relevant medical council before relying on them. This website does not provide medical advice.

All ratings, prices, offers and timings are provided by vendors and may change without notice. Please double-check all details, labels and licences before making any payment or visit.` },
  privacy: { title: 'Privacy Policy', body: `What we collect: your 10-digit mobile number (for OTP login via Google Firebase), OTP verification logs, name, approximate GPS/browser location (only when you allow location access, to show nearby businesses), search queries, and click events (Call/WhatsApp) on listings.

Vendors additionally submit business details and verification documents (Trade License / FSSAI / KMC certificates) which are stored privately and viewed only by the Administrator.

Payments are processed by Razorpay; we never store card, UPI or bank credentials.

We do not sell personal data. Data is retained while your account is active and deleted on request to the Grievance Officer.` },
  terms: { title: 'Business Terms of Use', body: `1. Vendors are solely and fully liable for the accuracy, legality and genuineness of all information, images, videos, prices and offers they publish.
2. Every new listing and every future edit (phone numbers, categories, description, banners, video links) is held in a Pending Review queue and published only after manual approval by the Administrator.
3. Vendors must keep government licences valid. Expired licences lead to automatic suspension of the listing.
4. Free plan: one profile image; Call/WhatsApp buttons hidden. Premium plan: contact buttons, gallery, banner and video embeds.
5. Subscription and ad fees are non-refundable once the service is live.
6. PVRS HUB may remove any listing without notice upon a valid takedown request or legal order.` },
  grievance: { title: 'Grievance Officer', body: `In accordance with the Information Technology Act, 2000 and the IT (Intermediary Guidelines) Rules, 2021, complaints and takedown requests may be sent to:

Grievance Officer — PVRS HUB
Email: suhantudupi@gmail.com
Response: acknowledgement within 24 hours, resolution within 15 days.` },
  about: { title: 'About PVRS HUB', body: 'PVRS HUB is a verified local business directory for Udupi, Manipal, Malpe and Mangaluru — built for students, tourists and residents of coastal Karnataka.' },
};

async function seed(reset) {
  if (!reset && !db.isEmpty()) return;
  await db.reset();
  CATS.forEach(([name, icon, color, subs], i) => db.insert('categories', { name, slug: slug(name), icon, color, subs, order: i, active: true }, 'cat'));
  db.setSettings({
    siteName: 'PVRS HUB',
    cities: ['Udupi', 'Manipal', 'Malpe', 'Mangaluru', 'Kundapura', 'Karkala'],
    popularSearches: ['Restaurants', 'Student PGs', 'Scooter Rentals', 'Pharmacies', 'Electricians', 'Wedding Halls'],
    hero: { title: 'Find Local Businesses Near You', subtitle: 'Search. Connect. Grow. Udupi | Mangaluru | Beyond.' },
    stats: { businesses: '5,000+', customers: '100,000+', verified: 'Verified', support: 'Local' },
    cta: { vendorTitle: 'Grow Your Local Sales — List Your Business for FREE Today!', vendorText: 'Get discovered by students, tourists & locals across coastal Karnataka.', advertiseTitle: 'Advertise with PVRS HUB', advertiseText: 'Reach thousands of local customers through banners, featured listings and video ads.' },
    locationBanner: { title: 'Explore Udupi & Mangaluru', subtitle: 'Great Businesses. Greater People.', image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&q=70' },
    social: { facebook: '#', instagram: '#', youtube: '#', linkedin: '#' },
    apps: { android: '#', ios: '#' },
    pages: LEGAL, searchStats: {},
  });
  db.insert('ads', { type: 'top_banner', title: 'SRI GANESH MOTORS', subtitle: 'Ride the new style — Wide Range | Best Offers | Easy Finance', cta: 'BOOK NOW', link: '/search?q=scooter', bg: 'linear-gradient(90deg,#7f1d1d,#dc2626)', status: 'approved', createdBy: 'admin' }, 'ad');
  db.insert('ads', { type: 'top_banner', title: 'MANIPAL STAY PG', subtitle: 'Fully furnished PGs near MIT/MAHE — Wi-Fi, food, laundry', cta: 'ENQUIRE', link: '/category/hotels-and-stay', bg: 'linear-gradient(90deg,#0033aa,#0055FF)', status: 'approved', createdBy: 'admin' }, 'ad');
  db.insert('ads', { type: 'middle_banner', title: 'COASTAL TMT', subtitle: 'Stronger Foundations. Brighter Tomorrow.', cta: 'KNOW MORE', link: '/advertise', bg: 'linear-gradient(90deg,#eff6ff,#dbeafe)', status: 'approved', createdBy: 'admin' }, 'ad');
  db.insert('ads', { type: 'promo', title: 'Make Your Home More Beautiful', subtitle: 'Furniture | Interiors | Home Decor', cta: 'EXPLORE NOW', link: '/search?q=interior', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=70', status: 'approved', createdBy: 'admin' }, 'ad');
  db.insert('ads', { type: 'hero_video', title: 'Discover Udupi & Mangaluru', subtitle: 'A City of Opportunities', youtubeUrl: 'https://www.youtube.com/watch?v=ScMzIvxBSi4', status: 'approved', createdBy: 'admin' }, 'ad');
  [['Best Restaurants in Udupi', 'https://www.youtube.com/watch?v=ScMzIvxBSi4'], ['Top Hospitals in Mangaluru', 'https://www.youtube.com/watch?v=ScMzIvxBSi4'], ['Home Construction Ideas', 'https://www.youtube.com/watch?v=ScMzIvxBSi4'], ['Beauty Tips & Care', 'https://www.youtube.com/watch?v=ScMzIvxBSi4'], ['Local Events & Celebrations', 'https://www.youtube.com/watch?v=ScMzIvxBSi4']]
    .forEach(([title, url]) => db.insert('videos', { title, url, active: true }, 'vid'));
  db.insert('offers', { title: 'FLAT 50% OFF', subtitle: 'On all services', businessName: 'Sagar Spa & Salon', city: 'Manipal', code: 'PVRS50', expiry: 'Valid till 31 Oct 2026', active: true }, 'off');
  db.insert('offers', { title: 'BUY 1 GET 1', subtitle: 'Premium meals', businessName: 'Hotel Supreme', city: 'Udupi', code: 'SUPREMEBOGO', expiry: 'Weekends', active: true }, 'off');
  db.insert('blogs', { title: 'Top 10 Student PGs near Manipal', excerpt: 'How to pick a safe, affordable PG near MIT/MAHE.', body: 'Check the owner\'s registration, visit in person, verify food & Wi-Fi...', published: true }, 'blo');

  const demo = [
    ['Hotel Diana', 'restaurants-and-food', 'Pure Veg Restaurants', 'Udupi', 'premium', { swiggy: 'https://www.swiggy.com', zomato: 'https://www.zomato.com' }, 'featured', 4.8, 1200, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&q=70'],
    ['KMC Hospital', 'health-and-hospitals', 'General Hospitals', 'Mangaluru', 'premium', null, 'premium', 4.6, 980, 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&q=70'],
    ['Sagar Electronics', 'shopping-and-retail', 'Electronics', 'Udupi', 'free', null, 'verified', 4.5, 430, 'https://images.unsplash.com/photo-1550009158-9a375e54d588?w=400&q=70'],
    ['Trisha Beauty Salon', 'beauty-and-wellness', 'Salons', 'Mangaluru', 'premium', null, 'featured', 4.7, 620, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=70'],
    ['Coastal Builders', 'home-and-construction', 'Builders', 'Udupi', 'premium', null, 'premium', 4.6, 310, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=70']
  ];
  demo.forEach(([name, category, subCategory, city, plan, orderOnline, badge, rating, reviews, image], i) => db.insert('businesses', {
    name, category, subCategory, city, address: 'Main Road, ' + city, description: `${name} — trusted ${subCategory} in ${city}.`,
    contact: { phone: '98450' + String(10000 + i), whatsapp: '98450' + String(10000 + i) }, orderOnline, profileImage: image, badge,
    plan, planExpiry: plan === 'premium' ? new Date(Date.now() + 300 * 864e5).toISOString() : null,
    menu: template(category, subCategory), status: 'approved', approvedOnce: true, verified: true, unclaimed: i >= 4, rating: rating, reviews: reviews, views: 100 * i, leads: 0, featured: (badge === 'featured')
  }, 'biz'));
  // Demo activity for the last 30 days so admin analytics isn't empty on a fresh install
  const bizIds = db.all('businesses').map((b) => b._id);
  for (let d = 29; d >= 0; d--) {
    const day = Date.now() - d * 864e5; const n = 8 + Math.round(6 * Math.sin(d / 4) + Math.random() * 6);
    for (let k = 0; k < n; k++) {
      const type = k % 7 === 0 ? 'call' : k % 9 === 0 ? 'whatsapp' : 'view';
      db.insert('leads', { businessId: bizIds[k % bizIds.length], type, demo: true, createdAt: new Date(day - Math.random() * 8e7).toISOString() }, 'lead');
    }
  }
  await db.flush();
  console.log('Seeded database');
}
module.exports = seed;
if (require.main === module) {
  require('dotenv').config();
  db.init().then(() => seed(process.argv.includes('--reset'))).then(async () => { await db.flush(); process.exit(0); });
}
