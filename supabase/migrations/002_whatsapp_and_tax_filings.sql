-- ============================================================================
-- GCCStartup — Migration 002
-- Additive tables the UI rebuild needs that the initial schema didn't cover:
--   - whatsapp_messages: durable 2-way message log (the admin WhatsApp inbox
--     and the customer notification-drawer both need real history; the
--     `notifications` table is user-scoped app notifications, not a message
--     transcript, so it can't hold this).
--   - tax_filings: UAE Corporate Tax / VAT filing records for the kept
--     /portal/tax-compliance screen, which has no DB-backed entity today.
-- ============================================================================

BEGIN;

-- ─── 9. whatsapp_messages ──────────────────────────────────────────────────

CREATE TABLE whatsapp_messages (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                  UUID         REFERENCES companies(id) ON DELETE SET NULL,
  phone_number                VARCHAR(50) NOT NULL,
  direction                   VARCHAR(10) NOT NULL
                                CHECK (direction IN ('inbound','outbound')),
  message_type                VARCHAR(20) NOT NULL DEFAULT 'text',
  body                        TEXT        NOT NULL,
  template_name                VARCHAR(100),
  whatsapp_message_id         VARCHAR(255) UNIQUE,
  status                      VARCHAR(50)  NOT NULL DEFAULT 'received'
                                CHECK (status IN (
                                  'queued','sent','delivered','read','failed','received'
                                )),
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_messages_company_id   ON whatsapp_messages(company_id);
CREATE INDEX idx_whatsapp_messages_phone_number ON whatsapp_messages(phone_number);
CREATE INDEX idx_whatsapp_messages_wamid        ON whatsapp_messages(whatsapp_message_id);

-- ─── 10. tax_filings ───────────────────────────────────────────────────────

CREATE TABLE tax_filings (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                  UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period_type                 VARCHAR(30) NOT NULL
                                CHECK (period_type IN ('vat_quarterly','corporate_tax_annual')),
  period_label                VARCHAR(50) NOT NULL,
  due_date                    DATE        NOT NULL,
  filed_date                  DATE,
  amount_due                  DECIMAL(10,2) NOT NULL DEFAULT 0,
  status                      VARCHAR(20)  NOT NULL DEFAULT 'upcoming'
                                CHECK (status IN ('upcoming','filed','overdue')),
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tax_filings_company_id  ON tax_filings(company_id);
CREATE INDEX idx_tax_filings_due_date    ON tax_filings(due_date);
CREATE INDEX idx_tax_filings_status      ON tax_filings(status);

COMMIT;
