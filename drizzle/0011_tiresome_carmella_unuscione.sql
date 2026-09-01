CREATE TABLE "private"."checkout_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" text NOT NULL,
	"title" text NOT NULL,
	"unit_price" bigint NOT NULL,
	"quantity" integer NOT NULL,
	"total_amount" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_order_items_unit_price_positive" CHECK ("private"."checkout_order_items"."unit_price" > 0),
	CONSTRAINT "checkout_order_items_quantity_positive" CHECK ("private"."checkout_order_items"."quantity" > 0),
	CONSTRAINT "checkout_order_items_total_consistent" CHECK ("private"."checkout_order_items"."total_amount" = "private"."checkout_order_items"."unit_price" * "private"."checkout_order_items"."quantity")
);
--> statement-breakpoint
CREATE TABLE "private"."checkout_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_user_id" uuid NOT NULL,
	"customer_email" text NOT NULL,
	"client_request_id" uuid NOT NULL,
	"currency" text DEFAULT 'COP' NOT NULL,
	"amount" bigint NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"provider" text DEFAULT 'mercadopago' NOT NULL,
	"provider_order_id" text,
	"provider_status" text,
	"provider_status_detail" text,
	"checkout_url" text,
	"idempotency_key" uuid DEFAULT gen_random_uuid() NOT NULL,
	"note" text,
	"expires_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_orders_amount_positive" CHECK ("private"."checkout_orders"."amount" > 0),
	CONSTRAINT "checkout_orders_currency_check" CHECK ("private"."checkout_orders"."currency" IN ('COP')),
	CONSTRAINT "checkout_orders_provider_check" CHECK ("private"."checkout_orders"."provider" IN ('mercadopago')),
	CONSTRAINT "checkout_orders_status_check" CHECK ("private"."checkout_orders"."status" IN (
        'draft', 'checkout_created', 'pending', 'paid', 'failed', 'canceled',
        'expired', 'partially_refunded', 'refunded', 'charged_back'
      ))
);
--> statement-breakpoint
CREATE TABLE "private"."payment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" text DEFAULT 'mercadopago' NOT NULL,
	"provider_payment_id" text,
	"provider_status" text,
	"status" text DEFAULT 'created' NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_attempts_amount_positive" CHECK ("private"."payment_attempts"."amount" > 0),
	CONSTRAINT "payment_attempts_status_check" CHECK ("private"."payment_attempts"."status" IN ('created', 'pending', 'approved', 'rejected', 'canceled', 'refunded'))
);
--> statement-breakpoint
CREATE TABLE "private"."payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'mercadopago' NOT NULL,
	"provider_event_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"event_type" text NOT NULL,
	"action" text,
	"payload_hash" text NOT NULL,
	"signature_valid" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"failure_reason" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "payment_events_status_check" CHECK ("private"."payment_events"."status" IN ('received', 'processing', 'processed', 'ignored', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "private"."payment_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"payment_attempt_id" uuid,
	"amount" bigint NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"provider_refund_id" text,
	"reason" text NOT NULL,
	"requested_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "payment_refunds_amount_positive" CHECK ("private"."payment_refunds"."amount" > 0),
	CONSTRAINT "payment_refunds_status_check" CHECK ("private"."payment_refunds"."status" IN ('requested', 'processing', 'completed', 'rejected', 'failed'))
);
--> statement-breakpoint
CREATE TABLE "private"."service_jwt_replays" (
	"jti" text PRIMARY KEY NOT NULL,
	"subject" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"claims" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "private"."checkout_order_items" ADD CONSTRAINT "checkout_order_items_order_id_checkout_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "private"."checkout_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."payment_attempts" ADD CONSTRAINT "payment_attempts_order_id_checkout_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "private"."checkout_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."payment_refunds" ADD CONSTRAINT "payment_refunds_order_id_checkout_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "private"."checkout_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."payment_refunds" ADD CONSTRAINT "payment_refunds_payment_attempt_id_payment_attempts_id_fk" FOREIGN KEY ("payment_attempt_id") REFERENCES "private"."payment_attempts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."payment_refunds" ADD CONSTRAINT "payment_refunds_requested_by_admin_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."service_jwt_replays" ADD CONSTRAINT "service_jwt_replays_order_id_checkout_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "private"."checkout_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_order_items_order_product_unique" ON "private"."checkout_order_items" USING btree ("order_id","product_id");--> statement-breakpoint
CREATE INDEX "checkout_order_items_order_idx" ON "private"."checkout_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_orders_customer_request_unique" ON "private"."checkout_orders" USING btree ("customer_user_id","client_request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_orders_idempotency_unique" ON "private"."checkout_orders" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "checkout_orders_provider_order_unique" ON "private"."checkout_orders" USING btree ("provider_order_id") WHERE "private"."checkout_orders"."provider_order_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "checkout_orders_customer_created_idx" ON "private"."checkout_orders" USING btree ("customer_user_id","created_at");--> statement-breakpoint
CREATE INDEX "checkout_orders_status_updated_idx" ON "private"."checkout_orders" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "payment_attempts_order_created_idx" ON "private"."payment_attempts" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_attempts_provider_payment_unique" ON "private"."payment_attempts" USING btree ("provider_payment_id") WHERE "private"."payment_attempts"."provider_payment_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_events_provider_event_unique" ON "private"."payment_events" USING btree ("provider","provider_event_id");--> statement-breakpoint
CREATE INDEX "payment_events_resource_idx" ON "private"."payment_events" USING btree ("resource_id");--> statement-breakpoint
CREATE INDEX "payment_events_status_received_idx" ON "private"."payment_events" USING btree ("status","received_at");--> statement-breakpoint
CREATE INDEX "payment_refunds_order_created_idx" ON "private"."payment_refunds" USING btree ("order_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_refunds_provider_refund_unique" ON "private"."payment_refunds" USING btree ("provider_refund_id") WHERE "private"."payment_refunds"."provider_refund_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "service_jwt_replays_expires_idx" ON "private"."service_jwt_replays" USING btree ("expires_at");--> statement-breakpoint
REVOKE ALL ON TABLE "private"."checkout_orders" FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."checkout_order_items" FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."payment_attempts" FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."payment_events" FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."payment_refunds" FROM PUBLIC, anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."service_jwt_replays" FROM PUBLIC, anon, authenticated;
