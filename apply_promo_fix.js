const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

const promoCarouselCode = `
function PromoCarousel({ ads }: { ads: any[] }) {
  const [i, setI] = useState(0);
  useEffect(() => { if (ads.length < 2) return; const t = setInterval(() => setI((x) => (x + 1) % ads.length), 4000); return () => clearInterval(t); }, [ads.length]);
  if (!ads.length) return <Banner ads={[]} h="h-full min-h-[200px]" />;
  const a = ads[i % ads.length];
  return (
    <div className="relative h-full min-h-[200px]">
      <Link href={a.link || '#'} className="card overflow-hidden absolute inset-0 bg-orange-50 p-5 flex flex-col justify-end" style={a.image ? { background: \`linear-gradient(90deg,#fff7ed 45%,transparent), url(\${img(a.image)}) right/cover\` } : {}}>
        <div className="relative z-10">
          <h3 className="text-xl font-black text-gray-900 max-w-[60%] line-clamp-2">{a.title}</h3>
          <p className="text-xs text-gray-600 max-w-[60%] line-clamp-2 mt-1">{a.subtitle}</p>
          <span className="btn btn-accent w-fit mt-3 !text-xs">{a.cta || 'EXPLORE'}</span>
        </div>
      </Link>
      {ads.length > 1 && <div className="absolute bottom-3 left-5 flex gap-1 z-20">{ads.map((_, k) => <span key={k} className={\`w-1.5 h-1.5 rounded-full \${k === i % ads.length ? 'bg-accent' : 'bg-gray-300'}\`} />)}</div>}
    </div>
  );
}

export default function Home`;

// Insert the PromoCarousel definition
if (!code.includes('function PromoCarousel')) {
  code = code.replace('export default function Home', promoCarouselCode);
}

// Now replace the hardcoded promo rendering
// I will use regex to find the block starting with "{ads.promo?.[0] ?" and ending with "h-full min-h-[200px]" />}"
const regex = /\{ads\.promo\?\.\[0\] \? \([\s\S]*?<Banner ads=\{\[\]\} h="h-full min-h-\[200px\]" \/>\}/m;

if (regex.test(code)) {
  code = code.replace(regex, '<PromoCarousel ads={ads.promo || []} />');
  console.log('Successfully replaced promo rendering!');
} else {
  console.log('Regex did not match. Looking for exact block...');
  // If regex fails, let's just do it manually by finding index
  const startStr = '{ads.promo?.[0] ? (';
  const endStr = '<Banner ads={[]} h="h-full min-h-[200px]" />}';
  const startIndex = code.indexOf(startStr);
  const endIndex = code.indexOf(endStr, startIndex);
  if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + '<PromoCarousel ads={ads.promo || []} />' + code.substring(endIndex + endStr.length);
    console.log('Successfully replaced via string index!');
  } else {
    console.log('Failed to find the block to replace.');
  }
}

fs.writeFileSync('frontend/src/app/page.tsx', code, 'utf8');
