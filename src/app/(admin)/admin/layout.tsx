import { auth } from "@/lib/auth"
import AdminSidebar from "@/components/admin/AdminSidebar"
import { CollectionProvider } from "@/lib/admin/CollectionContext"

export const metadata = {
  title: "XTAL Admin",
  robots: { index: false, follow: false },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <CollectionProvider>
      <div className="min-h-screen bg-slate-50">
        <AdminSidebar user={session?.user} />
        <main className="md:ml-60 min-h-screen">
          <div className="p-4 pt-16 md:pt-8 md:p-8">{children}</div>
        </main>
      </div>
    </CollectionProvider>
  )
}
