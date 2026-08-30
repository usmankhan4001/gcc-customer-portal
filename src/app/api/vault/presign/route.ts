import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl } from '@/lib/r2';
import { query, queryOne } from '@/lib/db';
import { requireUser, AuthError, isStaffRole } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PresignRequest {
  company_id: string;
  category: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

interface PresignResponse {
  document_id: string;
  upload_url: string;
  r2_key: string;
  expires_in_seconds: number;
}

const PRESIGN_EXPIRY_SECONDS = 900; // 15 minutes
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

// ---------------------------------------------------------------------------
// POST /api/vault/presign
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireUser(request);

    const body = (await request.json()) as PresignRequest;
    const { company_id, category, file_name, file_size, mime_type } = body;

    if (!company_id || !category || !file_name || !file_size || !mime_type) {
      return NextResponse.json(
        { error: 'Missing required fields: company_id, category, file_name, file_size, mime_type' },
        { status: 400 }
      );
    }

    // Staff can upload against any company; a client only against their own.
    if (!isStaffRole(user.role)) {
      const owned = await queryOne<{ id: string }>(
        `SELECT id FROM companies WHERE id = $1 AND user_id = $2`,
        [company_id, user.userId]
      );
      if (!owned) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (file_size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const safeFileName = file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const r2Key = `vault/${year}/${month}/${crypto.randomUUID()}-${safeFileName}`;

    const documentId = crypto.randomUUID();

    await query(
      `INSERT INTO documents (id, company_id, user_id, category, file_name, r2_key, mime_type, file_size_bytes, status, uploaded_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, NOW(), NOW())`,
      [documentId, company_id, user.userId, category, file_name, r2Key, mime_type, file_size, user.userId]
    );

    const uploadUrl = await getPresignedUploadUrl(r2Key, mime_type, PRESIGN_EXPIRY_SECONDS);

    const response: PresignResponse = {
      document_id: documentId,
      upload_url: uploadUrl,
      r2_key: r2Key,
      expires_in_seconds: PRESIGN_EXPIRY_SECONDS,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[vault/presign] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
