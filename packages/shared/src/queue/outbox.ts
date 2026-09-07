import { randomUUID } from 'node:crypto'

export type JobType =
  | 'send_email'
  | 'send_whatsapp'
  | 'flow_step'
  | 'campaign_dispatch'
  | 'compliance_reminder'

export type JobStatus = 'pending' | 'claimed' | 'completed' | 'failed' | 'deferred'

export interface Job {
  id: string
  job_type: JobType
  payload: Record<string, unknown>
  status: JobStatus
  idempotency_key: string | null
  attempts: number
  max_attempts: number
  last_error: string | null
  claimed_at: string | null
  deferred_until: string | null
  created_at: string
  updated_at: string
}

export interface OutboxRow {
  id: string
  job_type: string
  payload: string // JSON string
  status: string
  idempotency_key: string | null
  attempts: number
  max_attempts: number
  last_error: string | null
  claimed_at: string | null
  deferred_until: string | null
  created_at: string
  updated_at: string
}

export interface JobDB {
  /** Raw SQL query runner — supports parameterised queries. */
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }>
}

interface EnqueueOptions {
  idempotencyKey?: string
  maxAttempts?: number
  deferSeconds?: number
}

/**
 * Enqueue a job into the outbox table.
 * @param db - Database client
 * @param jobType - Type of job
 * @param payload - Arbitrary JSON-serialisable payload
 * @param options - Optional idempotency key, max attempts, deferral
 * @returns The new job's ID
 */
export async function enqueueJob(
  db: JobDB,
  jobType: JobType,
  payload: Record<string, unknown>,
  options?: EnqueueOptions,
): Promise<string> {
  const id = randomUUID()
  const now = new Date().toISOString()
  const idempotencyKey = options?.idempotencyKey ?? null
  const maxAttempts = options?.maxAttempts ?? 5
  const deferredUntil = options?.deferSeconds
    ? new Date(Date.now() + options.deferSeconds * 1000).toISOString()
    : null
  const initialStatus: JobStatus = deferredUntil ? 'deferred' : 'pending'

  await db.query(
    `INSERT INTO outbox (id, job_type, payload, status, idempotency_key, attempts, max_attempts, last_error, claimed_at, deferred_until, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 0, $6, null, null, $7, $8, $9)`,
    [id, jobType, JSON.stringify(payload), initialStatus, idempotencyKey, maxAttempts, deferredUntil, now, now],
  )

  return id
}

/**
 * Claim the next available job for processing (optimistic lock).
 * @param db - Database client
 * @param jobType - Type of job to claim
 * @returns Claimed job row or null
 */
export async function claimJob(
  db: JobDB,
  jobType: JobType,
): Promise<OutboxRow | null> {
  const now = new Date().toISOString()

  const result = await db.query<OutboxRow>(
    `UPDATE outbox
     SET status = 'claimed', claimed_at = $1, updated_at = $2
     WHERE id = (
       SELECT id FROM outbox
       WHERE job_type = $3
         AND status IN ('pending', 'deferred')
         AND (deferred_until IS NULL OR deferred_until <= $2)
         AND attempts < max_attempts
       ORDER BY created_at ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING *`,
    [now, now, jobType],
  )

  return result.rows[0] ?? null
}

/**
 * Mark a job as completed.
 * @param db - Database client
 * @param jobId - Job ID
 */
export async function completeJob(db: JobDB, jobId: string): Promise<void> {
  const now = new Date().toISOString()
  await db.query(
    `UPDATE outbox SET status = 'completed', updated_at = $1 WHERE id = $2`,
    [now, jobId],
  )
}

/**
 * Mark a job as failed.
 * @param db - Database client
 * @param jobId - Job ID
 * @param error - Error message
 */
export async function failJob(db: JobDB, jobId: string, error: string): Promise<void> {
  const now = new Date().toISOString()
  await db.query(
    `UPDATE outbox
     SET status = 'failed', last_error = $1, attempts = attempts + 1, updated_at = $2
     WHERE id = $3`,
    [error, now, jobId],
  )
}

/**
 * Defer a job for a number of seconds.
 * @param db - Database client
 * @param jobId - Job ID
 * @param seconds - Seconds to defer
 */
export async function deferJob(db: JobDB, jobId: string, seconds: number): Promise<void> {
  const now = new Date()
  const deferredUntil = new Date(now.getTime() + seconds * 1000).toISOString()
  await db.query(
    `UPDATE outbox
     SET status = 'deferred', deferred_until = $1, updated_at = $2
     WHERE id = $3`,
    [deferredUntil, now.toISOString(), jobId],
  )
}

/**
 * Reap stale claimed jobs that have been in-progress too long.
 * @param db - Database client
 * @param staleMinutes - How many minutes before a claimed job is considered stale
 * @returns Number of jobs reset to pending
 */
export async function reapStaleJobs(db: JobDB, staleMinutes: number): Promise<number> {
  const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  const result = await db.query(
    `UPDATE outbox
     SET status = 'pending', claimed_at = null, updated_at = $1
     WHERE status = 'claimed' AND claimed_at < $2`,
    [now, cutoff],
  )

  return result.rows.length
}
