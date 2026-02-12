// Hardcoded fallback defaults for when the XTAL backend is unreachable.
// These mirror the backend config in xtal-shopify-backend/app/config.py.

export const DEFAULT_BRAND_PROMPT = ""

export const DEFAULT_MARKETING_PROMPT = `Expand the user's intent with vibes, aesthetics, use cases, and feelings.

Product descriptions already contain domain-specific terms. BM25 handles exact keyword matching.
Your job is to enrich semantic meaning so vector search finds products whose descriptions match the user's intent.

Emphasize the following merchandiser goals for this catalog:
`
