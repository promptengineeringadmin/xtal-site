# Email to Emun — XTAL Search Integration for Willow Group

**Subject:** XTAL Search integration for Willow Group — technical overview + next steps

---

Hi [Name],

Hope you're doing well. I'm reaching out about integrating XTAL Search into the Willow Group storefront, which I understand is built on Emun.

We provide AI-powered product search — vector similarity, natural language understanding, and real-time faceting. We've been working with Willow Group and are ready to move to implementation on the storefront side.

**We can support two integration approaches and wanted to get your input on what works best with Emun's architecture:**

1. **JavaScript snippet** — A single `<script>` tag added to the storefront `<head>`. It intercepts the existing search input, calls our API directly from the browser, and renders results in an overlay (or inline). This requires zero backend changes on Emun's side and is the fastest path to launch. It's similar to how Algolia InstantSearch, Constructor's beacon, or Bloomreach's pixel work.

2. **Server-side API integration** — Emun's backend calls our REST API endpoints, and your templates render the results. This gives full control over the UX, supports server-side rendering for SEO, and keeps all requests server-to-server. It's more work but a deeper integration.

We've put together a technical integration guide with our API reference, data schemas, and configuration options:

**Documentation:** https://xtalsearch.com/docs/integration

I've also attached a PDF of the guide for offline reference.

A few questions that would help us plan:
- Does Emun have a standard pattern for third-party search integrations? (e.g., script injection, API middleware, storefront hooks)
- Are there any constraints around adding custom JavaScript to the storefront head?
- For a server-side approach, what does the extension/middleware architecture look like?

Happy to jump on a call to walk through the technical details together whenever works for your team.

Best,
[Your name]
XTAL Search
team@xtalsearch.com
