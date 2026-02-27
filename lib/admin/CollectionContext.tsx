"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"
import {
  COLLECTIONS,
  DEFAULT_COLLECTION,
  COLLECTION_STORAGE_KEY,
  type CollectionConfig,
} from "@/lib/admin/collections"

const RECENT_STORAGE_KEY = "xtal-admin-recent-collections"
const MAX_RECENT = 5

interface CollectionContextValue {
  collection: string
  collectionConfig: CollectionConfig
  setCollection: (id: string) => void
  collections: CollectionConfig[]
  recentCollections: string[]
  refreshCollections: () => Promise<void>
}

const CollectionContext = createContext<CollectionContextValue | null>(null)

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [collection, setCollectionState] = useState(DEFAULT_COLLECTION)
  const [collections, setCollections] = useState<CollectionConfig[]>(COLLECTIONS)
  const [recentCollections, setRecentCollections] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

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
    try {
      const recent = JSON.parse(sessionStorage.getItem(RECENT_STORAGE_KEY) || "[]")
      if (Array.isArray(recent)) setRecentCollections(recent)
    } catch { /* ignore */ }
    setHydrated(true)
    refreshCollections()
  }, [refreshCollections])

  function setCollection(id: string) {
    if (collections.some((c) => c.id === id)) {
      setCollectionState(id)
      sessionStorage.setItem(COLLECTION_STORAGE_KEY, id)
      // Track recent selections
      const updated = [id, ...recentCollections.filter((r) => r !== id)].slice(
        0,
        MAX_RECENT,
      )
      setRecentCollections(updated)
      sessionStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated))
    }
  }

  const collectionConfig =
    collections.find((c) => c.id === collection) ?? collections[0]

  if (!hydrated) return null

  return (
    <CollectionContext.Provider
      value={{
        collection,
        collectionConfig,
        setCollection,
        collections,
        recentCollections,
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
