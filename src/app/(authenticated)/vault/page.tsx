import { Folder, FileText, Upload, Link as LinkIcon, Download } from 'lucide-react';
import BannerHeader from '@/components/portal/BannerHeader';

export default function Vault() {
  const folders = [
    { name: 'Personal KYC', count: 2, icon: 'shield' },
    { name: 'Corporate Documents', count: 4, icon: 'briefcase' },
    { name: 'Tax Filings', count: 0, icon: 'file' },
  ];

  const recentFiles = [
    { name: 'Passport_Usman_Khan.pdf', size: '2.4 MB', date: 'Oct 12, 2026', type: 'pdf' },
    { name: 'Proof_of_Address.png', size: '1.1 MB', date: 'Oct 12, 2026', type: 'image' },
    { name: 'Trade_License_Draft.pdf', size: '840 KB', date: 'Oct 10, 2026', type: 'pdf' },
  ];

  return (
    <div className="pb-24">
      <BannerHeader title="SECURE VAULT" subtitle="Secure document management and sharing." />

      <div className="p-6 md:p-8 max-w-4xl mx-auto -mt-6 relative z-10">
        <div className="flex justify-end mb-6">
          <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-bold text-sm shadow-sm">
            <Upload className="w-4 h-4" />
            UPLOAD
          </button>
        </div>

        {/* Folders Grid */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4 px-1 tracking-tight">FOLDERS</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {folders.map((folder, idx) => (
              <div key={idx} className="bg-white p-4 rounded-md shadow-sm border border-gray-200 hover:border-red-600 hover:shadow-md transition-all cursor-pointer group flex items-center gap-3">
                <Folder className="w-8 h-8 text-red-600 shrink-0 group-hover:scale-105 transition-transform" />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm uppercase">{folder.name}</h3>
                  <p className="text-xs text-gray-500 font-medium">{folder.count} FILES</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Files List - Dense Table */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4 px-1 tracking-tight">RECENT FILES</h2>
          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-2 font-bold">Name</th>
                  <th className="px-4 py-2 font-bold hidden sm:table-cell">Size</th>
                  <th className="px-4 py-2 font-bold hidden sm:table-cell">Date</th>
                  <th className="px-4 py-2 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentFiles.map((file, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                    <td className="px-4 py-2 flex items-center gap-3">
                      <div className="bg-gray-100 p-1.5 rounded-md shrink-0">
                        <FileText className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm truncate">{file.name}</div>
                        <div className="sm:hidden flex gap-2 text-[10px] text-gray-500 font-medium">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span>{file.date}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 font-medium hidden sm:table-cell">{file.size}</td>
                    <td className="px-4 py-2 text-sm text-gray-600 font-medium hidden sm:table-cell">{file.date}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Create Shareable Link">
                          <LinkIcon className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
