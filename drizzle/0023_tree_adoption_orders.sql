CREATE TABLE "private"."tree_adoption_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_user_id" uuid NOT NULL,
	"customer_email" text NOT NULL,
	"tree_key" text NOT NULL,
	"tree_name" text NOT NULL,
	"trees_count" integer NOT NULL,
	"reference" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tree_adoption_orders_count_check" CHECK ("private"."tree_adoption_orders"."trees_count" > 0),
	CONSTRAINT "tree_adoption_orders_status_check" CHECK ("private"."tree_adoption_orders"."status" IN ('pending', 'active', 'cancelled'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "tree_adoption_orders_reference_unique" ON "private"."tree_adoption_orders" USING btree ("reference");--> statement-breakpoint
CREATE UNIQUE INDEX "tree_adoption_orders_customer_pending_unique" ON "private"."tree_adoption_orders" USING btree ("customer_user_id") WHERE "private"."tree_adoption_orders"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "tree_adoption_orders_customer_created_idx" ON "private"."tree_adoption_orders" USING btree ("customer_user_id","created_at");--> statement-breakpoint
ALTER TABLE "private"."tree_adoption_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."tree_adoption_orders" FROM PUBLIC, anon, authenticated;
