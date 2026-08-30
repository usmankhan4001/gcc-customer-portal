import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { jwtVerify } from 'jose';
import { query } from '@/lib/db';

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

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  company_id?: string;
}

// ---------------------------------------------------------------------------
// R2 / S3 Client
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function verifyAuth(request: NextRequest): Promise<JWTPayload> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7);
  const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as JWTPayload;
}

// ---------------------------------------------------------------------------
// POST /api/vault/presign
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authenticate
    let user: JWTPayload;
    try {
      user = await verifyAuth(request);
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse body
    const body = (await request.json()) as PresignRequest;
    const { company_id, category, file_name, file_size, mime_type } = body;

    if (!company_id || !category || !file_name || !file_size || !mime_type) {
      return NextResponse.json(
        { error: 'Missing required fields: company_id, category, file_name, file_size, mime_type' },
        { status: 400 }
      );
    }

    // 3. Validate company access
    if (user.role !== 'admin' && user.company_id !== company_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Validate file size (max 25 MB)
    const MAX_FILE_SIZE = 25 * 1024 * 1024;
    if (file_size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // 5. Build R2 key
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const safeFileName = file_name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const r2Key = `vault/${year}/${month}/${safeFileName}`;

    // 6. Create document record in database
    const documentId = crypto.randomUUID();

    await query(
      `INSERT INTO documents (id, company_id, user_id, category, file_name, r2_key, mime_type, file_size_bytes, status, uploaded_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $3, NOW(), NOW())`,
      [documentId, company_id, user.sub, category, file_name, r2Key, mime_type, file_size]
    );

    // 7. Generate presigned PUT URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      ContentType: mime_type,
      ContentLength: file_size,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: PRESIGN_EXPIRY_SECONDS,
    });

    const response: PresignResponse = {
      document_id: documentId,
      upload_url: uploadUrl,
      r2_key: r2Key,
      expires_in_seconds: PRESIGN_EXPIRY_SECONDS,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[vault/presign] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
