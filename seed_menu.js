const fetch = require('node-fetch');

const API = 'https://pvrs-backend.onrender.com/api';

async function seed() {
  console.log('Logging in...');
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9999999999', otp: '123456', mode: 'dev' })
  });
  const data = await res.json();
  if (!data.token) {
    console.error('Login failed', data);
    return;
  }
  const token = data.token;
  console.log('Logged in successfully!');

  // Fetch the business biz_8a8ed536ff0c
  console.log('Fetching business...');
  const bRes = await fetch(`${API}/admin/businesses/biz_8a8ed536ff0c`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  let biz = await bRes.json();
  if (!biz._id) {
    console.error('Failed to get business', biz);
    return;
  }
  
  // The user wants dummy data "with image food etc"
  // Wait, the MenuCat doesn't have an image field. I didn't add it in the backend or frontend yet!
  // I only fixed the UI for the name/price. Let's see if I should add image and description to MenuEditor and MenuView?
  // Let me just populate it with really good names first!
  // Wait, I should add description and image URL fields to the frontend and backend.
  // Actually, wait, let me just add it to the JSON and then update the frontend to display it!
  // The backend doesn't validate the structure deeply (it's JSON/MongoDB).
  
  biz.menu = [
    {
      name: 'Starters',
      items: [
        { name: 'Paneer Tikka', price: 240, veg: true, desc: 'Soft paneer cubes marinated in spices and grilled in a tandoor.', image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=300&fit=crop' },
        { name: 'Gobi Manchurian', price: 180, veg: true, desc: 'Crispy cauliflower florets tossed in a spicy, sweet, and tangy Indo-Chinese sauce.', image: 'https://images.unsplash.com/photo-1662993888062-0f04e1374bf9?w=300&h=300&fit=crop' },
        { name: 'Chicken 65', price: 260, veg: false, desc: 'Deep-fried spicy chicken bites originated in Hotel Buhari, Chennai.', image: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=300&h=300&fit=crop' }
      ]
    },
    {
      name: 'Main Course',
      items: [
        { name: 'Butter Chicken', price: 320, veg: false, desc: 'Tender chicken cooked in a rich, creamy tomato gravy.', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b6ae398?w=300&h=300&fit=crop' },
        { name: 'Palak Paneer', price: 280, veg: true, desc: 'Fresh spinach puree cooked with paneer cubes and mild Indian spices.', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&h=300&fit=crop' },
        { name: 'Veg Biryani', price: 220, veg: true, desc: 'Aromatic basmati rice cooked with mixed vegetables and whole spices.', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&h=300&fit=crop' }
      ]
    },
    {
      name: 'Breads',
      items: [
        { name: 'Garlic Naan', price: 50, veg: true, desc: 'Soft and fluffy naan topped with minced garlic and butter.', image: null },
        { name: 'Tandoori Roti', price: 30, veg: true, desc: 'Whole wheat flatbread baked in a traditional clay oven.', image: null }
      ]
    },
    {
      name: 'Desserts',
      items: [
        { name: 'Gulab Jamun (2 pcs)', price: 80, veg: true, desc: 'Deep fried dumplings soaked in a sweet, sticky sugar syrup.', image: 'https://images.unsplash.com/photo-1579705745173-4f3df93ddc07?w=300&h=300&fit=crop' }
      ]
    }
  ];

  console.log('Updating business...');
  const upRes = await fetch(`${API}/admin/businesses/biz_8a8ed536ff0c`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(biz)
  });
  
  const result = await upRes.json();
  console.log('Done!', result);
}

seed();
