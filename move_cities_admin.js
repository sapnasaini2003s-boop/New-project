const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf8');

// Remove from Hero Section
const citiesStr = '<div className="md:col-span-2"><label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Active Cities</label><input className="input" value={(v.cities || []).join(\', \')} onChange={(e) => setV({ ...v, cities: e.target.value.split(\',\').map((x: string) => x.trim()).filter(Boolean) })} placeholder="e.g. Udupi, Mangaluru, Manipal" /></div>';
code = code.replace(citiesStr, '');

// Create a standalone card right before the save button
const standaloneCities = `
      <div className="bg-white rounded-2xl p-6 grid md:grid-cols-1 gap-4 border-2 border-brand/20 shadow-sm">
        <h3 className="font-bold text-brand text-lg flex items-center gap-2">📍 Manage Active Cities</h3>
        <p className="text-xs text-gray-500 mb-2">Type city names separated by commas. These will appear in the search dropdown for all users.</p>
        <div>
          <input className="input !py-3 !text-base" value={(v.cities || []).join(', ')} onChange={(e) => setV({ ...v, cities: e.target.value.split(',').map((x: string) => x.trim()).filter(Boolean) })} placeholder="e.g. Udupi, Mangaluru, Manipal" />
        </div>
      </div>
`;

code = code.replace('<button onClick={() => { const { pages, searchStats, ...rest } = v; save(rest); }}', standaloneCities + '\n      <button onClick={() => { const { pages, searchStats, ...rest } = v; save(rest); }}');

fs.writeFileSync('frontend/src/app/admin/page.tsx', code, 'utf8');
