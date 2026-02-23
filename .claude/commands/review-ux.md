You are a senior UX designer reviewing the **$ARGUMENTS** demo page on the XTAL site. Perform a thorough user experience audit and produce a structured markdown report.

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
- `src/app/(public)/layout.tsx` (public layout: DemoModalProvider, Footer, ExitIntent)
- `src/app/layout.tsx` (root layout: fonts, analytics)

**Shared Components (read every file):**
- `components/try/TrySearch.tsx` — main orchestrator, state management, layout decisions
- `components/try/ProductCard.tsx` — card layout, explain panel, feedback buttons
- `components/try/SearchBar.tsx` — input UX, suggestion chips
- `components/try/AspectChips.tsx` — refinement chip interaction (+/- toggles)
- `components/try/FilterRail.tsx` — desktop sidebar, facet sections, price slider
- `components/try/MobileFilterDrawer.tsx` — mobile drawer pattern
- `components/try/ProductGrid.tsx` — grid layout, loading overlay
- `components/try/ColdStartHero.tsx` — first-visit hero section
- `components/try/ColdStartPanel.tsx` — showcase rows with pre-warmed results
- `components/try/PriceSlider.tsx` — range slider interaction
- `components/try/AppliedFilters.tsx` — active filter chips
- `components/try/FilterLoadingOverlay.tsx` — loading skeleton
- `components/try/SearchLoadingSpinner.tsx` — progress indicator

**If `$ARGUMENTS` is `goldcanna`, also read:**
- `components/try/BudtenderTrigger.tsx` — fixed FAB, entry point
- `components/try/BudtenderQuiz.tsx` — multi-step quiz flow
- `components/try/BudtenderDrawer.tsx` — quick vibe filter sidebar

**Supporting Libraries:**
- `lib/use-xtal-search.ts` — search state machine, understand the user flow
- `lib/use-onboarding-state.ts` — first-use nudges and onboarding tracking
- `lib/showcase.ts` — showcase query definitions and labels per collection

## Step 3: Evaluate Against UX Checklist

### Information Architecture
- [ ] Page hierarchy is clear: hero → search → results → details
- [ ] Navigation affordances: can user easily find search, filters, results?
- [ ] Content grouping is logical (facets grouped by category, results in grid)
- [ ] Empty states provide clear guidance (what to do when no results, first visit)
- [ ] Progressive disclosure: complex features revealed at appropriate moments

### Interaction Patterns
- [ ] Search flow: type → submit → results appear with clear loading feedback
- [ ] Filter flow: select facet → results update → applied filter visible → easy to clear
- [ ] Aspect chip flow: click chip → results refine → chip state toggles → clear path to remove
- [ ] Explain flow: click "?" → panel opens → explanation loads → feedback options available
- [ ] Price range: slider is intuitive, manual input available, range applies on release
- [ ] Sort: dropdown is discoverable, options are clear, change is immediate
- [ ] Feedback loops: every action has a visible response (loading, state change, error)

### Visual Hierarchy
- [ ] Primary CTA (search bar) is the most prominent element
- [ ] Results grid draws attention after search submission
- [ ] Filter controls are secondary to results (not competing for attention)
- [ ] Product cards have clear visual hierarchy: image → title → price → actions
- [ ] Relevance indicators (score bars) are subtle but informative
- [ ] Typography hierarchy: headings, body text, labels, metadata are distinct

### Mobile Experience (< 768px)
- [ ] Search bar is easily accessible (sticky positioning works)
- [ ] Filter access via drawer is discoverable (filter button visible and labeled)
- [ ] Touch targets meet minimum 44x44px
- [ ] Product cards are appropriately sized (not too small to tap)
- [ ] Horizontal scrolling of aspect chips works smoothly
- [ ] No horizontal overflow causing layout issues
- [ ] Bottom navigation / FAB doesn't overlap critical content
- [ ] Drawer close mechanism is intuitive (X button, outside click, swipe)

### First-Time User Journey
- [ ] Cold-start hero clearly communicates what this page does
- [ ] Suggestion chips provide obvious starting points for exploration
- [ ] Showcase panel demonstrates value before user takes action
- [ ] Onboarding nudges (explain "?" animation) are helpful, not annoying
- [ ] First search experience is fast and impressive (SSR pre-loaded data)
- [ ] User understands what aspects are and how to use them
- [ ] No jargon or technical terms that confuse non-technical visitors

### Conversion Funnel
- [ ] Path from demo → "Request a Demo" is clear and accessible
- [ ] DemoModal / ExitIntent captures interest at appropriate moments
- [ ] Footer provides alternative contact options
- [ ] Value proposition is reinforced throughout the experience
- [ ] The demo experience itself serves as the primary conversion driver

### Responsive Breakpoints
- [ ] Desktop (>= 1024px): filter rail + grid side by side
- [ ] Tablet (768-1023px): graceful degradation, filter drawer or collapsible
- [ ] Mobile (< 768px): single column, drawer filters, sticky search
- [ ] Transitions between breakpoints are smooth (no jarring layout shifts)

## Step 4: Output Report

Format your findings as follows:

```markdown
# UX Review: $ARGUMENTS Demo Page

**Date:** [today's date]
**Reviewer:** Claude (automated)
**Collection:** $ARGUMENTS

## Summary
[2-3 sentence overview of the user experience quality and key findings]

## Issue Table

| # | Severity | Dimension | Issue | Component | Recommendation |
|---|----------|-----------|-------|-----------|----------------|
| 1 | High | ... | ... | ... | ... |
| 2 | Medium | ... | ... | ... | ... |

**Severity definitions:**
- **High:** Significantly impairs usability, blocks user goals, or causes confusion
- **Medium:** Degrades experience but user can work around it
- **Low:** Polish opportunity, nice-to-have improvement

## Detailed Findings

### Information Architecture
[Findings with specific references to components and code]

### Interaction Patterns
[Findings with flow descriptions and improvement suggestions]

### Visual Hierarchy
[Findings with layout analysis]

### Mobile Experience
[Findings specific to mobile breakpoints and touch interactions]

### First-Time User Journey
[Walk through the first-time experience step by step, noting friction points]

### Conversion Funnel
[Analysis of the path from demo exploration to conversion action]

## Mockup Suggestions
[ASCII mockups or layout sketches for any proposed changes, e.g.:]

┌─────────────────────────────────────┐
│ [Proposed layout change]            │
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │ Card │  │ Card │  │ Card │     │
│  └──────┘  └──────┘  └──────┘     │
└─────────────────────────────────────┘

## Priority Matrix

| Priority | Issue # | Effort | Impact |
|----------|---------|--------|--------|
| Do First | ... | Low | High |
| Plan Next | ... | Medium | High |
| Backlog | ... | High | Medium |
```
