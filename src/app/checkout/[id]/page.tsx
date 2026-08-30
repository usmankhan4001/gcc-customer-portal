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

  const handleCheckout = () => {
    setLoading(true);
    // Mock checkout API call
    setTimeout(() => {
      setLoading(false);
      // Redirect back to dashboard after "payment"
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          {step === 1 ? (
            <Link href={`/services/${resolvedParams.id}`} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Link>
          ) : (
            <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          <h1 className="ml-2 text-lg font-bold text-gray-900">Secure Checkout</h1>
        </div>
        <div className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          Step {step} of 3
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-1.5">
        <div 
          className="bg-blue-600 h-1.5 transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-grow p-6 md:p-8 max-w-2xl mx-auto w-full pb-32">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Building2 className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Company Name</h2>
            </div>
            <p className="text-gray-600 font-medium mb-8">Provide 3 options for your new company name. The registry will approve the first available one.</p>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Option 1 (Preferred)</label>
                <input 
                  type="text" 
                  value={formData.nameOption1}
                  onChange={(e) => setFormData({...formData, nameOption1: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium"
                  placeholder="e.g. Acme Global Ltd."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Option 2</label>
                <input 
                  type="text" 
                  value={formData.nameOption2}
                  onChange={(e) => setFormData({...formData, nameOption2: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium"
                  placeholder="Alternative name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Option 3</label>
                <input 
                  type="text" 
                  value={formData.nameOption3}
                  onChange={(e) => setFormData({...formData, nameOption3: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-medium"
                  placeholder="Alternative name"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Select Package</h2>
            
            <div className="space-y-4">
              <label 
                className={`block relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  formData.tier === 'basic' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
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
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-900 text-lg">Self UBO (Basic)</span>
                  <span className="font-black text-gray-900 text-lg">$1,500</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">You are the registered director. Includes company formation and government fees.</p>
                {formData.tier === 'basic' && <div className="absolute top-5 right-5 w-4 h-4 rounded-full bg-blue-600" />}
              </label>

              <label 
                className={`block relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  formData.tier === 'standard' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="absolute -top-3 left-4 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">RECOMMENDED</div>
                <input 
                  type="radio" 
                  name="tier" 
                  value="standard"
                  checked={formData.tier === 'standard'}
                  onChange={() => setFormData({...formData, tier: 'standard'})}
                  className="sr-only"
                />
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-900 text-lg">Nominee UBO</span>
                  <span className="font-black text-gray-900 text-lg">$3,500</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Full privacy. GCCStartup acts as the registered nominee. Includes 1 bank account setup.</p>
                {formData.tier === 'standard' && <div className="absolute top-5 right-5 w-4 h-4 rounded-full bg-blue-600" />}
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <CreditCard className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Summary & Payment</h2>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="p-5 border-b border-gray-100">
                <div className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Company Name</div>
                <div className="font-bold text-gray-900">{formData.nameOption1 || 'Not provided'}</div>
              </div>
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <div className="font-bold text-gray-900">{formData.tier === 'basic' ? 'Basic Package' : 'Nominee UBO Package'}</div>
                  <div className="text-sm text-gray-500 font-medium">Formation + Gov Fees</div>
                </div>
                <div className="font-black text-gray-900">{formData.tier === 'basic' ? '$1,500' : '$3,500'}</div>
              </div>
              <div className="p-5 bg-gray-50 flex justify-between items-center">
                <div className="font-black text-gray-900 text-xl">Total Due Today</div>
                <div className="font-black text-blue-600 text-2xl">{formData.tier === 'basic' ? '$1,500' : '$3,500'}</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 font-medium">
                No KYC required right now. You will be prompted to upload your ID securely from your dashboard after payment is confirmed.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] flex justify-between items-center z-20">
        {step < 3 ? (
          <button 
            onClick={handleNext}
            disabled={step === 1 && !formData.nameOption1}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 disabled:bg-blue-300 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl shadow-md transition duration-200 text-lg"
          >
            Continue <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button 
            onClick={handleCheckout}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-bold py-4 px-8 rounded-xl shadow-md transition duration-200 text-lg relative overflow-hidden"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Pay with Stripe'
            )}
          </button>
        )}
      </div>
    </div>
  );
}
