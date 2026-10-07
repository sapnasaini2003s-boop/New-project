const fs = require('fs');

// Fix Header.tsx Mobile Search Layout
let headerCode = fs.readFileSync('frontend/src/components/Header.tsx', 'utf8');
const oldHeaderForm = `<form onSubmit={search} className="md:hidden px-3 pb-2 flex gap-2">
          <div className="flex items-center border rounded-lg px-2 w-[38%] bg-gray-50">
            <button type="button" onClick={locate} className="text-brand text-sm">📍</button>
            <div className="flex-1"><CityPicker city={city} onChange={changeCity} availableCities={CITIES} /></div>
          </div>
          <div className="flex-1 flex items-center border rounded-full px-3 bg-white">
            <div className="relative w-full"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Restaurants near me" className="w-full text-sm outline-none py-2" /><Suggest q={q} onPick={() => setQ('')} /></div>
            <button className="text-brand">🔍</button>
          </div>
        </form>`;

const newHeaderForm = `<form onSubmit={search} className="md:hidden px-3 pb-3 flex flex-col gap-2">
          <div className="flex items-center border border-gray-300 rounded-lg px-2 w-full bg-gray-50">
            <button type="button" onClick={locate} className="text-brand text-base px-1">📍</button>
            <div className="flex-1"><CityPicker city={city} onChange={changeCity} availableCities={CITIES} /></div>
          </div>
          <div className="flex-1 flex items-center border border-gray-300 rounded-lg px-3 bg-white focus-within:border-brand transition">
            <div className="relative w-full"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for businesses, products or services..." className="w-full text-sm outline-none py-2.5" /><Suggest q={q} onPick={() => setQ('')} /></div>
            <button className="text-brand text-lg px-2">🔍</button>
          </div>
        </form>`;
headerCode = headerCode.replace(oldHeaderForm, newHeaderForm);
fs.writeFileSync('frontend/src/components/Header.tsx', headerCode, 'utf8');

// Fix page.tsx stats grid
let pageCode = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');
const oldStatsGrid = `<div className="card p-4 md:col-span-2 grid grid-cols-4 text-center">`;
const newStatsGrid = `<div className="card p-4 md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-y-4 text-center">`;
pageCode = pageCode.replace(oldStatsGrid, newStatsGrid);
fs.writeFileSync('frontend/src/app/page.tsx', pageCode, 'utf8');

console.log('Fixed mobile layout responsiveness for Header and Stats Grid');
