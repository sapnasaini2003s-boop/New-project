const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/BizRow.tsx', 'utf8');

content = content.replace(/\{b\.verified && <span.*?Verified<\/span>\}/, '{b.verified && <span className="shrink-0 mt-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">✓ Verified</span>}');

content = content.replace(/<span.*?\{Number\(b\.rating\)\.toFixed\(1\)\}.*?<\/span>/, '<span className="bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded text-xs">{Number(b.rating).toFixed(1)}★</span>');

content = content.replace(/<span className="text-gray-500 flex items-center gap-1">.*?\{b\.city\}<\/span>/, '<span className="text-gray-500 flex items-center gap-1">📍 {b.city}</span>');

content = content.replace(/<a href=\{\`tel:\$\{b\.contact\.phone\}\`\}.*?<\/a>/, '<a href={`tel:${b.contact.phone}`} onClick={() => track(b._id, \'call\')} className="btn btn-brand !py-1.5 !px-3 !text-xs md:!text-sm">📞 {b.contact.phone.slice(0, 4)}XXXXXX</a>');

content = content.replace(/<a href=\{\`https:\/\/wa\.me\/91\$\{b\.contact\.whatsapp \|\| b\.contact\.phone\}\`\}.*?<\/a>/, '<a href={`https://wa.me/91${b.contact.whatsapp || b.contact.phone}`} target="_blank" onClick={() => track(b._id, \'whatsapp\')} className="btn bg-green-500 hover:bg-green-600 text-white !py-1.5 !px-3 !text-xs md:!text-sm">💬 WhatsApp</a>');

content = content.replace(/<Link href=\{\`\/business\/\$\{b\._id\}#enquiry\`\}.*?<\/Link>/, '<Link href={`/business/${b._id}#enquiry`} className="btn btn-accent !py-1.5 !px-3 !text-xs md:!text-sm">✉️ Send Enquiry</Link>');

content = content.replace(/\{b\.unclaimed && <Link href=\{\`\/business\/\$\{b\._id\}#claim\`\}.*?<\/Link>\}/, '{b.unclaimed && <Link href={`/business/${b._id}#claim`} className="flash text-[11px] font-bold text-accent mt-1">👋 Is this your business? Claim it now!</Link>}');

fs.writeFileSync('frontend/src/components/BizRow.tsx', content, 'utf8');
console.log('Fixed BizRow icons!');
