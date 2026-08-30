import React from 'react';
import BannerHeader from '@/components/portal/BannerHeader';
import SummaryCard from '@/components/portal/SummaryCard';
import ServiceTile from '@/components/portal/ServiceTile';
import PipelineStepTracker from '@/components/portal/PipelineStepTracker';
import { FileText, Building, Calculator, Search, Receipt, LayoutDashboard, Calendar, Users } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-8">
      <BannerHeader title="PERSONALIZED DASHBOARD" />
      
      <div className="px-4 -mt-8 relative z-10 max-w-4xl mx-auto w-full">
        <SummaryCard 
          title="Total Balance" 
          balance="Rs 705,500" 
          totalIncome="Rs 710,500" 
          totalExpense="Rs 5,000" 
        />
      </div>

      <div className="px-4 mt-6 max-w-4xl mx-auto w-full">
        <PipelineStepTracker 
          steps={['In Queue', 'Under Review', 'Submitted', 'Case closed']} 
          currentStep={1} 
        />
      </div>

      <div className="px-4 mt-8 max-w-4xl mx-auto w-full">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Services</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
          <ServiceTile 
            icon={<Calculator className="w-6 h-6 text-blue-600" />} 
            title="Tax Calculator" 
            href="/tools/tax-calculator" 
          />
          <ServiceTile 
            icon={<Search className="w-6 h-6 text-purple-600" />} 
            title="Name Checker" 
            href="/tools/name-checker" 
          />
          <ServiceTile 
            icon={<Building className="w-6 h-6 text-green-600" />} 
            title="Company Reg" 
            href="/tools/company-registration" 
          />
          <ServiceTile 
            icon={<FileText className="w-6 h-6 text-orange-600" />} 
            title="Documents" 
            href="/documents" 
          />
          <ServiceTile 
            icon={<Receipt className="w-6 h-6 text-red-600" />} 
            title="Invoices" 
            href="/invoices" 
          />
          <ServiceTile 
            icon={<Calendar className="w-6 h-6 text-teal-600" />} 
            title="Compliance" 
            href="/tools/compliance-calendar" 
          />
          <ServiceTile 
            icon={<Users className="w-6 h-6 text-pink-600" />} 
            title="Visa Costs" 
            href="/tools/visa-estimator" 
          />
          <ServiceTile 
            icon={<LayoutDashboard className="w-6 h-6 text-indigo-600" />} 
            title="More Tools" 
            href="/tools" 
          />
        </div>
      </div>
    </div>
  );
}
