const fs = require('fs');

let page = fs.readFileSync('frontend/src/app/legal/[slug]/page.tsx', 'utf8');

// The original GrievanceForm
const oldForm = `  return <form onSubmit={send} className="card p-6 mt-6 space-y-3"><h3 className="font-bold">Submit a grievance</h3>
    <input required className="input" placeholder="Subject" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
    <textarea required minLength={15} rows={5} className="input" placeholder="Describe your issue (include business name / link)" value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} />
    {msg && <p className="text-sm text-brand">{msg}</p>}<button className="btn btn-primary">Submit</button></form>;`;

const newForm = `  return (
    <form onSubmit={send} className="card p-6 md:p-8 mt-6 max-w-2xl shadow-sm border border-gray-200">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">Submit a Grievance</h3>
        <p className="text-sm text-gray-500 mt-1">Please provide the details of your issue. As per IT Rules 2021, we will acknowledge this within 24 hours.</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Subject</label>
          <input required minLength={5} maxLength={100} className="input w-full bg-gray-50 focus:bg-white" placeholder="e.g., Fake listing, Harassment, Refund issue" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <textarea required minLength={15} maxLength={1000} rows={5} className="input w-full bg-gray-50 focus:bg-white resize-none" placeholder="Please describe your issue in detail. If it is about a specific business, include their name or link here." value={f.details} onChange={(e) => setF({ ...f, details: e.target.value })} />
          <p className="text-xs text-gray-400 mt-1 flex justify-end">{f.details.length}/1000</p>
        </div>
        {msg && (
          <div className={\`p-3 rounded-lg text-sm font-medium \${msg.includes('Submitted') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}\`}>
            {msg.includes('Submitted') ? '✅ ' : '⚠ '} {msg}
          </div>
        )}
        <button type="submit" disabled={!f.subject || f.details.length < 15} className="btn btn-brand w-full md:w-auto px-8 py-3 text-base font-bold shadow-md disabled:opacity-50">Submit Grievance</button>
      </div>
    </form>
  );`;

page = page.replace(oldForm, newForm);

fs.writeFileSync('frontend/src/app/legal/[slug]/page.tsx', page, 'utf8');
console.log('Fixed grievance form UI');
