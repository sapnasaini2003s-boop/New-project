const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Manual precise fixes based on the grep output
  // 1. 404 listing not found -> 🔍
  content = content.replace(/<div className="text-6xl">.*?<\/div><h1 className="text-xl font-bold mt-3">Listing not found<\/h1>/g, '<div className="text-6xl">🔍</div><h1 className="text-xl font-bold mt-3">Listing not found</h1>');
  
  // 2. Breadcrumbs dot
  content = content.replace(/<\/Link> .*? <Link href=\{\`\/category\//g, '</Link> • <Link href={`/category/');
  content = content.replace(/<\/Link> .*? \{b\.subCategory\}/g, '</Link> • {b.subCategory}');

  // 3. Fallback building image
  content = content.replace(/: 'dY\?'\}/g, ": '🏢'}");
  content = content.replace(/: 'ðŸ ¢'\}/g, ": '🏢'}");

  // 4. Rating stars
  content = content.replace(/\{Number\(b\.rating\)\.toFixed\(1\)\}~\.<\/span>/g, '{Number(b.rating).toFixed(1)}★</span>');
  content = content.replace(/\{Number\(b\.rating\)\.toFixed\(1\)\}â˜…<\/span>/g, '{Number(b.rating).toFixed(1)}★</span>');

  // 5. Address pin
  content = content.replace(/<span>dY"\? \{b\.address \? /g, '<span>📍 {b.address ? ');
  content = content.replace(/<span>ðŸ“ \{b\.address \? /g, '<span>📍 {b.address ? ');

  // 6. Timings clock
  content = content.replace(/<span>dY ' \{b\.timings\}<\/span>/g, '<span>🕒 {b.timings}</span>');
  content = content.replace(/<span>ðŸ•’ \{b\.timings\}<\/span>/g, '<span>🕒 {b.timings}</span>');

  // 7. Dot for open status
  content = content.replace(/\{o\.open \? '-\? ' : ''\}\{o\.label\}/g, '{o.open ? \'● \' : \'\'}{o.label}');

  // 8. Send Enquiry envelope
  content = content.replace(/>o%,\? Send Enquiry<\/a>/g, '>✉️ Send Enquiry</a>');

  // 9. Order Swiggy/Zomato arrow
  content = content.replace(/<span>Order \+'<\/span>/g, '<span>Order ➔</span>');

  // 10. Admin integrations/system
  content = content.replace(/'local file .*?' : '.*?'\}/g, "'local file ⚠️' : '✅'}");
  
  // 11. Rupees
  content = content.replace(/>\?\{x\.amount\}<\/td>/g, '>₹{x.amount}</td>');
  content = content.replace(/>\?\{p\.amount\}<\/td>/g, '>₹{p.amount}</td>');

  // 12. Login/Register info icons
  content = content.replace(/>\?\? Customers don&apos;t/g, '>ℹ️ Customers don&apos;t');
  content = content.replace(/<b>\?\? Keep ready<\/b>/g, '<b>ℹ️ Keep ready</b>');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
}

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('frontend/src', function(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  replaceInFile(filePath);
});
console.log('Targeted sweep completed!');
