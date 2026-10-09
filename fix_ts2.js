const fs = require('fs');

let code = fs.readFileSync('frontend/src/app/advertise/page.tsx', 'utf8');
code = code.replace(/x\.feats\.map\(\(f\)/g, 'x.feats.map((f: string)');
code = code.replace(/x\.no\.map\(\(f\)/g, 'x.no.map((f: string)');

fs.writeFileSync('frontend/src/app/advertise/page.tsx', code, 'utf8');
console.log('Fixed TypeScript any error on map parameters');
