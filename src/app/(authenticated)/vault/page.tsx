import { Folder, FileText, Upload, MoreVertical, Link as LinkIcon, Download } from 'lucide-react';

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
    <div className="p-6 md:p-8 max-w-3xl mx-auto pb-24">
      <header className="mb-8 mt-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">The Vault</h1>
          <p className="text-gray-500 mt-2 font-medium">Secure document management and sharing.</p>
        </div>
        <button className="bg-blue-50 text-blue-600 p-3 rounded-full hover:bg-blue-100 transition-colors">
          <Upload className="w-6 h-6" />
        </button>
      </header>

      {/* Folders Grid */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Folders</h2>
        <div className="grid grid-cols-2 gap-4">
          {folders.map((folder, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group">
              <Folder className="w-10 h-10 text-blue-500 mb-3 group-hover:scale-105 transition-transform" />
              <h3 className="font-bold text-gray-900 text-sm">{folder.name}</h3>
              <p className="text-xs text-gray-500 font-medium mt-1">{folder.count} files</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Files List */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Recent Files</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {recentFiles.map((file, idx) => (
            <div key={idx} className={`p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${idx !== recentFiles.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="bg-gray-100 p-2.5 rounded-xl shrink-0">
                  <FileText className="w-6 h-6 text-gray-600" />
                </div>
                <div className="truncate pr-4">
                  <h4 className="font-bold text-gray-900 text-sm truncate">{file.name}</h4>
                  <div className="flex gap-2 text-xs text-gray-500 font-medium mt-1">
                    <span>{file.size}</span>
                    <span>•</span>
                    <span>{file.date}</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons for File */}
              <div className="flex items-center gap-1 shrink-0">
                <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Create Shareable Link">
                  <LinkIcon className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
