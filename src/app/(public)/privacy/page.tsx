import { Metadata } from "next"
import Navbar from "@/components/Navbar"

export const metadata: Metadata = {
  title: "Privacy Policy | XTAL Search",
  description: "How XTAL Search collects, uses, and protects your personal information.",
}

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#FCFDFF] pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto prose prose-slate">
          <h1 className="text-4xl font-bold text-xtal-navy mb-2">Privacy Policy</h1>
          <p className="text-slate-400 text-sm mb-10">Last updated: February 2026</p>

          <p>
            Prompt Engineering, Inc (&quot;we,&quot; &quot;us,&quot; or &quot;XTAL Search&quot;) operates
            the website at xtalsearch.com. This policy explains what information we collect, how we
            use it, and your choices regarding that information.
          </p>

          <h2>Information We Collect</h2>

          <h3>Information You Provide</h3>
          <ul>
            <li>
              <strong>Demo request form:</strong> name, work email address, company name, and an
              optional description of your current search challenges.
            </li>
            <li>
              <strong>Newsletter subscribe:</strong> email address only.
            </li>
          </ul>

          <h3>Information Collected Automatically</h3>
          <ul>
            <li>
              <strong>Google Analytics (GA4):</strong> We use Google Analytics to collect anonymized
              usage data including pages visited, time on site, referral source, and general
              geographic region. Google Analytics uses cookies to distinguish unique users.
            </li>
            <li>
              <strong>Vercel Analytics:</strong> We use Vercel Analytics to collect web performance
              metrics (page load times, web vitals). This data is aggregated and does not identify
              individual users.
            </li>
            <li>
              <strong>UTM parameters and referrer:</strong> When you submit a demo request, we record
              the page you were on, your referring URL, and any UTM campaign parameters from the URL.
              This helps us understand how visitors find our site.
            </li>
          </ul>

          <h2>How We Use Your Information</h2>
          <ul>
            <li>To respond to demo requests and schedule product demonstrations.</li>
            <li>To send newsletter updates if you subscribe (you can unsubscribe at any time).</li>
            <li>To understand how visitors use our site and improve the experience.</li>
            <li>To measure the effectiveness of our marketing efforts.</li>
          </ul>

          <h2>Where Your Data Is Stored</h2>
          <ul>
            <li>
              <strong>Google Sheets:</strong> Demo request submissions are stored in a private Google
              Sheets document via a secure webhook.
            </li>
            <li>
              <strong>Mailchimp:</strong> Email addresses from both demo requests and newsletter
              signups are synced to our Mailchimp audience for email communications. Mailchimp&apos;s
              privacy practices are described at{" "}
              <a href="https://www.intuit.com/privacy/statement/" target="_blank" rel="noopener noreferrer">
                intuit.com/privacy/statement
              </a>.
            </li>
            <li>
              <strong>Google Analytics:</strong> Analytics data is processed by Google. See{" "}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
                Google&apos;s Privacy Policy
              </a>.
            </li>
          </ul>

          <h2>Data Sharing</h2>
          <p>
            We do not sell your personal information. We share data only with the service providers
            listed above (Google, Mailchimp, Vercel) as necessary to operate this website and
            communicate with you.
          </p>

          <h2>Your Choices</h2>
          <ul>
            <li>
              <strong>Unsubscribe:</strong> Every email we send includes an unsubscribe link.
            </li>
            <li>
              <strong>Analytics opt-out:</strong> You can opt out of Google Analytics by installing
              the{" "}
              <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
                Google Analytics Opt-out Browser Add-on
              </a>.
            </li>
            <li>
              <strong>Data deletion:</strong> To request deletion of your personal data, contact us
              at the email below.
            </li>
          </ul>

          <h2>Contact</h2>
          <p>
            If you have questions about this privacy policy or your data, contact us at{" "}
            <a href="mailto:privacy@xtalsearch.com">privacy@xtalsearch.com</a>.
          </p>
        </div>
      </main>
    </>
  )
}
