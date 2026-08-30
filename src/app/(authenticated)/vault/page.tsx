import { and, desc, eq } from 'drizzle-orm';
import { Folder, FileText } from 'lucide-react';
import BannerHeader from '@/components/portal/BannerHeader';
import VaultUploader from '@/components/portal/VaultUploader';
import DownloadButton from '@/components/portal/DownloadButton';
import { getServerSession } from '@/lib/session';
import { db } from '@/lib/db';
import { documents } from '@/lib/db/schema';

const CATEGORY_LABELS: Record<string, string> = {
  trade_license: 'Trade License',
  moa_aoa: 'MOA / AOA',
  share_certificate: 'Share Certificate',
  tax_certificate: 'Tax Certificate',
  nominee_poa: 'Nominee POA',
  bank_document: 'Bank Document',
  other: 'Other',
};

export default async function Vault() {
  const session = await getServerSession();
  const rows = session
    ? await db
        .select()
        .from(documents)
        .where(and(eq(documents.user_id, session.userId), eq(documents.status, 'active')))
        .orderBy(desc(documents.created_at))
    : [];

  const byCategory = rows.reduce<Record<string, number>>((acc, doc) => {
    acc[doc.category] = (acc[doc.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="pb-24">
      <BannerHeader title="SECURE VAULT" subtitle="Secure document management and sharing." />

      <div className="p-6 md:p-8 max-w-4xl mx-auto -mt-6 relative z-10">
        <div className="flex justify-end mb-6">
          <VaultUploader />
        </div>

        {/* Folders Grid */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4 px-1 tracking-tight">FOLDERS</h2>
          {Object.keys(byCategory).length === 0 ? (
            <div className="bg-white rounded-md border border-gray-200 p-6 text-center text-sm text-gray-400">
              No documents yet. Upload your first one above.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(byCategory).map(([category, count]) => (
                <div key={category} className="bg-white p-4 rounded-md shadow-sm border border-gray-200 hover:border-red-600 hover:shadow-md transition-all cursor-pointer group flex items-center gap-3">
                  <Folder className="w-8 h-8 text-red-600 shrink-0 group-hover:scale-105 transition-transform" />
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm uppercase">{CATEGORY_LABELS[category] ?? category}</h3>
                    <p className="text-xs text-gray-500 font-medium">{count} FILE{count === 1 ? '' : 'S'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent Files List */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4 px-1 tracking-tight">RECENT FILES</h2>
          <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
            {rows.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">No files uploaded yet.</div>
            ) : (
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
                  {rows.map((file) => (
                    <tr key={file.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-b-0">
                      <td className="px-4 py-2 flex items-center gap-3">
                        <div className="bg-gray-100 p-1.5 rounded-md shrink-0">
                          <FileText className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-sm truncate">{file.file_name}</div>
                          <div className="sm:hidden flex gap-2 text-[10px] text-gray-500 font-medium">
                            <span>{file.file_size_bytes ? `${(file.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : '—'}</span>
                            <span>•</span>
                            <span>{new Date(file.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 font-medium hidden sm:table-cell">
                        {file.file_size_bytes ? `${(file.file_size_bytes / 1024 / 1024).toFixed(1)} MB` : '—'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-600 font-medium hidden sm:table-cell">
                        {new Date(file.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <DownloadButton documentId={file.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
