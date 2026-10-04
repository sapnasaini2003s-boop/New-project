const fs = require('fs');
let content = fs.readFileSync('frontend/src/components/BizCard.tsx', 'utf8');

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('text-4xl opacity-50')) {
    lines[i] = '        {(b.profileImage || b.image) ? <img src={img(b.profileImage || b.image)} alt={b.name} className="w-full h-full object-cover text-[0px]" onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <div className="h-full flex items-center justify-center text-4xl opacity-50">🏢</div>}';
  }
  if (lines[i].includes('{b.city}') && lines[i].includes('{b.subCategory}')) {
    lines[i] = '        <p className="text-[11px] text-gray-500 mt-0.5">{b.city} • {b.subCategory}</p>';
  }
  if (lines[i].includes('#claim')) {
    lines[i] = '        {b.unclaimed && <Link href={`/business/${b._id}#claim`} className="flash mt-2 text-[11px] font-bold text-accent">👋 Claim it now!</Link>}';
  }
}

fs.writeFileSync('frontend/src/components/BizCard.tsx', lines.join('\n'), 'utf8');
console.log('Force replaced BizCard lines!');
