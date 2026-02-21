"use client"

export default function StorefrontFooter() {
  return (
    <footer
      className="border-t py-12 px-6"
      style={{
        borderColor: "#E5E2DC",
        background: "#F7F6F3",
        fontFamily: "var(--font-body)",
        color: "#4A4A4A",
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h4
            className="text-lg mb-3"
            style={{ fontFamily: "var(--font-heading)", color: "#1A1A1A" }}
          >
            Willow Group
          </h4>
          <p className="text-sm leading-relaxed">
            34 Clinton Street<br />
            Batavia, NY 14020
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "#1A1A1A" }}>
            Quick Links
          </h4>
          <ul className="space-y-1 text-sm">
            {["About Us", "Contact", "Shipping Policy", "Returns"].map((link) => (
              <li key={link}>
                <a href="#" className="hover:opacity-70 transition-opacity" onClick={(e) => e.preventDefault()}>
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "#1A1A1A" }}>
            Follow Us
          </h4>
          <ul className="space-y-1 text-sm">
            {["Instagram", "Facebook", "Pinterest"].map((link) => (
              <li key={link}>
                <a href="#" className="hover:opacity-70 transition-opacity" onClick={(e) => e.preventDefault()}>
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t text-xs text-center" style={{ borderColor: "#E5E2DC" }}>
        &copy; 2026 Willow Group Ltd. All rights reserved.
        <span className="ml-4 px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: "#E5E2DC" }}>
          XTAL Sandbox — Not a real store
        </span>
      </div>
    </footer>
  )
}
