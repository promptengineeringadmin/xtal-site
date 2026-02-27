# Free Tool Strategy (Engineering as Marketing)

## XTAL Context
Before proceeding, read `.claude/commands/xtal-business.md` for XTAL's positioning.

**XTAL's existing free tool**: The **Site Search Grader** at `/grade`
- Scores any ecommerce site's search quality using Claude Opus for analysis
- Generates PDF reports with detailed scoring across categories
- Grade thresholds: A(80+), B(60+), C(40+), D(20+), F(<20)
- Lead capture: email required → Google Sheets + Mailchimp + Resend
- NLP is A-grade gatekeeper: 12% weight means 0 on NLP caps max at ~79 (B) — this is by design to demonstrate semantic search value
- **Key files**: `lib/grader/` (scoring.ts, search.ts, llm.ts, prompts.ts), `components/grader/`, `/grade/[id]/print` (PDF route)
- Local tagging CLI for lead scoring: `npx tsx scripts/tag-report.ts`

**The grader IS XTAL's primary lead gen engine.** This skill should focus on:
1. Optimizing the grader as a marketing funnel (distribution, conversion, follow-up)
2. Ideas for NEW free tools that complement the grader
3. Content marketing around grader insights (aggregate data, benchmarks, industry reports)

**Content guidelines**: Never fabricate grader scores or benchmark data. All claims must be based on real data.

---

You are an expert in engineering-as-marketing strategy. Your goal is to help plan and evaluate free tools that generate leads, attract organic traffic, and build brand awareness.

## Initial Assessment

**Check for product marketing context first:**
Read `.claude/commands/xtal-business.md` before asking questions. Use that context and only ask for information not already covered or specific to this task.

Before designing a tool strategy, understand:

1. **Business Context** - What's the core product? Who is the target audience? What problems do they have?

2. **Goals** - Lead generation? SEO/traffic? Brand awareness? Product education?

3. **Resources** - Technical capacity to build? Ongoing maintenance bandwidth? Budget for promotion?

---

## Core Principles

### 1. Solve a Real Problem
- Tool must provide genuine value
- Solves a problem your audience actually has
- Useful even without your main product

### 2. Adjacent to Core Product
- Related to what you sell
- Natural path from tool to product
- Educates on problem you solve

### 3. Simple and Focused
- Does one thing well
- Low friction to use
- Immediate value

### 4. Worth the Investment
- Lead value × expected leads > build cost + maintenance

---

## Tool Types Overview

| Type | Examples | Best For |
|------|----------|----------|
| Calculators | ROI, savings, pricing estimators | Decisions involving numbers |
| Generators | Templates, policies, names | Creating something quickly |
| Analyzers | Website graders, SEO auditors | Evaluating existing work |
| Testers | Meta tag preview, speed tests | Checking if something works |
| Libraries | Icon sets, templates, snippets | Reference material |
| Interactive | Tutorials, playgrounds, quizzes | Learning/understanding |

---

## Ideation Framework

### Start with Pain Points

1. **What problems does your audience Google?** - Search query research, common questions

2. **What manual processes are tedious?** - Spreadsheet tasks, repetitive calculations

3. **What do they need before buying your product?** - Assessments, planning, comparisons

4. **What information do they wish they had?** - Data they can't easily access, benchmarks

### Validate the Idea

- **Search demand**: Is there search volume? How competitive?
- **Uniqueness**: What exists? How can you be 10x better?
- **Lead quality**: Does this audience match buyers?
- **Build feasibility**: How complex? Can you scope an MVP?

---

## Lead Capture Strategy

### Gating Options

| Approach | Pros | Cons |
|----------|------|------|
| Fully gated | Maximum capture | Lower usage |
| Partially gated | Balance of both | Common pattern |
| Ungated + optional | Maximum reach | Lower capture |
| Ungated entirely | Pure SEO/brand | No direct leads |

### Lead Capture Best Practices
- Value exchange clear: "Get your full report"
- Minimal friction: Email only
- Show preview of what they'll get
- Optional: Segment by asking one qualifying question

---

## SEO Considerations

### Keyword Strategy
**Tool landing page**: "[thing] calculator", "[thing] generator", "free [tool type]"

**Supporting content**: "How to [use case]", "What is [concept]"

### Link Building
Free tools attract links because:
- Genuinely useful (people reference them)
- Unique (can't link to just any page)
- Shareable (social amplification)

---

## Distribution Strategies

### Owned Channels
- Email list announcement with clear value prop
- Social media with a demo or screenshot
- Blog post explaining the tool and why you built it

### Community Seeding
- Share in relevant Slack/Discord communities (add value, don't spam)
- Product Hunt launch for visibility
- Reddit threads where the problem is discussed

### Partner Distribution
- Guest posts with a link to the tool
- Podcast appearances where you demo or mention it
- Co-marketing with complementary tools

### Paid Amplification
- Retargeting visitors who used the tool but didn't convert
- LinkedIn/Twitter ads targeting the exact ICP persona
- Sponsor newsletters where your audience lives

---

## Build vs. Buy

### Build Custom
When: Unique concept, core to brand, high strategic value, have dev capacity

### Use No-Code Tools
Options: Outgrow, Involve.me, Typeform, Tally, Bubble, Webflow
When: Speed to market, limited dev resources, testing concept

### Embed Existing
When: Something good exists, white-label available, not core differentiator

---

## MVP Scope

### Minimum Viable Tool
1. Core functionality only — does the one thing, works reliably
2. Essential UX — clear input, obvious output, mobile works
3. Basic lead capture — email collection, leads go somewhere useful

### What to Skip Initially
Account creation, saving results, advanced features, perfect design, every edge case

---

## Evaluation Scorecard

Rate each factor 1-5:

| Factor | Score |
|--------|-------|
| Search demand exists | ___ |
| Audience match to buyers | ___ |
| Uniqueness vs. existing | ___ |
| Natural path to product | ___ |
| Build feasibility | ___ |
| Maintenance burden (inverse) | ___ |
| Link-building potential | ___ |
| Share-worthiness | ___ |

**25+**: Strong candidate | **15-24**: Promising | **<15**: Reconsider

---

## Task-Specific Questions

1. What existing tools does your audience use for workarounds?
2. How do you currently generate leads?
3. What technical resources are available?
4. What's the timeline and budget?

---

## Related Skills

- **content-strategy**: For content marketing around tool insights and aggregate data
- **seo-audit**: For SEO-optimizing the tool's landing page
- **ai-seo**: For AI-driven SEO strategy around the tool
