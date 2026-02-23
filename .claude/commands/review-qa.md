You are a senior QA engineer reviewing the **$ARGUMENTS** demo page on the XTAL site. Perform a thorough quality audit and produce a structured markdown report.

## Step 1: Resolve Collection to Files

Map the collection name `$ARGUMENTS` to its page file:
- `try` → `src/app/(public)/try/page.tsx`
- `willow` → `src/app/(public)/willow/page.tsx`
- `bestbuy` → `src/app/(public)/bestbuy/page.tsx`
- `goldcanna` → `src/app/(public)/goldcanna/page.tsx`
- Any other value → `src/app/(public)/demo/[slug]/page.tsx` (dynamic demo route)

## Step 2: Read Source Files

Read ALL of the following files. Do not skip any:

**Page & Layout:**
- The resolved page file from Step 1
- `src/app/(public)/layout.tsx`
- `src/app/layout.tsx`

**Shared Components (read every file):**
- `components/try/TrySearch.tsx`
- `components/try/ProductCard.tsx`
- `components/try/SearchBar.tsx`
- `components/try/AspectChips.tsx`
- `components/try/FilterRail.tsx`
- `components/try/MobileFilterDrawer.tsx`
- `components/try/ProductGrid.tsx`
- `components/try/ColdStartHero.tsx`
- `components/try/ColdStartPanel.tsx`
- `components/try/PriceSlider.tsx`
- `components/try/AppliedFilters.tsx`
- `components/try/FilterLoadingOverlay.tsx`
- `components/try/SearchLoadingSpinner.tsx`

**If `$ARGUMENTS` is `goldcanna`, also read:**
- `components/try/BudtenderTrigger.tsx`
- `components/try/BudtenderQuiz.tsx`
- `components/try/BudtenderDrawer.tsx`

**Core Libraries:**
- `lib/use-xtal-search.ts`
- `lib/xtal-types.ts`
- `lib/facet-utils.ts`
- `lib/use-onboarding-state.ts`

**Prior QA findings (if available):**
- `scripts/qa-output/qa-report.json` — incorporate known issues, don't duplicate them

## Step 3: Evaluate Against Checklist

### Functional Bugs
- [ ] Search submission works (enter key, button click, suggestion click)
- [ ] Empty query handling (no crash, appropriate UI state)
- [ ] Results render correctly (images, titles, prices, vendor tags)
- [ ] Price display handles edge cases: zero price, price ranges, missing price
- [ ] Aspect chips toggle correctly (+/- state, selected styling)
- [ ] Filter rail: facet checkboxes apply/clear, price slider works, "clear all" resets
- [ ] Mobile filter drawer opens/closes, applies filters correctly
- [ ] Explain panel loads on-demand, displays explanation, feedback buttons work
- [ ] Pagination / results-per-page changes work
- [ ] Sort dropdown changes result order
- [ ] URL query params sync with search state (back/forward navigation)
- [ ] Cold-start hero displays when no query, hides after first search
- [ ] Showcase panel loads pre-warmed data correctly

### Error Handling & Edge Cases
- [ ] API failure gracefully handled (network error, 500, timeout)
- [ ] AbortController cancels in-flight requests on new search
- [ ] Missing image fallback renders ("No image" placeholder)
- [ ] Extremely long product titles don't break layout (line-clamp)
- [ ] Special characters in search query don't cause errors
- [ ] Concurrent rapid searches don't produce race conditions
- [ ] Empty results state shows appropriate message

### Accessibility (WCAG 2.1 AA)
- [ ] All interactive elements have accessible names (aria-label, aria-labelledby, or visible text)
- [ ] Focus management: search input auto-focus, modal/drawer focus trap
- [ ] Keyboard navigation: all controls reachable via Tab, actionable via Enter/Space
- [ ] Color contrast meets 4.5:1 for text, 3:1 for large text and UI components
- [ ] Screen reader: results announced, filter changes announced, loading states communicated
- [ ] Images have meaningful alt text (not just "product image")
- [ ] Form inputs have associated labels
- [ ] Touch targets >= 44x44px on mobile

### Performance
- [ ] Images use `loading="lazy"` or Next.js `<Image>` with proper sizing
- [ ] No unnecessary re-renders (check dependency arrays in useEffect/useCallback/useMemo)
- [ ] Search hook doesn't fire redundant API calls
- [ ] Large lists virtualized or paginated (not rendering 100+ DOM nodes)
- [ ] No memory leaks (event listeners cleaned up, subscriptions unsubscribed)
- [ ] Bundle size: no large dependencies imported unnecessarily

### Type Safety
- [ ] No `any` types used where a specific type exists
- [ ] API responses properly typed (SearchResponse, Product interfaces)
- [ ] Optional chaining used where data may be null/undefined
- [ ] Props interfaces defined for all components

## Step 4: Output Report

Format your findings as follows:

```markdown
# QA Review: $ARGUMENTS Demo Page

**Date:** [today's date]
**Reviewer:** Claude (automated)
**Collection:** $ARGUMENTS

## Summary
[2-3 sentence overview of overall quality and critical findings]

## Severity Table

| # | Severity | Category | Issue | File | Line | Recommendation |
|---|----------|----------|-------|------|------|----------------|
| 1 | P0 | ... | ... | ... | ... | ... |
| 2 | P1 | ... | ... | ... | ... | ... |

**Severity definitions:**
- **P0 (Critical):** Broken functionality, data loss, security vulnerability
- **P1 (Major):** Degraded experience, accessibility failure, significant UX issue
- **P2 (Minor):** Polish issue, non-blocking improvement, code quality

## Detailed Findings

### Critical (P0)
[Detailed description of each P0 with code snippets and fix suggestions]

### Major (P1)
[Detailed description of each P1]

### Minor (P2)
[Detailed description of each P2]

## Prior QA Report Correlation
[If qa-report.json was found, note which issues are still present vs resolved]

## Recommendations
[Prioritized list of fixes, grouped by effort (quick wins vs larger changes)]
```
