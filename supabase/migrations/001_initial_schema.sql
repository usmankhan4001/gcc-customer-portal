-- ============================================================================
-- GCCStartup — Initial Schema Migration
-- PostgreSQL 16 — Creates all 8 core tables
-- ============================================================================

BEGIN;

-- ─── 1. users ──────────────────────────────────────────────────────────────

CREATE TABLE users (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email                       VARCHAR(255) UNIQUE NOT NULL,
  whatsapp_number             VARCHAR(50)  UNIQUE NOT NULL,
  full_name                   VARCHAR(255) NOT NULL,
  country_residence           VARCHAR(100),
  role                        VARCHAR(50)  NOT NULL DEFAULT 'client'
                                CHECK (role IN ('client','staff','operations','admin','super_admin')),
  avatar_url                  TEXT,
  magic_token                 VARCHAR(255),
  magic_token_expires_at      TIMESTAMPTZ,
  referral_code               VARCHAR(50)  UNIQUE,
  referred_by                 UUID         REFERENCES users(id),
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role            ON users(role);
CREATE INDEX idx_users_referral_code   ON users(referral_code);
CREATE INDEX idx_users_referred_by     ON users(referred_by);

-- ─── 2. companies ──────────────────────────────────────────────────────────

CREATE TABLE companies (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name                VARCHAR(255) NOT NULL,
  jurisdiction                VARCHAR(50)  NOT NULL
                                CHECK (jurisdiction IN (
                                  'uae_freezone','uae_mainland','hong_kong',
                                  'singapore','bahrain','ireland','oman','bvi_cayman'
                                )),
  tier                        VARCHAR(20)  NOT NULL
                                CHECK (tier IN ('tier_1_self','tier_2_nominee','tier_3_shelf')),
  status                      VARCHAR(50)  NOT NULL DEFAULT 'onboarding'
                                CHECK (status IN (
                                  'lead','onboarding','official_kyc_pending',
                                  'filing_in_progress','bank_opening','active',
                                  'renewal_due','suspended','archived'
                                )),
  track_type                  VARCHAR(20)  NOT NULL DEFAULT 'remote'
                                CHECK (track_type IN ('remote','gulf')),
  official_kyc_completed      BOOLEAN      NOT NULL DEFAULT FALSE,
  official_kyc_reference      VARCHAR(255),
  trade_license_number        VARCHAR(100),
  tax_registration_number     VARCHAR(100),
  registered_agent_name       VARCHAR(255),
  virtual_address_ejari       TEXT,
  incorporation_date          DATE,
  license_expiry_date         DATE,
  nominee_renewal_date        DATE,
  assigned_to                 UUID         REFERENCES users(id),
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_user_id        ON companies(user_id);
CREATE INDEX idx_companies_status         ON companies(status);
CREATE INDEX idx_companies_jurisdiction   ON companies(jurisdiction);
CREATE INDEX idx_companies_assigned_to    ON companies(assigned_to);

-- ─── 3. documents ──────────────────────────────────────────────────────────

CREATE TABLE documents (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                  UUID         REFERENCES companies(id) ON DELETE CASCADE,
  user_id                     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category                    VARCHAR(50)  NOT NULL
                                CHECK (category IN (
                                  'trade_license','moa_articles','share_certificate',
                                  'certificate_of_incumbency','tax_trn_certificate',
                                  'nominee_poa','preflight_id','other'
                                )),
  file_name                   VARCHAR(255) NOT NULL,
  r2_key                      TEXT        NOT NULL,
  mime_type                   VARCHAR(100) NOT NULL,
  file_size_bytes             BIGINT       NOT NULL,
  status                      VARCHAR(50)  NOT NULL DEFAULT 'active'
                                CHECK (status IN ('active','archived','superseded')),
  uploaded_by                 UUID         REFERENCES users(id),
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documents_company_id    ON documents(company_id);
CREATE INDEX idx_documents_user_id       ON documents(user_id);
CREATE INDEX idx_documents_category      ON documents(category);

-- ─── 4. milestones ─────────────────────────────────────────────────────────

CREATE TABLE milestones (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                  UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  stage_index                 INT         NOT NULL CHECK (stage_index BETWEEN 1 AND 6),
  stage_name                  VARCHAR(255) NOT NULL,
  status                      VARCHAR(50)  NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','in_progress','completed')),
  description                 TEXT,
  estimated_completion_days   INT,
  official_portal_url         TEXT,
  completed_at                TIMESTAMPTZ,
  completed_by                UUID         REFERENCES users(id),
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_milestones_company_id   ON milestones(company_id);
CREATE INDEX idx_milestones_status       ON milestones(status);

-- ─── 5. orders ─────────────────────────────────────────────────────────────

CREATE TABLE orders (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                  UUID         REFERENCES companies(id),
  user_id                     UUID        NOT NULL REFERENCES users(id),
  order_type                  VARCHAR(50)  NOT NULL
                                CHECK (order_type IN (
                                  'new_formation','shelf_transfer','annual_renewal',
                                  'tax_filing','add_on_bank','visa_service'
                                )),
  amount_total                DECIMAL(10,2) NOT NULL,
  currency                    VARCHAR(10)  NOT NULL DEFAULT 'USD',
  stripe_session_id           VARCHAR(255),
  stripe_payment_intent_id    VARCHAR(255),
  payment_status              VARCHAR(50)  NOT NULL DEFAULT 'unpaid'
                                CHECK (payment_status IN ('unpaid','processing','paid','failed','refunded')),
  line_items                  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  invoice_pdf_url             TEXT,
  paid_at                     TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_company_id       ON orders(company_id);
CREATE INDEX idx_orders_user_id          ON orders(user_id);
CREATE INDEX idx_orders_payment_status   ON orders(payment_status);
CREATE INDEX idx_orders_stripe_session   ON orders(stripe_session_id);

-- ─── 6. renewals ───────────────────────────────────────────────────────────

CREATE TABLE renewals (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                  UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  renewal_year                INT         NOT NULL,
  license_fee                 DECIMAL(10,2) NOT NULL DEFAULT 0,
  nominee_fee                 DECIMAL(10,2) NOT NULL DEFAULT 0,
  registered_address_fee      DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_renewal_cost          DECIMAL(10,2) NOT NULL,
  due_date                    DATE        NOT NULL,
  status                      VARCHAR(50)  NOT NULL DEFAULT 'upcoming'
                                CHECK (status IN ('upcoming','invoiced','paid','overdue','renewed')),
  order_id                    UUID         REFERENCES orders(id),
  paid_at                     TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_renewals_company_id     ON renewals(company_id);
CREATE INDEX idx_renewals_status         ON renewals(status);
CREATE INDEX idx_renewals_due_date       ON renewals(due_date);

-- ─── 7. notifications ──────────────────────────────────────────────────────

CREATE TABLE notifications (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                       VARCHAR(255) NOT NULL,
  message                     TEXT        NOT NULL,
  type                        VARCHAR(50)  NOT NULL
                                CHECK (type IN ('info','success','warning','action_required')),
  link_url                    TEXT,
  is_read                     BOOLEAN      NOT NULL DEFAULT FALSE,
  whatsapp_status             VARCHAR(50)  DEFAULT 'not_applicable'
                                CHECK (whatsapp_status IN (
                                  'not_applicable','queued','sent','delivered','read','failed'
                                )),
  email_status                VARCHAR(50)  DEFAULT 'not_applicable'
                                CHECK (email_status IN (
                                  'not_applicable','queued','sent','delivered','opened','failed'
                                )),
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id   ON notifications(user_id);
CREATE INDEX idx_notifications_is_read   ON notifications(is_read);

-- ─── 8. shareable_links ────────────────────────────────────────────────────

CREATE TABLE shareable_links (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                  UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by                  UUID        NOT NULL REFERENCES users(id),
  token                       VARCHAR(100) UNIQUE NOT NULL,
  password_hash               VARCHAR(255),
  document_ids                JSONB       NOT NULL DEFAULT '[]'::jsonb,
  views_count                 INT         NOT NULL DEFAULT 0,
  expires_at                  TIMESTAMPTZ  NOT NULL,
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shareable_links_token    ON shareable_links(token);
CREATE INDEX idx_shareable_links_company  ON shareable_links(company_id);

COMMIT;
