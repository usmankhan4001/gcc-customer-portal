import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { and, eq, ne, desc, isNull, or } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { catalogDocumentRequirements, companies, documents, documentVersions } from '@/lib/db/schema';
import { UPLOAD_MIME_TYPES } from '@/lib/catalog/checklist';

interface PresignRequest {
  category?: string;
  company_id?: string;
  requirement_key?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  expiry_date?: string;
}

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PRESIGN_EXPIRY_SECONDS = 900; // 15 minutes
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('gcc_session')?.value;
    const session = token ? await verifyToken(token) : null;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as PresignRequest;
    const { file_name, file_size, mime_type, expiry_date, company_id, requirement_key } = body;
    const category = body.category ?? (requirement_key ? 'other' : '');

    if (!category || !file_name || !file_size || !mime_type) {
      return NextResponse.json(
        { error: 'Missing required fields: category, file_name, file_size, mime_type' },
        { status: 400 }
      );
    }

    if (file_size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Checklist upload: the file answers one catalog requirement of one of the client's own paid companies.
    let requirement: typeof catalogDocumentRequirements.$inferSelect | undefined;
    let company: typeof companies.$inferSelect | undefined;
    if (requirement_key) {
      if (!company_id || !(UPLOAD_MIME_TYPES as readonly string[]).includes(mime_type)) {
        return NextResponse.json({ error: 'Upload a PDF, JPG, PNG, WebP or HEIC file for this company.' }, { status: 400 });
      }
      [company] = await db
        .select()
        .from(companies)
        .where(and(eq(companies.id, company_id), eq(companies.user_id, session.userId), ne(companies.status, 'lead')))
        .limit(1);
      if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      [requirement] = await db
        .select()
        .from(catalogDocumentRequirements)
        .where(
          and(
            eq(catalogDocumentRequirements.jurisdiction, company.jurisdiction),
            eq(catalogDocumentRequirements.key, requirement_key),
            eq(catalogDocumentRequirements.active, true),
            or(isNull(catalogDocumentRequirements.package_key), eq(catalogDocumentRequirements.package_key, company.package_key ?? '')),
          ),
        )
        .limit(1);
      if (!requirement) return NextResponse.json({ error: 'Unknown document requirement' }, { status: 400 });
    } else {
      [company] = await db
        .select()
        .from(companies)
        .where(and(eq(companies.user_id, session.userId), ne(companies.status, 'lead')))
        .orderBy(desc(companies.created_at))
        .limit(1);
    }
    const fileCategory = (requirement?.category ?? category) as any;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const safeFileName = file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const r2Key = `vault/${session.userId}/${year}/${month}/${Date.now()}_${safeFileName}`;

    // If a document of the same company+category already exists, archive it
    // as a version instead of silently overwriting it.
    const [existing] = company
      ? await db
          .select()
          .from(documents)
          .where(
            and(
              eq(documents.company_id, company.id),
              requirement
                ? eq(documents.requirement_key, requirement.key)
                : eq(documents.category, fileCategory),
              eq(documents.status, 'active')
            )
          )
          .limit(1)
      : [];

    if (existing) {
      const [latestVersion] = await db
        .select({ version_number: documentVersions.version_number })
        .from(documentVersions)
        .where(eq(documentVersions.document_id, existing.id))
        .orderBy(desc(documentVersions.version_number))
        .limit(1);

      await db.insert(documentVersions).values({
        document_id: existing.id,
        version_number: (latestVersion?.version_number ?? 1) + 1,
        r2_key: existing.r2_key,
        file_name: existing.file_name,
        uploaded_by: session.userId,
      });

      await db.update(documents).set({ status: 'superseded' }).where(eq(documents.id, existing.id));
    }

    const [document] = await db
      .insert(documents)
      .values({
        user_id: session.userId,
        company_id: company?.id,
        file_name,
        r2_key: r2Key,
        category: fileCategory,
        requirement_key: requirement?.key,
        mime_type,
        file_size_bytes: file_size,
        status: 'active',
        expiry_date: expiry_date ? new Date(expiry_date) : undefined,
        uploaded_by: session.userId,
      })
      .returning();

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      ContentType: mime_type,
      ContentLength: file_size,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: PRESIGN_EXPIRY_SECONDS });

    return NextResponse.json({
      document_id: document.id,
      upload_url: uploadUrl,
      r2_key: r2Key,
      expires_in_seconds: PRESIGN_EXPIRY_SECONDS,
    });
  } catch (error) {
    console.error('[vault/presign] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
