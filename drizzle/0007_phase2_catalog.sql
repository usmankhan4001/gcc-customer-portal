CREATE TABLE "catalog_addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"summary" text,
	"price_cents" integer,
	"currency" text DEFAULT 'usd' NOT NULL,
	"max_quantity" integer DEFAULT 1 NOT NULL,
	"jurisdictions" text[],
	"package_keys" text[],
	"options" jsonb,
	"active" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "catalog_addons_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "catalog_document_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jurisdiction" text NOT NULL,
	"package_key" text,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"help" text,
	"category" text DEFAULT 'other' NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "catalog_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jurisdiction" text NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"summary" text,
	"tier" text NOT NULL,
	"price_cents" integer,
	"currency" text DEFAULT 'usd' NOT NULL,
	"timeline_min_days" integer,
	"timeline_max_days" integer,
	"timeline_note" text,
	"recommended" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jurisdiction" text NOT NULL,
	"package_key" text NOT NULL,
	"addons" jsonb NOT NULL,
	"total_cents" integer NOT NULL,
	"currency" text NOT NULL,
	"user_id" uuid,
	"order_id" uuid,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "package_key" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "requirement_key" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "dedupe_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_doc_req_idx" ON "catalog_document_requirements" USING btree ("jurisdiction","package_key","key");--> statement-breakpoint
CREATE UNIQUE INDEX "catalog_packages_key_idx" ON "catalog_packages" USING btree ("jurisdiction","key");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_dedupe_key_unique" UNIQUE("dedupe_key");