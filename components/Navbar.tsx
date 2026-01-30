"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/how-it-works", label: "How It Works" },
    { href: "/use-cases", label: "Use Cases" },
    { href: "/pricing", label: "Pricing" },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
      <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
        <Link href="/">
          <Logo />
        </Link>
        <div className="hidden md:flex items-center gap-10 text-[13px] uppercase tracking-widest font-semibold text-xtal-navy">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hover:text-blue-600 transition-colors ${
                pathname === link.href ? "text-blue-600" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#demo"
            className="bg-xtal-navy text-white px-6 py-2.5 rounded-full hover:scale-105 transition-transform shadow-lg shadow-blue-900/20"
          >
            Request Demo
          </Link>
        </div>
      </div>
    </nav>
  );
}
