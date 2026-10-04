const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/BizCard.tsx', 'utf8');

// Fix fallback image emoji
content = content.replace(/opacity-50.*?<\/div>/, 'opacity-50">🏢</div>');

// Fix dot between city and subcategory
content = content.replace(/\{b\.city\}.*?\{b\.subCategory\}/, '{b.city} • {b.subCategory}');

// Fix unclaimed business hand emoji (👋)
content = content.replace(/text-accent">.*?Claim it now!<\/Link>/, 'text-accent">👋 Claim it now!</Link>');

fs.writeFileSync('frontend/src/components/BizCard.tsx', content, 'utf8');
console.log('Fixed BizCard remaining icons!');
