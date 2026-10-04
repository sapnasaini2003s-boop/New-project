const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/BizRow.tsx', 'utf8');

content = content.replace(/\{b\.rating > 0 && <span.*?ratings<\/span><\/span>\}/, '{b.rating > 0 && <span className="flex items-center gap-1"><span className="bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded text-xs">{Number(b.rating).toFixed(1)}★</span><span className="text-gray-500">{b.reviews} ratings</span></span>}');

fs.writeFileSync('frontend/src/components/BizRow.tsx', content, 'utf8');
console.log('Fixed rating tags in BizRow');
