# WingSpan

> AI-powered career intelligence for designers. Upload your CV → get a personalised Future Self Blueprint™ → evolve through guided learning experiences.

**Live:** https://wingspan.designsbyamit.com

---

## What It Does

WingSpan is a two-part platform for designers:

1. **Blueprint** (`/wingspan`) — Upload your resume and portfolio links. WingSpan's AI pipeline extracts your career data, runs Career Alpha™ analysis across 5 dimensions (market intelligence, futures analysis, human advantage, career ROI, intrinsic signal), and generates a personalised Future Self Blueprint with 3 career bets (Safe, Growth, Bold), gap analysis, a growth roadmap, and actionable next steps.

2. **Design Evolution** (`/paths`) — A daily learning platform that guides your growth through structured experiences drawn from your Blueprint. AI mentor, competency tracking, learning paths.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Animation | Framer Motion |
| Database | PostgreSQL (Neon) via Prisma 7 |
| AI — Analysis | Groq (llama-3.3-70b-versatile) |
| AI — Vision | Google Gemini 1.5 Flash (PDF vision fallback) |
| Auth | Google OAuth 2.0 (direct, PKCE + CSRF) |
| Deployment | Vercel |

---

## Project Structure

```
app/
  (app)/               # Design Evolution platform (authenticated)
    page.tsx           # Home dashboard
    paths/             # Learning paths explorer
    experience/[id]/   # Individual experience + AI mentor
    profile/           # User profile, competencies, streak
  wingspan/            # Wingspan Blueprint flow (public)
  api/
    extract/           # POST: parse CV files → ExtractedCareerData
    career-alpha/      # POST: Career Alpha™ intelligence engine
    blueprint/         # POST SSE: stream Blueprint generation
    refine/            # POST: per-section AI refinement
    auth/google/       # GET: OAuth init + callback
    auth/me|logout/    # Session management
  login/               # Google Sign-In
  onboarding/          # Career track + domain selection
  page.tsx             # Public landing page
  privacy/ terms/      # Legal pages

components/
  screens/             # Wingspan flow screens (Welcome, Footprint, Discovery, Validation, Blueprint)
  blueprint/           # Blueprint section components (ProfileMap, CareerIntelligence, PathSelection, GapAnalysis, GrowthRoadmap, Resources)
  experience/          # Design Evolution experience components
  home/                # Design Evolution home components
  paths/               # Learning path components
  profile/             # Profile components
  layout/              # AppNav
  ui/                  # Shared UI primitives

lib/
  claude.ts            # All Groq AI calls (extract, blueprint streaming)
  career-alpha.ts      # Career Alpha™ engine with caching
  pipeline.ts          # Background pipeline runner (staggered UX)
  auth.ts              # JWT session management
  db.ts                # Prisma client (Neon in prod, SQLite in dev)
  parsers/             # File parsers (PDF via unpdf, DOCX, XLSX, TXT)
  export.ts            # Blueprint → Markdown / HTML export
  mentor.ts            # AI mentor streaming (Design Evolution)

context/
  WingspanContext.tsx  # Global state machine for Blueprint flow

types/
  wingspan.ts          # All TypeScript types
  design-evolution.ts  # Design Evolution platform types

prisma/
  schema.prisma        # Data model
  migrations/          # PostgreSQL migrations
  seed*.ts             # Data seeding scripts

public/
  brand/               # Logo assets (LogoColor.svg, Logo.svg, LogoWings.svg, WingSpanLogo.svg, LogoWing.png)
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- A Neon (or PostgreSQL) database
- Groq API key

### Local Development

```bash
# Install dependencies
npm install

# Copy env template and fill in values
cp .env.example .env.local

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed the database (optional — loads Design Evolution content)
npx tsx prisma/seed.ts

# Start dev server
npm run dev
```

Open http://localhost:3000 for the landing page, or http://localhost:3000/wingspan for the Blueprint flow.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (pooled) |
| `DIRECT_URL` | PostgreSQL direct connection (for migrations) |
| `JWT_SECRET` | 32+ char secret for session cookies |
| `GROQ_API_KEY` | Groq API key (llama-3.3-70b-versatile) |
| `GEMINI_API_KEY` | Google Gemini key (PDF vision fallback) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Same as above (for client-side OAuth init) |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL (e.g. https://wingspan.designsbyamit.com) |
| `UNSPLASH_ACCESS_KEY` | Unsplash key (experience hero images) |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase config (legacy, can be removed) |

---

## Key Flows

### Blueprint Flow (Wingspan)
1. **FootprintScreen** — Upload CV (PDF/DOCX/TXT) + portfolio URLs + select interests
2. **Extract** — `/api/extract` parses files and calls Groq to structure career data (~5-10s)
3. **ValidationScreen** — User reviews extracted timeline; Career Alpha + Blueprint run in background
4. **BlueprintScreen** — 6-step Blueprint: Profile Map → Career Intelligence → Future Paths → Gap Analysis → Growth Roadmap → Resources

### Design Evolution Flow
1. **Onboarding** — Select career level + domains
2. **Home** — Daily experience card drawn from active learning path
3. **Experience** — Read concept guide → complete challenge → reflect → AI mentor panel
4. **Profile** — Competency radar, skill bars, streak, activity timeline

---

## Architecture Notes

- **Staggered pipeline:** Extract completes (~5s) → ValidationScreen shows immediately → Career Alpha + Blueprint stream in background (~30-60s). Users see their timeline while analysis runs.
- **Blueprint streaming:** SSE stream from `/api/blueprint`. Events: `step`, `observation`, `ping`, `complete`, `error`.
- **Per-section refinement:** Each Blueprint section has an AI refine panel that calls `/api/refine` with the section name + instruction. Returns partial Blueprint updates merged into state.
- **Auth:** Direct Google OAuth with PKCE + CSRF (no Firebase SDK dependency). Session is a JWT in an httpOnly cookie.

---

## Deployment (Vercel)

The `vercel.json` build command runs:
```
npx prisma generate && npx prisma migrate deploy && next build
```

Add a Neon Postgres database via Vercel Storage to get `DATABASE_URL` injected automatically.
