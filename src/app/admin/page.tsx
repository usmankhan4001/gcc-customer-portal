import React from 'react';

type CardData = {
  id: number;
  company: string;
  jurisdiction: string;
  flag: string;
  staff: string;
  days: number;
  avatar: string;
};

const newLeads: CardData[] = [
  { id: 1, company: 'Acme Global Ltd', jurisdiction: 'UAE Freezone', flag: '🇦🇪', staff: 'Sarah M.', days: 1, avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { id: 2, company: 'Beta Holdings', jurisdiction: 'BVI', flag: '🇻🇬', staff: 'John D.', days: 2, avatar: 'https://i.pravatar.cc/150?u=john' },
  { id: 7, company: 'Quantum Dynamics', jurisdiction: 'Delaware', flag: '🇺🇸', staff: 'Alice W.', days: 0, avatar: 'https://i.pravatar.cc/150?u=alice' }
];

const kycReview: CardData[] = [
  { id: 3, company: 'TechFlow', jurisdiction: 'HK', flag: '🇭🇰', staff: 'Alice W.', days: 4, avatar: 'https://i.pravatar.cc/150?u=alice' },
  { id: 8, company: 'Alpha Connect', jurisdiction: 'Cyprus', flag: '🇨🇾', staff: 'Bob K.', days: 5, avatar: 'https://i.pravatar.cc/150?u=bob' }
];

const filing: CardData[] = [
  { id: 4, company: 'Zenith Corp', jurisdiction: 'Cayman Islands', flag: '🇰🇾', staff: 'Bob K.', days: 12, avatar: 'https://i.pravatar.cc/150?u=bob' },
  { id: 5, company: 'Global Traders', jurisdiction: 'UAE Mainland', flag: '🇦🇪', staff: 'Sarah M.', days: 8, avatar: 'https://i.pravatar.cc/150?u=sarah' }
];

const done: CardData[] = [
  { id: 6, company: 'Nexus Innovations', jurisdiction: 'Singapore', flag: '🇸🇬', staff: 'John D.', days: 20, avatar: 'https://i.pravatar.cc/150?u=john' },
  { id: 9, company: 'Ozone Tech', jurisdiction: 'UK', flag: '🇬🇧', staff: 'Sarah M.', days: 32, avatar: 'https://i.pravatar.cc/150?u=sarah' }
];

const KanbanCard = ({ card }: { card: CardData }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3">
    <div className="flex justify-between items-start">
      <h4 className="font-semibold text-sm text-slate-800 leading-tight pr-2">{card.company}</h4>
    </div>
    
    <div className="flex items-center">
      <span className="inline-flex items-center text-xs font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200">
        <span className="mr-1.5 text-base leading-none">{card.flag}</span>
        {card.jurisdiction}
      </span>
    </div>
    
    <div className="flex items-center justify-between pt-1 border-t border-slate-50 mt-1">
      <div className="flex items-center space-x-2">
        <img 
          src={card.avatar} 
          alt={card.staff} 
          className="w-6 h-6 rounded-full border border-slate-300 bg-slate-100"
          loading="lazy"
        />
        <span className="text-xs text-slate-600 font-medium">{card.staff}</span>
      </div>
      <div className="flex items-center text-xs text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded">
        <svg className="w-3.5 h-3.5 mr-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        {card.days} {card.days === 1 ? 'day' : 'days'}
      </div>
    </div>
  </div>
);

const KanbanColumn = ({ title, count, cards }: { title: string, count: number, cards: CardData[] }) => (
  <div className="flex flex-col bg-slate-50/50 rounded-xl border border-slate-200 w-full min-w-[320px] max-w-[360px] h-full flex-shrink-0">
    <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
      <h3 className="font-bold text-sm text-slate-800">{title}</h3>
      <span className="bg-white text-slate-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200 shadow-sm">
        {count}
      </span>
    </div>
    <div className="p-3 flex-1 overflow-y-auto">
      {cards.map(card => (
        <KanbanCard key={card.id} card={card} />
      ))}
    </div>
  </div>
);

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex justify-between items-center max-w-[1600px] mx-auto w-full">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Operations Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Manage company formation orders across jurisdictions.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
              Filter
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
              + New Order
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex space-x-5 h-full max-w-[1600px] mx-auto pb-4">
          <KanbanColumn title="New Leads (No KYC)" count={newLeads.length} cards={newLeads} />
          <KanbanColumn title="KYC Review" count={kycReview.length} cards={kycReview} />
          <KanbanColumn title="Filing in Progress" count={filing.length} cards={filing} />
          <KanbanColumn title="Active/Done" count={done.length} cards={done} />
        </div>
      </main>
    </div>
  );
}
