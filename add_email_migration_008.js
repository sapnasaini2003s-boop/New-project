const fs = require('fs');

const path = 'backend/src/migrations.js';
let code = fs.readFileSync(path, 'utf8');

const newMigration = `
  { 
    id: '008', 
    name: 'Fix dummy emails in settings and legal pages', 
    run: () => {
      let c1 = 0, c2 = 0;
      const s = db.settings();
      if (s.contact) {
        if (s.contact.email === 'support@yourdomain.in') { s.contact.email = 'suhantudupi@gmail.com'; c1++; }
        if (s.contact.grievance === 'legal@yourdomain.in') { s.contact.grievance = 'suhantudupi@gmail.com'; c1++; }
        if (c1 > 0) db.setSettings(s);
      }
      for (const p of db.all('pages')) {
        let changed = false;
        let content = p.content;
        if (content && typeof content === 'string') {
          if (content.includes('support@yourdomain.in')) { content = content.replace(/support@yourdomain\\.in/g, 'suhantudupi@gmail.com'); changed = true; }
          if (content.includes('legal@yourdomain.in')) { content = content.replace(/legal@yourdomain\\.in/g, 'suhantudupi@gmail.com'); changed = true; }
        }
        if (changed) { 
          db.update('pages', p._id, { content }); 
          c2++; 
        }
      }
      return \`Updated \${c1} settings and \${c2} pages.\`;
    } 
  },
`;

if (!code.includes("id: '008'")) {
  code = code.replace(/];\s*\/\/\s*One-off maintenance tasks/, newMigration + '];\n\n// One-off maintenance tasks');
  fs.writeFileSync(path, code, 'utf8');
}
