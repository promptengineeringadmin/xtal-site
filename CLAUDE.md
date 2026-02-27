# XTAL Site

## Stack
Next.js 14 App Router · Tailwind CSS · TypeScript · Vercel

## Development
```bash
npm run dev                    # Dev server
npm run build                  # Production build
npm run build:client           # SDK (esbuild → public/client/v1/xtal.js)
```
Load env: `export $(grep -v '^#' .env.local | grep -v '^\s*$' | xargs)`

## Deployment
- Commit = push to main = deploy to prod. After every commit: `git push && vercel --prod`
- No staging branch. Claude deploys, not the user.
- Repo: `promptengineeringadmin/xtal-site`
- Backend deploy (ECS): `gh workflow run infrastructure.yml --repo Prompt-Engineering-Inc/xtal-shopify-backend -f client=dewine -f environment=dev -f apply_backend=true -f apply_frontend=false -f apply_shopify_frontend=false`

## Architecture
- Route groups: `(public)` customer-facing, `(admin)` internal (@xtalsearch.com OAuth), `(sandbox)` SDK dev/testing
- Middleware protects `/admin/*`, `/api/admin/*`, `/api/grader/admin/*`
- Search proxy: `/api/xtal/*` → `XTAL_BACKEND_URL` (CORS `*` for embeds)
- Lead capture: `/api/demo-request` → Google Sheets + Mailchimp + Resend
- Admin auth: NextAuth.js Google OAuth, `@xtalsearch.com` domain only, JWT sessions
- Server search: `lib/server-search.ts` (SSR fetch wrapper, ISR revalidate)
- API keys: Redis-backed, format `xtal_<48-hex>`, `X-API-Key` header

## Repository Relationship
- **`xtal-shopify-backend`** (local: `C:\vibe\xtal-shopify-backend`): Backend API (FastAPI/Python)
- The /try page calls backend API through Next.js proxy routes (`src/app/api/xtal/`)
- When backend models change (`app/models/search.py`), update TypeScript types in `lib/xtal-types.ts` manually

## Design System
- Always use XTAL brand tokens, never generic Tailwind colors
- Primary: `xtal-navy` (#1B2D5B), `xtal-ice` (#E8ECF1)
- Dark bg: `#0F1A35`, Page bg: `#FCFDFF`
- Font: Inter, `tracking-brand` = 0.25em
- Custom classes: `.glass-card`, `.brand-gradient`, `.shadow-xtal`
- Icons: `lucide-react`
- Full reference: auto-memory topic file `xtal-design-system.md`

## Conventions
- Don't ask user to run commands — start them yourself and give clickable links
- All links must be immediately clickable in VS Code (full URLs or markdown `[text](path)`)
- Granular commits — one feature per PR, don't bundle unrelated changes
- Use sonnet subagents for efficiency when possible
- Plan titles: identifiable within ~25 chars (card truncation width)
- **When something goes wrong, STOP and re-enter plan mode immediately.** Never iterate through failures — replan from scratch, understand the root cause, then execute the fix.

## Constraints
- NEVER use `--skip-ai` for production ingestion
- All ingestion MUST use BatchPipeline (chunked AI → embed → store)
- Search POST body field is `collection` (NOT `collection_name`)
- SDK build output (`public/client/v1/xtal.js`) is gitignored — use `git add -f`
- Config cache on `/api/xtal/config` is 5 minutes — wait after Redis changes

## Windows/Bash
- Use forward slashes in paths (no `cd /d`)
- Git paths with parens need single quotes: `git add 'src/app/(admin)/...'`
- No `python3` — use node for JSON processing
- Always give absolute paths when referencing files/output to the user

## Local Tools
- RTX 4070 Super for local GPU inference
- Ollama at `localhost:11434` (`llama3.1:8b` default, `70b` for quality)
- Use for zero-cost tasks: tagging, extraction, classification

## Testing & Validation
When asked to fix or build something, test it with actual runtime validation (e.g., headless browser, curl, dev server) — do NOT just read code and assume it works. Start dev servers proactively when needed for visual/functional verification.

## Content & Copy Guidelines
Avoid generic, sycophantic, or AI-sounding copy. Never fabricate statistics, customer behaviors, or competitive claims. Never overwrite user's manual edits by rewriting entire files — only edit the specific sections that need changing.

## Project-Specific Conventions
For product/SKU routing, always use item_code (SKU) not database IDs. For URLs, always use the www subdomain (e.g., www.xtalsearch.com) to avoid CORS redirect issues.
