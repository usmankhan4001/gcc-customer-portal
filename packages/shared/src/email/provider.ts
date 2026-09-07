export interface EmailSendParams {
  from: string
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  tags?: Record<string, string>
}

export interface EmailBulkSendParams {
  from: string
  to: string[]
  subject: string
  html: string
  text?: string
  tags?: Record<string, string>
}

export interface EmailSendResult {
  id: string
  status: string
}

export interface EmailProvider {
  /** Send a single email. */
  send(params: EmailSendParams): Promise<EmailSendResult>
  /** Send a bulk email to multiple recipients. */
  sendBulk(params: EmailBulkSendParams): Promise<EmailSendResult[]>
}
