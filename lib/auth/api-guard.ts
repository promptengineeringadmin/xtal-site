import { auth } from "@/lib/auth"

export async function requireAuth() {
  const session = await auth()
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }
  return session
}

export async function requireInternal() {
  const result = await requireAuth()
  if (result instanceof Response) return result
  if (result.user.role !== "internal") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }
  return result
}
