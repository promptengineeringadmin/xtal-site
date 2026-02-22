export const metadata = {
  robots: { index: false, follow: false },
}

export default function SandboxLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      {/* Sprat is not on Google Fonts — use a display serif fallback chain */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap');
        :root {
          --font-heading: 'DM Serif Display', 'Georgia', serif;
          --font-body: 'Manrope', 'Helvetica Neue', sans-serif;
        }
      `}</style>
      {children}
    </>
  )
}
