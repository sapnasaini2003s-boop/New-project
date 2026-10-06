const fs = require('fs');

let header = fs.readFileSync('frontend/src/components/Header.tsx', 'utf8');

const oldMenu = `<Link href="/favorites" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenu(false)}>?? Saved Businesses</Link>
                  <button onClick={() => { logout(); setMenu(false); router.push('/'); }} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600">Logout</button>`;

const newMenu = `<Link href="/favorites" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenu(false)}>?? Saved Businesses</Link>
                  <Link href="/contact" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenu(false)}>⚠️ My Complaints</Link>
                  <button onClick={() => { logout(); setMenu(false); router.push('/'); }} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600">Logout</button>`;

header = header.replace(oldMenu, newMenu);

fs.writeFileSync('frontend/src/components/Header.tsx', header, 'utf8');
console.log('Added My Complaints to Header');
