const fs = require('fs');

// 1. Update BizCard.tsx
let bizCard = fs.readFileSync('frontend/src/components/BizCard.tsx', 'utf8');
bizCard = bizCard.replace('className="card overflow-hidden hover:shadow-lg transition flex flex-col border border-gray-200"', 'className="card overflow-hidden hover:shadow-lg transition flex flex-col border border-gray-200 h-full"');
fs.writeFileSync('frontend/src/components/BizCard.tsx', bizCard, 'utf8');

// 2. Update page.tsx (home page)
let homePage = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');
homePage = homePage.replace('className="min-w-[220px] md:min-w-0"', 'className="min-w-[220px] md:min-w-0 h-full"');
fs.writeFileSync('frontend/src/app/page.tsx', homePage, 'utf8');

console.log('Fixed alignment!');
