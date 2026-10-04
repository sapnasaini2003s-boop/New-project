const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const [search, replace] of replacements) {
    content = content.split(search).join(replace);
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
}

// Map of corrupted strings (copied exactly from what Node/UTF-8 reads them as) to Emojis
// Using the actual broken UTF-8 strings
const fixes = [
  ['âœ”', '✓'],
  ['â˜…', '★'],
  ['ðŸ“ ', '📍'],
  ['ðŸ“ž', '📞'],
  ['ðŸ’¬', '💬'],
  ['ðŸ›µ', '🛵'],
  ['ðŸ—ºï¸', '🗺️'],
  ['ðŸ’ ', '🤍'],
  ['ðŸ”—', '🔗'],
  ['â€¢', '•'],
  ['ðŸ‘‹', '👋'],
  ['â†’', '➔'],
  ['ðŸš©', '🚩'],
  ['ðŸ•’', '🕒'],
  ['âœ‰ï¸', '✉️'],
  ['âš ï¸', '⚠️'],
  ['âœ…', '✅'],
  ['ðŸš«', '🚫'],
  ['ðŸ—‘ï¸', '🗑️'],
  ['ðŸ“ˆ', '📈'],
  ['ðŸ“‰', '📉'],
  ['ðŸ’°', '💰'],
  ['ðŸ‘¥', '👥'],
  ['ðŸ ¢', '🏢'],
  ['ðŸ› ', '🛠️'],
  ['ðŸ”Ž', '🔍'],
  ['â„¹ï¸', 'ℹ️'],
  ['ðŸ’¡', '💡']
];

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('frontend/src', function(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  replaceInFile(filePath, fixes);
});

// Also manually fix the specific known artifacts that might be different
// Admin Page
let adminPage = 'frontend/src/app/admin/page.tsx';
if (fs.existsSync(adminPage)) {
  let content = fs.readFileSync(adminPage, 'utf8');
  // 'local file ??' -> 'local file ⚠️'
  content = content.replace(/'local file .*?' : '.*?'\}/g, "'local file ⚠️' : '✅'}");
  // ?{x.amount} -> ₹{x.amount}
  content = content.replace(/\?\{x\.amount\}/g, '₹{x.amount}');
  // 
  fs.writeFileSync(adminPage, content, 'utf8');
}

// Vendor Dashboard
let vendorPage = 'frontend/src/app/vendor/dashboard/page.tsx';
if (fs.existsSync(vendorPage)) {
  let content = fs.readFileSync(vendorPage, 'utf8');
  content = content.replace(/\?\{p\.amount\}/g, '₹{p.amount}');
  fs.writeFileSync(vendorPage, content, 'utf8');
}

console.log('Safe global fix completed!');
