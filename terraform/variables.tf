# ===================================
# General Variables
# ===================================
variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "roommaster"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "Southeast Asia"
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "RoomMaster"
    ManagedBy   = "Terraform"
  }
}

# ===================================
# Container Registry Variables
# ===================================
variable "acr_sku" {
  description = "SKU for Azure Container Registry (Basic, Standard, Premium)"
  type        = string
  default     = "Basic"
}

# ===================================
# Container App Variables
# ===================================
variable "container_app_name" {
  description = "Name of the container app"
  type        = string
  default     = "roommaster-api"
}

variable "container_image" {
  description = "Container image to deploy (will be overridden by CI/CD)"
  type        = string
  default     = "roommaster:latest"
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 3000
}

variable "min_replicas" {
  description = "Minimum number of container replicas"
  type        = number
  default     = 1
}

variable "max_replicas" {
  description = "Maximum number of container replicas"
  type        = number
  default     = 10
}

variable "cpu_per_replica" {
  description = "CPU allocation per replica (in cores)"
  type        = number
  default     = 0.5
}

variable "memory_per_replica" {
  description = "Memory allocation per replica (in Gi)"
  type        = string
  default     = "1Gi"
}

# ===================================
# Application Environment Variables
# ===================================
variable "node_env" {
  description = "Node environment"
  type        = string
  default     = "production"
}

variable "database_url" {
  description = "PostgreSQL connection string"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret for token signing"
  type        = string
  sensitive   = true
}

variable "jwt_access_expiration_minutes" {
  description = "JWT access token expiration in minutes"
  type        = string
  default     = "30"
}

variable "jwt_refresh_expiration_days" {
  description = "JWT refresh token expiration in days"
  type        = string
  default     = "30"
}

variable "jwt_reset_password_expiration_minutes" {
  description = "JWT reset password token expiration in minutes"
  type        = string
  default     = "10"
}

variable "jwt_verify_email_expiration_minutes" {
  description = "JWT verify email token expiration in minutes"
  type        = string
  default     = "10"
}

# ===================================
# Optional: Email Configuration
# ===================================
variable "smtp_host" {
  description = "SMTP host for email"
  type        = string
  default     = ""
}

variable "smtp_port" {
  description = "SMTP port"
  type        = string
  default     = "587"
}

variable "smtp_username" {
  description = "SMTP username"
  type        = string
  default     = ""
  sensitive   = true
}

variable "smtp_password" {
  description = "SMTP password"
  type        = string
  default     = ""
  sensitive   = true
}

variable "email_from" {
  description = "Email from address"
  type        = string
  default     = ""
}

# ===================================
# Swagger Configuration
# ===================================
variable "swagger_username" {
  description = "Username for Swagger documentation access"
  type        = string
  default     = "admin"
}

variable "swagger_password" {
  description = "Password for Swagger documentation access"
  type        = string
  default     = ""
  sensitive   = true
}

# ===================================
# Log Analytics Variables
# ===================================
variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 30
}
