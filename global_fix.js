const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('frontend/src', function(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. 404 location pin
  content = content.replace(/<div className="text-6xl">.*?<\/div><h1 className="text-xl font-bold mt-3">Listing not found<\/h1>/g, '<div className="text-6xl">🔍</div><h1 className="text-xl font-bold mt-3">Listing not found</h1>');
  
  // 2. Breadcrumbs dot
  content = content.replace(/<\/Link> .*? <Link href=\{\`\/category\//g, '</Link> • <Link href={`/category/');
  content = content.replace(/<\/Link> .*? \{b\.subCategory\}/g, '</Link> • {b.subCategory}');

  // 3. Fallback image building (BizRow, BizCard, Page)
  content = content.replace(/: '.*?'\}/g, match => {
    if (match.includes('dY') || match.includes('ðŸ') || match.includes('')) {
      return ": '🏢'}";
    }
    return match;
  });

  // 4. Rating star in hero section
  content = content.replace(/\{Number\(b\.rating\)\.toFixed\(1\)\}.*?<\/span>/g, '{Number(b.rating).toFixed(1)}★</span>');

  // 5. Hero address pin
  content = content.replace(/<span>.*? \{b\.address \? /g, '<span>📍 {b.address ? ');

  // 6. Hero business hours (dot and clock)
  content = content.replace(/\{o\.open \? '.*?' : ''\}\{o\.label\}/g, '{o.open ? \'● \' : \'\'}{o.label}');
  content = content.replace(/<span>.*? \{b\.timings\}<\/span>/g, '<span>🕒 {b.timings}</span>');

  // 7. Send Enquiry envelope
  content = content.replace(/className="btn btn-brand flex-1 md:flex-none">.*? Send Enquiry<\/a>/g, 'className="btn btn-brand flex-1 md:flex-none">✉️ Send Enquiry</a>');

  // 8. Order Swiggy/Zomato arrow
  content = content.replace(/<span>Order .*?<\/span><\/a>/g, '<span>Order ➔</span></a>');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
  }
});
console.log('Global sweep completed!');
