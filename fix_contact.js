const fs = require('fs');

let page = fs.readFileSync('frontend/src/app/contact/page.tsx', 'utf8');

// Add Suspense and searchParams
page = page.replace(
  `import { useState } from 'react';`,
  `import { useState, useEffect, Suspense } from 'react';\nimport { useSearchParams } from 'next/navigation';`
);

page = page.replace(
  `const ITEMS: [string, string, string, string][] = [['issue', '??', 'Report an Issue', ''], ['list', '??', 'Want to list with us?', '/register-business'], ['txn', '??', 'My transaction', '/vendor/dashboard'], ['grievance', '??', 'Grievance Redressal', ''], ['mine', '??', 'My complaints', '']];`,
  `const ITEMS: [string, string, string, string][] = [['issue', '⚠️', 'Report an Issue', ''], ['list', '🏢', 'Want to list with us?', '/register-business'], ['txn', '💳', 'My transaction', '/vendor/dashboard'], ['grievance', '⚖️', 'Grievance Redressal', ''], ['mine', '📋', 'My complaints', '']];`
);

// We need to wrap the whole component in Suspense because of useSearchParams
const componentBody = `
function SupportContent() {
  const { user } = useUser(); const [modal, setModal] = useState<'login' | 'issue' | 'grievance' | 'mine' | null>(null);
  const searchParams = useSearchParams();
  useEffect(() => { if (searchParams.get('tab') === 'mine' && user) setModal('mine'); }, [searchParams, user]);
  const mine = useFetch<any[]>(user && modal === 'mine' ? '/grievances/mine' : null);
  const [text, setText] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const open = (k: string, href: string) => { if (href) { if (k === 'txn' && !user) return setModal('login'); window.location.href = href; return; } if (!user) return setModal('login'); setMsg(''); setText(''); setModal(k as any); };
  const submit = async () => { setBusy(true); try { setMsg((await api('/grievances', { body: { kind: modal, details: text } })).message); setText(''); } catch (e: any) { setMsg(e.message); } setBusy(false); };
  return (<div className="min-h-[70vh] bg-white">
    <div className="bg-brand text-white text-center py-3 font-semibold text-sm">Customer Support</div>
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-center font-bold text-lg mb-4">Hi! How can we help you today?</h1>
      <div className="divide-y border-t border-b">{ITEMS.map(([k, i, l, h]) => (
        <button key={k} onClick={() => open(k, h)} className="w-full flex items-center gap-4 py-4 text-left hover:bg-gray-50"><span className="text-2xl w-9">{i}</span><span className="flex-1 font-semibold">{l}</span><span className="text-gray-400">›</span></button>))}</div>
      <p className="text-xs text-gray-500 mt-6 text-center">Grievance Officer (IT Act): <a className="text-brand" href="mailto:legal@yourdomain.in">legal@yourdomain.in</a></p>
    </div>
    {modal && <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center" onClick={() => setModal(null)}>
      <div className="bg-white w-full md:max-w-md rounded-t-2xl md:rounded-2xl p-5 slideup" onClick={(e) => e.stopPropagation()}>
        {modal === 'mine' ? <>
          <div className="flex justify-between items-center mb-3"><h3 className="font-bold">My complaints</h3><button onClick={() => setModal(null)} className="text-xl">✕</button></div>
          <div className="max-h-[60vh] overflow-y-auto space-y-3">{!mine.data ? <p className="text-sm text-gray-400">Loading.</p> : !mine.data.length ? <p className="text-sm text-gray-500">No complaints yet.</p> : mine.data.map((c) => (
            <div key={c._id} className="border rounded-xl p-3 text-sm"><div className="flex justify-between gap-2"><b>{c.reason}</b><span className={\`text-[11px] font-bold px-2 rounded-full h-fit \${c.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}\`}>{c.status === 'pending' ? 'In review' : c.status}</span></div>
              <p className="text-gray-600 mt-1 break-words">{c.details}</p><p className="text-[11px] text-gray-400 mt-1">{new Date(c.createdAt).toLocaleString('en-IN')}</p>
              {c.response ? <p className="mt-2 bg-blue-50 text-blue-800 rounded-lg p-2 text-xs"><b>Reply:</b> {c.response}</p> : c.autoResponse && <p className="mt-2 bg-gray-50 text-gray-700 rounded-lg p-2 text-xs"><b>Acknowledgement:</b> {c.autoResponse}</p>}</div>))}</div></> : modal === 'login' ? <>
          <p className="mb-4">Please login to register a complaint.</p>
          <div className="flex gap-2"><button onClick={() => setModal(null)} className="btn btn-ghost flex-1">Close</button><Link href="/login?intent=user&next=/contact" className="btn btn-brand flex-1 text-center">Login</Link></div></> : <>
          <div className="flex justify-between items-center mb-2"><h3 className="font-bold">{modal === 'issue' ? 'Report an Issue' : 'Grievance Redressal'}</h3><button onClick={() => setModal(null)} className="text-xl">✕</button></div>
          <p className="text-xs text-gray-500 mb-3">{modal === 'grievance' ? 'In the event that you are not satisfied with the resolution provided by our team you can contact our grievance redressal officer.' : 'Tell us about the problem you faced.'}</p>
          <textarea rows={4} className="input mb-2" placeholder="Please write your query here, and our team will act on it in 24-48 hours" value={text} onChange={(e) => setText(e.target.value)} />
          {msg && <p className="text-sm text-brand mb-2">{msg}</p>}
          <div className="flex gap-2"><button onClick={() => setModal(null)} className="btn btn-ghost flex-1">Cancel</button><button disabled={busy || text.trim().length < 5} onClick={submit} className="btn btn-brand flex-1 disabled:opacity-50">Submit</button></div></>}
      </div></div>}
  </div>);
}

export default function Support() {
  return <Suspense fallback={<div>Loading...</div>}><SupportContent /></Suspense>;
}
`;

page = page.substring(0, page.indexOf('export default function Support() {')) + componentBody;

fs.writeFileSync('frontend/src/app/contact/page.tsx', page, 'utf8');
console.log('Fixed contact page');
