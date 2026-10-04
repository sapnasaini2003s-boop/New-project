const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/business/[id]/page.tsx', 'utf8');

// Replace Stars
content = content.replace(/\{i <= Math\.round\(n\) \? '.*?' : '.*?'\}/g, '{i <= Math.round(n) ? \'★\' : \'☆\'}');

// Replace literal mojibakes
content = content.replace(/~./g, '★');
content = content.replace(/ðŸ“ /g, '📍 ');
content = content.replace(/ðŸ“ž/g, '📞');
content = content.replace(/ðŸ’¬/g, '💬');
content = content.replace(/ðŸ›µ/g, '🛵');
content = content.replace(/ðŸ—ºï¸/g, '🗺️');
content = content.replace(/ðŸ’ /g, '🤍');
content = content.replace(/ðŸ”—/g, '🔗');
content = content.replace(/âœ”/g, '✓');

fs.writeFileSync('frontend/src/app/business/[id]/page.tsx', content, 'utf8');
console.log('Replaced exact mojibake string literals');
