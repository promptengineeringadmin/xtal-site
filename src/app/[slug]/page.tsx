import { notFound } from "next/navigation";
import { Metadata } from "next";

// Import JSON data
import howItWorksData from "@/data/howitworks.json";
import pricingData from "@/data/pricing.json";
import useCasesData from "@/data/use-cases.json";

// Import Component Blocks
import Navbar from "@/components/Navbar";
import PageHero from "@/components/blocks/PageHero";
import FeatureShowcase from "@/components/blocks/FeatureShowcase";
import PricingCards from "@/components/blocks/PricingCards";
import ComparisonGrid from "@/components/blocks/ComparisonGrid";
import FAQAccordion from "@/components/blocks/FAQAccordion";
import PageCTA from "@/components/blocks/PageCTA";
import StatsBar from "@/components/blocks/StatsBar";
import TechSpecs from "@/components/blocks/TechSpecs";
import FeatureDetail from "@/components/blocks/FeatureDetail";
import CostCalculator from "@/components/blocks/CostCalculator";
import ComparisonSection from "@/components/blocks/ComparisonSection";
import BeforeAfterShowcase from "@/components/blocks/BeforeAfterShowcase";
import ValueComparison from "@/components/blocks/ValueComparison";
import UseCaseGrid from "@/components/blocks/UseCaseGrid";
import Logo from "@/components/Logo";

// Map JSON "type" to React Components
const COMPONENT_MAP: Record<string, React.ComponentType<any>> = {
  "page-hero": PageHero,
  "feature-showcase": FeatureShowcase,
  "pricing-cards": PricingCards,
  "comparison-grid": ComparisonGrid,
  "competitor-pricing": ComparisonGrid,
  "faq-accordion": FAQAccordion,
  "page-cta": PageCTA,
  "stats-bar": StatsBar,
  "use-case-grid": UseCaseGrid,
  "process-deep-dive": FeatureShowcase,
  "value-comparison": ValueComparison,
  "tech-specs": TechSpecs,
  "feature-detail": FeatureDetail,
  "cost-calculator": CostCalculator,
  "comparison-section": ComparisonSection,
  "before-after-showcase": BeforeAfterShowcase,
};

// Page data mapping
const PAGE_DATA: Record<string, any> = {
  "how-it-works": howItWorksData,
  "pricing": pricingData,
  "use-cases": useCasesData,
};

// Generate static params for all known slugs
export function generateStaticParams() {
  return [
    { slug: "how-it-works" },
    { slug: "pricing" },
    { slug: "use-cases" },
  ];
}

// Generate metadata dynamically
export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params;
  const data = PAGE_DATA[slug];

  if (!data) {
    return {
      title: "Page Not Found | XTAL Search",
    };
  }

  return {
    title: data.meta.title,
    description: data.meta.description,
    openGraph: {
      title: data.meta.title,
      description: data.meta.description,
      images: data.meta.ogImage ? [data.meta.ogImage] : [],
    },
  };
}

export default async function SecondaryPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const data = PAGE_DATA[slug];

  if (!data) {
    return notFound();
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FCFDFF]">
        {data.sections.map((section: any, index: number) => {
          const Component = COMPONENT_MAP[section.type];

          if (!Component) {
            console.warn(`Unknown component type: ${section.type}`);
            return null;
          }

          return (
            <section key={section.id || index} id={section.id} className="relative">
              <Component {...section} />
            </section>
          );
        })}
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200 text-center text-slate-500 text-sm bg-white">
        <div className="flex justify-center mb-6">
          <Logo className="h-6 opacity-50 grayscale" />
        </div>
        <p>&copy; Prompt Engineering, Inc 2025. All Rights Reserved.</p>
      </footer>
    </>
  );
}
