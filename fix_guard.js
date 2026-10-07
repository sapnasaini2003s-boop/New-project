const fs = require('fs');

let content = fs.readFileSync('backend/src/guard.js', 'utf8');

const oldMap = `return { name: clean(it.name, 80), price, veg: it.veg === true || it.veg === 'true' ? true : it.veg === false || it.veg === 'false' ? false : null };`;
const newMap = `return { name: clean(it.name, 80), price, veg: it.veg === true || it.veg === 'true' ? true : it.veg === false || it.veg === 'false' ? false : null, desc: clean(it.desc, 300), image: isUrl(it.image) ? it.image : null };`;

content = content.replace(oldMap, newMap);

fs.writeFileSync('backend/src/guard.js', content, 'utf8');
console.log('Fixed guard.js to allow desc and image in menu items');
