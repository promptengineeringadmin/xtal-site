# XTAL Search Marketing Website

A static marketing website for XTAL Search, an AI-native search platform for e-commerce.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Hosting**: Vercel
- **Forms**: Next.js API routes with optional Resend email notifications

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Local Development

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd xtal-site
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment variables file:
   ```bash
   cp .env.example .env.local
   ```

4. (Optional) Configure environment variables in `.env.local`:
   - `RESEND_API_KEY`: Your Resend API key for email notifications
   - `NOTIFICATION_EMAIL`: Email address to receive demo requests

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | No | Resend API key for sending email notifications |
| `NOTIFICATION_EMAIL` | No | Email address to receive demo request notifications |

If Resend is not configured, demo requests will be logged to the console.

## Deployment to Vercel

### Option 1: Vercel Dashboard

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Configure environment variables in the Vercel dashboard
4. Deploy

### Option 2: Vercel CLI

1. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. For production deployment:
   ```bash
   vercel --prod
   ```

## Project Structure

```
xtal-site/
├── public/                 # Static assets
│   ├── xtal-logo.svg      # Navy logo
│   ├── xtal-logo-white.svg # White logo for dark backgrounds
│   └── favicon.svg        # Favicon
├── src/
│   └── app/
│       ├── layout.tsx     # Root layout with metadata
│       ├── page.tsx       # Homepage
│       ├── globals.css    # Global styles
│       └── api/
│           └── demo-request/
│               └── route.ts # Form submission handler
├── components/
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── ProblemSolution.tsx
│   ├── ValueProps.tsx
│   ├── HowItWorks.tsx
│   ├── UseCases.tsx
│   ├── DemoRequestForm.tsx
│   ├── Footer.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── GeometricBackground.tsx
├── lib/
│   └── validation.ts      # Form validation utilities
└── ...config files
```

## Brand Guidelines

- **Primary Color**: Navy blue `#1B2D5B`
- **Accent/Background**: Light blue-gray `#E8ECF1`
- **Typography**: Inter (Google Fonts)
- **Brand Name**: "XTAL" with wide letter-spacing (`tracking-[0.2em]`)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

© 2025 Prompt Engineering, Inc. All rights reserved.
