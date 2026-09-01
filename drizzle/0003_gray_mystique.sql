CREATE TABLE "private"."admin_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text DEFAULT '' NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_settings_key_check" CHECK ("private"."admin_settings"."key" IN (
        'brand.display_name',
        'brand.tagline',
        'contact.support_email',
        'contact.sales_email',
        'commerce.default_coupon_reference',
        'integrations.shopify_store_url'
      ))
);
--> statement-breakpoint
ALTER TABLE "private"."admin_settings" ADD CONSTRAINT "admin_settings_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_settings_key_unique" ON "private"."admin_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "admin_settings_updated_by_idx" ON "private"."admin_settings" USING btree ("updated_by");