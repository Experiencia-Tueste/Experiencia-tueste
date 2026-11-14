CREATE TABLE "private"."shopify_webhook_deliveries" (
	"delivery_id" text PRIMARY KEY NOT NULL,
	"topic" text NOT NULL,
	"outcome" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "private"."tree_adoption_orders" ADD COLUMN "shopify_order_id" text;--> statement-breakpoint
ALTER TABLE "private"."tree_adoption_orders" ADD COLUMN "paid_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "private"."tree_adoption_orders" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "tree_adoption_orders_shopify_order_unique" ON "private"."tree_adoption_orders" USING btree ("shopify_order_id") WHERE "private"."tree_adoption_orders"."shopify_order_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "private"."shopify_webhook_deliveries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."shopify_webhook_deliveries" FROM PUBLIC, anon, authenticated;
