const fs = require('fs');

let content = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

// Find the promo banner hardcoded block
const promoRegex = /\{ads\.promo\?\.\[0\] \? \([\s\S]*?\) : <Banner ads=\{\[\]\} h="h-full min-\[200px\]" \/>\}/;
// Wait, the regex might be tricky. Let's just use a string replacement of that entire block.

const oldBlock = `{ads.promo?.[0] ? (
          <Link href={ads.promo[0].link || '#'} className="card overflow-hidden relative min-h-[200px] bg-orange-50 p-5 flex flex-col justify-end" style={ads.promo[0].image ? { background: \`linear-gradient(90deg,#fff7ed 45%,transparent), url(\${img(ads.promo[0].image)})\` + ' right/cover' } : {}}>
            <h3 className="text-xl font-black text-gray-900 max-w-[60%]">{ads.promo[0].title}</h3>
            <p className="text-xs text-gray-600 max-w-[60%]">{ads.promo[0].subtitle}</p>
            <span className="btn btn-accent w-fit mt-3 !text-xs">{ads.promo[0].cta || 'EXPLORE'}</span>
          </Link>
        ) : <Banner ads={[]} h="h-full min-h-[200px]" />}`;

// Actually let's just write a generic rotation block using `PromoCarousel`
const injectComponent = `
function PromoCarousel({ ads }: { ads: any[] }) {
  const [i, setI] = useState(0);
  useEffect(() => { if (ads.length < 2) return; const t = setInterval(() => setI((x) => (x + 1) % ads.length), 4000); return () => clearInterval(t); }, [ads.length]);
  if (!ads.length) return <Banner ads={[]} h="h-full min-h-[200px]" />;
  const a = ads[i % ads.length];
  return (
    <div className="relative h-full min-h-[200px]">
      <Link href={a.link || '#'} className="card overflow-hidden absolute inset-0 bg-orange-50 p-5 flex flex-col justify-end" style={a.image ? { background: \`linear-gradient(90deg,#fff7ed 45%,transparent), url(\${img(a.image)}) right/cover\` } : {}}>
        <div className="relative z-10">
          <h3 className="text-xl font-black text-gray-900 max-w-[60%]">{a.title}</h3>
          <p className="text-xs text-gray-600 max-w-[60%]">{a.subtitle}</p>
          <span className="btn btn-accent w-fit mt-3 !text-xs">{a.cta || 'EXPLORE'}</span>
        </div>
      </Link>
      {ads.length > 1 && <div className="absolute bottom-2 left-5 flex gap-1 z-20">{ads.map((_, k) => <span key={k} className={\`w-1.5 h-1.5 rounded-full \${k === i % ads.length ? 'bg-accent' : 'bg-gray-300'}\`} />)}</div>}
    </div>
  );
}
`;

// It's safer to just replace the whole file or do precise AST operations.
