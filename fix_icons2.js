const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/BizCard.tsx', 'utf8');

content = content.replace(/\{b\.verified && <span.*?Verified<\/span>\}/, '{b.verified && <span className="absolute top-2 right-2 bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-200 z-10 shadow-sm flex items-center gap-1">✓ Verified</span>}');
content = content.replace(/<span.*?\{Number\(b\.rating\)\.toFixed\(1\)\}.*?<\/span>/, '<span className="bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded text-xs shadow-sm">{Number(b.rating).toFixed(1)}★</span>');
content = content.replace(/<span className="text-gray-500 flex items-center gap-1">.*?\{b\.city\}<\/span>/, '<span className="text-gray-500 flex items-center gap-1">📍 {b.city}</span>');
content = content.replace(/<a href=\{\`tel:\$\{b\.contact\.phone\}\`\}.*?<\/a>/, '<a href={`tel:${b.contact.phone}`} onClick={() => track(b._id, \'call\')} className="flex-1 btn btn-ghost border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 !py-2 !text-[11px] uppercase tracking-wide">📞 Call</a>');
content = content.replace(/<a href=\{\`https:\/\/wa\.me\/91\$\{b\.contact\.whatsapp \|\| b\.contact\.phone\}\`\}.*?<\/a>/, '<a href={`https://wa.me/91${b.contact.whatsapp || b.contact.phone}`} target="_blank" onClick={() => track(b._id, \'whatsapp\')} className="flex-1 btn !py-2 !text-[11px] uppercase tracking-wide bg-green-500 text-white hover:bg-green-600">💬 WhatsApp</a>');

fs.writeFileSync('frontend/src/components/BizCard.tsx', content, 'utf8');
console.log('Fixed BizCard icons!');
