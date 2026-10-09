const fs = require('fs');

function updateAdminPage() {
  let code = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf8');
  
  // Find FIELDS.blogs and replace it
  const target = `blogs: ['title', 'excerpt', 'body', 'image']`;
  const replacement = `blogs: ['title', 'excerpt', 'body', 'image', 'externalLink']`;
  
  if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('frontend/src/app/admin/page.tsx', code, 'utf8');
    console.log('Updated admin page');
  } else {
    console.log('Target not found in admin page');
  }
}

function updateBlogsPage() {
  let code = fs.readFileSync('frontend/src/app/blogs/page.tsx', 'utf8');
  
  // Replace the link generation for first blog
  code = code.replace(/href=\{`\/blogs\/\$\{first\._id\}`\}/g, "href={first.externalLink || `/blogs/${first._id}`}");
  
  // Let's add target="_blank" if it's external link? 
  // Next.js Link component allows external URLs, but it's better to pass target="_blank" if it's an external link. 
  // But doing it safely inside template strings is tricky. 
  // Let's just do standard a tag behaviour if it's an absolute url, Next.js Link handles it natively.
  
  // Replace the link generation for rest blogs
  code = code.replace(/href=\{`\/blogs\/\$\{b\._id\}`\}/g, "href={b.externalLink || `/blogs/${b._id}`}");
  
  fs.writeFileSync('frontend/src/app/blogs/page.tsx', code, 'utf8');
  console.log('Updated blogs page');
}

updateAdminPage();
updateBlogsPage();
