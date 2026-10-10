const fs = require('fs');

function replaceEmail(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  
  code = code.replace(/support@yourdomain\.in/g, 'suhantudupi@gmail.com');
  code = code.replace(/legal@yourdomain\.in/g, 'suhantudupi@gmail.com');
  code = code.replace(/pvrshub@gmail\.com/g, 'suhantudupi@gmail.com');
  
  fs.writeFileSync(filePath, code, 'utf8');
}

[
  'frontend/src/app/contact/page.tsx',
  'frontend/src/app/legal/[slug]/page.tsx',
  'backend/src/migrations.js',
  'backend/src/seed.js',
  'backend/src/util.js',
  'backend/src/routes/admin.js'
].forEach(replaceEmail);

console.log('Replaced emails successfully.');
