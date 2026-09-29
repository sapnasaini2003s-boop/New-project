'use client';
import React, { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOTP = async () => {
    if(!name) return alert('Enter your name');
    if(phone.length !== 10) return alert('Enter valid 10 digit number');
    
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/users/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      if(res.ok) {
        setStep(2);
        alert('Mock OTP sent: 123456'); 
      } else {
        alert('Failed to send OTP');
      }
    } catch(err) { console.error(err); }
    setLoading(false);
  };

  const verifySignup = async () => {
    if(otp.length !== 6) return alert('Enter 6 digit OTP');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, otp })
      });
      const data = await res.json();
      if(res.ok) {
        alert('Signup Successful! Your account is pending admin approval.');
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/vendor/dashboard';
      } else {
        alert(data.message || 'Error');
      }
    } catch(err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-blue-900 text-3xl font-bold mb-2">📍 PVRS HUB</div>
          <h1 className="text-xl font-bold text-gray-800">Create Vendor Account</h1>
          <p className="text-sm text-gray-500 mt-1">Signup to list your business</p>
        </div>

        {step === 1 ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              type="text" 
              className="w-full rounded-md border border-gray-300 px-3 py-2 mb-4 focus:border-blue-500 outline-none" 
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <div className="flex mb-6">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                +91
              </span>
              <input 
                type="text" 
                maxLength={10}
                className="flex-1 block w-full rounded-none rounded-r-md border border-gray-300 px-3 py-2 focus:border-blue-500 outline-none" 
                placeholder="Enter 10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            
            <button 
              onClick={requestOTP}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Get OTP'}
            </button>
            <div className="mt-4 text-center text-sm">
               Already have an account? <Link href="/login" className="text-blue-600 font-bold hover:underline">Login here</Link>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4 text-center">OTP sent to +91 {phone}</p>
            <div className="flex justify-center mb-6">
              <input 
                type="text" 
                maxLength={6} 
                placeholder="Enter 6 digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-widest border border-gray-300 rounded-md text-lg py-2 focus:border-blue-500 outline-none" 
              />
            </div>
            <button 
              onClick={verifySignup}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Verify & Signup'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
