const fs = require('fs');

const path = 'backend/src/migrations.js';
let code = fs.readFileSync(path, 'utf8');

const newMigration = `
  { 
    id: '009', 
    name: 'Fix dummy emails in settings.pages', 
    run: () => {
      let c = 0;
      const s = db.settings();
      if (s.pages) {
        for (const slug of Object.keys(s.pages)) {
          let p = s.pages[slug];
          if (p && p.content) {
            let changed = false;
            if (p.content.includes('yourdomain.in')) {
              p.content = p.content.replace(/support@yourdomain\\.in/g, 'suhantudupi@gmail.com');
              p.content = p.content.replace(/legal@yourdomain\\.in/g, 'suhantudupi@gmail.com');
              changed = true;
            }
            if (changed) c++;
          }
        }
        if (c > 0) db.setSettings(s);
      }
      return \`Updated \${c} pages in settings.\`;
    } 
  },
`;

if (!code.includes("id: '009'")) {
  code = code.replace(/];\s*\/\/\s*One-off maintenance tasks/, newMigration + '];\n\n// One-off maintenance tasks');
  fs.writeFileSync(path, code, 'utf8');
}
