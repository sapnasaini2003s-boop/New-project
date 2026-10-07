const fs = require('fs');

let content = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf8');

const oldAside = `<aside className={\`\${nav ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-[260px] bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-slate-300 flex flex-col transition-transform duration-200\`}>`;
const newAside = `<aside className={\`\${nav ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:sticky top-0 h-screen inset-y-0 left-0 z-40 w-[260px] shrink-0 bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-slate-300 flex flex-col transition-transform duration-200\`}>`;

content = content.replace(oldAside, newAside);

fs.writeFileSync('frontend/src/app/admin/page.tsx', content, 'utf8');
console.log('Fixed admin sidebar scrolling issue');
