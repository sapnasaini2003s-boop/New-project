const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/Header.tsx', 'utf8');

// 1. Remove the static CITIES array
code = code.replace(/const CITIES = \['Udupi', 'Manipal', 'Malpe', 'Mangaluru', 'Kundapura', 'Karkala'\];\n/g, '');

// 2. Add CityPicker component definition before Header()
const cityPickerCode = `
function CityPicker({ city, onChange, availableCities }: { city: string; onChange: (c: string) => void; availableCities: string[] }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const filtered = availableCities.filter(c => c.toLowerCase().includes(q.toLowerCase()));
  
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="bg-transparent outline-none text-sm font-medium py-2 px-1 max-w-[100px] flex items-center justify-between w-full">
        <span className="truncate">{city}</span>
        <span className="text-[10px] ml-1 opacity-50">▼</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 shadow-xl rounded-xl z-50 overflow-hidden">
            <div className="p-2 border-b bg-gray-50">
              <input autoFocus placeholder="Search city..." className="w-full text-sm p-1.5 border rounded outline-none" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filtered.map(c => (
                <button key={c} type="button" className="w-full text-left px-4 py-2 text-sm hover:bg-brand/10 hover:text-brand" onClick={() => { onChange(c); setOpen(false); setQ(''); }}>
                  {c}
                </button>
              ))}
              {filtered.length === 0 && <div className="px-4 py-2 text-sm text-gray-500">Not found</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Header() {
`;

code = code.replace('export default function Header() {', cityPickerCode);

// 3. Destructure cfg from useConfig to get dynamic cities
// Inside Header(): const { f } = useConfig();
// We'll change it to: const { f, cfg } = useConfig();
code = code.replace('const { f } = useConfig();', 'const { f, cfg } = useConfig();\n  const CITIES = cfg?.cities || [\'Udupi\', \'Manipal\', \'Malpe\', \'Mangaluru\', \'Kundapura\', \'Karkala\'];');

// 4. Replace Desktop <select>
// <select value={city} onChange={(e) => changeCity(e.target.value)} className="bg-transparent outline-none text-sm font-medium py-2 max-w-[100px]">
//   {CITIES.map((c) => <option key={c}>{c}</option>)}
// </select>
const selectRegex1 = /<select value=\{city\} onChange=\{\(e\) => changeCity\(e\.target\.value\)\} className="bg-transparent outline-none text-sm font-medium py-2 max-w-\[100px\]">[\s\S]*?<\/select>/;
code = code.replace(selectRegex1, '<CityPicker city={city} onChange={changeCity} availableCities={CITIES} />');

// 5. Replace Mobile <select>
// <select value={city} onChange={(e) => changeCity(e.target.value)} className="bg-transparent outline-none text-sm w-full py-2">
//   {CITIES.map((c) => <option key={c}>{c}</option>)}
// </select>
const selectRegex2 = /<select value=\{city\} onChange=\{\(e\) => changeCity\(e\.target\.value\)\} className="bg-transparent outline-none text-sm w-full py-2">[\s\S]*?<\/select>/;
code = code.replace(selectRegex2, '<div className="flex-1"><CityPicker city={city} onChange={changeCity} availableCities={CITIES} /></div>');

fs.writeFileSync('frontend/src/components/Header.tsx', code, 'utf8');
console.log('Successfully injected CityPicker into Header.tsx');
