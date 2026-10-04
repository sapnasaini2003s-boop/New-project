const fs = require('fs');

// 1. admin/page.tsx
let adminPage = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf8');
adminPage = adminPage.replace(/'local file \?\?' : '\?\?'\}  up/g, "'local file ⚠️' : '✅'} • up");
adminPage = adminPage.replace(/>\?\{x\.amount\}<\/td>/g, '>₹{x.amount}</td>');
fs.writeFileSync('frontend/src/app/admin/page.tsx', adminPage, 'utf8');

// 2. login/page.tsx
let loginPage = fs.readFileSync('frontend/src/app/login/page.tsx', 'utf8');
loginPage = loginPage.replace(/>\?\? Customers don&apos;t/g, '>ℹ️ Customers don&apos;t');
fs.writeFileSync('frontend/src/app/login/page.tsx', loginPage, 'utf8');

// 3. register-business/page.tsx
let regPage = fs.readFileSync('frontend/src/app/register-business/page.tsx', 'utf8');
regPage = regPage.replace(/<b>\?\? Keep ready<\/b>/g, '<b>ℹ️ Keep ready</b>');
fs.writeFileSync('frontend/src/app/register-business/page.tsx', regPage, 'utf8');

// 4. vendor/dashboard/page.tsx
let vendorPage = fs.readFileSync('frontend/src/app/vendor/dashboard/page.tsx', 'utf8');
vendorPage = vendorPage.replace(/>\?\{p\.amount\}<\/td>/g, '>₹{p.amount}</td>');
fs.writeFileSync('frontend/src/app/vendor/dashboard/page.tsx', vendorPage, 'utf8');

console.log('Fixed edge cases!');
