# XTAL Business Context & Competitive Position

## What XTAL Actually Is

XTAL is AI-native ecommerce search for mid-market teams ($5M–$100M revenue) that don't have dedicated search engineers or merchandisers. The core value proposition: LLM-based query understanding at every tier, zero instrumentation burden, and prompt-based merchandising that doesn't require a full-time operator.

### Architecture (honest)
- **Frontend (xtal-site)**: Prompt management + proxy layer. Zero LLM calls for search. Injects brand/marketing/aspects/explain prompts into backend calls, passes geo headers, parallelizes search + aspects.
- **Backend (xtal-shopify-backend)**: 2-stage LLM pipeline (query augmentation with brand context → marketing re-rank after retrieval). This is where all AI happens.
- **SDK (client/src/)**: Vanilla TS embeddable snippet. Shadow DOM isolation, Shopify cart support, UTM tracking, MutationObserver for SPAs. Inline mode only (overlay removed). No search-as-you-type, no pagination, no filter UI in SDK currently.

### What's Real
- LLM-based semantic query understanding on every search (backend)
- Brand-aware query augmentation (unique — no competitor equivalent)
- Geo + seasonal context-aware personalization (zero-config, via Vercel headers + date injection)
- Prompt-based merchandising (natural language instructions vs manual rules)
- Per-collection prompt management with version history
- Search quality click logging with prompt_hash correlation
- Embeddable snippet with LLM-generated merchant-matched card templates (verisimilitude)
- Site Search Grader (genuine lead-gen tool, Claude Opus for analysis + scoring)
- Budtender recommendations API (v0.5 — architecture extensible beyond cannabis)
- API key auth + per-client usage metering

### What's Not Built Yet
- A/B testing framework (roadmap item — random explain prompt pool exists but no statistical framework)
- Behavioral/session-based personalization (acknowledged as a different beast)
- General-purpose recommendations (budtender is cannabis-specific v0.5; pattern is extensible)
- Search-as-you-type in SDK
- Pagination in SDK
- Filter/aspects UI in SDK
- Revenue-attributed analytics
- Category page merchandising

## Pricing Model

XTAL uses **per-search (usage-based) pricing**. This IS the business model — confirmed by `lib/api/budtender-usage.ts` which tracks per-request counts per client per month. Contact for pricing; no public pricing page.

**CRITICAL**: Never claim "no per-search metering" or "catalog-based pricing" or "flat-rate" — these are false and were already corrected across all content in Feb 2026.

## Competitive Landscape (Feb 2026)

### vs Algolia (primary competitor)

**Algolia's tiers (verified):**
| Tier | Cost | AI Features |
|------|------|-------------|
| Build (free) | $0, 10K searches/mo | Keyword only |
| Grow | $0.50/1K searches | Keyword + typo tolerance. No AI. |
| Grow Plus | $1.75/1K searches | AI Synonyms, AI Ranking (click-data-driven), Personalization |
| Elevate | Custom (~$20K+/yr) | NeuralSearch (hybrid keyword+vector), Merchandising Studio |

**Where XTAL wins:**
1. **Semantic search without enterprise contract** — Algolia gates NeuralSearch at Elevate ($20K+/yr). XTAL offers LLM intent understanding at all tiers.
2. **Zero instrumentation burden** — Algolia's AI Ranking/Personalization require correct click/purchase event tracking at volume. Many teams implement this poorly. XTAL's LLM works from query text + brand context immediately.
3. **Prompt-based merchandising for teams without merchandisers** — Algolia's Merchandising Studio is powerful IF you have someone in it daily. XTAL's natural language prompts work for teams where the head of ecommerce is also running paid media.
4. **Brand-aware query augmentation** — no Algolia equivalent. The LLM "knows" the store's voice and vocabulary.
5. **Context-aware personalization out of the box** — geo (country/region) + seasonal, zero config. Algolia's personalization requires event instrumentation.
6. **Setup speed** — script tag → live in hours vs weeks of Algolia tuning.
7. **Card template verisimilitude** — LLM generates merchant-matched cards. InstantSearch is generic.

**Where Algolia wins:**
1. **Infrastructure** — 119K QPS, 99.999% uptime, 10,000+ servers. Not comparable.
2. **Developer ecosystem** — InstantSearch (React/Vue), 10+ language SDKs, best-in-class docs.
3. **Feature completeness** — A/B testing, Recommend (FBT, Related, Trending), Agent Studio, MCP Server.
4. **Customer count / social proof** — 18,000+ customers vs XTAL's handful.
5. **Revenue analytics** — search-attributed revenue dashboards vs click logging.
6. **Non-ecommerce** — docs search, SaaS, content. Different market entirely.

**Algolia's known weaknesses (from G2):**
- Cost unpredictability (#1 complaint) — bill shock from traffic spikes
- AI feature gating requiring enterprise tier jumps
- Implementation complexity beyond defaults
- Vendor lock-in (no self-hosted option)
- Support quality tiering (non-enterprise gets docs + forum)

### vs Klevu / Searchspring (now Athos Commerce)

Merged January 2025. klevu.com and searchspring.com both redirect to athoscommerce.com. All pricing is custom-quoted through Athos sales. Pre-merger Klevu started ~$449–$499/mo; Searchspring ~$599/mo. Neither verifiable post-merger.

**XTAL advantage**: Athos merger creates uncertainty. Teams evaluating during contract renewals are a natural audience. XTAL's faster deployment and accessible pricing fill the gap for teams who find Athos pricing has moved upmarket.

### vs Doofinder

**Doofinder pricing (verified Feb 2026):**
- Basic: $49/mo ($44 annual) — 10K requests
- Pro: $149/mo ($134 annual) — 150K requests
- Advanced: $349/mo ($314 annual) — 400K requests

Doofinder is the budget option. Keyword + basic NLP + synonym management. Good G2 reviews (4.7/5, ~500 reviews). European-headquartered (Spain), strong multilingual support. XTAL doesn't compete on price here — the pitch is "when you outgrow Doofinder's NLP ceiling."

### vs Searchanise

Budget Shopify search. Starts at ~$6/mo on Shopify. Not a serious competitor at the mid-market level XTAL targets.

## The Defensible Position (one sentence)

XTAL is AI-native ecommerce search that gives mid-market teams semantic query understanding, brand-aware merchandising, and context-aware personalization — capabilities that Algolia gates behind $20K+/yr enterprise contracts — deployable in hours with zero instrumentation.

## Content Guidelines

- Always verify competitor pricing against their actual websites before publishing
- Never fabricate case studies or research data
- Never claim features XTAL doesn't have (personalization is geo+seasonal, not behavioral; merchandising is prompt-based, not visual rules)
- Comparison tables should use qualified values like `"AI-guided via prompts"` instead of bare `true` for merchandising
- When uncertain about XTAL pricing details, use "usage-based — contact for details"
- Algolia Grow ($0.50/1K) ≠ Grow Plus ($1.75/1K) — always distinguish tiers correctly
