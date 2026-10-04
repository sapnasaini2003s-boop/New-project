const fs = require('fs');

let content = fs.readFileSync('frontend/src/app/business/[id]/page.tsx', 'utf8');

// 1. Insert `const isOwner = ...`
const isOwnerLine = `
  const isFood = /food|restaurant/.test(b.category);
  const isMedical = /health|medical|hospital/.test(b.category);
  const isOwner = user && (b.ownerId === user._id || b.contact?.phone === user.phone);
`;
content = content.replace(/const isFood = \/food\|restaurant\/\.test\(b\.category\);\s*const isMedical = \/health\|medical\|hospital\/\.test\(b\.category\);/, isOwnerLine.trim());


// 2. Hide Enquiry form
content = content.replace(/\{f\.enquiries !== false && <form id="enquiry"/, '{f.enquiries !== false && !isOwner && <form id="enquiry"');


// 3. Hide Review form
const originalReviewCheck = `f.reviews === false ? <p className="text-xs text-gray-400 mb-3">Reviews are paused right now.</p> : (user || f.guestReviews) ? (`;
const newReviewCheck = `isOwner ? <p className="text-xs bg-brand/10 text-brand p-2 rounded-xl mb-3 font-semibold">You are viewing your own profile. You cannot review your own business.</p> : ` + originalReviewCheck;
content = content.replace(originalReviewCheck, newReviewCheck);

// Optional: Hide Report form if owner (why report yourself?)
content = content.replace(/\{f\.reports !== false && <button onClick/, '{f.reports !== false && !isOwner && <button onClick');

fs.writeFileSync('frontend/src/app/business/[id]/page.tsx', content, 'utf8');
console.log('Fixed owner logic!');
