const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/business/[id]/page.tsx', 'utf8');

// Header badges
content = content.replace(/\{b\.verified && <span.*?Verified<\/span>\}/, '{b.verified && <span className="bg-emerald-500 text-xs font-bold px-2.5 py-1 rounded-full">✓ Verified</span>}');
content = content.replace(/\{b\.plan === 'premium' && <span.*?Premium<\/span>\}/, '{b.plan === \'premium\' && <span className="bg-accent text-xs font-bold px-2.5 py-1 rounded-full">★ Premium</span>}');

// Location / Rating 
content = content.replace(/<div className="flex flex-wrap items-center gap-3 mt-3 opacity-90 text-sm">[\s\S]*?<\/div>/m, 
`<div className="flex flex-wrap items-center gap-3 mt-3 opacity-90 text-sm">
  {b.rating > 0 && <span className="bg-emerald-500 font-bold px-1.5 py-0.5 rounded text-xs">{Number(b.rating).toFixed(1)}★</span>}
  {b.reviews > 0 && <span>{b.reviews} ratings</span>}
  <span className="flex items-center gap-1">📍 {b.address}, {b.city}</span>
</div>`);

// Save / Share buttons
content = content.replace(/<button onClick=\{toggleFav\}.*?<\/button>/, `<button onClick={toggleFav} className="btn bg-white/10 hover:bg-white/20 border-white/20 ml-auto">{fav ? '❤️ Saved' : '🤍 Save'}</button>`);
content = content.replace(/<button onClick=\{share\}.*?<\/button>/, `<button onClick={share} className="btn bg-white/10 hover:bg-white/20 border-white/20">🔗 Share</button>`);

// Action buttons (Call, WhatsApp, Order, Directions, Lock)
content = content.replace(/<a href=\{\`tel:\$\{b\.contact\.phone\}\`\}.*?<\/a>/, `<a href={\`tel:\${b.contact.phone}\`} onClick={() => track(b._id, 'call')} className="btn btn-brand flex-1 md:flex-none">📞 Call Now</a>`);
content = content.replace(/<a href=\{\`https:\/\/wa\.me\/91\$\{b\.contact\.whatsapp \|\| b\.contact\.phone\}\`\}.*?<\/a>/, `<a href={\`https://wa.me/91\${b.contact.whatsapp || b.contact.phone}\`} target="_blank" onClick={() => track(b._id, 'whatsapp')} className="btn bg-green-500 hover:bg-green-600 text-white flex-1 md:flex-none">💬 WhatsApp</a>`);
content = content.replace(/<button onClick=\{.*?Order Online<\/button>/, `<button onClick={() => { setSheet(true); track(b._id, 'order'); }} className="btn btn-accent flex-1 md:flex-none">🛵 Order Online</button>`);
content = content.replace(/<a href=\{b\.mapUrl\}.*?Directions<\/a>/, `<a href={b.mapUrl} target="_blank" className="btn btn-ghost flex-1 md:flex-none">🗺️ Directions</a>`);
content = content.replace(/\{b\.contactLocked && <span.*?<\/span>\}/, `{b.contactLocked && <span className="text-xs text-gray-500 w-full md:w-auto md:ml-auto">🔒 Direct contact shown on Premium listings — send an enquiry instead.</span>}`);
content = content.replace(/\{b\.unclaimed && <a href="#claim".*?<\/a>\}/, `{b.unclaimed && <a href="#claim" className="flash block mt-3 text-center rounded-xl bg-orange-50 border border-orange-200 py-2 text-sm font-bold text-accent">👋 Is this your business? Claim it now!</a>}`);

// Reviews
content = content.replace(/<h2 className="text-xl md:text-2xl font-bold flex items-center gap-4">Ratings &amp; Reviews <span className="text-3xl">\{Number\(b\.rating\)\.toFixed\(1\)\} <span className="text-yellow-400 text-2xl">.*?<\/span><\/span><\/h2>/, `<h2 className="text-xl md:text-2xl font-bold flex items-center gap-4">Ratings &amp; Reviews <span className="text-3xl">{Number(b.rating).toFixed(1)} <span className="text-yellow-400 text-2xl">{'★'.repeat(Math.round(b.rating))}{'☆'.repeat(5 - Math.round(b.rating))}</span></span></h2>`);
content = content.replace(/<div className="text-yellow-400 text-lg">.*?<\/div>/g, `<div className="text-yellow-400 text-lg">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>`);

fs.writeFileSync('frontend/src/app/business/[id]/page.tsx', content, 'utf8');
console.log('Fixed Business Details page icons!');
