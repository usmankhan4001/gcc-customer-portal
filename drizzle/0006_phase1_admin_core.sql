ALTER TYPE "public"."user_role" ADD VALUE 'client_relations';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'incorporation_va';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'marketing_va';--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"actor_name" text,
	"actor_role" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"company_id" uuid,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "stage" text DEFAULT 'order_confirmed' NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "stage_changed_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "bank_stage" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "bank_rejection_reason" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "on_hold" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "waiting_on" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "hold_reason" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "registration_number" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "filing_reference" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "next_action" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "next_due_at" timestamp;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "kind" text DEFAULT 'client_upload' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "review_status" text DEFAULT 'uploaded' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "reviewed_at" timestamp;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "account_status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "disabled_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "totp_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "totp_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;--> statement-breakpoint
CREATE INDEX "audit_events_company_idx" ON "audit_events" USING btree ("company_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_events_entity_idx" ON "audit_events" USING btree ("entity_type","entity_id");--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- The audit log is append-only: nothing, including the app, may change or remove a row.
CREATE FUNCTION "audit_events_append_only"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only';
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER "audit_events_no_change" BEFORE UPDATE OR DELETE ON "audit_events" FOR EACH ROW EXECUTE FUNCTION "audit_events_append_only"();--> statement-breakpoint
CREATE TRIGGER "audit_events_no_truncate" BEFORE TRUNCATE ON "audit_events" FOR EACH STATEMENT EXECUTE FUNCTION "audit_events_append_only"();