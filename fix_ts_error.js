const fs = require('fs');

let code = fs.readFileSync('frontend/src/app/advertise/page.tsx', 'utf8');
code = code.replace(/const plans = \[/g, 'const plans: any[] = [');

fs.writeFileSync('frontend/src/app/advertise/page.tsx', code, 'utf8');
console.log('Fixed TypeScript error by adding type any[] to plans array');
