// ─── Table Name Constants ────────────────────────────────────────────────────

export const USERS_TABLE = 'users';
export const COMPANIES_TABLE = 'companies';
export const DOCUMENTS_TABLE = 'documents';
export const MILESTONES_TABLE = 'milestones';
export const ORDERS_TABLE = 'orders';
export const RENEWALS_TABLE = 'renewals';
export const NOTIFICATIONS_TABLE = 'notifications';
export const SHAREABLE_LINKS_TABLE = 'shareable_links';

// ─── Enum Types ─────────────────────────────────────────────────────────────

export type UserRole = 'client' | 'staff' | 'operations' | 'admin' | 'super_admin';
export type CompanyJurisdiction =
  | 'uae_freezone'
  | 'uae_mainland'
  | 'hong_kong'
  | 'singapore'
  | 'bahrain'
  | 'ireland'
  | 'oman'
  | 'bvi_cayman';
export type CompanyTier = 'tier_1_self' | 'tier_2_nominee' | 'tier_3_shelf';
export type CompanyStatus =
  | 'lead'
  | 'onboarding'
  | 'official_kyc_pending'
  | 'filing_in_progress'
  | 'bank_opening'
  | 'active'
  | 'renewal_due'
  | 'suspended'
  | 'archived';
export type TrackType = 'remote' | 'gulf';
export type DocumentCategory =
  | 'trade_license'
  | 'moa_articles'
  | 'share_certificate'
  | 'certificate_of_incumbency'
  | 'tax_trn_certificate'
  | 'nominee_poa'
  | 'preflight_id'
  | 'other';
export type DocumentStatus = 'active' | 'archived' | 'superseded';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';
export type OrderType =
  | 'new_formation'
  | 'shelf_transfer'
  | 'annual_renewal'
  | 'tax_filing'
  | 'add_on_bank'
  | 'visa_service';
export type PaymentStatus = 'unpaid' | 'processing' | 'paid' | 'failed' | 'refunded';
export type RenewalStatus = 'upcoming' | 'invoiced' | 'paid' | 'overdue' | 'renewed';
export type NotificationType = 'info' | 'success' | 'warning' | 'action_required';
export type DeliveryStatus =
  | 'not_applicable'
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

// ─── Row Interfaces ─────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  whatsapp_number: string;
  full_name: string;
  country_residence: string | null;
  role: UserRole;
  avatar_url: string | null;
  magic_token: string | null;
  magic_token_expires_at: Date | null;
  referral_code: string | null;
  referred_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Company {
  id: string;
  user_id: string;
  company_name: string;
  jurisdiction: CompanyJurisdiction;
  tier: CompanyTier;
  status: CompanyStatus;
  track_type: TrackType;
  official_kyc_completed: boolean;
  official_kyc_reference: string | null;
  trade_license_number: string | null;
  tax_registration_number: string | null;
  registered_agent_name: string | null;
  virtual_address_ejari: string | null;
  incorporation_date: Date | null;
  license_expiry_date: Date | null;
  nominee_renewal_date: Date | null;
  assigned_to: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Document {
  id: string;
  company_id: string | null;
  user_id: string;
  category: DocumentCategory;
  file_name: string;
  r2_key: string;
  mime_type: string;
  file_size_bytes: number;
  status: DocumentStatus;
  uploaded_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Milestone {
  id: string;
  company_id: string;
  stage_index: number;
  stage_name: string;
  status: MilestoneStatus;
  description: string | null;
  estimated_completion_days: number | null;
  official_portal_url: string | null;
  completed_at: Date | null;
  completed_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: string;
  company_id: string | null;
  user_id: string;
  order_type: OrderType;
  amount_total: number;
  currency: string;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_status: PaymentStatus;
  line_items: Record<string, unknown>[];
  invoice_pdf_url: string | null;
  paid_at: Date | null;
  created_at: Date;
}

export interface Renewal {
  id: string;
  company_id: string;
  renewal_year: number;
  license_fee: number;
  nominee_fee: number;
  registered_address_fee: number;
  total_renewal_cost: number;
  due_date: Date;
  status: RenewalStatus;
  order_id: string | null;
  paid_at: Date | null;
  created_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link_url: string | null;
  is_read: boolean;
  whatsapp_status: DeliveryStatus;
  email_status: DeliveryStatus;
  created_at: Date;
}

export interface ShareableLink {
  id: string;
  company_id: string;
  created_by: string;
  token: string;
  password_hash: string | null;
  document_ids: string[];
  views_count: number;
  expires_at: Date;
  created_at: Date;
}
