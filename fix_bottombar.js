const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/Chrome.tsx', 'utf8');

// The items in BottomBar
const bottomBarMojibake = `const items = [['??', 'Home', '/'], ['??', 'Search/B2B', '/search'], ['??', 'News/Feed', '/blogs']];`;
const bottomBarFixed = `
  const HomeIcon = <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
  const SearchIcon = <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
  const NewsIcon = <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" /></svg>;
  const MoreIcon = <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
  
  const items = [[HomeIcon, 'Home', '/'], [SearchIcon, 'Search', '/search'], [NewsIcon, 'News', '/blogs']];
`;

code = code.replace(bottomBarMojibake, bottomBarFixed);

// The more menu in BottomBar
const moreMojibake = `[['??', 'Categories', '/categories'], ['???', 'Offers', '/offers'], ['??', 'Trending', '/trending'], ['??', 'Videos', '/videos'], ['??', 'Free Listing', '/register-business'], ['??', 'Advertise', '/advertise'], ['??', 'My Account', '/vendor/dashboard'], ['??', 'Saved', '/favorites'], ['??', 'Legal', '/legal/disclaimer']]`;
const moreFixed = `[['📂', 'Categories', '/categories'], ['🔥', 'Offers', '/offers'], ['📈', 'Trending', '/trending'], ['🎥', 'Videos', '/videos'], ['🏪', 'Free Listing', '/register-business'], ['📢', 'Advertise', '/advertise'], ['👤', 'My Account', '/vendor/dashboard'], ['❤️', 'Saved', '/favorites'], ['⚖️', 'Legal', '/legal/disclaimer']]`;

code = code.replace(moreMojibake, moreFixed);

// More button itself
const moreBtnMojibake = `<button onClick={() => setMore(true)} className="flex flex-col items-center py-2 text-gray-600"><span className="text-lg">?</span>More</button>`;
const moreBtnFixed = `<button onClick={() => setMore(true)} className="flex flex-col items-center py-2 text-gray-600"><span className="text-lg mb-1">{MoreIcon}</span>More</button>`;
code = code.replace(moreBtnMojibake, moreBtnFixed);

// In the items map for the BottomBar
const mapMojibake = `<span className="text-lg">{i}</span>{n}</Link>`;
const mapFixed = `<span className="mb-1">{i as any}</span>{n}</Link>`;
code = code.replace(mapMojibake, mapFixed);

fs.writeFileSync('frontend/src/components/Chrome.tsx', code, 'utf8');
console.log('Fixed BottomBar icons');
