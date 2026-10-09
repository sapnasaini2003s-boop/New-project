const fs = require('fs');

const ICONS = {
  Home: '<svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd"/></svg>',
  Search: '<svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd"/></svg>',
  News: '<svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M2 3a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm2 1v12h12V4H4zm1 2h10v2H5V6zm0 4h10v2H5v-2zm0 4h7v2H5v-2z" clipRule="evenodd"/></svg>',
  Cats: '<svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 1v2h2V5H5zm-2 7a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zm2 1v2h2v-2H5zm6-9a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zm2 1v2h2V5h-2zm-2 7a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4zm2 1v2h2v-2h-2z" clipRule="evenodd"/></svg>',
  Offers: '<svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM9.08 6.72a.75.75 0 011.06-.06l2.5 2.25a.75.75 0 010 1.12l-2.5 2.25a.75.75 0 11-1.008-1.12l1.242-1.118H7a.75.75 0 010-1.5h3.374l-1.242-1.118a.75.75 0 01.053-1.065z" clipRule="evenodd"/></svg>',
  Trending: '<svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.448-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.645-5.323l-3.142.842a.75.75 0 01-.53-.919z" clipRule="evenodd"/></svg>',
  Videos: '<svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M3.25 4A2.25 2.25 0 001 6.25v7.5A2.25 2.25 0 003.25 16h7.5A2.25 2.25 0 0013 13.75v-7.5A2.25 2.25 0 0010.75 4h-7.5zM19 4.75a.75.75 0 00-1.28-.53l-3 3a.75.75 0 00-.22.53v4.5c0 .199.079.39.22.53l3 3a.75.75 0 001.28-.53v-10z"/></svg>',
  Listing: '<svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd"/></svg>',
  Ad: '<svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd"/></svg>',
  User: '<svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>',
  Heart: '<svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.739.739 0 01-.69.001l-.002-.001z"/></svg>',
  Shield: '<svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-1.998A11.954 11.954 0 0110 1.944z" clipRule="evenodd"/></svg>',
  More: '<svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm1 4a1 1 0 100 2h12a1 1 0 100-2H4z" clipRule="evenodd"/></svg>',
  Warn: '<svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 inline-block mr-1"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>'
};

let c = fs.readFileSync('frontend/src/components/Chrome.tsx', 'utf8');

// Replace top bar maintenance icon
c = c.replace(/>\?\? We're doing/g, ">" + ICONS.Warn + " We're doing");

// BottomBar items
// const items = [['??', 'Home', '/'], ['??', 'Search/B2B', '/search'], ['??', 'News/Feed', '/blogs']];
c = c.replace(/const items = \[\[\'\?\?\', \'Home\', \'\/\'\], \[\'\?\?\', \'Search\/B2B\', \'\/search\'\], \[\'\?\?\', \'News\/Feed\', \'\/blogs\'\]\];/g, 
  "const items = [[" + JSON.stringify(ICONS.Home) + ", 'Home', '/'], [" + JSON.stringify(ICONS.Search) + ", 'Search/B2B', '/search'], [" + JSON.stringify(ICONS.News) + ", 'News/Feed', '/blogs']];");

// BottomBar More popup items
c = c.replace(/\[\['\?\?', 'Categories', '\/categories'\], \['\?\?\?', 'Offers', '\/offers'\], \['\?\?', 'Trending', '\/trending'\], \['\?\?', 'Videos', '\/videos'\], \['\?\?', 'Free Listing', '\/register-business'\], \['\?\?', 'Advertise', '\/advertise'\], \['\?\?', 'My Account', '\/vendor\/dashboard'\], \['\?\?', 'Saved', '\/favorites'\], \['\?\?', 'Legal', '\/legal\/disclaimer'\]\]/g, 
  "[[" + JSON.stringify(ICONS.Cats) + ", 'Categories', '/categories'], [" + JSON.stringify(ICONS.Offers) + ", 'Offers', '/offers'], [" + JSON.stringify(ICONS.Trending) + ", 'Trending', '/trending'], [" + JSON.stringify(ICONS.Videos) + ", 'Videos', '/videos'], [" + JSON.stringify(ICONS.Listing) + ", 'Free Listing', '/register-business'], [" + JSON.stringify(ICONS.Ad) + ", 'Advertise', '/advertise'], [" + JSON.stringify(ICONS.User) + ", 'My Account', '/vendor/dashboard'], [" + JSON.stringify(ICONS.Heart) + ", 'Saved', '/favorites'], [" + JSON.stringify(ICONS.Shield) + ", 'Legal', '/legal/disclaimer']]");

// Render raw SVGs using dangerouslySetInnerHTML
c = c.replace(/<span className="text-xl leading-none mb-1">\{i as any\}<\/span>/g, "<span className=\"text-xl leading-none mb-1\" dangerouslySetInnerHTML={{ __html: i as any }}></span>");
c = c.replace(/<span className="text-lg">\?<\/span>More<\/button>/g, "<span className=\"text-lg\" dangerouslySetInnerHTML={{ __html: " + JSON.stringify(ICONS.More) + " }}></span>More</button>");
c = c.replace(/<span className="text-2xl">\{i\}<\/span>/g, "<span className=\"text-2xl\" dangerouslySetInnerHTML={{ __html: i as any }}></span>");

fs.writeFileSync('frontend/src/components/Chrome.tsx', c, 'utf8');
console.log('Done replacing icons in Chrome.tsx');
