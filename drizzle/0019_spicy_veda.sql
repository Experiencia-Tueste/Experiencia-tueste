ALTER TABLE "private"."engagement_requests" ADD COLUMN "radio_company_id" uuid;--> statement-breakpoint
ALTER TABLE "private"."engagement_requests" ADD COLUMN "radio_channel_id" uuid;--> statement-breakpoint
ALTER TABLE "private"."engagement_requests" ADD CONSTRAINT "engagement_requests_radio_company_id_radio_companies_id_fk" FOREIGN KEY ("radio_company_id") REFERENCES "private"."radio_companies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."engagement_requests" ADD CONSTRAINT "engagement_requests_radio_channel_id_radio_channels_id_fk" FOREIGN KEY ("radio_channel_id") REFERENCES "private"."radio_channels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "engagement_requests_radio_company_idx" ON "private"."engagement_requests" USING btree ("radio_company_id");--> statement-breakpoint
CREATE INDEX "engagement_requests_radio_channel_idx" ON "private"."engagement_requests" USING btree ("radio_channel_id");