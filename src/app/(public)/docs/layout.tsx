import Link from "next/link"
import Image from "next/image"

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Hide the public layout footer on docs pages */}
      <style>{`footer { display: none !important; }`}</style>
      <div className="min-h-screen flex">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-slate-200 bg-white print:hidden sticky top-0 h-screen overflow-y-auto">
          <div className="p-5 border-b border-slate-200">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/xtal-logo.svg" alt="XTAL" width={28} height={28} />
              <span className="text-lg font-semibold tracking-brand text-xtal-navy">XTAL</span>
            </Link>
            <p className="text-[11px] text-slate-400 mt-1">Developer Documentation</p>
          </div>
          <nav className="p-4 space-y-1 text-sm">
            <NavSection title="Getting Started">
              <NavLink href="#overview">Overview</NavLink>
              <NavLink href="#quick-start">Quick Start</NavLink>
              <NavLink href="#integration-options">Integration Options</NavLink>
            </NavSection>
            <NavSection title="API Reference">
              <NavLink href="#search-api">Search</NavLink>
              <NavLink href="#aspects-api">Aspects</NavLink>
              <NavLink href="#config-api">Configuration</NavLink>
            </NavSection>
            <NavSection title="Data Models">
              <NavLink href="#product-schema">Product Schema</NavLink>
              <NavLink href="#search-context">Search Context</NavLink>
              <NavLink href="#facets">Facets &amp; Filtering</NavLink>
            </NavSection>
            <NavSection title="Configuration">
              <NavLink href="#collection-settings">Collection Settings</NavLink>
              <NavLink href="#utm-tracking">UTM Tracking</NavLink>
              <NavLink href="#features">Features</NavLink>
            </NavSection>
            <NavSection title="Support">
              <NavLink href="#next-steps">Next Steps</NavLink>
            </NavSection>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </>
  )
}

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 px-2">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="block px-2 py-1.5 rounded-md text-slate-600 hover:text-xtal-navy hover:bg-slate-50 transition-colors"
    >
      {children}
    </a>
  )
}
