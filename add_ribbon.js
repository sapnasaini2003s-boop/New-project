const fs = require('fs');

let code = fs.readFileSync('frontend/src/app/advertise/page.tsx', 'utf8');

// The line we want to replace:
// <div key={x.n} className={`card p-7 flex flex-col relative ${x.best ? 'border-2 border-accent shadow-2xl md:-translate-y-3' : ''}`}>
// {x.best && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>}

const target = `        <div key={x.n} className={\`card p-7 flex flex-col relative \${x.best ? 'border-2 border-accent shadow-2xl md:-translate-y-3' : ''}\`}>
          {x.best && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>}`;

const replacement = `        <div key={x.n} className={\`card p-7 flex flex-col relative overflow-hidden \${x.best ? 'border-2 border-accent shadow-2xl md:-translate-y-3' : ''}\`}>
          {x.best && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-bold px-3 py-1 rounded-b-full">MOST POPULAR</span>}
          {x.best && (
            <div className="absolute top-5 -right-10 w-[140px] text-center bg-green-500 text-white font-black text-[11px] py-1 rotate-45 shadow">
              SAVE 50%
            </div>
          )}`;

if(code.includes('MOST POPULAR')) {
  code = code.replace(target, replacement);
  fs.writeFileSync('frontend/src/app/advertise/page.tsx', code, 'utf8');
  console.log('Added slanted 50% off ribbon to advertise page');
} else {
  console.log('Could not find target block in advertise page');
}
