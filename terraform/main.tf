# terraform/main.tf
# Main infrastructure resources for RoomMaster Backend

# Create Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

# Create App Service Plan
# Using Free tier (F1) for minimal cost - suitable for school projects
# For slightly better performance, consider Basic B1 tier
resource "azurerm_service_plan" "main" {
  name                = var.app_service_plan_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "F1" # Free tier - change to "B1" for Basic tier if needed

  tags = var.tags
}

# Create Linux App Service for Node.js
resource "azurerm_linux_web_app" "main" {
  name                = var.app_service_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id

  site_config {
    always_on = false # Must be false for Free tier (F1)

    application_stack {
      node_version = var.node_version
    }

    # Health check endpoint (optional but recommended)
    # health_check_path = "/health"

    # Configure CORS if needed
    # cors {
    #   allowed_origins = ["https://your-frontend-domain.com"]
    # }
  }

  # Application settings (environment variables)
  app_settings = {
    # Core Configuration
    "PORT"         = var.port
    "NODE_ENV"     = var.node_env
    "DATABASE_URL" = var.database_url

    # JWT Configuration
    "JWT_SECRET"                            = var.jwt_secret
    "JWT_ACCESS_EXPIRATION_MINUTES"         = var.jwt_access_expiration_minutes
    "JWT_REFRESH_EXPIRATION_DAYS"           = var.jwt_refresh_expiration_days
    "JWT_RESET_PASSWORD_EXPIRATION_MINUTES" = var.jwt_reset_password_expiration_minutes
    "JWT_VERIFY_EMAIL_EXPIRATION_MINUTES"   = var.jwt_verify_email_expiration_minutes

    # SMTP Configuration
    "SMTP_HOST"     = var.smtp_host
    "SMTP_PORT"     = var.smtp_port
    "SMTP_USERNAME" = var.smtp_username
    "SMTP_PASSWORD" = var.smtp_password
    "EMAIL_FROM"    = var.email_from

    # Swagger Configuration
    "SWAGGER_USERNAME" = var.swagger_username
    "SWAGGER_PASSWORD" = var.swagger_password

    # Azure App Service Configuration
    "WEBSITE_NODE_DEFAULT_VERSION" = "~20"
    # Let Azure build install dependencies instead of shipping node_modules
    # "SCM_DO_BUILD_DURING_DEPLOYMENT" = "true"
  }

  # Configure HTTPS only
  https_only = true

  # Connection strings (alternative to app_settings for sensitive data)
  # connection_string {
  #   name  = "Database"
  #   type  = "Custom"
  #   value = var.database_url
  # }

  tags = var.tags
}
