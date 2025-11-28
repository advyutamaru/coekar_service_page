variable "root_domain" {
  description = "Root domain name (hosted zone)"
  type        = string
  default     = "coekar.com"
}

variable "site_subdomain" {
  description = "Subdomain used for the service page"
  type        = string
  default     = "info"
}

variable "github_owner" {
  description = "GitHub organization or user name"
  type        = string
  default     = "advatec"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "coekar_service_page"
}

variable "tags" {
  description = "Common tags to apply to resources"
  type        = map(string)
  default = {
    Project = "coekar_service_page"
  }
}

