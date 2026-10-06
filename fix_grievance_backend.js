const fs = require('fs');

let pub = fs.readFileSync('backend/src/routes/public.js', 'utf8');

const oldGriev = `router.post('/grievances', limit('grv', 8, 3600e3), auth(true), (req, res) => {
  const { kind, details } = req.body; const text = String(details || '').trim();
  if (text.length < 5) return res.status(400).json({ message: 'Please write your query' });
  const issue = kind === 'issue';
  db.insert('reports', { type: issue ? 'issue' : 'grievance', businessId: null, businessName: issue ? 'Reported issue' : 'Grievance redressal', reason: issue ? 'Issue' : 'Grievance', details: text.slice(0, 2000), name: req.user.name, phone: req.user.phone, userId: req.user._id, status: 'pending' }, 'rep');
  notify(null, issue ? 'New issue reported' : 'New grievance', \`\${req.user.name || req.user.phone}: \${text.slice(0, 120)}\`, 'inbox');
  res.status(201).json({ message: 'Submitted. Our team will act on it within 24-48 hours.' });
});`;

const newGriev = `router.post('/grievances', limit('grv', 8, 3600e3), auth(true), (req, res) => {
  const { kind, details } = req.body; const text = String(details || '').trim();
  if (text.length < 5) return res.status(400).json({ message: 'Please write your query' });
  const issue = kind === 'issue';
  const r = db.insert('reports', { type: issue ? 'issue' : 'grievance', businessId: null, businessName: issue ? 'Reported issue' : 'Grievance redressal', reason: issue ? 'Issue' : 'Grievance', details: text.slice(0, 2000), name: req.user.name, phone: req.user.phone, userId: req.user._id, status: 'pending' }, 'rep');
  
  // Notify Admin
  notify(null, issue ? 'New issue reported' : 'New grievance', \`\${req.user.name || req.user.phone}: \${text.slice(0, 120)}\`, 'inbox');
  
  // Auto-reply to User
  const msg = \`Dear \${req.user.name || 'User'},\n\nWe have received your \${issue ? 'issue report' : 'grievance'} (ID: \${r._id}). Our Grievance Officer will review this and get back to you within 24 hours as per the IT Rules 2021.\n\nThanks,\nPVRS HUB Team\`;
  notify(req.user._id, \`\${issue ? 'Issue' : 'Grievance'} Received\`, msg.replace(/\\n/g, '<br>'), 'inbox', req.user.email);
  
  res.status(201).json({ message: 'Submitted successfully. A confirmation has been sent to you.' });
});`;

pub = pub.replace(oldGriev, newGriev);

fs.writeFileSync('backend/src/routes/public.js', pub, 'utf8');
console.log('Fixed auto reply for grievances');
