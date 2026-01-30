export function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "XTAL Search",
    url: "https://xtalsearch.com",
    logo: "https://xtalsearch.com/xtal-logo.svg",
    description:
      "AI-native product discovery platform for e-commerce. Natural language search that understands intent, not just keywords.",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      url: "https://xtalsearch.com/demo",
    },
  };

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "XTAL Search",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "E-commerce Search",
    operatingSystem: "Web-based",
    description:
      "AI-native product discovery platform that combines LLM intelligence with vector and keyword precision. Full-Spectrum Search™ handles any query type—from exact SKUs to natural language descriptions.",
    url: "https://xtalsearch.com",
    offers: {
      "@type": "Offer",
      price: "0.10",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "0.10",
        priceCurrency: "USD",
        unitText: "per search",
        description: "Usage-based pricing at $0.10 per search, up to 50,000 searches/month",
      },
    },
    featureList: [
      "Full-Spectrum Search™ - hybrid semantic and keyword matching",
      "LLM query understanding",
      "Plain-English merchandising rules",
      "XTAL Intelligence (reasoning visibility)",
      "Real-time catalog sync",
      "Shopify, BigCommerce, WooCommerce, Magento integrations",
      "No configuration required",
    ],
    screenshot: "https://xtalsearch.com/og-image.png",
    softwareHelp: {
      "@type": "WebPage",
      url: "https://xtalsearch.com/how-it-works",
    },
    provider: {
      "@type": "Organization",
      name: "XTAL Search",
      url: "https://xtalsearch.com",
    },
  };

  const faqPageSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How much does XTAL Search cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "XTAL Search costs $0.10 per search, up to 50,000 searches per month. A store with 15,000 monthly searches would pay $1,500/month. Volume pricing is available for stores exceeding 50,000 searches.",
        },
      },
      {
        "@type": "Question",
        name: "Are there setup fees for XTAL Search?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. XTAL has no setup fees, no implementation costs, and no annual contracts. The per-search price includes all features, all platform integrations, and standard support.",
        },
      },
      {
        "@type": "Question",
        name: "How does XTAL Search pricing compare to Algolia?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Algolia charges around $1 per 1,000 searches plus record storage fees and typically requires engineering resources to configure. XTAL's $0.10/search includes full LLM-powered search with no configuration required, often resulting in lower total cost of ownership.",
        },
      },
      {
        "@type": "Question",
        name: "What types of e-commerce stores does XTAL Search work with?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "XTAL works with any e-commerce platform including Shopify, Shopify Plus, BigCommerce, WooCommerce, Magento, and custom headless builds. It's particularly effective for specialty retailers with complex catalogs, growing DTC brands, and B2B wholesalers.",
        },
      },
      {
        "@type": "Question",
        name: "How is XTAL different from Algolia or Searchspring?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "XTAL was built from the ground up around LLM understanding, not as an add-on to traditional keyword search. This means it works out of the box without extensive configuration, handles natural language queries natively, and uses plain English for merchandising rules instead of JSON configs.",
        },
      },
      {
        "@type": "Question",
        name: "What is Full-Spectrum Search?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Full-Spectrum Search is XTAL's hybrid approach that combines vector/semantic search with precision keyword matching. This means it handles exact SKU lookups and vague intent queries equally well—in the same search bar, automatically.",
        },
      },
      {
        "@type": "Question",
        name: "How long does it take to set up XTAL Search?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "For standard Shopify and BigCommerce integrations, setup takes same-day. More complex integrations with custom platforms typically take 1-2 days. No engineering resources required on your end.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need to tag or enrich my product data for XTAL to work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. XTAL works with your existing product data as-is. The LLM understands your catalog structure automatically and doesn't require custom attributes or AI training.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageSchema),
        }}
      />
    </>
  );
}
