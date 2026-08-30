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
    <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl shadow-lg p-6 text-white w-full max-w-md mx-auto">
      <h2 className="text-lg font-medium opacity-90 mb-1">{title}</h2>
      <div className="text-4xl font-bold mb-6">{balance}</div>
      
      <div className="flex justify-between items-center bg-white/20 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex flex-col">
          <span className="text-sm font-medium opacity-80 uppercase tracking-wider">Income</span>
          <span className="text-lg font-semibold">{totalIncome}</span>
        </div>
        <div className="w-px h-10 bg-white/30 mx-4"></div>
        <div className="flex flex-col text-right">
          <span className="text-sm font-medium opacity-80 uppercase tracking-wider">Expense</span>
          <span className="text-lg font-semibold">{totalExpense}</span>
        </div>
      </div>
    </div>
  );
}
