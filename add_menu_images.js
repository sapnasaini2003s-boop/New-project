const fs = require('fs');

let content = fs.readFileSync('frontend/src/components/MenuView.tsx', 'utf8');

// Update MenuCat definition (conceptually we just use optional fields inline)
// Look for where we render items:
const oldRender = `<div className="flex-1 min-w-0">\n                      <p className="font-semibold text-gray-800 text-[15px] leading-snug">{it.name}</p>\n                      <p className="font-bold text-gray-700 text-sm mt-1">₹{it.price}</p>\n                    </div>`;

const newRender = `<div className="flex-1 min-w-0">\n                      <p className="font-semibold text-gray-800 text-[15px] leading-snug">{it.name}</p>\n                      <p className="font-bold text-gray-700 text-sm mt-1">₹{it.price}</p>\n                      {it.desc && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{it.desc}</p>}\n                    </div>\n                    {it.image && <div className="shrink-0 w-24 h-24 rounded-xl overflow-hidden shadow-sm relative"><img src={it.image} alt={it.name} className="w-full h-full object-cover" /></div>}`;

content = content.replace(oldRender, newRender);

fs.writeFileSync('frontend/src/components/MenuView.tsx', content, 'utf8');
