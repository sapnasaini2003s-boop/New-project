const fs = require('fs');

let content = fs.readFileSync('frontend/src/app/business/[id]/page.tsx', 'utf8');

// Replace &check; with the actual unicode character ✓
content = content.replace(/&check;/g, '✓');

fs.writeFileSync('frontend/src/app/business/[id]/page.tsx', content, 'utf8');
console.log('Fixed the verified badge checkmark!');
