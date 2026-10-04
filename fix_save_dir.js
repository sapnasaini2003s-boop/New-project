const fs = require('fs');

let content = fs.readFileSync('frontend/src/app/business/[id]/page.tsx', 'utf8');

// 1. Fix Save / Saved button
content = content.replace(/\{saved \? '.*?' : '.*?'\}/g, "{saved ? '❤️ Saved' : '🤍 Save'}");

// 2. Fix Directions button
content = content.replace(/className="btn btn-ghost flex-1 md:flex-none">.*?Directions<\/a>/g, 'className="btn btn-ghost flex-1 md:flex-none">📍 Directions</a>');

fs.writeFileSync('frontend/src/app/business/[id]/page.tsx', content, 'utf8');
console.log('Fixed Save and Directions buttons!');
