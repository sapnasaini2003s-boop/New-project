const fs = require('fs');

let code = fs.readFileSync('backend/src/routes/auth.js', 'utf8');

const target = `  if ((process.env.OTP_MODE || 'dev') === 'firebase') return res.json({ message: 'Use Firebase to send OTP', mode: 'firebase' });
  otps.set(phone, { otp: '123456', exp: Date.now() + 5 * 60e3, tries: 0 });
  res.json({ message: \`OTP sent to +91 \${phone} (test OTP: 123456)\`, mode: 'dev' });
});`;

const replacement = `  if ((process.env.OTP_MODE || 'dev') === 'firebase') return res.json({ message: 'Use Firebase to send OTP', mode: 'firebase' });
  
  // WhatsApp OTP Support
  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    otps.set(phone, { otp: code, exp: Date.now() + 5 * 60e3, tries: 0 });
    
    // Send via Meta Cloud API (requires a template named 'otp' or similar, or just send text message if approved)
    fetch(\`https://graph.facebook.com/v17.0/\${process.env.WHATSAPP_PHONE_ID}/messages\`, {
      method: 'POST',
      headers: { 'Authorization': \`Bearer \${process.env.WHATSAPP_TOKEN}\`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: "whatsapp", to: "91" + phone, type: "text",
        text: { body: \`Your PVRS HUB login OTP is: \${code}. It is valid for 5 minutes. Do not share this with anyone.\` }
      })
    }).catch(console.error);

    return res.json({ message: \`OTP sent to +91 \${phone} via WhatsApp\`, mode: 'whatsapp' });
  }

  // Fallback to dev mode
  otps.set(phone, { otp: '123456', exp: Date.now() + 5 * 60e3, tries: 0 });
  res.json({ message: \`OTP sent to +91 \${phone} (test OTP: 123456)\`, mode: 'dev' });
});`;

if(code.includes('otps.set(phone, { otp: \'123456\'')) {
  code = code.replace(target, replacement);
  fs.writeFileSync('backend/src/routes/auth.js', code, 'utf8');
  console.log('Added WhatsApp OTP logic to auth.js');
} else {
  console.log('Could not find target block in auth.js');
}
