const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/Header.tsx', 'utf8');

// The desktop select
content = content.replace(
  /<select value=\{city\} onChange=\{\(e\) => changeCity\(e\.target\.value\)\} className="bg-transparent outline-none text-sm font-medium py-2">\s*\{CITIES\.map\(\(c\) => <option key=\{c\}>\{c\}<\/option>\)\}\s*<\/select>/,
  '<input list="cities-list" value={city} onChange={(e) => changeCity(e.target.value)} className="bg-transparent outline-none text-sm font-medium py-2 w-28 placeholder-gray-500" placeholder="City" />'
);

// The mobile select
content = content.replace(
  /<select value=\{city\} onChange=\{\(e\) => changeCity\(e\.target\.value\)\} className="bg-transparent outline-none text-sm w-full py-2">\s*\{CITIES\.map\(\(c\) => <option key=\{c\}>\{c\}<\/option>\)\}\s*<\/select>/,
  '<input list="cities-list" value={city} onChange={(e) => changeCity(e.target.value)} className="bg-transparent outline-none text-sm w-full py-2 placeholder-gray-500" placeholder="City" />\n          <datalist id="cities-list">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>'
);

fs.writeFileSync('frontend/src/components/Header.tsx', content, 'utf8');
console.log('Fixed Header cities to use datalist combobox!');
