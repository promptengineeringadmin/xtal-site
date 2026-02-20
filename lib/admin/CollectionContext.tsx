"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import { useSession } from "next-auth/react"
import {
  COLLECTIONS,
  DEFAULT_COLLECTION,
  COLLECTION_STORAGE_KEY,
  type CollectionConfig,
} from "@/lib/admin/collections"

interface CollectionContextValue {
  collection: string
  collectionConfig: CollectionConfig
  setCollection: (id: string) => void
  collections: CollectionConfig[]
  refreshCollections: () => Promise<void>
}

const CollectionContext = createContext<CollectionContextValue | null>(null)

export function CollectionProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [collection, setCollectionState] = useState(DEFAULT_COLLECTION)
  const [collections, setCollections] = useState<CollectionConfig[]>(COLLECTIONS)
  const [hydrated, setHydrated] = useState(false)

  const isClient = session?.user?.role === "client"
  const clientCollectionIds = session?.user?.collectionIds ?? []

  // Fetch dynamic collections from Redis (merged with hardcoded)
  const refreshCollections = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/collections")
      if (res.ok) {
        const data = await res.json()
        if (data.collections) {
          setCollections(data.collections)
        }
      }
    } catch {
      // Silently fall back to hardcoded collections
    }
  }, [])

  useEffect(() => {
    const stored = sessionStorage.getItem(COLLECTION_STORAGE_KEY)
    if (stored && COLLECTIONS.some((c) => c.id === stored)) {
      setCollectionState(stored)
    }
    setHydrated(true)
    refreshCollections()
  }, [refreshCollections])

  // For client users: lock to their org's collection(s)
  useEffect(() => {
    if (isClient && clientCollectionIds.length > 0) {
      if (!clientCollectionIds.includes(collection)) {
        setCollectionState(clientCollectionIds[0])
      }
    }
  }, [isClient, clientCollectionIds, collection])

  // Determine visible collections
  const visibleCollections = isClient && clientCollectionIds.length > 0
    ? collections.filter((c) => clientCollectionIds.includes(c.id))
    : collections

  function setCollection(id: string) {
    // Client users can't switch to collections outside their org
    if (isClient && clientCollectionIds.length > 0 && !clientCollectionIds.includes(id)) {
      return
    }
    if (collections.some((c) => c.id === id)) {
      setCollectionState(id)
      sessionStorage.setItem(COLLECTION_STORAGE_KEY, id)
    }
  }

  const collectionConfig =
    visibleCollections.find((c) => c.id === collection) ?? visibleCollections[0]

  if (!hydrated) return null

  return (
    <CollectionContext.Provider
      value={{
        collection,
        collectionConfig,
        setCollection,
        collections: visibleCollections,
        refreshCollections,
      }}
    >
      {children}
    </CollectionContext.Provider>
  )
}

export function useCollection(): CollectionContextValue {
  const ctx = useContext(CollectionContext)
  if (!ctx) {
    throw new Error("useCollection must be used within a CollectionProvider")
  }
  return ctx
}
