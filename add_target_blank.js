const fs = require('fs');

function updateBlogsPage() {
  let code = fs.readFileSync('frontend/src/app/blogs/page.tsx', 'utf8');
  
  code = code.replace(/href=\{first\.externalLink \|\| `\/blogs\/\$\{first\._id\}`\}/g, "href={first.externalLink || `/blogs/${first._id}`} target={first.externalLink ? '_blank' : undefined}");
  
  code = code.replace(/href=\{b\.externalLink \|\| `\/blogs\/\$\{b\._id\}`\}/g, "href={b.externalLink || `/blogs/${b._id}`} target={b.externalLink ? '_blank' : undefined}");
  
  fs.writeFileSync('frontend/src/app/blogs/page.tsx', code, 'utf8');
  console.log('Added target=_blank to external links in blogs page');
}

updateBlogsPage();
