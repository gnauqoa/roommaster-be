terraform {
  required_version = ">= 1.6.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85.0"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.47.0"
    }
  }

  # Remote backend configuration for storing state in Azure Storage
  # This will be configured during setup
  backend "azurerm" {
    # These values will be provided via backend config file or CLI
    # resource_group_name  = "rg-roommaster-tfstate"
    # storage_account_name = "stroommasterstate"
    # container_name       = "tfstate"
    # key                  = "roommaster.tfstate"
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
    
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}

provider "azuread" {}
