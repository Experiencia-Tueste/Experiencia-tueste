CREATE TABLE "private"."radio_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"plan_id" text NOT NULL,
	"subscription_status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "radio_channels_plan_check" CHECK ("private"."radio_channels"."plan_id" IN ('senal', 'disenada', 'personalizada')),
	CONSTRAINT "radio_channels_subscription_status_check" CHECK ("private"."radio_channels"."subscription_status" IN ('pending', 'trial', 'active', 'paused', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "private"."radio_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"city" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "radio_companies_status_check" CHECK ("private"."radio_companies"."status" IN ('active', 'inactive'))
);
--> statement-breakpoint
ALTER TABLE "private"."radio_channels" ADD CONSTRAINT "radio_channels_company_id_radio_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "private"."radio_companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."radio_channels" ADD CONSTRAINT "radio_channels_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."radio_companies" ADD CONSTRAINT "radio_companies_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "radio_channels_company_name_unique" ON "private"."radio_channels" USING btree ("company_id","name");--> statement-breakpoint
CREATE INDEX "radio_channels_company_id_idx" ON "private"."radio_channels" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "radio_channels_subscription_status_idx" ON "private"."radio_channels" USING btree ("subscription_status");--> statement-breakpoint
CREATE INDEX "radio_channels_created_by_idx" ON "private"."radio_channels" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "radio_companies_email_unique" ON "private"."radio_companies" USING btree ("contact_email");--> statement-breakpoint
CREATE INDEX "radio_companies_status_idx" ON "private"."radio_companies" USING btree ("status");--> statement-breakpoint
CREATE INDEX "radio_companies_created_by_idx" ON "private"."radio_companies" USING btree ("created_by");--> statement-breakpoint
REVOKE ALL ON TABLE "private"."radio_companies" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."radio_channels" FROM anon, authenticated;
