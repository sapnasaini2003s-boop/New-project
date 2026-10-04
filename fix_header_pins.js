const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/Header.tsx', 'utf8');

// The location pins
content = content.replace(/className="text-brand px-1">.*?</g, 'className="text-brand px-1">📍<');
content = content.replace(/className="text-brand text-sm">.*?</g, 'className="text-brand text-sm mr-1">📍<'); // added mr-1 for spacing

fs.writeFileSync('frontend/src/components/Header.tsx', content, 'utf8');
console.log('Fixed location pins!');
