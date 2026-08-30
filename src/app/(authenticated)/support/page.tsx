import { Mail, Phone, MessageCircle } from 'lucide-react';
import BannerHeader from '@/components/portal/BannerHeader';

export default function Support() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <BannerHeader title="Support" subtitle="We are here to help" />
      
      <div className="max-w-4xl mx-auto px-4 md:px-6 -mt-8 relative z-10">
        {/* Support Card */}
        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Online Support</h2>
          </div>
          
          <div className="p-2 flex flex-col gap-2">
            <a href="mailto:support@gccstartup.com" className="flex items-center gap-4 p-4 rounded-md hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
              <div className="bg-red-50 text-red-600 p-3 rounded-md shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">E-mail</h3>
                <p className="text-sm text-gray-500">support@gccstartup.com</p>
              </div>
            </a>

            <a href="tel:+97337728231" className="flex items-center gap-4 p-4 rounded-md hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
              <div className="bg-red-50 text-red-600 p-3 rounded-md shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Call</h3>
                <p className="text-sm text-gray-500">Speak directly with our team</p>
              </div>
            </a>

            <a href="https://wa.me/97337728231" target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 rounded-md hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
              <div className="bg-red-50 text-red-600 p-3 rounded-md shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">WhatsApp</h3>
                <p className="text-sm text-gray-500">Fastest response time</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
