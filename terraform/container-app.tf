# ===================================
# Container App
# ===================================
resource "azurerm_container_app" "main" {
  name                         = var.container_app_name
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = var.tags

  # ===================================
  # Registry Configuration
  # ===================================
  registry {
    server               = azurerm_container_registry.main.login_server
    username             = azurerm_container_registry.main.admin_username
    password_secret_name = "acr-password"
  }

  # ===================================
  # Secrets
  # ===================================
  secret {
    name  = "acr-password"
    value = azurerm_container_registry.main.admin_password
  }

  secret {
    name  = "database-url"
    value = var.database_url
  }

  secret {
    name  = "jwt-secret"
    value = var.jwt_secret
  }

  dynamic "secret" {
    for_each = var.smtp_password != "" ? [1] : []
    content {
      name  = "smtp-password"
      value = var.smtp_password
    }
  }

  dynamic "secret" {
    for_each = var.swagger_password != "" ? [1] : []
    content {
      name  = "swagger-password"
      value = var.swagger_password
    }
  }

  # ===================================
  # Ingress Configuration
  # ===================================
  ingress {
    external_enabled = true
    target_port      = var.container_port
    transport        = "http"
    
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  # ===================================
  # Template Configuration
  # ===================================
  template {
    min_replicas = var.min_replicas
    max_replicas = var.max_replicas

    # ===================================
    # Container Definition
    # ===================================
    container {
      name   = var.container_app_name
      image  = "${azurerm_container_registry.main.login_server}/${var.container_image}"
      cpu    = var.cpu_per_replica
      memory = var.memory_per_replica

      # ===================================
      # Environment Variables
      # ===================================
      env {
        name  = "NODE_ENV"
        value = var.node_env
      }

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name        = "JWT_SECRET"
        secret_name = "jwt-secret"
      }

      env {
        name  = "JWT_ACCESS_EXPIRATION_MINUTES"
        value = var.jwt_access_expiration_minutes
      }

      env {
        name  = "JWT_REFRESH_EXPIRATION_DAYS"
        value = var.jwt_refresh_expiration_days
      }

      env {
        name  = "JWT_RESET_PASSWORD_EXPIRATION_MINUTES"
        value = var.jwt_reset_password_expiration_minutes
      }

      env {
        name  = "JWT_VERIFY_EMAIL_EXPIRATION_MINUTES"
        value = var.jwt_verify_email_expiration_minutes
      }

      env {
        name  = "PORT"
        value = tostring(var.container_port)
      }

      # Optional SMTP Configuration
      dynamic "env" {
        for_each = var.smtp_host != "" ? [1] : []
        content {
          name  = "SMTP_HOST"
          value = var.smtp_host
        }
      }

      dynamic "env" {
        for_each = var.smtp_port != "" ? [1] : []
        content {
          name  = "SMTP_PORT"
          value = var.smtp_port
        }
      }

      dynamic "env" {
        for_each = var.smtp_username != "" ? [1] : []
        content {
          name  = "SMTP_USERNAME"
          value = var.smtp_username
        }
      }

      dynamic "env" {
        for_each = var.smtp_password != "" ? [1] : []
        content {
          name        = "SMTP_PASSWORD"
          secret_name = "smtp-password"
        }
      }

      dynamic "env" {
        for_each = var.email_from != "" ? [1] : []
        content {
          name  = "EMAIL_FROM"
          value = var.email_from
        }
      }

      # Swagger Configuration
      env {
        name  = "SWAGGER_USERNAME"
        value = var.swagger_username
      }

      dynamic "env" {
        for_each = var.swagger_password != "" ? [1] : []
        content {
          name        = "SWAGGER_PASSWORD"
          secret_name = "swagger-password"
        }
      }

      # ===================================
      # Probes
      # ===================================
      liveness_probe {
        transport = "HTTP"
        path      = "/health"
        port      = var.container_port
        
        initial_delay           = 10
        interval_seconds        = 30
        timeout                 = 5
        failure_count_threshold = 3
      }

      readiness_probe {
        transport = "HTTP"
        path      = "/health"
        port      = var.container_port
        
        interval_seconds        = 10
        timeout                 = 3
        failure_count_threshold = 3
        success_count_threshold = 1
      }

      startup_probe {
        transport = "HTTP"
        path      = "/health"
        port      = var.container_port
        
        interval_seconds        = 5
        timeout                 = 3
        failure_count_threshold = 12
      }
    }
  }

  lifecycle {
    ignore_changes = [
      template[0].container[0].image,  # Image will be updated by CI/CD
    ]
  }
}
