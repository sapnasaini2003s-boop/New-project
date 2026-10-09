const fs = require('fs');

let code = fs.readFileSync('frontend/src/app/advertise/page.tsx', 'utf8');

const t2 = `const plans = [
    { n: 'Free Listing', price: '₹0', per: 'forever', feats: ['Business page & search visibility', '1 profile image', 'Enquiry form leads', 'Verified badge after document check'], no: ['Call & WhatsApp buttons', 'Gallery & videos'], cta: 'Start free', tone: 'ghost' },
    { n: 'Premium', price: \`₹\${p?.premium?.toLocaleString('en-IN') ?? '-'}\`, per: '/ year', feats: ['Call & WhatsApp buttons unlocked', 'Photo gallery + header banner', 'YouTube / Facebook / Instagram videos', 'Featured homepage slider', 'WhatsApp alert on every lead', 'Banner ad booking'], no: [], cta: 'Go Premium', tone: 'accent', best: true },
    { n: 'Banner Ads', price: \`₹\${p?.bannerPerDay ?? '-'}\`, per: '/ day', feats: ['Top carousel or middle banner', 'Promotional widget', 'Hero video ad (2x price)', 'Book & pay from dashboard'], no: [], cta: 'Book a banner', tone: 'brand' },
  ];`;

const r2 = `const plans = [
    { n: 'Free Listing', price: '₹0', per: 'forever', feats: ['Business page & search visibility', '1 profile image', 'Enquiry form leads', 'Verified badge after document check'], no: ['Call & WhatsApp buttons', 'Gallery & videos'], cta: 'Start free', tone: 'ghost' },
    { n: 'Premium', price: \`₹\${p?.premium?.toLocaleString('en-IN') ?? '-'}\`, mrp: p?.premium ? \`₹\${(p.premium * 2).toLocaleString('en-IN')}\` : '', per: '/ year', feats: ['Call & WhatsApp buttons unlocked', 'Photo gallery + header banner', 'YouTube / Facebook / Instagram videos', 'Featured homepage slider', 'WhatsApp alert on every lead', 'Banner ad booking'], no: [], cta: 'Go Premium', tone: 'accent', best: true },
    { n: 'Banner Ads', price: \`₹\${p?.bannerPerDay ?? '-'}\`, per: '/ day', feats: ['Top carousel or middle banner', 'Promotional widget', 'Hero video ad (2x price)', 'Book & pay from dashboard'], no: [], cta: 'Book a banner', tone: 'brand' },
  ];`;

code = code.replace(t2, r2);

const t3 = `<span className="text-4xl font-black">{x.price}</span> <span className="text-gray-500 text-sm">{x.per}</span>`;
const r3 = `<span className="text-4xl font-black">{x.price}</span> <span className="text-gray-500 text-sm">{x.per}</span>{x.mrp && <s className="text-gray-400 ml-2 text-sm">{x.mrp}</s>}`;
code = code.replace(t3, r3);

fs.writeFileSync('frontend/src/app/advertise/page.tsx', code, 'utf8');
console.log('Added MRP and crossed price to Premium plan');
