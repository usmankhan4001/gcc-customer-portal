import Link from 'next/link';
import { redirect } from 'next/navigation';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { PageHeader } from '@/components/admin/PageHeader';
import { DocumentActions } from '@/components/admin/DocumentActions';
import { db } from '@/lib/db';
import { companies, documents, users } from '@/lib/db/schema';
import { requireStaff } from '@/lib/staff/session';
import { can, canOnClient } from '@/lib/staff/roles';
import { companyScope } from '@/lib/staff/queries';
import { REVIEW_LABEL } from '@/lib/staff/documents';
import { ageDays, formatDate } from '@/lib/staff/ui';

export const dynamic = 'force-dynamic';

/** Documents waiting for a decision, oldest first, across every client this person may see. */
export default async function DocumentsQueuePage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const staff = await requireStaff();
  if (!staff) redirect('/auth?redirect=/admin/documents');
  if (!can(staff.dbRole, 'documents.review')) redirect('/admin/dashboard');

  const showAll = (await searchParams).show === 'all';
  const client = alias(users, 'client_user');
  const rows = await db
    .select({
      doc: documents,
      companyId: companies.id,
      companyName: companies.company_name,
      assignedTo: companies.assigned_to,
      clientName: client.full_name,
    })
    .from(documents)
    .innerJoin(companies, eq(documents.company_id, companies.id))
    .leftJoin(client, eq(companies.user_id, client.id))
    .where(
      and(
        companyScope(staff),
        eq(documents.kind, 'client_upload'),
        eq(documents.status, 'active'),
        showAll ? undefined : inArray(documents.review_status, ['uploaded', 'under_review']),
      ),
    )
    .orderBy(asc(documents.created_at))
    .limit(300);

  return (
    <div className="wrap admin-page">
      <PageHeader
        eyebrow="Day to day"
        title="Documents"
        subtitle={showAll ? 'Every client upload.' : 'Waiting for a decision, oldest first.'}
        actions={<Link href={showAll ? '/admin/documents' : '/admin/documents?show=all'} className="btn">{showAll ? 'Only waiting' : 'Show all'}</Link>}
      />

      <div className="admin-table-card">
        {rows.length === 0 ? (
          <div className="cl-empty"><p>{showAll ? 'No documents yet.' : 'Nothing is waiting for review.'}</p></div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Document</th><th className="hide-phone">Client</th><th>Status</th><th className="hide-phone">Uploaded</th><th className="is-right">Actions</th></tr>
              </thead>
              <tbody>
                {rows.map(({ doc, companyId, companyName, assignedTo, clientName }) => (
                  <tr key={doc.id}>
                    <td><strong>{doc.file_name}</strong><div>{doc.category.replace(/_/g, ' ')}</div></td>
                    <td className="hide-phone"><Link href={`/admin/companies/${companyId}?tab=documents`}>{clientName ?? 'Client'}</Link><div>{companyName}</div></td>
                    <td>{REVIEW_LABEL[doc.review_status]}{doc.rejection_reason && <div>{doc.rejection_reason}</div>}</td>
                    <td className="hide-phone">{formatDate(doc.created_at)}<div>{ageDays(doc.created_at)} ago</div></td>
                    <td className="is-right">
                      <DocumentActions
                        documentId={doc.id}
                        reviewStatus={doc.review_status}
                        canReview={canOnClient(staff.dbRole, 'documents.review', staff.userId, assignedTo)}
                        canView={canOnClient(staff.dbRole, doc.category === 'passport' || doc.category === 'proof_of_address' ? 'kyc.view' : 'documents.review', staff.userId, assignedTo)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
