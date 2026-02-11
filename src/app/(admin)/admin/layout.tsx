import PasswordGate from "@/components/admin/PasswordGate"
import AdminSidebar from "@/components/admin/AdminSidebar"
import { CollectionProvider } from "@/lib/admin/CollectionContext"

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
    <PasswordGate>
      <CollectionProvider>
        <div className="min-h-screen bg-slate-50">
          <AdminSidebar />
          <main className="ml-60 min-h-screen">
            <div className="p-8">{children}</div>
          </main>
        </div>
      </CollectionProvider>
    </PasswordGate>
  )
}
