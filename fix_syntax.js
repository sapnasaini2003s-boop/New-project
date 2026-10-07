const fs = require('fs');

function fix(file) {
  let code = fs.readFileSync(file, 'utf8');
  // Remove the bullet from arrow functions and greater-than operators
  code = code.replace(/=>• /g, '=> ');
  code = code.replace(/>• /g, '> ');
  code = code.replace(/• null/g, ' null');
  
  // Re-add bullet safely
  code = code.replace(/\} • \{/g, '} • {');

  fs.writeFileSync(file, code, 'utf8');
}

fix('frontend/src/components/BizCard.tsx');
fix('frontend/src/components/BizRow.tsx');
console.log('Fixed syntax error');
