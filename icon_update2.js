const fs = require('fs');

const svgStar = '<svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 inline-block mr-0.5"><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd"/></svg>';
const svgBuilding = '<svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 opacity-20"><path d="M5 3v18h14V3H5zm2 2h10v14H7V5zm2 2v2h2V7H9zm4 0v2h2V7h-2zm-4 4v2h2v-2H9zm4 0v2h2v-2h-2zm-4 4v2h2v-2H9zm4 0v2h2v-2h-2z"/></svg>';
const svgPin = '<svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 inline-block mr-0.5"><path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11 0 .308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.53 5.736 5.736 0 00.082.04zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd"/></svg>';
const svgCheck = '<svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 inline-block mr-0.5"><path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/></svg>';
const svgShield = '<svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 inline-block mr-0.5"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-1.998A11.954 11.954 0 0110 1.944zM8.707 10.707a1 1 0 00-1.414-1.414L5.293 11.293a1 1 0 001.414 1.414L8 11.414l3.293 3.293a1 1 0 001.414-1.414L9.414 9.293a1 1 0 00-1.414 1.414L8.707 10.707z" clipRule="evenodd"/></svg>';
const svgLock = '<svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 inline-block mr-0.5"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd"/></svg>';
const svgBolt = '<svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 inline-block mr-0.5"><path d="M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z"/></svg>';
const svgTruck = '<svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 inline-block mr-0.5"><path d="M6.5 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM16.5 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /><path d="M4 4h9v8h2.36l1.83 2.56c.21.3.34.66.36 1.04H17v1.4h-1.5c0 .03 0 .07 0 .1v.17A2.5 2.5 0 0113 18.5a2.5 2.5 0 01-2.5-2.5v-.17c0-.03 0-.07 0-.1H7.5c0 .03 0 .07 0 .1v.17A2.5 2.5 0 015 18.5a2.5 2.5 0 01-2.5-2.5v-.17c0-.03 0-.07 0-.1H2v-4h2V4zm2 2v6h5V6H6zm6 4v2h2.5l-1.43-2H12z" /></svg>';
const svgDoc = '<svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 inline-block mr-0.5"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg>';
const svgMail = '<svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 inline-block mr-0.5"><path d="M3 4a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2H3zm0 1.5l7 4.5 7-4.5v.5l-7 4.5L3 6v-.5z"/></svg>';
const svgTrophy = '<svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 inline-block mr-0.5"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM5.97 3.47a.75.75 0 011.06 0l1.06 1.06a.75.75 0 11-1.06 1.06L5.97 4.53a.75.75 0 010-1.06zm8.06 0a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zM4 8a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H14.5v2c0 2.485-2.015 4.5-4.5 4.5s-4.5-2.015-4.5-4.5v-2h-.25A.75.75 0 014 8zm6 5.5a3 3 0 003-3v-1.5H7v1.5a3 3 0 003 3zM10 17.25a.75.75 0 01.75.75v.5h1.5a.75.75 0 010 1.5h-4.5a.75.75 0 010-1.5h1.5v-.5a.75.75 0 01.75-.75z" clipRule="evenodd"/></svg>';

function processFile(file) {
  let c = fs.readFileSync(file, 'utf8');

  // Fallback building
  c = c.replace(/>\?\?<\/div>/g, ">" + svgBuilding + "</div>");
  c = c.replace(/>\?\?<\/Link>/g, ">" + svgBuilding + "</Link>");
  
  // Replace rating star (it has a question mark currently due to powershell damage)
  c = c.replace(/\{Number\(b\.rating\)\.toFixed\(1\)\} \?<\/span>/g, "{Number(b.rating).toFixed(1)} " + svgStar + "</span>");
  
  // distanceKm
  c = c.replace(/>\?\? \{b\.distanceKm\} km away/g, ">" + svgPin + " {b.distanceKm} km away");
  
  // locked contact
  c = c.replace(/>\?\? XXXXXXXXXX \?\?</g, ">" + svgLock + " XXXXXXXXXX " + svgLock + "<");
  c = c.replace(/>\?\? XXXXXXXXXX <span title="Shown on Premium listings">\?\?</g, ">" + svgLock + " XXXXXXXXXX <span title=\"Shown on Premium listings\">" + svgLock + "<");
  
  // Claim
  c = c.replace(/>\?\? Claim it now!</g, ">" + svgBolt + " Claim it now!<");
  c = c.replace(/>\? Is this your business\? Claim it now!</g, ">" + svgBolt + " Is this your business? Claim it now!<");
  
  // Verified
  c = c.replace(/>\? Verified/g, ">" + svgCheck + " Verified");
  // Trust Seal
  c = c.replace(/>\?\? Trust Seal/g, ">" + svgShield + " Trust Seal");
  // City
  c = c.replace(/>\?\? \{b\.city\}/g, ">" + svgPin + " {b.city}");
  // Top Rated
  c = c.replace(/>\? Top rated/g, ">" + svgTrophy + " Top rated");
  // Delivery
  c = c.replace(/>[^<a-zA-Z0-9]+Delivery/g, ">" + svgTruck + " Delivery");
  // Menu available
  c = c.replace(/>\?\? Menu available/g, ">" + svgDoc + " Menu available");
  // Send Enquiry
  c = c.replace(/>\?\? Send Enquiry/g, ">" + svgMail + " Send Enquiry");

  fs.writeFileSync(file, c, 'utf8');
}

processFile('frontend/src/components/BizCard.tsx');
processFile('frontend/src/components/BizRow.tsx');
console.log('Done');
