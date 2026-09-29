import React from 'react';
import Link from 'next/link';

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-4">Legal Policies & Grievance</h1>
          
          <div className="prose max-w-none text-gray-600 space-y-6 text-sm">
             <section>
                <h2 className="text-xl font-bold text-gray-800 mb-2">1. Website Disclaimer</h2>
                <p>This platform operates under the intermediary guidelines of Section 79 of the Information Technology Act, 2000. All business listings, including medical profiles, are subjected to a strict Three-Possibility Rule. We do not guarantee the medical efficacy of any listed healthcare provider. Visitors are advised to double-check medical credentials before making any decisions.</p>
             </section>

             <section>
                <h2 className="text-xl font-bold text-gray-800 mb-2">2. Privacy Policy</h2>
                <p>We collect mandatory Mobile OTP logs for authentication via Firebase and temporary GPS logs for location-based search services. This data is heavily encrypted. We do not sell your OTP or location data to unauthorized third parties.</p>
             </section>

             <section>
                <h2 className="text-xl font-bold text-gray-800 mb-2">3. Business Terms of Use</h2>
                <p>Vendors hold complete liability for the products and services they list. Any attempt to bypass the **Anti-Switch Trick Control** by uploading fraudulent Trade Licenses or FSSAI certificates will result in immediate suspension and permanent ban.</p>
             </section>

             <section className="bg-gray-100 p-4 rounded-lg mt-8">
                <h2 className="text-lg font-bold text-gray-800 mb-2">Grievance Officer</h2>
                <p>For instant takedown requests or complaints regarding listed content, please contact our mandatory Grievance Officer at:</p>
                <p className="font-bold text-blue-600 mt-2">legal@pvrshub.com</p>
             </section>
          </div>
        </div>
      </div>
    </div>
  );
}
