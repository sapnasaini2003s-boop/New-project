const fs = require('fs');
let v = fs.readFileSync('frontend/src/app/vendor/dashboard/page.tsx', 'utf8');
v = v.replace(/ðŸ’°/g, '₹');
fs.writeFileSync('frontend/src/app/vendor/dashboard/page.tsx', v, 'utf8');

let a = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf8');
a = a.replace(/ðŸ’°/g, '₹');
fs.writeFileSync('frontend/src/app/admin/page.tsx', a, 'utf8');

let l = fs.readFileSync('frontend/src/app/login/page.tsx', 'utf8');
l = l.replace(/â„¹ï¸ /g, 'ℹ️ ');
fs.writeFileSync('frontend/src/app/login/page.tsx', l, 'utf8');

let r = fs.readFileSync('frontend/src/app/register-business/page.tsx', 'utf8');
r = r.replace(/â„¹ï¸ /g, 'ℹ️ ');
fs.writeFileSync('frontend/src/app/register-business/page.tsx', r, 'utf8');

console.log('Fixed edge cases perfectly!');
