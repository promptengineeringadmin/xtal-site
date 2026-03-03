/**
 * Seed Willow as the first billing customer.
 * Usage: npx tsx scripts/seed-willow-customer.ts
 *
 * Requires env: export $(grep -v '^#' .env.local | grep -v '^\s*$' | xargs)
 */

import { saveCustomer, getCustomer, type BillingCustomer } from "../lib/api/billing-customer"

async function main() {
  const existing = await getCustomer("willow")
  if (existing) {
    console.log("Willow customer already exists:", existing.display_name, "—", existing.status)
    return
  }

  const willow: BillingCustomer = {
    slug: "willow",
    company_name: "Willow Group Ltd",
    display_name: "Willow",
    billing_email: "",
    website: "www.willowgroupltd.com",
    deployment_method: "gtm",
    collections: ["willow"],
    customer_type: "paying",
    status: "active",
    billing_start: "2026-03-03",
    launch_date: "2026-03-03",
    billing_model: "usage",
    price_per_search: 0.10,
    price_per_aspect_click: 0.10,
    price_per_explain: 0.10,
    created_at: "",
    updated_at: "",
  }

  await saveCustomer(willow)
  console.log("Willow customer seeded successfully.")
}

main().catch((err) => {
  console.error("Failed to seed:", err)
  process.exit(1)
})
