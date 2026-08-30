import { and, eq, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import { documentAccessLog, documents, shareableLinks } from '@/lib/db/schema';
import { getPresignedDownloadUrl } from '@/lib/r2';
import { FileText, ShieldWarning } from '@phosphor-icons/react/dist/ssr';

export default async function SharedDocumentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [link] = await db
    .select()
    .from(shareableLinks)
    .where(and(eq(shareableLinks.token, token), eq(shareableLinks.revoked, false), gt(shareableLinks.expires_at, new Date())))
    .limit(1);

  if (!link) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-8 text-center max-w-sm">
          <ShieldWarning size={40} weight="duotone" className="text-destructive mx-auto mb-3" />
          <h1 className="text-lg font-bold text-gray-900 mb-1">Link expired or invalid</h1>
          <p className="text-sm text-gray-500">This shareable link is no longer active. Ask the sender for a new one.</p>
        </div>
      </div>
    );
  }

  const [document] = await db.select().from(documents).where(eq(documents.id, link.document_id)).limit(1);
  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-8 text-center max-w-sm">
          <ShieldWarning size={40} weight="duotone" className="text-destructive mx-auto mb-3" />
          <h1 className="text-lg font-bold text-gray-900">Document no longer available</h1>
        </div>
      </div>
    );
  }

  const downloadUrl = await getPresignedDownloadUrl(document.r2_key);

  await db.insert(documentAccessLog).values({ document_id: document.id, action: 'viewed' });
  await db
    .update(shareableLinks)
    .set({ access_count: link.access_count + 1 })
    .where(eq(shareableLinks.id, link.id));

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-md shadow-sm border border-gray-200 p-8 text-center max-w-sm w-full">
        <FileText size={40} weight="duotone" className="text-primary mx-auto mb-3" />
        <h1 className="text-lg font-bold text-gray-900 mb-1">{document.file_name}</h1>
        <p className="text-sm text-gray-500 mb-6">Shared securely via GCCStartup Vault.</p>
        <a
          href={downloadUrl}
          className="inline-block w-full bg-primary hover:bg-primary-700 text-white text-sm font-bold py-2.5 px-4 rounded-md transition-colors"
        >
          Download
        </a>
      </div>
    </div>
  );
}
