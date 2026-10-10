const fs = require('fs');

let code = fs.readFileSync('frontend/src/components/MenuView.tsx', 'utf8');

// Replace Step Component
code = code.replace(
  /const Step = \(\{ k \}: \{ k: string \}\) => cart\[k\] \? \([\s\S]*?\) : <button[^>]*>\{kd\.add\}<\/button>;/,
  `const Step = ({ k }: { k: string }) => cart[k] ? (
    <div className="inline-flex items-center gap-3 text-gray-800 font-medium">
      <button type="button" aria-label="Remove one" onClick={() => setQty(k, -1)} className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center text-lg leading-none hover:bg-gray-50">−</button>
      <span className="text-sm w-4 text-center">{cart[k]}</span>
      <button type="button" aria-label="Add one" onClick={() => setQty(k, 1)} className="w-6 h-6 rounded-full border border-green-600 flex items-center justify-center text-green-600 text-lg leading-none hover:bg-green-50">+</button>
    </div>
  ) : <button type="button" onClick={() => setQty(k, 1)} className="text-sm font-semibold text-green-600 flex items-center gap-1 hover:text-green-700"><span className="text-lg leading-none">+</span> Add</button>;`
);

// Replace Item Row
code = code.replace(
  /<div key=\{k\} className="flex gap-3 items-start pb-4 border-b border-gray-100 last:border-0 last:pb-0">[\s\S]*?<\/div>\); \}\)/,
  `<div key={k} className="flex gap-4 items-start py-4 border-b border-gray-100 last:border-0">
                    {it.image && (
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
                        <img src={img(it.image)} alt={it.name} loading="lazy" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-[15px] leading-snug break-words flex items-center gap-2">
                        {it.name}
                        <Dot veg={it.veg} />
                      </p>
                      <p className="font-bold text-gray-900 text-lg mt-0.5">₹{it.price}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Price displayed by the shop</p>
                      {it.desc && <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{it.desc}</p>}
                      {biz.orderable && <div className="mt-3"><Step k={k} /></div>}
                    </div>
                  </div>); })`
);

// Replace Cart Bar logic
code = code.replace(
  /onClick=\{\(\) => \{ setSheet\(true\); setDone\(null\); setErr\(''\); \}\}/,
  `onClick={() => { document.getElementById('enquiry-box')?.scrollIntoView({ behavior: 'smooth' }); }}`
);

// Replace Modal Sheet with Inline Enquiry Box
code = code.replace(
  /\{sheet && \([\s\S]*?\}\)/,
  `{biz.orderable && count > 0 && (
        <div id="enquiry-box" className="mt-8 bg-[#f3f4f6] rounded-2xl p-5 mb-4 mx-4 md:mx-5 scroll-mt-24">
          {done ? (
            <div className="text-center space-y-3 py-4">
              <div className="text-4xl"><E c="✅"/></div><p className="font-bold text-gray-900">Enquiry {done.orderNo} Sent!</p>
              <p className="text-sm text-gray-600">{done.message}</p>
              {done.waUrl && <a href={done.waUrl} target="_blank" rel="noopener" className="btn bg-[#128C7E] text-white w-full !py-3 rounded-xl font-bold mt-2"><E c="💬"/> Open WhatsApp</a>}
            </div>
          ) : (
            <form onSubmit={place}>
              <h3 className="font-bold text-gray-900 text-[15px] mb-3">Enquiry message</h3>
              <div className="space-y-1.5 mb-5">
                {lines.map((l) => (
                  <p key={l.k} className="text-[14px] text-gray-800">{l.name} — Quantity {l.qty}</p>
                ))}
                <div className="flex justify-between font-bold text-gray-900 pt-3 mt-3 border-t border-gray-200">
                  <span>Total Amount</span><span>₹{total}</span>
                </div>
              </div>

              {!!biz.min && total < biz.min && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 mb-4">Minimum order is ₹{biz.min} — add ₹{biz.min - total} more.</p>}

              <div className="space-y-3 mb-5">
                <input required minLength={2} maxLength={60} className="input bg-white w-full" placeholder="Your Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
                <input required inputMode="numeric" maxLength={10} pattern="[6-9][0-9]{9}" title="10-digit mobile" className="input bg-white w-full" placeholder="Your Mobile Number" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\\D/g, '') })} />
                {err && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{err}</p>}
              </div>

              <button disabled={busy || !lines.length || (!!biz.min && total < biz.min)} className="btn bg-[#128C7E] hover:bg-[#075E54] text-white w-full !py-3 rounded-xl font-bold shadow-sm disabled:opacity-50">
                {busy ? 'Sending…' : <><E c="💬" /> Enquire on WhatsApp</>}
              </button>
              <p className="text-[11px] text-gray-500 mt-3 leading-relaxed text-center">
                The customer sends the enquiry to the shop, which confirms price and availability.
              </p>
            </form>
          )}
        </div>
      )}`
);

fs.writeFileSync('frontend/src/components/MenuView.tsx', code, 'utf8');
