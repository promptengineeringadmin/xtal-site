"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import DemoButton from "./DemoButton";

export default function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navLinks = [
    { href: "/how-it-works", label: "How It Works" },
    { href: "/use-cases", label: "Use Cases" },
    { href: "/pricing", label: "Pricing" },
    // { href: "/grade", label: "Grade Search" },
    // { href: "/try", label: "Try It" },
  ];

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100 print:hidden">
        <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
          <Link href="/">
            <Logo />
          </Link>

          {/* Desktop nav */}
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
            <DemoButton
              source="navbar"
              className="bg-xtal-navy text-white px-6 py-2.5 rounded-full hover:scale-105 transition-transform shadow-lg shadow-blue-900/20"
            >
              Request Demo
            </DemoButton>
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsOpen(true)}
            className="md:hidden p-2 text-xtal-navy"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile menu drawer (right rail) */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white z-50 shadow-2xl transform transition-transform md:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-end p-4">
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-xtal-navy"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex flex-col px-6 py-4 gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`text-lg font-semibold text-xtal-navy hover:text-blue-600 transition-colors ${
                pathname === link.href ? "text-blue-600" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
          <DemoButton
            source="navbar-mobile"
            className="bg-xtal-navy text-white px-6 py-3 rounded-full text-center font-semibold mt-4"
          >
            Request Demo
          </DemoButton>
        </div>
      </div>
    </>
  );
}
