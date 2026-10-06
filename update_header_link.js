const fs = require('fs');

let header = fs.readFileSync('frontend/src/components/Header.tsx', 'utf8');

header = header.replace('<Link href="/contact" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenu(false)}>⚠️ My Complaints</Link>', '<Link href="/contact?tab=mine" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenu(false)}>⚠️ My Complaints</Link>');

fs.writeFileSync('frontend/src/components/Header.tsx', header, 'utf8');
console.log('Fixed link in Header');
