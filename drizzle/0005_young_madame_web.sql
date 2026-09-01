CREATE TABLE "private"."compliance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"lot_id" uuid,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"reference" text,
	"issued_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_records_kind_check" CHECK ("private"."compliance_records"."kind" IN ('certificate', 'inspection', 'document', 'communication')),
	CONSTRAINT "compliance_records_status_check" CHECK ("private"."compliance_records"."status" IN ('pending', 'valid', 'rejected', 'archived')),
	CONSTRAINT "compliance_records_dates_check" CHECK ("private"."compliance_records"."expires_at" IS NULL OR "private"."compliance_records"."issued_at" IS NULL OR "private"."compliance_records"."expires_at" > "private"."compliance_records"."issued_at")
);
--> statement-breakpoint
CREATE TABLE "private"."farm_lots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"code" text NOT NULL,
	"harvest_year" integer NOT NULL,
	"variety" text NOT NULL,
	"process" text NOT NULL,
	"weight_kg" numeric(12, 2),
	"status" text DEFAULT 'growing' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "farm_lots_status_check" CHECK ("private"."farm_lots"."status" IN ('growing', 'harvested', 'stored', 'closed')),
	CONSTRAINT "farm_lots_year_check" CHECK ("private"."farm_lots"."harvest_year" BETWEEN 2000 AND 2200),
	CONSTRAINT "farm_lots_weight_check" CHECK ("private"."farm_lots"."weight_kg" IS NULL OR "private"."farm_lots"."weight_kg" >= 0)
);
--> statement-breakpoint
CREATE TABLE "private"."farms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"producer_name" text NOT NULL,
	"city" text NOT NULL,
	"region" text NOT NULL,
	"contact_email" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "farms_status_check" CHECK ("private"."farms"."status" IN ('active', 'inactive'))
);
--> statement-breakpoint
ALTER TABLE "private"."compliance_records" ADD CONSTRAINT "compliance_records_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "private"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."compliance_records" ADD CONSTRAINT "compliance_records_lot_id_farm_lots_id_fk" FOREIGN KEY ("lot_id") REFERENCES "private"."farm_lots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."compliance_records" ADD CONSTRAINT "compliance_records_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."farm_lots" ADD CONSTRAINT "farm_lots_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "private"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."farm_lots" ADD CONSTRAINT "farm_lots_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."farms" ADD CONSTRAINT "farms_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "compliance_records_farm_id_idx" ON "private"."compliance_records" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "compliance_records_lot_id_idx" ON "private"."compliance_records" USING btree ("lot_id");--> statement-breakpoint
CREATE INDEX "compliance_records_expires_at_idx" ON "private"."compliance_records" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "compliance_records_status_idx" ON "private"."compliance_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "compliance_records_created_by_idx" ON "private"."compliance_records" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "farm_lots_code_unique" ON "private"."farm_lots" USING btree ("code");--> statement-breakpoint
CREATE INDEX "farm_lots_farm_id_idx" ON "private"."farm_lots" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "farm_lots_status_idx" ON "private"."farm_lots" USING btree ("status");--> statement-breakpoint
CREATE INDEX "farm_lots_created_by_idx" ON "private"."farm_lots" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "farms_status_idx" ON "private"."farms" USING btree ("status");--> statement-breakpoint
CREATE INDEX "farms_created_by_idx" ON "private"."farms" USING btree ("created_by");--> statement-breakpoint
REVOKE ALL ON TABLE "private"."farms" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."farm_lots" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."compliance_records" FROM anon, authenticated;
