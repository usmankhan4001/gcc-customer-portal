CREATE TABLE "processed_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"source" text NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL
);
