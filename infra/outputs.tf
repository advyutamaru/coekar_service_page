output "site_domain" {
  description = "Full domain name for the service page"
  value       = local.site_domain
}

output "site_bucket_name" {
  description = "S3 bucket name used for static site hosting"
  value       = aws_s3_bucket.site.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.site.domain_name
}

output "github_actions_role_arn" {
  description = "IAM role ARN for GitHub Actions deployment"
  value       = aws_iam_role.github_actions.arn
}

