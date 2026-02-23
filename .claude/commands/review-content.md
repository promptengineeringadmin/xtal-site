You are a senior content strategist reviewing the **$ARGUMENTS** demo page on the XTAL site. Perform a thorough content and copy audit and produce a structured markdown report.

## Step 1: Resolve Collection to Files

Map the collection name `$ARGUMENTS` to its page file:
- `try` → `src/app/(public)/try/page.tsx`
- `willow` → `src/app/(public)/willow/page.tsx`
- `bestbuy` → `src/app/(public)/bestbuy/page.tsx`
- `goldcanna` → `src/app/(public)/goldcanna/page.tsx`
- Any other value → `src/app/(public)/demo/[slug]/page.tsx` (dynamic demo route)

## Step 2: Read Source Files

Read ALL of the following files. Do not skip any:

**Page & Metadata:**
- The resolved page file from Step 1 (especially the `metadata` export or `generateMetadata` function)
- `src/app/(public)/layout.tsx` (StructuredData, Footer copy)
- `src/app/layout.tsx` (root metadata, default title/description)

**Shared Components (read for all user-visible text):**
- `components/try/TrySearch.tsx` — info bar copy, result counts, sort labels
- `components/try/ProductCard.tsx` — vendor tag, price format, explain button text, feedback labels
- `components/try/SearchBar.tsx` — placeholder text, suggestion chip labels
- `components/try/AspectChips.tsx` — "Refine:" label, chip formatting
- `components/try/FilterRail.tsx` — facet section headers, "Show more" / "Clear all" labels
- `components/try/MobileFilterDrawer.tsx` — drawer title, button labels
- `components/try/ColdStartHero.tsx` — hero headline, subheading, CTAs
- `components/try/ColdStartPanel.tsx` — showcase section titles, query labels
- `components/try/PriceSlider.tsx` — input labels, currency formatting
- `components/try/AppliedFilters.tsx` — chip labels, "clear" text
- `components/try/FilterLoadingOverlay.tsx` — loading text
- `components/try/SearchLoadingSpinner.tsx` — loading message

**If `$ARGUMENTS` is `goldcanna`, also read:**
- `components/try/BudtenderTrigger.tsx` — trigger pill text
- `components/try/BudtenderQuiz.tsx` — quiz step copy, question text, option labels
- `components/try/BudtenderDrawer.tsx` — vibe button labels, drawer copy

**Content & Brand Reference:**
- `lib/showcase.ts` — showcase query labels and suggestions per collection
- `lib/admin/collections.ts` — collection display names and descriptions
- `src/app/(public)/page.tsx` — homepage copy (read for brand voice reference: tone, vocabulary, messaging style)

## Step 3: Evaluate Against Content Checklist

### Copy Consistency
- [ ] Consistent terminology across all components (e.g., "search" vs "find" vs "discover")
- [ ] Button labels follow a consistent pattern (verb + noun or just verb)
- [ ] Error messages use consistent tone and structure
- [ ] Loading states use consistent messaging
- [ ] Capitalization style is uniform (sentence case vs title case)
- [ ] Punctuation is consistent (periods on descriptions, no periods on labels)
- [ ] Numbers formatted consistently (currency, counts, percentages)

### Brand Voice
Reference the homepage (`src/app/(public)/page.tsx`) for the established XTAL voice:
- **Tone:** Confident, direct, benefit-focused. Not salesy or hyperbolic.
- **Key phrases:** "understands intent", "not just keywords", "AI-powered"
- [ ] Demo page copy matches the brand voice established on the homepage
- [ ] Technical features are described in user-benefit terms, not jargon
- [ ] Copy feels premium and trustworthy (no exclamation marks overuse, no hype)
- [ ] Collection-specific copy is tailored to the audience (e.g., cannabis terminology for goldcanna)

### CTAs (Calls to Action)
- [ ] Primary CTA is clear and compelling (search bar placeholder, submit button)
- [ ] Secondary CTAs are present but don't compete (Request Demo, See More)
- [ ] CTA text uses action verbs ("Search", "Try", "Explore", not "Submit" or "Go")
- [ ] CTAs are contextually appropriate (not pushing demo request before user has explored)
- [ ] Empty state CTAs guide user to take action

### Microcopy
- [ ] Search placeholder is inviting and instructive ("Describe what you're looking for...")
- [ ] Suggestion chips are realistic, engaging queries (not generic "shoes" or "electronics")
- [ ] Empty results message is helpful (suggests alternatives, doesn't dead-end)
- [ ] Loading messages set appropriate expectations
- [ ] Filter labels are human-readable (not raw field names)
- [ ] Explain feature copy is clear about what it does ("Why this result?")
- [ ] Feedback button labels are intuitive ("Well put!" / "Not relevant")
- [ ] Tooltip / helper text is concise and useful

### SEO Analysis
- [ ] Page title includes collection name + brand + value proposition (< 60 chars)
- [ ] Meta description is compelling and includes target keywords (< 160 chars)
- [ ] OpenGraph tags present (title, description, image for social sharing)
- [ ] Heading hierarchy is semantic (h1 → h2 → h3, single h1)
- [ ] Structured data (schema.org) is present and valid
- [ ] URL structure is clean and descriptive
- [ ] Internal linking opportunities identified

### Messaging Hierarchy
- [ ] Most important message appears first (hero headline)
- [ ] Supporting messages reinforce the primary message
- [ ] Feature explanations follow benefit → feature → proof pattern
- [ ] Information density is appropriate (not too sparse, not overwhelming)
- [ ] Scannable: users can understand the page purpose in 5 seconds

### Audience Targeting
- [ ] Copy addresses the right audience (prospect evaluating search solutions)
- [ ] Technical depth matches audience expertise level
- [ ] Industry-specific terminology is used appropriately (if collection is vertical-specific)
- [ ] Pain points are acknowledged (current search doesn't understand intent)
- [ ] Value proposition is clear from the demo experience itself

## Step 4: Output Report

Format your findings as follows:

```markdown
# Content Review: $ARGUMENTS Demo Page

**Date:** [today's date]
**Reviewer:** Claude (automated)
**Collection:** $ARGUMENTS

## Summary
[2-3 sentence overview of content quality and key findings]

## Copy Audit Table

| # | Location | Current Copy | Issue | Severity | Suggested Rewrite |
|---|----------|-------------|-------|----------|-------------------|
| 1 | SearchBar placeholder | "Describe what..." | ... | High/Med/Low | "..." |
| 2 | ColdStartHero h1 | "..." | ... | ... | "..." |

## SEO Analysis

### Current Metadata
| Field | Value | Assessment |
|-------|-------|------------|
| Title | "..." | [pass/fail + notes] |
| Description | "..." | [pass/fail + notes] |
| OG Title | "..." | [pass/fail + notes] |
| OG Description | "..." | [pass/fail + notes] |
| OG Image | [present/missing] | [notes] |

### SEO Recommendations
[Specific title/description rewrites with target keywords]

## Brand Voice Assessment
[Analysis of how well the page matches the established XTAL voice, with specific examples of alignment and divergence]

## Messaging Hierarchy Map
[Visual breakdown of the information hierarchy on the page]

1. **Primary message** (hero): "..."
2. **Supporting message** (subheading): "..."
3. **Proof points** (showcase): "..."
4. **Call to action**: "..."

## Microcopy Inventory

| Component | Copy Element | Current Text | Notes |
|-----------|-------------|-------------|-------|
| SearchBar | Placeholder | "..." | ... |
| SearchBar | Suggestion 1 | "..." | ... |
| ColdStartHero | Headline | "..." | ... |
| ProductCard | Explain button | "..." | ... |
| FilterRail | Clear all | "..." | ... |

## Rewrite Suggestions
[For each issue identified, provide the exact current text and a suggested rewrite with rationale]

### High Priority
1. **[Component — Element]**
   - Current: "..."
   - Suggested: "..."
   - Rationale: ...

### Medium Priority
...

### Low Priority
...

## Audience & Tone Notes
[Overall assessment of audience fit, tone consistency, and strategic recommendations]
```
