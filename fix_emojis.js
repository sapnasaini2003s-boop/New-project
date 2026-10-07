const fs = require('fs');

function fix(file) {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace '??' with '🏢'
  code = code.replace(/'\?\?'/g, "'🏢'");
  // Replace '? Verified' with '✓ Verified'
  code = code.replace(/\? Verified/g, "✓ Verified");
  // Replace '?? Trust Seal' with '🏆 Trust Seal'
  code = code.replace(/\?\? Trust Seal/g, "🏆 Trust Seal");
  
  // In Chrome.tsx TopBar
  code = code.replace(/\?\? We're doing scheduled maintenance/g, "🛠️ We're doing scheduled maintenance");
  
  // In Listing.tsx LeadStrip
  code = code.replace(/>\?</g, ">👉<");

  fs.writeFileSync(file, code, 'utf8');
}

fix('frontend/src/components/BizRow.tsx');
fix('frontend/src/components/BizCard.tsx');
fix('frontend/src/components/Listing.tsx');
fix('frontend/src/components/Chrome.tsx');
fix('frontend/src/components/MenuView.tsx');

console.log('Fixed broken emojis in multiple components');
