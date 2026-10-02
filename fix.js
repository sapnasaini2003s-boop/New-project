const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/admin/page.tsx', 'utf8');

const newOverview = `function Overview() {
  const { data: d } = useFetch<any>('/admin/overview');
  if (!d) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 animate-pulse">
      {[...Array(8)].map((_, i) => <div key={i} className="bg-white rounded-[20px] p-6 border border-slate-200/60 shadow-sm"><div className="h-5 bg-slate-100 rounded-lg w-1/3 mb-5" /><div className="h-10 bg-slate-100 rounded-xl w-2/3" /></div>)}
    </div>
  );

  const cards = [
    { label: 'Revenue', value: '₹' + d.revenue.toLocaleString('en-IN'), icon: '💰', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100/50' },
    { label: 'Premium', value: d.premium, icon: '⭐', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100/50' },
    { label: 'Free', value: d.free, icon: '🆓', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100/50' },
    { label: 'Live Listings', value: d.live, icon: '🟢', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100/50' },
    { label: 'Suspended', value: d.suspended, icon: '⛔', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100/50' },
    { label: 'Total Users', value: d.users, icon: '👥', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100/50' },
    { label: 'Leads Generated', value: d.leads, icon: '📞', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100/50' },
    { label: 'Pending Approval', value: Object.values(d.queue).reduce((a: any, b: any) => a + b, 0), icon: '⏳', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100/50' },
  ];

  return (
    <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-[20px] p-6 border border-slate-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden group hover:-translate-y-0.5">
            <div className={'absolute top-0 left-0 right-0 h-1 ' + c.bg + ' opacity-0 group-hover:opacity-100 transition-opacity'}></div>
            <div className="flex items-center gap-3.5 mb-5">
              <div className={'w-11 h-11 rounded-2xl border flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-sm ' + c.bg + ' ' + c.border + ' ' + c.color}>
                {c.icon}
              </div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">{c.label}</p>
            </div>
            <p className="text-4xl font-black text-slate-800 tracking-tight">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white rounded-[24px] p-7 md:p-8 border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <div className="absolute -top-6 -right-6 p-8 opacity-[0.03] text-8xl pointer-events-none rotate-12">📥</div>
          <h3 className="font-bold text-slate-800 text-xl mb-6 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">📥</span> 
            Approval Queue
          </h3>
          <div className="space-y-2 relative z-10">
            {Object.entries(d.queue).map(([k, v]: any) => (
              <div key={k} className="flex justify-between items-center p-3.5 rounded-[14px] hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-default">
                <span className="text-sm text-slate-600 capitalize font-semibold tracking-wide">{k}</span>
                <span className={'text-xs font-bold px-3 py-1.5 rounded-lg ' + (v > 0 ? 'bg-amber-100 text-amber-700 shadow-sm' : 'bg-slate-100 text-slate-400')}>
                  {v} Pending
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[24px] p-7 md:p-8 border border-slate-200/60 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <div className="absolute -top-6 -right-6 p-8 opacity-[0.03] text-8xl pointer-events-none rotate-12">📈</div>
          <h3 className="font-bold text-slate-800 text-xl mb-6 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">📈</span> 
            Search Demand
          </h3>
          <div className="space-y-2 relative z-10">
            {Object.entries(d.searchStats).length === 0 && <p className="text-sm text-slate-400 py-4 text-center font-medium bg-slate-50 rounded-2xl border border-slate-100">No search data yet</p>}
            {Object.entries(d.searchStats).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([k, v]: any) => (
              <div key={k} className="flex justify-between items-center p-3.5 rounded-[14px] hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-default group">
                <span className="text-sm text-slate-700 font-medium group-hover:text-blue-600 transition-colors capitalize">{k.replace(/-/g, ' ')}</span>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block shadow-inner">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: Math.min((v / 20) * 100, 100) + '%' }}></div>
                  </div>
                  <span className="text-xs font-bold text-slate-600 bg-white shadow-sm border border-slate-200/60 px-2.5 py-1 rounded-md min-w-[2.5rem] text-center">{v}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}`;

const startIdx = content.indexOf('function Overview() {');
const endIdx = content.indexOf('function Diff({ b }: { b: any }) {');
if (startIdx > -1 && endIdx > -1) {
    content = content.substring(0, startIdx) + newOverview + '\n\n' + content.substring(endIdx);
    fs.writeFileSync('frontend/src/app/admin/page.tsx', content, 'utf8');
    console.log('Fixed syntax errors successfully');
} else {
    console.log('Could not find boundaries');
}
