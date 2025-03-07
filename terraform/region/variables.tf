variable "default_role" {
  description = "default aws IAM role to use. defaults to the CI Role"
  default     = "opg-lpa-ci"
}

variable "pagerduty_token" {
  description = "pagerduty token"
  sensitive   = true
}

# variables for terraform.tfvars.json
variable "account_mapping" {
  description = "maps the tfvars.json files to accounts"
  type        = map(any)
}

variable "accounts" {
  description = "the account map loaded from tfvars.json"
  type = map(
    object({
      account_id         = string
      account_name_short = string
      is_production      = string
      retention_in_days  = number
      dr_enabled         = bool
      always_on_aurora   = bool
      dns_firewall = object({
        enabled         = bool
        domains_allowed = list(string)
        domains_blocked = list(string)
      })
      regions = map(
        object({
          region     = string
          is_primary = string
      }))
    })
  )
}
