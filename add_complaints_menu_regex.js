const fs = require('fs');

let header = fs.readFileSync('frontend/src/components/Header.tsx', 'utf8');

// Replace the Saved Businesses line and add My Complaints right after it
header = header.replace(
  /<Link href="\/favorites".*?>.*?Saved Businesses<\/Link>/,
  '<Link href="/favorites" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenu(false)}>❤️ Saved Businesses</Link>\n                    <Link href="/contact?tab=mine" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenu(false)}>⚠️ My Complaints</Link>'
);

fs.writeFileSync('frontend/src/components/Header.tsx', header, 'utf8');
console.log('Successfully added My Complaints to Header!');
