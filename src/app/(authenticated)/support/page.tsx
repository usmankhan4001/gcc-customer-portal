import BannerHeader from '@/components/portal/BannerHeader';
import { Mail, Phone, MessageCircle } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <BannerHeader title="ONLINE SUPPORT" subtitle="How do you want to connect with us?" />
      
      <main className="flex-1 max-w-md w-full mx-auto p-4 flex items-center justify-center -mt-8">
        <div className="bg-white rounded-md shadow-md border border-gray-200 p-8 w-full">
          <p className="text-center text-gray-700 font-medium mb-6 text-sm">Please select below any option from below</p>
          
          <div className="flex justify-center items-center gap-4">
            <button className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-gray-600">e-mail</span>
            </button>
            
            <button className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-full border border-red-200 flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors">
                <Phone className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-gray-600">Call</span>
            </button>
            
            <a href="https://wa.me/97337728231" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 rounded-full border border-green-200 flex items-center justify-center text-green-600 hover:bg-green-50 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-gray-600">WhatsApp</span>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
