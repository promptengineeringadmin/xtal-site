import { Metadata } from "next"
import Navbar from "@/components/Navbar"

export const metadata: Metadata = {
  title: "Terms of Service | XTAL Search",
  description: "Terms and conditions for using the XTAL Search website.",
}

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FCFDFF] pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto prose prose-slate">
          <h1 className="text-4xl font-bold text-xtal-navy mb-2">Terms of Service</h1>
          <p className="text-slate-400 text-sm mb-10">Last updated: February 2026</p>

          <p>
            These terms govern your use of the XTAL Search website at xtalsearch.com, operated by
            Prompt Engineering, Inc (&quot;we,&quot; &quot;us,&quot; or &quot;the Company&quot;).
            By accessing this website, you agree to these terms.
          </p>

          <h2>About This Website</h2>
          <p>
            This website is a marketing site for XTAL Search, an AI-powered product discovery
            platform for e-commerce. The site provides information about our product, allows you to
            request a product demonstration, and subscribe to our newsletter.
          </p>

          <h2>Use of the Website</h2>
          <p>You agree to use this website only for lawful purposes and in a manner that does not:</p>
          <ul>
            <li>Infringe the rights of any third party.</li>
            <li>Interfere with or disrupt the website or its servers.</li>
            <li>Submit false or misleading information through any form on the site.</li>
            <li>Attempt to gain unauthorized access to any part of the website.</li>
          </ul>

          <h2>Demo Requests</h2>
          <p>
            When you submit a demo request, you provide your contact information so we can schedule a
            product demonstration. Submitting a request does not create a binding agreement or
            obligation to purchase. We will use your information as described in our{" "}
            <a href="/privacy">Privacy Policy</a>.
          </p>

          <h2>Newsletter</h2>
          <p>
            By subscribing to our newsletter, you consent to receive periodic emails about XTAL
            Search, including product updates and industry insights. You may unsubscribe at any time
            using the link provided in each email.
          </p>

          <h2>Intellectual Property</h2>
          <p>
            All content on this website — including text, graphics, logos, icons, images, and
            software — is the property of Prompt Engineering, Inc or its content suppliers and is
            protected by United States and international copyright laws. The XTAL name and logo are
            trademarks of Prompt Engineering, Inc.
          </p>

          <h2>Disclaimer</h2>
          <p>
            This website and its content are provided &quot;as is&quot; without warranties of any
            kind, either express or implied. Product features, metrics, and comparisons presented on
            this site are for informational purposes and may vary based on implementation and
            configuration.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, Prompt Engineering, Inc shall not be liable for
            any indirect, incidental, special, consequential, or punitive damages arising from your
            use of this website.
          </p>

          <h2>Changes to These Terms</h2>
          <p>
            We may update these terms from time to time. Changes will be posted on this page with an
            updated revision date. Continued use of the website after changes constitutes acceptance
            of the revised terms.
          </p>

          <h2>Governing Law</h2>
          <p>
            These terms are governed by the laws of the State of Delaware, United States, without
            regard to its conflict of law provisions.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these terms can be directed to{" "}
            <a href="mailto:legal@xtalsearch.com">legal@xtalsearch.com</a>.
          </p>
        </div>
      </main>
    </>
  )
}
