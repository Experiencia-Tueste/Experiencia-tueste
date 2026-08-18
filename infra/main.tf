# ─────────────────────────────────────────────────────────────────────
# Blueprint de recursos — SIN APROVISIONAR.
#
# Cada bloque está documentado. Los recursos dependientes de decisiones
# externas (dominio, certificado) quedan comentados con `# PENDIENTE`
# para habilitarlos en su fase. Nada de esto se ha aplicado jamás.
# ─────────────────────────────────────────────────────────────────────

locals {
  name = "${var.project_name}-${var.environment}"
}

# ── ECR: repositorio de imágenes del contenedor Next.js ──────────────
resource "aws_ecr_repository" "app" {
  name = local.name

  # Tags inmutables: cada despliegue publica un tag nuevo (p. ej. el SHA
  # del commit); nunca se sobreescribe una imagen ya desplegada.
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# ── VPC y red base ──────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
}

# Subredes públicas (ALB/NAT) y privadas (ECS) + security groups.
# Los detalles (AZs, número de subredes, egress) se concretan al definir
# la cuenta y la región definitivas; por eso el blueprint solo declara la
# VPC y documenta el resto como pendiente.

# ── ECS Fargate + ALB (privado, origen de CloudFront) ────────────────
# PENDIENTE: task definition con la imagen de ECR, health check GET /,
# servicio Fargate en subredes privadas, ALB interno con listener
# HTTPS (certificado ACM) que solo acepta tráfico de CloudFront.

# ── CloudFront (único punto público) ────────────────────────────────
# PENDIENTE: distribución con origen ALB, cacheo de estáticos con hash,
# comportamientos que preservan las cabeceras de seguridad de la app.

# ── WAF global (asociada a CloudFront) ───────────────────────────────
# PENDIENTE: web ACL en CLOUDFRONT scope con:
#   - reglas administradas (AWSManagedRulesCommonRuleSet,
#     AWSManagedRulesSQLiRuleSet al existir endpoints),
#   - rate-based rule con límite var.waf_rate_limit,
#   - TODO en acción COUNT inicial (observación), luego BLOCK por regla.

# ── Route 53 + ACM ──────────────────────────────────────────────────
# PENDIENTE (solo si var.domain_name != ""):
#   - zona alojada para el dominio,
#   - certificado ACM en us-east-1 (provider aws.us_east_1) con
#     validación DNS,
#   - registros A/AAAA → CloudFront.

# ── Secrets Manager ─────────────────────────────────────────────────
# PENDIENTE: secretos reales (Supabase, Shopify si aplica) inyectados en
# Fargate vía valueFrom del task definition. Nunca en variables tf ni
# en la imagen.

# ── CloudWatch ──────────────────────────────────────────────────────
# PENDIENTE: log groups de ECS con retención var.log_retention_days,
# métricas y alarmas (5xx, latencia, coste).

# ── IAM mínimo + OIDC ───────────────────────────────────────────────
# PENDIENTE:
#   - rol de ejecución de Fargate (ECR pull + CloudWatch + Secrets
#     Manager con mínimo privilegio),
#   - rol de despliegue para GitHub Actions federado por OIDC (sin
#     access keys permanentes), limitado a ecr:PutImage y ecs:UpdateService.
