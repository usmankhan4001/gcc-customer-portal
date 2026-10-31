import React from 'react';

interface SummaryCardProps {
  title: string;
  balance?: string;
  totalIncome?: string;
  totalExpense?: string;
}

export default function SummaryCard({ 
  title, 
  balance = '$0.00', 
  totalIncome = '$0.00', 
  totalExpense = '$0.00' 
}: SummaryCardProps) {
  return (
    <div className="bg-[#14204A] border border-[#1E293B] rounded-2xl sm:rounded-3xl shadow-[0_10px_25px_-5px_rgba(10,20,47,0.15)] p-6 sm:p-7 text-white w-full max-w-md mx-auto lg:max-w-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#F26522]">{title}</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/90">FINANCIAL OVERVIEW</span>
      </div>
      <div className="text-3xl sm:text-4xl font-bold font-heading mb-6 tracking-tight text-white">{balance}</div>
      
      <div className="flex justify-between items-center bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Revenue / Inflow</span>
          <span className="text-base sm:text-lg font-bold text-[#DCFCE7] font-mono mt-0.5">{totalIncome}</span>
        </div>
        <div className="w-px h-8 bg-white/20 mx-3"></div>
        <div className="flex flex-col text-right">
          <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">Operating Expense</span>
          <span className="text-base sm:text-lg font-bold text-white font-mono mt-0.5">{totalExpense}</span>
        </div>
      </div>
    </div>
  );
}
