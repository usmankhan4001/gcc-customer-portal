import { Building2, Calculator, ShieldCheck, HelpCircle, FileText, Globe } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <header className="mb-10 mt-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back, Usman</h1>
        <p className="text-gray-500 mt-2 font-medium">Manage your global structures and compliance.</p>
      </header>

      {/* Grid: Services */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Services</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Link href="/services" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:border-blue-500 hover:shadow-md transition-all group">
            <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">Start a Company</span>
          </Link>
          <button className="text-left bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:border-blue-500 hover:shadow-md transition-all group">
            <div className="bg-orange-50 w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-orange-100 transition-colors">
              <Globe className="w-6 h-6 text-orange-500" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">Tax Residency</span>
          </button>
          <button className="text-left bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:border-blue-500 hover:shadow-md transition-all group">
            <div className="bg-emerald-50 w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">Renewals</span>
          </button>
        </div>
      </section>

      {/* Grid: Free Tools */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Tools & Calculators</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Link href="/tools/tax-calculator" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:border-blue-500 hover:shadow-md transition-all group">
            <div className="bg-purple-50 w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <Calculator className="w-6 h-6 text-purple-600" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">Tax Savings</span>
          </Link>
          <button className="text-left bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 hover:border-blue-500 hover:shadow-md transition-all group">
            <div className="bg-indigo-50 w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <FileText className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">Generate NDA</span>
          </button>
        </div>
      </section>

      {/* Grid: Quick Actions */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:bg-gray-50 transition-colors">
            <div className="bg-gray-100 p-2 rounded-lg">
              <HelpCircle className="w-5 h-5 text-gray-600" />
            </div>
            <span className="font-semibold text-gray-800 text-sm">Support Chat</span>
          </button>
        </div>
      </section>

      {/* Feed */}
      <section className="pb-10 pt-4 border-t border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-6 px-1">Recent Activity</h2>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-orange-500 flex items-start gap-4">
            <div className="flex-grow">
              <h4 className="font-bold text-gray-900 text-sm">Action Required: KYC</h4>
              <p className="text-sm text-gray-500 mt-1">Please upload your passport copy to complete the UAE company formation setup.</p>
            </div>
            <button className="text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full whitespace-nowrap">Upload</button>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4 opacity-75">
            <div className="flex-grow">
              <h4 className="font-bold text-gray-900 text-sm">Account Created</h4>
              <p className="text-sm text-gray-500 mt-1">Welcome to GCC Startup. Your journey begins here.</p>
            </div>
            <span className="text-xs text-gray-400 font-medium">2h ago</span>
          </div>
        </div>
      </section>
    </div>
  );
}
