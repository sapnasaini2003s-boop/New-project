const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

// Replace ads.promo?.[1]?.image
content = content.replace(
  /url\(\$\{ads\.promo\?\.\[1\]\?\.image\}\)/g,
  'url(${img(ads.promo?.[1]?.image)})'
);

// Replace a.image inside the slice(2, 4) loop
content = content.replace(
  /url\(\$\{a\.image\}\)/g,
  'url(${img(a.image)})'
);

// Optional: fix locationBanner just in case they change it to an uploaded image
content = content.replace(
  /url\(\$\{s\.locationBanner\?\.image\}\)/g,
  'url(${img(s.locationBanner?.image)})'
);

fs.writeFileSync('frontend/src/app/page.tsx', content, 'utf8');
console.log('Fixed missing img() wrappers in page.tsx');
