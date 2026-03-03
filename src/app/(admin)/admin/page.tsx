import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { MARKETING_HOST } from "@/lib/admin/subdomain-routes"

export default async function AdminIndex() {
  const headersList = await headers()
  const host = headersList.get("host") ?? ""

  if (host.includes(MARKETING_HOST)) {
    redirect("/admin/demos")
  }
  redirect("/admin/dashboard")
}
