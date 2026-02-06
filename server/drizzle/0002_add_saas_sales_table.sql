CREATE TABLE "saas_sales" (
	"id" text PRIMARY KEY NOT NULL,
	"external_reference" text NOT NULL,
	"payment_id" text,
	"payment_provider" text DEFAULT 'mercadopago',
	"plan" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'ARS',
	"buyer_email" text NOT NULL,
	"buyer_name" text,
	"store_name" text,
	"status" text DEFAULT 'pending',
	"store_id" text,
	"license_key_hash" text,
	"created_at" timestamp DEFAULT now(),
	"paid_at" timestamp,
	"provisioned_at" timestamp,
	"error_message" text,
	CONSTRAINT "saas_sales_external_reference_unique" UNIQUE("external_reference")
);
--> statement-breakpoint
ALTER TABLE "saas_sales" ADD CONSTRAINT "saas_sales_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_saas_sales_status" ON "saas_sales" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_saas_sales_email" ON "saas_sales" USING btree ("buyer_email");--> statement-breakpoint
CREATE INDEX "idx_saas_sales_created" ON "saas_sales" USING btree ("created_at");