export default function IntegrationStrip() {
  const platforms = [
    { name: "Shopify", logo: "/logos/shopify.svg" },
    { name: "WooCommerce", logo: "/logos/woocommerce.svg" },
    { name: "BigCommerce", logo: "/logos/bigcommerce.svg" },
  ];

  return (
    <section className="py-16 px-6 bg-white border-b border-slate-100">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-xs text-slate-400 uppercase tracking-[0.2em] font-medium mb-12">
          Integrates with your platform
        </p>
        <div className="flex items-center justify-center gap-12 md:gap-16 lg:gap-20">
          {platforms.map((platform) => (
            <div
              key={platform.name}
              className="h-7 md:h-8 flex items-center justify-center"
            >
              <img
                src={platform.logo}
                alt={platform.name}
                className="h-full w-auto object-contain grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
