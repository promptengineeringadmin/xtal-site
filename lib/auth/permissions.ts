import type { Session } from "next-auth"

export function isInternal(session: Session | null): boolean {
  return session?.user?.role === "internal"
}

export function canAccessCollection(
  session: Session | null,
  collectionId: string
): boolean {
  if (!session) return false
  if (session.user.role === "internal") return true
  return session.user.collectionIds.includes(collectionId)
}

export function getSessionCollections(session: Session | null): string[] {
  if (!session) return []
  return session.user.collectionIds
}
