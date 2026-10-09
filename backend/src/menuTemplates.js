// Suggested menu / service-rate lists per sub-category. Vendors can load these in the editor and change names & prices.
// Format: sub-category -> [[group name, 'item|price|short description', ...], ...]   (prices are indicative starting rates in ₹)
const G = (name, ...items) => [name, ...items];
const SUB = {
  // Restaurants & Food
  'Pure Veg Restaurants': [G('Starters', 'Paneer Tikka|220|Tandoor-grilled cottage cheese', 'Gobi Manchurian|160', 'Veg Spring Roll|140', 'Hara Bhara Kebab|180'), G('Main Course', 'Paneer Butter Masala|240', 'Dal Tadka|160', 'Veg Biryani|190', 'Mix Veg Curry|170'), G('Breads & Rice', 'Butter Naan|45', 'Tandoori Roti|25', 'Jeera Rice|120', 'Plain Dosa|70'), G('Desserts & Drinks', 'Gulab Jamun (2 pc)|60', 'Fresh Lime Soda|60', 'Masala Chai|25', 'Filter Coffee|35')],
  'Non-Veg Dhabas': [G('Starters', 'Chicken Tikka|260', 'Fish Fry|280', 'Chicken 65|220'), G('Main Course', 'Butter Chicken|320', 'Chicken Curry|260', 'Mutton Rogan Josh|400', 'Egg Curry|170'), G('Breads & Rice', 'Butter Naan|45', 'Tandoori Roti|25', 'Chicken Biryani|240', 'Jeera Rice|120')],
  'Cafes': [G('Hot Beverages', 'Cappuccino|120', 'Cafe Latte|130', 'Masala Chai|40', 'Hot Chocolate|150'), G('Cold Beverages', 'Cold Coffee|140', 'Iced Tea|110', 'Oreo Shake|160', 'Fresh Lime Soda|70'), G('Snacks', 'Veg Sandwich|110', 'Cheese Garlic Bread|130', 'French Fries|110', 'Veg Burger|140'), G('Desserts', 'Brownie with Ice Cream|160', 'Cheesecake Slice|180', 'Waffle|150')],
  'Biryani Houses': [G('Biryani', 'Chicken Dum Biryani|240', 'Mutton Biryani|360', 'Egg Biryani|170', 'Veg Biryani|180', 'Prawn Biryani|330'), G('Sides', 'Raita|30', 'Chicken 65|220', 'Mirchi Ka Salan|50', 'Boiled Egg|15'), G('Drinks', 'Soft Drink|40', 'Buttermilk|30', 'Falooda|120')],
  'Ice Cream Parlours': [G('Scoops', 'Vanilla Scoop|50', 'Chocolate Scoop|60', 'Butterscotch Scoop|60', 'Mango Scoop|60'), G('Sundaes & Shakes', 'Hot Chocolate Fudge|150', 'Brownie Sundae|170', 'Oreo Shake|140', 'Mango Shake|120'), G('Family Packs', 'Family Pack 500 ml|230', 'Party Pack 1 L|420')],
  'Home Kitchens & Home-Cooked Food Deliveries': [G('Meals', 'Veg Thali|120|Roti, rice, dal, sabzi, salad', 'Non-Veg Thali|170', 'Mini Meals|90', 'Weekly Tiffin Plan (6 days)|650'), G('Add-ons', 'Extra Roti (2)|20', 'Curd|20', 'Sweet of the Day|30')],
  // Hotels & Stay
  'Luxury Hotels': [G('Rooms (per night)', 'Deluxe Room|3500|Breakfast included', 'Executive Suite|5500', 'Family Suite|6500'), G('Packages', 'Candlelight Dinner|2500', 'Airport / Station Pickup|800', 'Spa Session (60 min)|1800')],
  'Budget Stays': [G('Rooms (per night)', 'Non-AC Single Room|700', 'AC Double Room|1200', 'AC Family Room|1800'), G('Extras', 'Extra Bed|300', 'Breakfast|100', 'Early Check-in|300')],
  'Resorts': [G('Stay (per night)', 'Garden Cottage|3500', 'Pool Villa|6500', 'Sea-view Room|4800'), G('Activities', 'Day Pass with Lunch|1200', 'Guided Beach Walk|400', 'Bonfire Evening|600')],
  'Student PGs & Hostels': [G('Monthly Rent', 'Triple Sharing|4500|Meals extra', 'Double Sharing|6500', 'Single Room|9500'), G('Meals & Services', 'Food (3 meals / month)|3000', 'Laundry (monthly)|500', 'Wi-Fi (monthly)|300')],
  'Homestays': [G('Rooms (per night)', 'Double Room|1800|Home-cooked breakfast', 'Family Room|2800', 'Whole Home (up to 6)|6500'), G('Experiences', 'Home-cooked Dinner|350', 'Local Sightseeing (half day)|1500')],
  // Health & Hospitals
  'General Hospitals': [G('Consultation & Care', 'OPD Consultation|300', 'Emergency Visit|800', 'Health Check-up Package|1800', 'Ambulance (within city)|1200')],
  'General Physicians': [G('Consultation', 'First Consultation|300', 'Follow-up Visit|200', 'Home Visit|700', 'Online Consultation|250'), G('Procedures', 'ECG|250', 'Injection / Dressing|100')],
  'Dentists': [G('Check-up & Cleaning', 'Consultation|300', 'Scaling & Polishing|800', 'Tooth Whitening|4500'), G('Treatments', 'Tooth Filling|700', 'Root Canal (per tooth)|4500', 'Extraction|600', 'Dental Crown|4000', 'Braces (full)|35000')],
  '24/7 Pharmacies': [G('Services', 'Home Delivery (within 5 km)|30', 'BP Check|20', 'Sugar Test (strip)|40'), G('Essentials', 'First-aid Kit|350', 'Digital Thermometer|250', 'N95 Mask (pack of 5)|150', 'Glucometer|900')],
  'Diagnostic Labs': [G('Blood Tests', 'CBC|250', 'Blood Sugar (F/PP)|120', 'Lipid Profile|600', 'Thyroid Profile (T3 T4 TSH)|550', 'HbA1c|450'), G('Scans', 'X-Ray Chest|350', 'ECG|250', 'Ultrasound Abdomen|1100'), G('Packages', 'Full Body Check-up|1999', 'Home Sample Collection|100')],
  'Ayurvedic Clinics': [G('Consultation', 'Consultation|300', 'Follow-up|150'), G('Therapies', 'Abhyanga Massage|1200', 'Shirodhara|1800', 'Panchakarma (per day)|2500', 'Herbal Steam|600')],
  'Local Home Nursing Care': [G('Care Plans (per day)', 'Day Nurse (8 hrs)|900', 'Night Nurse (12 hrs)|1200', 'Full-day Attendant (24 hrs)|1800'), G('Services', 'Injection / IV at home|250', 'Wound Dressing|300', 'Physiotherapy at Home|600')],
  // Education & Training
  'Schools': [G('Fees (indicative)', 'Admission / Registration|1000', 'Annual Fee (Primary)|35000', 'Annual Fee (High School)|45000'), G('Facilities', 'School Bus (monthly)|1500', 'Uniform & Books Set|4500')],
  'Colleges': [G('Courses (per year)', 'B.Com|35000', 'BBA|55000', 'B.Sc|40000', 'B.Tech|120000'), G('Services', 'Application Form|500', 'Hostel (yearly)|60000')],
  'Coaching Centers': [G('Batches', 'Class 10 Maths & Science (yearly)|18000', 'PUC Science Batch (yearly)|35000', 'NEET / JEE Foundation (yearly)|55000', 'Spoken English (3 months)|4500'), G('Other', 'Demo Class|0', 'Test Series|2500')],
  'Tutors': [G('Home Tuition (per month)', 'Class 1–5, all subjects|2500', 'Class 6–10, one subject|2000', 'PUC / College Subject|3000'), G('Other', 'Demo Class|0', 'Online Class (per hour)|400', 'Exam Crash Course|3500')],
  // Home & Construction
  'Electricians': [G('Wiring & Fittings', 'Fan Installation|250|Ceiling fan fitting', 'Fan Repair / Regulator Change|300', 'Switch / Socket Replacement|120', 'Tube Light / LED Fitting|150', 'New Point Wiring (per point)|450', 'MCB / Fuse Replacement|300'), G('Appliances & Safety', 'Geyser Installation|500', 'Inverter / UPS Installation|700', 'Earthing Check|600', 'House Wiring Inspection|800', 'Doorbell Installation|200')],
  'Plumbers': [G('Repairs', 'Tap Repair / Replacement|200', 'Leakage Fixing|300', 'Flush Tank Repair|400', 'Drain Blockage Clearing|500', 'Pipeline Repair (per point)|450'), G('Installation', 'Wash Basin Fitting|600', 'Western Toilet Fitting|900', 'Water Tank Cleaning|800', 'Motor Pump Installation|700', 'Shower / Geyser Plumbing|400')],
  'AC Repair': [G('Service', 'AC Service (Split)|500|Jet-wash cleaning', 'AC Service (Window)|400', 'Gas Top-up (Split)|2200', 'Gas Leak Fix & Refill|3200'), G('Install & Repair', 'AC Installation (Split)|1500', 'AC Uninstallation|700', 'PCB / Card Repair|2500', 'Compressor Check|600')],
  'Carpenters': [G('Repairs & Fitting', 'Door Lock Fitting|300', 'Door / Window Repair|450', 'Furniture Polish (per sq ft)|40', 'Curtain Rod Fitting|200', 'Bed / Cot Repair|600'), G('Custom Work', 'Modular Wardrobe (per sq ft)|1100', 'Kitchen Cabinet (per sq ft)|1200', 'TV Unit|9000', 'Wooden Door (supply & fit)|8500')],
  'Pest Control': [G('Treatments', 'General Pest Control (1 BHK)|1200', 'General Pest Control (2 BHK)|1600', 'Cockroach Gel Treatment|1000', 'Termite Treatment (per sq ft)|12', 'Bed Bug Treatment|1500', 'Mosquito Fogging|700', 'Rodent Control|900')],
  'Appliance Technicians': [G('Repairs', 'Washing Machine Repair|400', 'Refrigerator Repair|450', 'Microwave Repair|350', 'Water Purifier Service|400', 'Mixer / Grinder Repair|250', 'TV Repair|500', 'Chimney Cleaning|600')],
  'Laundry & Dry Cleaning': [G('Per Piece', 'Shirt / T-shirt Wash & Iron|30', 'Trousers / Jeans|40', 'Saree Dry Clean|180', 'Suit (2 pc) Dry Clean|350', 'Blanket / Quilt|300', 'Curtain (per panel)|150', 'Only Ironing (per piece)|10'), G('Bulk', 'Wash & Fold (per kg)|70', 'Pickup & Delivery|0')],
  'Packers & Movers': [G('Local Shifting', '1 BHK Shifting|6500', '2 BHK Shifting|9500', '3 BHK Shifting|14000', 'Single Item (Fridge / Bed)|1500'), G('Add-ons', 'Packing Material (per box)|40', 'Loading & Unloading|800', 'Transit Insurance|500')],
  'Builders': [G('Construction (per sq ft)', 'Basic Construction|1800', 'Standard Construction|2200', 'Premium Construction|2800'), G('Services', 'Site Visit & Estimate|0', 'Renovation (per sq ft)|600', 'Compound Wall (per ft)|1200', 'Waterproofing (per sq ft)|60')],
  'Interior Designers': [G('Design', 'Consultation / Site Visit|500', '2D Layout Plan|5000', '3D Design (per room)|8000'), G('Execution', 'Modular Kitchen (per sq ft)|1300', 'Wardrobe (per sq ft)|1100', 'Full Home Interior (2 BHK)|450000', 'False Ceiling (per sq ft)|85')],
  'Architects': [G('Services', 'Site Visit & Consultation|1000', 'House Plan (per sq ft)|35', 'Elevation Design (per sq ft)|20', 'Structural Drawing (per sq ft)|15', 'Municipal Approval Drawings|12000', 'Vastu Consultation|2500')],
  // Automotive & Transport
  'Car Rentals': [G('Self-drive / With Driver', 'Hatchback (per day)|1800', 'Sedan (per day)|2500', 'SUV (per day)|3800', 'Tempo Traveller (per day)|6500'), G('Charges', 'Extra Km|12', 'Driver Allowance (per day)|500', 'Airport Pickup|1200')],
  'Two-Wheeler/Scooter Rentals': [G('Rentals (per day)', 'Scooter (Activa / Jupiter)|400', 'Bike (Splendor / Shine)|450', 'Royal Enfield|1000', 'Helmet|0|Free with every rental'), G('Packages', 'Weekly Rent (scooter)|2400', 'Monthly Rent (scooter)|7500')],
  'Auto-Rickshaw Call Links': [G('Fares (indicative)', 'Local Ride up to 3 km|60', 'Local Ride 3–6 km|120', 'Railway Station Drop|250', 'Waiting Charge (per 15 min)|20', 'Night Ride Surcharge|50')],
  'Local Taxi Services': [G('Trips', 'Local Hire (4 hrs / 40 km)|1500', 'Local Hire (8 hrs / 80 km)|2500', 'Railway / Airport Drop|900', 'Outstation (per km)|14'), G('Packages', 'Udupi–Manipal–Malpe Sightseeing|2200', 'Mangaluru Airport Drop|2800')],
  'Garages': [G('Services', 'General Service (Car)|2500', 'General Service (Bike)|600', 'Oil Change|800', 'Brake Pad Replacement|1500', 'Wheel Alignment & Balancing|700', 'Battery Replacement|3500', 'Car AC Service|1800', 'Denting & Painting (per panel)|2500')],
  'Towing Services': [G('Towing', 'Car Towing (within 10 km)|1500', 'Bike Towing (within 10 km)|600', 'Extra Km|40', 'Flat-bed Recovery|2500'), G('Roadside Help', 'Battery Jump-start|400', 'Flat Tyre Help|350', 'Fuel Delivery (5 L)|450')],
  'Bike Showrooms': [G('Services', 'Test Ride|0', 'Booking Amount|5000', 'Exchange Valuation|0', 'First Free Service|0'), G('Accessories', 'Helmet|900', 'Seat Cover|450', 'Bike Cover|350', 'Crash Guard|1200')],
  // Shopping & Retail
  'Supermarkets': [G('Groceries', 'Rice 5 kg|320', 'Toor Dal 1 kg|160', 'Cooking Oil 1 L|150', 'Sugar 1 kg|48', 'Atta 5 kg|240', 'Tea 250 g|110'), G('Daily Needs', 'Milk 1 L|56', 'Bread|40', 'Eggs (6)|45', 'Biscuits Pack|30', 'Detergent 1 kg|120')],
  'Clothing Stores': [G('Men', 'Shirt (from)|599', 'T-shirt (from)|349', 'Jeans (from)|999', 'Formal Trousers (from)|899'), G('Women', 'Kurti (from)|499', 'Saree (from)|999', 'Salwar Set (from)|1199'), G('Kids', 'Kids T-shirt (from)|249', 'Kids Frock (from)|399')],
  'Electronics': [G('Mobiles & Accessories', 'Smartphone (from)|8999', 'Phone Cover|199', 'Charger & Cable|399', 'Earphones (from)|499', 'Power Bank 10000 mAh|999'), G('Home Appliances', 'Ceiling Fan|1999', 'LED TV 32 inch|11999', 'Mixer Grinder|2499', 'Iron Box|799', 'Bluetooth Speaker|1299')],
  'Malls': [G('Services', 'Parking (4-wheeler, per hr)|40', 'Gift Card|500', 'Kids Play Zone Entry|250', 'Food Court Combo|220', 'Movie Ticket (from)|180')],
  // Beauty & Wellness
  'Salons': [G('Hair', 'Haircut (Men)|150', 'Haircut (Women)|350', 'Hair Spa|900', 'Hair Colour (from)|1200', 'Beard Trim|80'), G('Skin & Grooming', 'Facial (from)|700', 'Cleanup|500', 'Waxing (full arms)|250', 'Threading|40', 'Manicure|450', 'Pedicure|600'), G('Bridal', 'Bridal Makeup (from)|8000', 'Party Makeup|2500', 'Mehendi (per hand)|300')],
  'Spas': [G('Massage', 'Swedish Massage (60 min)|1500', 'Deep Tissue (60 min)|1800', 'Aromatherapy (60 min)|1700', 'Head & Shoulder (30 min)|700', 'Foot Reflexology (30 min)|600'), G('Packages', 'Couple Spa (90 min)|3800', 'Body Scrub + Massage|2400')],
  'Gyms': [G('Memberships', 'Day Pass|150', 'Monthly|1200', 'Quarterly|3000', 'Half-yearly|5000', 'Yearly|8500'), G('Training', 'Personal Training (monthly)|4500', 'Zumba / Cardio Classes (monthly)|1500', 'Diet Plan|800')],
  'Yoga Centers': [G('Classes', 'Trial Class|0', 'Monthly Group Class|1000', 'Quarterly|2700', 'Personal Yoga (per session)|500', 'Weekend Workshop|800'), G('Programs', 'Meditation Course (8 sessions)|1500', 'Prenatal Yoga (monthly)|1500', 'Therapy Yoga (monthly)|2000')],
  // Professional Services
  'Lawyers': [G('Consultation', 'First Consultation|500', 'Detailed Case Review|1500', 'Legal Notice Drafting|2500'), G('Documents', 'Rental Agreement Drafting|1500', 'Affidavit|400', 'Will Drafting|5000', 'Property Document Verification|5000', 'Cheque Bounce Notice|2500')],
  'CA & Accountants': [G('Tax Filing', 'ITR – Salaried|1000', 'ITR – Business / Profession|3500', 'GST Registration|2500', 'GST Return (monthly)|800'), G('Business', 'Company Registration (Pvt Ltd)|9000', 'Monthly Bookkeeping|2500', 'Audit (small business)|12000', 'TDS Return (quarterly)|1500')],
  'Consultants': [G('Services', 'Initial Consultation (1 hr)|1000', 'Business Plan|6000', 'Market Research Report|8000', 'Startup Registration Help|4000', 'Monthly Advisory Retainer|10000')],
  'IT Services': [G('Web & App', 'Business Website (5 pages)|12000', 'E-commerce Website|35000', 'Mobile App (basic)|60000', 'Logo & Branding|3500'), G('Support', 'Laptop / PC Repair|500', 'Software Installation|300', 'CCTV Installation (4 cam)|14000', 'Annual Maintenance (per system)|2000', 'Social Media Management (monthly)|6000')],
  // Events & Entertainment
  'Kalyana Mantapas (Wedding Halls)': [G('Hall Booking', 'Hall without AC (per day)|40000|Up to 500 guests', 'AC Hall (per day)|75000|Up to 800 guests', 'Dining Hall (per meal)|12000'), G('Add-ons', 'Stage Decoration|15000', 'Generator Backup|6000', 'Parking Management|3000', 'Bridal Room|2000')],
  'Event Decorators': [G('Decor', 'Stage Decoration (basic)|12000', 'Entrance Gate Decor|5000', 'Mandap Decor|20000', 'Birthday Decoration|3500', 'Balloon Decor (per 50)|2500'), G('Lighting & Flowers', 'Lighting Setup|6000', 'Flower Garland (pair)|800', 'Floral Backdrop|9000')],
  'Local Photographers': [G('Packages', 'Pre-wedding Shoot|15000', 'Wedding Photography (1 day)|35000', 'Candid + Traditional Video|60000', 'Birthday / Event (3 hrs)|6000', 'Baby Shoot|5000'), G('Add-ons', 'Drone Shots|5000', 'Photo Album (30 pages)|4500', 'Extra Hour|1500', 'Instagram Reel Highlight|3000')],
  'DJ Sound Providers': [G('Packages', 'DJ + Sound (4 hrs)|9000', 'DJ + Lights (4 hrs)|14000', 'Wedding Sangeet Package|25000', 'Mic & Speaker only (per day)|3500'), G('Add-ons', 'Extra Hour|1500', 'Dance Floor Lights|4000', 'LED Wall (per day)|12000')],
  'Outdoor Caterers': [G('Per Plate', 'Veg Menu (basic)|250', 'Veg Menu (premium)|450', 'Non-Veg Menu|550', 'Breakfast Menu|120', 'Snacks & Tea (per head)|90'), G('Add-ons', 'Live Counters|80', 'Serving Staff (per head)|700', 'Crockery & Tables|3000')],
  'Wedding Planners': [G('Planning', 'Consultation|0', 'Day-of Coordination|25000', 'Full Wedding Planning (from)|150000', 'Destination Wedding (from)|300000'), G('Services', 'Guest Management|8000', 'Hospitality & Transport Desk|10000', 'Invitation Design & Print|6000')],
  // Real Estate
  'Rent Houses': [G('Listings (monthly)', '1 BHK House|7000', '2 BHK House|12000', '3 BHK House|18000', 'Independent Villa|35000'), G('Charges', 'Rental Brokerage|0|Usually one month rent', 'Security Deposit|0|Usually 2 months rent')],
  'Flats & Apartments for Lease': [G('Listings (monthly)', '1 BHK Flat|8000', '2 BHK Flat|13000', '3 BHK Flat|20000', 'Furnished Studio|9500'), G('Charges', 'Maintenance (monthly)|1500', 'Site Visit|0')],
  'Commercial Shops': [G('Shops (monthly)', 'Small Shop (up to 200 sq ft)|10000', 'Medium Shop (200–500 sq ft)|22000', 'Showroom (500+ sq ft)|45000', 'Office Space (per sq ft)|35'), G('Charges', 'Security Deposit|0|Usually 6 months rent', 'Site Visit|0')],
  'Real Estate Brokers': [G('Services', 'Property Search & Site Visits|0', 'Rental Brokerage|0|Usually one month rent', 'Sale Brokerage|0|1% of deal value', 'Agreement & Registration Help|3500', 'Property Valuation|3000')],
  'Land Brokers': [G('Services', 'Plot Search & Site Visits|0', 'Land Survey Coordination|4000', 'Document Verification|5000', 'Sale Brokerage|0|2% of deal value', 'Registration Assistance|5000', 'Legal Opinion|6000')],
};
// Fallback when a sub-category has no specific list: by category slug keyword
const BY_CAT = {
  food: [G('Popular Items', 'Item 1|100', 'Item 2|150', 'Item 3|200')],
  stay: [G('Rooms (per night)', 'Standard Room|1500', 'Deluxe Room|2500')],
  health: [G('Services', 'Consultation|300', 'Follow-up|200')],
  education: [G('Courses', 'Course 1 (monthly)|2000', 'Demo Class|0')],
  home: [G('Services', 'Visiting / Inspection Charge|200', 'Basic Service|400')],
  automotive: [G('Services', 'Basic Service|500', 'Pickup & Drop|300')],
  shopping: [G('Products', 'Product 1|199', 'Product 2|399')],
  beauty: [G('Services', 'Basic Service|300', 'Premium Service|800')],
  professional: [G('Services', 'Consultation|500', 'Standard Package|3000')],
  events: [G('Packages', 'Basic Package|10000', 'Premium Package|25000')],
  real: [G('Services', 'Site Visit|0', 'Brokerage|0')],
};
const catKey = (slug = '') => (/food|restaurant/.test(slug) ? 'food' : /hotel|stay/.test(slug) ? 'stay' : /health|hospital/.test(slug) ? 'health' : /educat/.test(slug) ? 'education' : /home|construct/.test(slug) ? 'home' : /auto|transport/.test(slug) ? 'automotive' : /shop|retail/.test(slug) ? 'shopping' : /beauty|wellness/.test(slug) ? 'beauty' : /profession/.test(slug) ? 'professional' : /event|entertain/.test(slug) ? 'events' : /real/.test(slug) ? 'real' : null);
const FOOD_VEG = /veg|thali|paneer|dal |gobi|mix veg|dosa|roti|naan|rice|raita|spring roll|kebab|chai|coffee|shake|soda|lime|gulab|sandwich|garlic|fries|burger|brownie|cheesecake|waffle|scoop|sundae|curd|sweet|buttermilk|falooda|salan/i;
const NONVEG = /chicken|mutton|fish|egg|prawn|non-veg/i;
function build(groups, food) {
  return groups.map(([name, ...items]) => ({ name, items: items.map((s) => { const [n, p, d] = s.split('|'); const it = { name: n, price: Number(p) || 0, veg: food ? (NONVEG.test(n) ? false : FOOD_VEG.test(n) ? true : null) : null }; if (d) it.desc = d; return it; }) }));
}
// category slug + sub-category name -> menu (same shape as business.menu)
function template(categorySlug, sub) {
  const k = catKey(categorySlug); const food = k === 'food';
  const g = SUB[sub] || BY_CAT[k];
  return g ? build(g, food) : [];
}
module.exports = { template, catKey, SUB };
