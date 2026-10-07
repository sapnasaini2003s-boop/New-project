const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf8');

const targetStr = '<div className="md:col-span-2"><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Popular Searches</label><input className="input" value={(v.popularSearches || []).join(\', \')} onChange={(e) => setV({ ...v, popularSearches: e.target.value.split(\',\').map((x: string) => x.trim()).filter(Boolean) })} /></div>';

const citiesStr = '<div className="md:col-span-2"><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Active Cities</label><input className="input" value={(v.cities || []).join(\', \')} onChange={(e) => setV({ ...v, cities: e.target.value.split(\',\').map((x: string) => x.trim()).filter(Boolean) })} placeholder="e.g. Udupi, Mangaluru, Manipal" /></div>';

if (code.includes(targetStr)) {
  code = code.replace(targetStr, targetStr + '\n        ' + citiesStr);
  fs.writeFileSync('frontend/src/app/admin/page.tsx', code, 'utf8');
  console.log('Successfully injected Cities setting into Admin page.tsx');
} else {
  console.log('Could not find the target string in admin/page.tsx');
}
