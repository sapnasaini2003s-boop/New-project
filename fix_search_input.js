const fs = require('fs');

let content = fs.readFileSync('frontend/src/components/MenuView.tsx', 'utf8');

// Replace the complicated search input with a simpler one
content = content.replace(
  /<div className="relative">\s*<span className="absolute left-3 top-1\/2 -translate-y-1\/2 text-gray-400">.*?<\/span>\s*<input \s*className="input pl-9 w-full bg-white border-gray-200 focus:border-brand shadow-sm" \s*placeholder="Search dishes\.\.\." \s*value=\{q\} \s*onChange=\{\(e\) => setQ\(e\.target\.value\)\} \s*\/>\s*<\/div>/g,
  `<input className="input w-full bg-white border-gray-200 focus:border-brand shadow-sm" placeholder="🔍 Search dishes..." value={q} onChange={(e) => setQ(e.target.value)} />`
);

fs.writeFileSync('frontend/src/components/MenuView.tsx', content, 'utf8');
console.log('Fixed search input overlap');
