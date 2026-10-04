const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/BizRow.tsx', 'utf8');

// Fix Location Pin
content = content.replace(/<span className="text-gray-500">.*?\{b\.city\}<\/span>/, '<span className="text-gray-500 flex items-center gap-1">📍 {b.city}</span>');

// Fix Dot symbol for open/closed status
content = content.replace(/\}>.*?\{o\.label\}<\/span>;/g, '}>● {o.label}</span>;');

fs.writeFileSync('frontend/src/components/BizRow.tsx', content, 'utf8');
console.log('Fixed BizRow remaining icons!');
