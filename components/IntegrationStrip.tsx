export default function IntegrationStrip() {
  return (
    <section className="py-12 px-6 bg-white border-b border-slate-100">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-sm text-slate-400 uppercase tracking-widest font-medium mb-8">
          Integrates with your platform
        </p>
        <div className="flex items-center justify-center gap-12 md:gap-16">
          {/* Shopify */}
          <a
            href="https://www.shopify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group transition-all duration-300"
            aria-label="Shopify"
          >
            <img
              src="/logos/shopify.svg"
              alt="Shopify"
              className="h-8 md:h-10 w-auto grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
            />
          </a>

          {/* WooCommerce */}
          <a
            href="https://woocommerce.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group transition-all duration-300"
            aria-label="WooCommerce"
          >
            <img
              src="/logos/woocommerce.svg"
              alt="WooCommerce"
              className="h-6 md:h-7 w-auto grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
            />
          </a>

          {/* BigCommerce */}
          <a
            href="https://www.bigcommerce.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group transition-all duration-300"
            aria-label="BigCommerce"
          >
            <img
              src="/logos/bigcommerce.svg"
              alt="BigCommerce"
              className="h-6 md:h-7 w-auto grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
