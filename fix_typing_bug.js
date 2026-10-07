const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf8');

// Fix popularSearches
const oldPop = '<input className="input" value={(v.popularSearches || []).join(\', \')} onChange={(e) => setV({ ...v, popularSearches: e.target.value.split(\',\').map((x: string) => x.trim()).filter(Boolean) })} />';
const newPop = '<input className="input" value={typeof v.popularSearches === \'string\' ? v.popularSearches : (v.popularSearches || []).join(\', \')} onChange={(e) => setV({ ...v, popularSearches: e.target.value })} />';
code = code.replace(oldPop, newPop);

// Fix cities
const oldCity = '<input className="input !py-3 !text-base" value={(v.cities || []).join(\', \')} onChange={(e) => setV({ ...v, cities: e.target.value.split(\',\').map((x: string) => x.trim()).filter(Boolean) })} placeholder="e.g. Udupi, Mangaluru, Manipal" />';
const newCity = '<input className="input !py-3 !text-base" value={typeof v.cities === \'string\' ? v.cities : (v.cities || []).join(\', \')} onChange={(e) => setV({ ...v, cities: e.target.value })} placeholder="e.g. Udupi, Mangaluru, Manipal" />';
code = code.replace(oldCity, newCity);

// Fix save button
const oldSave = '<button onClick={() => { const { pages, searchStats, ...rest } = v; save(rest); }}';
const newSave = '<button onClick={() => { const { pages, searchStats, ...rest } = v; if (typeof rest.cities === \'string\') rest.cities = rest.cities.split(\',\').map((x: string) => x.trim()).filter(Boolean); if (typeof rest.popularSearches === \'string\') rest.popularSearches = rest.popularSearches.split(\',\').map((x: string) => x.trim()).filter(Boolean); save(rest); }}';
code = code.replace(oldSave, newSave);

fs.writeFileSync('frontend/src/app/admin/page.tsx', code, 'utf8');
console.log('Fixed typing bug for arrays in Settings');
