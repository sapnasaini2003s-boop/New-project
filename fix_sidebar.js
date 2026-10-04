const fs = require('fs');
let content = fs.readFileSync('frontend/src/app/business/[id]/page.tsx', 'utf8');

// The symbols show up weirdly in the terminal, but using exact string matches based on what they are in UTF-8
// Let's replace the HTML strings precisely

// Reviews stars button
content = content.replace(/className=\{i <= rev\.rating \? 'text-amber-400' : 'text-gray-300'\}>.*?<\/button>/g, 'className={i <= rev.rating ? \'text-amber-400\' : \'text-gray-300\'}>★</button>');

// Placeholder text
content = content.replace(/placeholder="Share your experience.*?"/, 'placeholder="Share your experience..."');

// Login to write review arrow
content = content.replace(/Login to write a review.*?<\/Link>/, 'Login to write a review ➔</Link>');

// Details section Address pin
content = content.replace(/<p>.*?\{b\.address \?/, '<p>📍 {b.address ?');

// Details section Clock
content = content.replace(/<p className="font-semibold mb-1">.*?Business hours<\/p>/, '<p className="font-semibold mb-1">🕒 Business hours</p>');
content = content.replace(/<p>.*?\{b\.timings\}<\/p>/, '<p>🕒 {b.timings}</p>');

// Details section Envelope
content = content.replace(/<p>.*?\{b\.contact\.email\}<\/p>/, '<p>✉️ {b.contact.email}</p>');

// Dot between cat and subcategory
content = content.replace(/\{cat\?\.name\} .*? \{b\.subCategory\}/, '{cat?.name} • {b.subCategory}');

// Report listing flag
content = content.replace(/<button onClick=\{.*?className="text-xs text-red-500 hover:underline pt-2">.*?Report this listing<\/button>/, '<button onClick={() => setReport({ reason: \'\' })} className="text-xs text-red-500 hover:underline pt-2">🚩 Report this listing</button>');

fs.writeFileSync('frontend/src/app/business/[id]/page.tsx', content, 'utf8');
console.log('Fixed remaining details sidebar and reviews mojibake!');
