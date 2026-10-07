const fs = require('fs');

function fix(file) {
  let code = fs.readFileSync(file, 'utf8');
  
  // BizCard & BizRow specifics
  code = code.replace(/>\?\?</g, ">🏢<");
  code = code.replace(/>\?\? /g, ">🏢 ");
  code = code.replace(/'\?\?'/g, "'🏢'");
  code = code.replace(/\? Verified/g, "✓ Verified");
  code = code.replace(/\?\? Trust Seal/g, "🏆 Trust Seal");
  
  code = code.replace(/\}\?</g, "}★<");
  code = code.replace(/\?<\/span>/g, "★</span>");
  
  code = code.replace(/>\?\? \{b\.distanceKm\}/g, ">📍 {b.distanceKm}");
  code = code.replace(/>\?\? XXXXXXXXXX/g, ">🔒 XXXXXXXXXX");
  code = code.replace(/>\?\?</g, ">🔒<");
  code = code.replace(/>\?\? Claim it now!</g, ">⚡ Claim it now!<");
  code = code.replace(/>\? Is this your business\?/g, ">⚡ Is this your business?");
  code = code.replace(/>\? Top rated/g, ">⭐ Top rated");
  code = code.replace(/> Delivery/g, ">🛵 Delivery");
  code = code.replace(/>\?\? Menu available/g, ">📜 Menu available");
  
  code = code.replace(/>\?\? Call/g, ">📞 Call");
  code = code.replace(/>\?\? \{b\.contact\.phone\}/g, ">📞 {b.contact.phone}");
  code = code.replace(/>\?\? WhatsApp/g, ">💬 WhatsApp");
  code = code.replace(/>\?\? Send Enquiry/g, ">✉️ Send Enquiry");
  code = code.replace(/>\?\? \{b\.city\}/g, ">📍 {b.city}");
  
  // Bullets
  code = code.replace(/> /g, ">• ");
  code = code.replace(/\}   \{/g, "} • {");

  fs.writeFileSync(file, code, 'utf8');
}

fix('frontend/src/components/BizCard.tsx');
fix('frontend/src/components/BizRow.tsx');

// Fix text sizing in page.tsx category section
let page = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');
page = page.replace(/text-\[10\.5px\] md:text-xs/g, "text-xs md:text-sm");
fs.writeFileSync('frontend/src/app/page.tsx', page, 'utf8');

// Fix text sizing in Header.tsx
let header = fs.readFileSync('frontend/src/components/Header.tsx', 'utf8');
header = header.replace(/text-\[9px\]/g, "text-[10px]");
fs.writeFileSync('frontend/src/components/Header.tsx', header, 'utf8');

console.log('Fixed fonts and emojis');
