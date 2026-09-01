CREATE INDEX "admin_user_roles_role_id_idx" ON "private"."admin_user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "vendor_memberships_created_by_idx" ON "private"."vendor_memberships" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "vendors_created_by_idx" ON "private"."vendors" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "admin_integrations_updated_by_idx" ON "private"."admin_integrations" USING btree ("updated_by");--> statement-breakpoint
CREATE INDEX "coupon_references_updated_by_idx" ON "private"."coupon_references" USING btree ("updated_by");