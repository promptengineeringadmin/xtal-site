import { NextResponse } from "next/server"
import {
  getAllCustomers,
  getCustomer,
  saveCustomer,
  deleteCustomer,
  type BillingCustomer,
  DEFAULT_PRICING,
} from "@/lib/api/billing-customer"
import { getBillingUsage } from "@/lib/api/billing-usage"

// GET /api/admin/customers — list all customers with usage enrichment
// GET /api/admin/customers?slug=willow — get single customer
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")

    if (slug) {
      const customer = await getCustomer(slug)
      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 })
      }
      // Enrich with current month usage across all collections
      const usageByCollection = await Promise.all(
        customer.collections.map(async (col) => ({
          collection: col,
          usage: await getBillingUsage(col),
        }))
      )
      return NextResponse.json({ customer, usage: usageByCollection })
    }

    const customers = await getAllCustomers()

    // Enrich each customer with this month's total cost
    const enriched = await Promise.all(
      customers.map(async (c) => {
        let total_this_month = 0
        for (const col of c.collections) {
          const usage = await getBillingUsage(col)
          if (c.billing_model === "flat") {
            total_this_month = c.flat_monthly_fee ?? 0
          } else {
            total_this_month +=
              usage.search * c.price_per_search +
              usage.aspect_click * c.price_per_aspect_click +
              usage.explain * c.price_per_explain
          }
        }
        return { ...c, total_this_month }
      })
    )

    return NextResponse.json({ customers: enriched })
  } catch (error) {
    console.error("List customers error:", error)
    return NextResponse.json({ error: "Failed to list customers" }, { status: 500 })
  }
}

// POST /api/admin/customers — create or update customer
export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.slug || !body.company_name) {
      return NextResponse.json(
        { error: "slug and company_name are required" },
        { status: 400 }
      )
    }

    const existing = await getCustomer(body.slug)

    const customer: BillingCustomer = {
      slug: body.slug,
      company_name: body.company_name,
      display_name: body.display_name || body.company_name,
      primary_contact_name: body.primary_contact_name,
      primary_contact_email: body.primary_contact_email,
      billing_email: body.billing_email || "",
      collections: body.collections || [],
      customer_type: body.customer_type || "demo",
      status: body.status || "prospect",
      billing_start: body.billing_start,
      billing_end: body.billing_end,
      billing_model: body.billing_model || "usage",
      price_per_search: body.price_per_search ?? DEFAULT_PRICING.price_per_search,
      price_per_aspect_click: body.price_per_aspect_click ?? DEFAULT_PRICING.price_per_aspect_click,
      price_per_explain: body.price_per_explain ?? DEFAULT_PRICING.price_per_explain,
      flat_monthly_fee: body.flat_monthly_fee,
      notes: body.notes,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    await saveCustomer(customer)
    return NextResponse.json({ customer })
  } catch (error) {
    console.error("Save customer error:", error)
    return NextResponse.json({ error: "Failed to save customer" }, { status: 500 })
  }
}

// DELETE /api/admin/customers — body: { slug }
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    if (!body.slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 })
    }
    await deleteCustomer(body.slug)
    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error("Delete customer error:", error)
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}
