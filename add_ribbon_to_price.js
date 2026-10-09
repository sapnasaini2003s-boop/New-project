const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/Price.tsx', 'utf8');

const newRibbon = `
export function Ribbon({ off }: { off: number }) {
  if (off <= 0) return null;
  return (
    <div className="absolute top-4 -right-8 w-32 bg-red-600 text-white text-[10px] font-black tracking-widest text-center py-1 rotate-45 shadow-md z-10 pointer-events-none">
      SAVE {off}%
    </div>
  );
}
`;

if (!code.includes('export function Ribbon')) {
  code += newRibbon;
  fs.writeFileSync('frontend/src/components/Price.tsx', code, 'utf8');
}
