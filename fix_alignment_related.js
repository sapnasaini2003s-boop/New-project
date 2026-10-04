const fs = require('fs');

// Update business/[id]/page.tsx
let bizPage = fs.readFileSync('frontend/src/app/business/[id]/page.tsx', 'utf8');
bizPage = bizPage.replace('className="min-w-[220px] md:min-w-0"', 'className="min-w-[220px] md:min-w-0 h-full"');
fs.writeFileSync('frontend/src/app/business/[id]/page.tsx', bizPage, 'utf8');

console.log('Fixed alignment on related businesses!');
