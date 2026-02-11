"use client"

import {
  createContext,
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

interface CollectionContextValue {
  collection: string
  collectionConfig: CollectionConfig
  setCollection: (id: string) => void
  collections: CollectionConfig[]
}

const CollectionContext = createContext<CollectionContextValue | null>(null)

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [collection, setCollectionState] = useState(DEFAULT_COLLECTION)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem(COLLECTION_STORAGE_KEY)
    if (stored && COLLECTIONS.some((c) => c.id === stored)) {
      setCollectionState(stored)
    }
    setHydrated(true)
  }, [])

  function setCollection(id: string) {
    if (COLLECTIONS.some((c) => c.id === id)) {
      setCollectionState(id)
      sessionStorage.setItem(COLLECTION_STORAGE_KEY, id)
    }
  }

  const collectionConfig =
    COLLECTIONS.find((c) => c.id === collection) ?? COLLECTIONS[0]

  if (!hydrated) return null

  return (
    <CollectionContext.Provider
      value={{
        collection,
        collectionConfig,
        setCollection,
        collections: COLLECTIONS,
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
