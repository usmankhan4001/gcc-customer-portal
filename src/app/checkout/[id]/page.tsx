"use client";

import { useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ChevronRight, Building2, CreditCard } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CheckoutWizard({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nameOption1: '',
    nameOption2: '',
    nameOption3: '',
    tier: 'standard', // basic, standard, premium
  });

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: formData.tier,
          companyName: formData.nameOption1,
          jurisdiction: resolvedParams.id
        })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Payment failed to initialize.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          {step === 1 ? (
            <Link href={`/services/${resolvedParams.id}`} className="p-1 -ml-1 rounded-md hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-900" />
            </Link>
          ) : (
            <button onClick={handleBack} className="p-1 -ml-1 rounded-md hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-900" />
            </button>
          )}
          <h1 className="ml-2 text-base font-black text-gray-900 uppercase tracking-tight">Checkout</h1>
        </div>
        <div className="text-xs font-black text-red-600 bg-red-50 px-2 py-1 rounded-sm border border-red-100 uppercase tracking-wider">
          Step {step} of 3
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-1">
        <div 
          className="bg-red-600 h-1 transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-grow p-4 md:p-6 max-w-2xl mx-auto w-full pb-32">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-3">
              <Building2 className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Company Name</h2>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-6">Provide 3 options for your new company name. The registry will approve the first available one.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">Option 1 (Preferred)</label>
                <input 
                  type="text" 
                  value={formData.nameOption1}
                  onChange={(e) => setFormData({...formData, nameOption1: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-md border-2 border-gray-300 focus:border-red-600 focus:ring-0 outline-none transition-all font-bold text-sm text-gray-900 placeholder:font-medium placeholder:text-gray-400"
                  placeholder="ACME GLOBAL LTD."
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">Option 2</label>
                <input 
                  type="text" 
                  value={formData.nameOption2}
                  onChange={(e) => setFormData({...formData, nameOption2: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-md border-2 border-gray-300 focus:border-red-600 focus:ring-0 outline-none transition-all font-bold text-sm text-gray-900 placeholder:font-medium placeholder:text-gray-400"
                  placeholder="ALTERNATIVE NAME"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-1.5">Option 3</label>
                <input 
                  type="text" 
                  value={formData.nameOption3}
                  onChange={(e) => setFormData({...formData, nameOption3: e.target.value})}
                  className="w-full px-3 py-2.5 rounded-md border-2 border-gray-300 focus:border-red-600 focus:ring-0 outline-none transition-all font-bold text-sm text-gray-900 placeholder:font-medium placeholder:text-gray-400"
                  placeholder="ALTERNATIVE NAME"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight border-b border-gray-200 pb-3 mb-5">Select Package</h2>
            
            <div className="space-y-4">
              <label 
                className={`block relative p-4 rounded-md border-2 cursor-pointer transition-all ${
                  formData.tier === 'basic' ? 'border-red-600 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <input 
                  type="radio" 
                  name="tier" 
                  value="basic"
                  checked={formData.tier === 'basic'}
                  onChange={() => setFormData({...formData, tier: 'basic'})}
                  className="sr-only"
                />
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-black text-gray-900 uppercase tracking-wide">Self UBO (Basic)</span>
                  <span className="font-black text-gray-900">$1,500</span>
                </div>
                <p className="text-sm text-gray-700 font-medium leading-snug">You are the registered director. Includes company formation and government fees.</p>
                {formData.tier === 'basic' && <div className="absolute top-4 right-4 w-3.5 h-3.5 rounded-full bg-red-600" />}
              </label>

              <label 
                className={`block relative p-4 rounded-md border-2 cursor-pointer transition-all ${
                  formData.tier === 'standard' ? 'border-red-600 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="absolute -top-2.5 left-3 bg-gray-900 text-white text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest">RECOMMENDED</div>
                <input 
                  type="radio" 
                  name="tier" 
                  value="standard"
                  checked={formData.tier === 'standard'}
                  onChange={() => setFormData({...formData, tier: 'standard'})}
                  className="sr-only"
                />
                <div className="flex justify-between items-start mb-1.5">
                  <span className="font-black text-gray-900 uppercase tracking-wide">Nominee UBO</span>
                  <span className="font-black text-gray-900">$3,500</span>
                </div>
                <p className="text-sm text-gray-700 font-medium leading-snug">Full privacy. GCCStartup acts as the registered nominee. Includes 1 bank account setup.</p>
                {formData.tier === 'standard' && <div className="absolute top-4 right-4 w-3.5 h-3.5 rounded-full bg-red-600" />}
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-3">
              <CreditCard className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tight">Summary & Payment</h2>
            </div>
            
            <div className="bg-white rounded-md shadow-sm border-2 border-gray-200 overflow-hidden mb-5">
              <div className="p-4 border-b-2 border-gray-100">
                <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Company Name</div>
                <div className="font-bold text-gray-900 uppercase text-sm">{formData.nameOption1 || 'NOT PROVIDED'}</div>
              </div>
              <div className="p-4 border-b-2 border-gray-100 flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-900 uppercase text-sm">{formData.tier === 'basic' ? 'Basic Package' : 'Nominee UBO Package'}</div>
                  <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">Formation + Gov Fees</div>
                </div>
                <div className="font-black text-gray-900">$ {formData.tier === 'basic' ? '1,500' : '3,500'}</div>
              </div>
              <div className="p-4 bg-gray-50 flex justify-between items-center border-t border-gray-200">
                <div className="font-black text-gray-900 uppercase tracking-wider text-sm">Total Due</div>
                <div className="font-black text-red-600 text-xl">$ {formData.tier === 'basic' ? '1,500' : '3,500'}</div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 p-4 rounded-md flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-900 font-bold leading-relaxed">
                NO KYC REQUIRED NOW. YOU WILL BE PROMPTED TO UPLOAD YOUR ID SECURELY FROM YOUR DASHBOARD AFTER PAYMENT IS CONFIRMED.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-20 p-4">
        <div className="max-w-2xl mx-auto w-full flex justify-between items-center">
          {step < 3 ? (
            <button 
              onClick={handleNext}
              disabled={step === 1 && !formData.nameOption1}
              className="w-full flex items-center justify-center gap-2 bg-red-600 disabled:bg-red-300 hover:bg-red-700 text-white font-black py-3.5 px-6 rounded-md shadow-sm transition duration-200 text-sm uppercase tracking-widest"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-black py-3.5 px-6 rounded-md shadow-sm transition duration-200 text-sm uppercase tracking-widest relative overflow-hidden"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  PROCESSING...
                </span>
              ) : (
                'PAY WITH STRIPE'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
