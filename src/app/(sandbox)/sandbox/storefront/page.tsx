import { serverSearch } from "@/lib/server-search"
import type { Product } from "@/lib/xtal-types"
import StorefrontShell from "./_components/StorefrontShell"

export const dynamic = "force-dynamic"

export default async function StorefrontPage() {
  const res = await serverSearch("bestsellers", "willow", 16)
  const products: Product[] = res?.results ?? []

  return <StorefrontShell products={products} />
}
