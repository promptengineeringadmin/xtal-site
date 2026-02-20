import AdminSidebar from "@/components/admin/AdminSidebar"
import { CollectionProvider } from "@/lib/admin/CollectionContext"
import { SessionProvider } from "next-auth/react"

export const metadata = {
  title: "XTAL Admin",
  robots: { index: false, follow: false },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <CollectionProvider>
        <div className="min-h-screen bg-slate-50">
          <AdminSidebar />
          <main className="md:ml-60 min-h-screen">
            <div className="p-4 pt-16 md:pt-8 md:p-8">{children}</div>
          </main>
        </div>
      </CollectionProvider>
    </SessionProvider>
  )
}
