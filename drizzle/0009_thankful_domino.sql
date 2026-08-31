CREATE TABLE "private"."admin_role_capabilities" (
	"role_id" uuid NOT NULL,
	"capability" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_role_capabilities_role_id_capability_pk" PRIMARY KEY("role_id","capability")
);
--> statement-breakpoint
CREATE TABLE "private"."vendor_memberships" (
	"vendor_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_memberships_vendor_id_user_id_pk" PRIMARY KEY("vendor_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "private"."vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"status" text DEFAULT 'active' NOT NULL,
	"commission_bps" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendors_status_check" CHECK ("private"."vendors"."status" IN ('active', 'suspended')),
	CONSTRAINT "vendors_commission_bps_check" CHECK ("private"."vendors"."commission_bps" >= 0 AND "private"."vendors"."commission_bps" <= 10000)
);
--> statement-breakpoint
CREATE TABLE "private"."admin_integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"label" text NOT NULL,
	"status" text DEFAULT 'disconnected' NOT NULL,
	"public_reference" text,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_integrations_status_check" CHECK ("private"."admin_integrations"."status" IN ('disconnected', 'configured', 'degraded', 'disabled'))
);
--> statement-breakpoint
CREATE TABLE "private"."coupon_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"external_id" text,
	"status" text DEFAULT 'active' NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupon_references_status_check" CHECK ("private"."coupon_references"."status" IN ('active', 'inactive', 'expired'))
);
--> statement-breakpoint
ALTER TABLE "private"."admin_roles" DROP CONSTRAINT "admin_roles_key_check";--> statement-breakpoint
ALTER TABLE "private"."admin_settings" DROP CONSTRAINT "admin_settings_key_check";--> statement-breakpoint
ALTER TABLE "private"."admin_role_capabilities" ADD CONSTRAINT "admin_role_capabilities_role_id_admin_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "private"."admin_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."vendor_memberships" ADD CONSTRAINT "vendor_memberships_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "private"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."vendor_memberships" ADD CONSTRAINT "vendor_memberships_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "private"."admin_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."vendor_memberships" ADD CONSTRAINT "vendor_memberships_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."vendors" ADD CONSTRAINT "vendors_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."admin_integrations" ADD CONSTRAINT "admin_integrations_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "private"."coupon_references" ADD CONSTRAINT "coupon_references_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "private"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_role_capabilities_capability_idx" ON "private"."admin_role_capabilities" USING btree ("capability");--> statement-breakpoint
CREATE UNIQUE INDEX "vendor_memberships_user_unique" ON "private"."vendor_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vendors_status_idx" ON "private"."vendors" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "admin_integrations_provider_unique" ON "private"."admin_integrations" USING btree ("provider");--> statement-breakpoint
CREATE INDEX "admin_integrations_status_idx" ON "private"."admin_integrations" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_references_code_unique" ON "private"."coupon_references" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coupon_references_status_idx" ON "private"."coupon_references" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_logs_target_type_idx" ON "private"."audit_logs" USING btree ("target_type");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "private"."audit_logs" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "private"."admin_roles" ADD CONSTRAINT "admin_roles_key_check" CHECK ("private"."admin_roles"."key" IN ('owner', 'admin', 'editor', 'operador', 'moderador', 'lector', 'vendedor'));--> statement-breakpoint
ALTER TABLE "private"."admin_settings" ADD CONSTRAINT "admin_settings_key_check" CHECK ("private"."admin_settings"."key" IN (
        'brand.display_name',
        'brand.tagline',
        'brand.website_url',
        'organization.legal_name',
        'organization.tax_id',
        'contact.support_email',
        'contact.sales_email',
        'contact.whatsapp',
        'commerce.default_coupon_reference',
        'integrations.shopify_store_url'
      ));--> statement-breakpoint
WITH role_defaults(key, name, description, capabilities) AS (
  VALUES
  ('owner', 'Owner', 'Configuración sensible, usuarios, roles, auditoría y todos los módulos.', ARRAY['admin.access', 'users.manage', 'content.read', 'content.edit', 'content.review', 'content.publish', 'crm.read', 'crm.manage', 'crm.export', 'orders.read', 'orders.manage', 'orders.sync', 'market.read', 'market.manage', 'market.self', 'tree.read', 'tree.export', 'events.manage', 'events.read', 'events.checkin', 'events.export', 'unity.read', 'unity.manage', 'radio.read', 'radio.manage', 'backstage.read', 'backstage.manage', 'auctions.read', 'auctions.manage', 'analytics.read', 'analytics.export', 'config.manage', 'tree.update', 'community.read', 'community.moderate', 'audit.read']::text[]),
  ('admin', 'Administrador', 'Operación completa de módulos autorizados y publicación de contenido.', ARRAY['admin.access', 'content.read', 'content.edit', 'content.review', 'content.publish', 'crm.read', 'crm.manage', 'crm.export', 'orders.read', 'orders.manage', 'orders.sync', 'market.read', 'market.manage', 'tree.read', 'tree.export', 'events.manage', 'events.read', 'events.checkin', 'events.export', 'unity.read', 'unity.manage', 'radio.read', 'radio.manage', 'backstage.read', 'backstage.manage', 'auctions.read', 'auctions.manage', 'analytics.read', 'analytics.export', 'community.read', 'tree.update', 'community.moderate', 'audit.read']::text[]),
  ('editor', 'Editor', 'Crear, editar y preparar contenido, lanzamientos, eventos y activos.', ARRAY['admin.access', 'content.read', 'content.edit', 'content.review', 'events.read', 'events.manage']::text[]),
  ('operador', 'Operador', 'Atender solicitudes, actualizar Tree/mercado/radio y consultar operaciones asignadas.', ARRAY['admin.access', 'crm.read', 'crm.manage', 'crm.export', 'orders.read', 'orders.manage', 'market.read', 'tree.read', 'tree.update', 'tree.export', 'events.read', 'events.manage', 'events.checkin', 'events.export', 'unity.read', 'unity.manage', 'radio.read', 'backstage.read', 'backstage.manage']::text[]),
  ('moderador', 'Moderador', 'Revisar y moderar comunidad.', ARRAY['admin.access', 'community.read', 'community.moderate']::text[]),
  ('lector', 'Lector', 'Consulta de métricas y datos explícitamente asignados.', ARRAY['admin.access', 'content.read', 'crm.read', 'orders.read', 'market.read', 'tree.read', 'events.read', 'unity.read', 'radio.read', 'community.read', 'backstage.read', 'analytics.read']::text[]),
  ('vendedor', 'Vendedor', 'Acceso comercial limitado al vendedor vinculado y a sus registros propios.', ARRAY['admin.access', 'crm.read', 'orders.read', 'market.read', 'market.self']::text[])
), upserted_roles AS (
  INSERT INTO "private"."admin_roles" ("key", "name", "description")
  SELECT key, name, description FROM role_defaults
  ON CONFLICT ("key") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description"
  RETURNING "id", "key"
)
INSERT INTO "private"."admin_role_capabilities" ("role_id", "capability")
SELECT roles.id, unnest(defaults.capabilities)
FROM upserted_roles roles
JOIN role_defaults defaults ON defaults.key = roles.key
ON CONFLICT DO NOTHING;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."admin_role_capabilities" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."vendors" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."vendor_memberships" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."admin_integrations" FROM anon, authenticated;--> statement-breakpoint
REVOKE ALL ON TABLE "private"."coupon_references" FROM anon, authenticated;
