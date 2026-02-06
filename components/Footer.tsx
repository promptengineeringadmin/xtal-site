import Link from "next/link"
import Logo from "./Logo"
import FooterSubscribe from "./FooterSubscribe"

const SOCIAL_LINKS = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/xtal-search/",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: "X",
    href: "https://x.com/xtalsearch",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/xtalsearch",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C16.67.014 16.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer className="bg-[#0F1A35] text-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-12 md:gap-8">
          {/* Column 1: Newsletter */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-3">
              Stay in the Loop
            </h3>
            <p className="text-sm text-slate-400 mb-5">
              Product updates and occasional sharp takes on AI, e-commerce and search.
            </p>
            <FooterSubscribe />
          </div>

          {/* Column 2: Social Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-3">
              Follow Us
            </h3>
            <div className="space-y-3">
              {SOCIAL_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors group"
                >
                  <span className="text-slate-500 group-hover:text-white transition-colors">
                    {link.icon}
                  </span>
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Column 3: Podcast */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-3">
              The Thought Virus
            </h3>
            <p className="text-sm text-slate-400 mb-5">
              A 9-episode series documenting what happens when AI stops helping you think — and starts shaping what you think about.
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="https://open.spotify.com/show/22xKrmogHBCpoFXMxJvINy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 transition-colors text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                Listen on Spotify
              </a>
              <a
                href="https://podcasts.apple.com/us/podcast/the-thought-virus/id1798498694"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 transition-colors text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6c4.636 0 8.4 3.764 8.4 8.4 0 1.81-.574 3.488-1.552 4.862-.236-.834-.496-1.644-.78-2.422.49-.748.776-1.642.776-2.6 0-2.627-2.13-4.756-4.756-4.756h-.176c-2.627 0-4.756 2.13-4.756 4.756 0 .958.286 1.852.776 2.6-.284.778-.544 1.588-.78 2.422A8.362 8.362 0 013.6 12c0-4.636 3.764-8.4 8.4-8.4zm0 3.6a4.8 4.8 0 00-1.5 9.36c-.186.63-.348 1.29-.48 1.98A2.4 2.4 0 0112 20.4a2.4 2.4 0 011.98-1.86c-.132-.69-.294-1.35-.48-1.98A4.8 4.8 0 0012 7.2zm0 2.4a2.4 2.4 0 110 4.8 2.4 2.4 0 010-4.8z" />
                </svg>
                Listen on Apple Podcasts
              </a>
            </div>
          </div>
        </div>

        {/* Divider + Bottom Row */}
        <div className="border-t border-slate-700 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </Link>
          </div>
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} XTAL Search. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
