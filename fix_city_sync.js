const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/Listing.tsx', 'utf8');

const target = `  const [city, setCity] = useState('');\n  useEffect(() => { setCity(getCity()); }, []);`;
const replacement = `  const [city, setCity] = useState('');\n  useEffect(() => { setCity(getCity()); const f = () => setCity(getCity()); window.addEventListener('pvrs-city', f); return () => window.removeEventListener('pvrs-city', f); }, []);`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('frontend/src/components/Listing.tsx', code, 'utf8');
  console.log('Fixed pvrs-city sync in Listing.tsx');
} else {
  console.log('Could not find target block in Listing.tsx to fix city sync');
}
