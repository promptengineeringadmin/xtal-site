import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    robots: { index: false, follow: false },
    title: `XTAL Visual QA — ${slug}`,
  };
}

export default async function SiteClonePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="flex flex-col h-screen bg-[#0f0f17]">
      {/* Control bar */}
      <div
        className="flex items-center gap-4 px-4 shrink-0"
        style={{
          height: 40,
          background: "#1e1e2e",
          fontFamily: "system-ui",
          fontSize: 13,
        }}
      >
        <span style={{ color: "#818cf8", fontWeight: 600 }}>
          XTAL Visual QA
        </span>
        <span style={{ color: "#6c7086" }}>
          {slug} clone + SDK Overlay
        </span>
        <a
          href="/sandbox/storefront"
          style={{
            color: "#89b4fa",
            marginLeft: "auto",
            textDecoration: "none",
            fontSize: 12,
          }}
        >
          &larr; Back to Sandbox
        </a>
      </div>

      {/* Iframe: no sandbox attr — SDK needs full script execution */}
      <iframe
        src={`/api/sandbox/site-clone/${slug}`}
        className="flex-1 w-full border-0"
        title={`${slug} clone with XTAL SDK`}
      />
    </div>
  );
}
