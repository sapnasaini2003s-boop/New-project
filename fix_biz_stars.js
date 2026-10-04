const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/business/[id]/page.tsx', 'utf8');

// Fix Stars Component
content = content.replace(/\{i <= Math\.round\(n\) \? '.*?' : '.*?'\}/g, '{i <= Math.round(n) ? \'★\' : \'☆\'}');

// Fix Saved / Save buttons (one of them was using "toggleLocalFav" instead of just "fav")
content = content.replace(/\{saved \? '.*?' : '.*?'\}/g, '{saved ? \'❤️ Saved\' : \'🤍 Save\'}');

// Fix any other stray 'text-yellow-400' stars that might be there
content = content.replace(/'\uFFFD\~\.'/g, "'★'");

fs.writeFileSync('frontend/src/app/business/[id]/page.tsx', content, 'utf8');
console.log('Fixed Stars and remaining icons');
