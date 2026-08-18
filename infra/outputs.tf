# ── Salidas del blueprint (se rellenan al habilitar cada recurso) ─────

output "ecr_repository_url" {
  description = "URL del repositorio ECR para subir la imagen."
  value       = aws_ecr_repository.app.repository_url
}

output "vpc_id" {
  description = "ID de la VPC principal."
  value       = aws_vpc.main.id
}

# PENDIENTE al habilitar CloudFront/ALB/Route 53:
#   output "cloudfront_distribution_domain" { ... }
#   output "alb_dns_name"                  { ... }
#   output "site_url_final"                { ... }
