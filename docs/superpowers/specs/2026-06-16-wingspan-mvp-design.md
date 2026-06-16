# Wingspan MVP — Design Spec

**Date:** 2026-06-16  
**Status:** Approved for implementation

---

## 1. Product Summary

Wingspan is a premium AI-native single-session web application that transforms a professional's uploaded resume and optional supporting files into a **Future Self Blueprint™** — a deeply personalized career intelligence artifact revealing identity patterns, strengths, future pathways, gaps, and actions.

**Core hypothesis being validated:** Can GPT-4o generate meaningful career clarity and future direction from a person's professional footprint in a single session?

---

## 2. Scope

### In scope (MVP)
- 5-screen single-session experience (no auth, no persistence, no routing)
- Resume upload + parsing (PDF with fallback to Vision, DOCX, XLSX, CSV, TXT)
- Optional URL inputs and additional file uploads
- Interest chip selector
- Two-stage AI pipeline (extract → analyze)
- AI discovery experience with live streaming progress
- Career timeline + confidence validation
- Future Self Blueprint with **4 sections** (Core 4):
  - Profile Map
  - Career Intelligence (Strengths + Interests + Future Paths)
  - Gap Analysis
  - Trackable Actions
- Light + dark mode toggle
- Project Repository XLSX template download

### Out of scope (MVP)
- Authentication, accounts, saved sessions
- Sections 5–7 of the full spec (Brand Positioning, Growth Matrix, Project Analytics)
- Community, mentorship, job search, portfolio hosting
- Mobile-optimized layout (desktop-first)

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | ShadCN UI |
| Animation | Framer Motion |
| Icons | Lucide Icons |
| AI | OpenAI SDK (GPT-4o) |
| File parsing | pdf-parse, pdfjs-dist (vision fallback), mammoth, xlsx |
| Deployment | Vercel |
| State | useReducer via useWingspan context hook |
| Streaming | Server-Sent Events (SSE) |

No database. No Supabase. No login. Environment variable: `OPENAI_API_KEY`.

---

## 4. Visual Design System

### Color Tokens

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#141414` | App background |
| `--surface` | `#333` | Card / input backgrounds |
| `--surface-dim` | `#1a1a1a` | Locked section bg |
| `--border` | `#404040` | All borders |
| `--border-dim` | `#363636` | Dashed/locked borders |
| `--text-primary` | `#f0f0f0` | Headlines |
| `--text-secondary` | `#999` | Body text |
| `--text-muted` | `#888` | Captions, labels |
| `--text-dim` | `#555` | Locked/disabled text |
| `--neon` | `#a3e635` | Primary accent — all interactive elements |
| `--neon-glow` | `rgba(163,230,53,0.45)` | Glow on neon elements |
| `--neon-surface` | `rgba(163,230,53,0.1)` | Neon-tinted card backgrounds |
| `--neon-border` | `rgba(163,230,53,0.22)` | Neon-tinted borders |

**Light mode** uses the same neon accent with:
- `--bg`: `#f7f8ff`
- `--surface`: `#ffffff`
- `--border`: `rgba(99,102,241,0.1)` (soft indigo tint)
- `--text-primary`: `#11121e`
- `--text-secondary`: `#6b7280`
- Neon text darkened to `#4a6e0a` where used as body text (contrast compliance)
- Neon CTA on dark button background: `#111810` bg, `#a3e635` label

### Typography

| Role | Weight | Color |
|---|---|---|
| Wordmark "Wingspan" | Regular (400) | Neon `#a3e635` |
| Section headline | Light (300) + Bold (700) key phrase | `#f0f0f0` / `#fff` |
| Subhead | SemiBold (600) | `#e8e8e8` |
| Body | Regular (400) | `#999` |
| Caption / label | Regular / Bold | `#888` / `#777` |
| Card title | SemiBold (600) | `#e0e0e0` |

Wordmark is **never** all-caps. Letter-spacing: 0.05em.

### Shape & Shadow

- Card border-radius: `10px`
- Panel border-radius: `16–20px`  
- Soft shadows: `0 2px 6px rgba(0,0,0,0.06), 0 16px 48px rgba(163,230,53,0.06)` (light); `0 4px 24px rgba(0,0,0,0.5)` (dark)

### Color Discipline

**Grey (structural):** backgrounds, borders, non-interactive containers, locked states, trust chips  
**Neon (interactive/live):** CTAs, selected pills, active tabs, confirm actions, progress fills, confidence %, step dots, glow effects, "Continue →" buttons, observation borders

---

## 5. Application State Machine

Single `useWingspan` context using `useReducer`. No external state library.

```
WELCOME → FOOTPRINT → DISCOVERING → VALIDATING → BLUEPRINT
```

State shape:
```ts
type WingspanState = {
  screen: 'welcome' | 'footprint' | 'discovering' | 'validating' | 'blueprint'
  files: File[]
  urls: Record<string, string>
  interests: string[]
  extractedData: ExtractedCareerData | null
  discoveryProgress: DiscoveryProgress
  validatedData: ValidatedCareerData | null
  blueprint: Blueprint | null
  error: string | null
}
```

---

## 6. API Routes

### `POST /api/extract`
**Stage 1 — Career data extraction**

Input: FormData containing file(s) + URLs  
Output: `ExtractedCareerData` JSON

Pipeline:
1. Parse all uploaded files server-side (pdf-parse / vision fallback / mammoth / xlsx)
2. Single GPT-4o call with structured output schema
3. Returns: timeline[], projects[], skills[], education[], rawText

**PDF Vision Fallback:** If `pdf-parse` returns < 100 chars, render PDF pages via `pdfjs-dist` canvas → base64 images → GPT-4o vision extraction.

### `POST /api/blueprint` (SSE streaming)
**Stage 2 — Blueprint generation**

Input: `{ extractedData, interests, validatedEdits }`  
Output: Server-Sent Events stream

SSE event sequence:
```
event: step  data: { step: "timeline", label: "Reconstructing career timeline…" }
event: step  data: { step: "strengths", label: "Detecting strength patterns…" }
event: observation  data: { text: "A recurring theme is emerging…" }
event: step  data: { step: "paths", label: "Mapping future opportunities…" }
event: step  data: { step: "gaps", label: "Analyzing gaps…" }
event: step  data: { step: "actions", label: "Generating your Blueprint…" }
event: complete  data: { blueprint: Blueprint }
```

### `GET /api/template`
Returns the Project Repository XLSX template as a file download. Generated at build time from a static template definition.

---

## 7. AI Output Schema (Core 4)

```ts
type Blueprint = {
  profileMap: {
    identityStatement: string        // 1–2 sentence professional narrative
    yearsOfExperience: number
    industries: string[]
    platforms: string[]
    domains: string[]
    careerEvolution: string          // short narrative arc
  }
  strengths: Strength[]
  interests: Interest[]
  futurePaths: FuturePath[]
  gaps: Gap[]
  actions: {
    immediate: Action[]
    mediumTerm: Action[]
    longTerm: Action[]
    resources: Resource[]
  }
  confidenceScores: {
    timeline: number
    projects: number
    strengths: number
    futurePaths: number
  }
  insights: string[]                 // 3–5 discovery observations
  rationale: Record<string, string>  // evidence per insight
}

type Strength = {
  name: string
  confidence: number           // 0–100
  evidence: string
  projectCount: number
  projects: string[]
  rationale: string
}

type FuturePath = {
  title: string
  whyItFits: string
  evidence: string[]
  opportunitySize: 'emerging' | 'growing' | 'established'
  confidence: number
}

type Gap = {
  pathway: string
  currentReadiness: number
  futureReadiness: number
  requiredCapabilities: string[]
  gapSize: 'small' | 'medium' | 'large'
  timeline: string
  effort: string
  howToClose: string
}

type Action = {
  title: string
  description: string
  measurable: string
  pathway: string
  priority: 'high' | 'medium' | 'low'
}
```

All outputs rendered through designed UI components. Raw JSON never displayed.

---

## 8. Screen Specifications

### Screen 1 — Welcome
- Full-bleed centered layout, no nav
- Framer Motion fade-up entrance sequence: wordmark → headline → body → CTA
- Subtle neon radial glow behind headline (CSS radial-gradient, very low opacity)
- Trust chips (grey pills): "AI-powered", "Single session", "No signup"
- CTA: "Start Discovery →" (neon button)
- Light/dark toggle: top-right corner, persists in localStorage

### Screen 2 — Footprint Collection
- **Resume upload (required):** Dashed grey upload zone, neon "Upload Resume" label, drag-and-drop + click. Accepted: PDF, DOCX, XLSX, CSV, TXT
- **Template download:** Ghost button below upload zone: "Download Project Repository Template →"
- **Optional URLs:** LinkedIn, Portfolio, GitHub, Behance, Dribbble, Medium — text inputs, grey bg, grey placeholder
- **Additional files:** Collapsible "Add more files" section
- **Interest chips:** "What excites you next?" — animated chip grid, tap to select/deselect, neon when selected, grey when not. Minimum 3, maximum 5 required before CTA unlocks. Options: AI, Design Leadership, Product Strategy, Entrepreneurship, Design Systems, Research, Community Building, Education, Sustainability, Innovation, Emerging Technology, Management, Writing, Public Speaking
- **CTA:** "Begin Analysis →" — disabled (grey) until resume uploaded + ≥3 interests selected, then activates to neon

### Screen 3 — AI Discovery
No spinners. No generic loading.

- Wordmark + "Building your Blueprint…" subhead
- **Step list** (SSE-driven, real pipeline steps):
  1. Parsing your resume
  2. Structuring career data
  3. Reconstructing career timeline
  4. Detecting strength patterns
  5. Mapping future opportunities
  6. Analyzing gaps
  7. Generating your Blueprint
- Step states: idle (grey dot + grey text) → active (neon pulsing dot + neon text) → done (static neon dot + dark olive text)
- **Observation cards:** 2–3 injected mid-stream from the `observation` SSE events. Grey card with neon left border. Italic text. Stagger-animate in.
- **Progress bar:** overall % at bottom, neon fill with glow
- Duration: 20–45s real pipeline time

### Screen 4 — Validation
- Subhead: "Does this look right?" + body copy
- **Career Timeline section:** Extracted roles as cards (grey bg `#333`, border `#484848`). Each card: role title (`#e0e0e0`), company + dates (caption `#888`), confirm ✓ (neon) + edit ✎ (grey `#888`) + remove × (grey). Inline editing: click edit reveals text inputs within the card.
- **Confidence section:** Progress rows per dimension (timeline, strengths, future opportunities). Caption `#888` + neon % with glow + neon progress fill.
- If any score < 80%: suggestion card: "Uploading a Project Repository Template can improve accuracy." with template download link.
- **CTA:** "View My Blueprint →"

### Screen 5 — Future Self Blueprint™
Progressive section reveal (Option C). Sections unlock one at a time.

**Header (always visible):**
- "Future Self Blueprint™" wordmark treatment
- Identity statement (light weight, `#999`)
- Stats grid: years exp, industries, projects count — grey cards, neon values

**Section reveal pattern:**
- Locked sections: dim (`opacity: 0.5`), dashed border `#363636`, grey text, "LOCKED" badge
- Active/revealed: solid border `#404040`, white title, "REVEALED" or "UNLOCKING…" badge
- "Continue to [Next Section] →" neon ghost button animates in at bottom of each completed section
- Framer Motion: `AnimatePresence` + stagger children on each reveal

**Section 1 — Profile Map**
- Identity statement (full)
- Tag grid: industries, platforms, domains
- Career evolution narrative (short paragraph)

**Section 2 — Career Intelligence**
Three sub-sections revealed together:
- *Strengths:* Cards with name, confidence %, evidence sentence, project count, neon progress bar. Expandable for full rationale + project list.
- *Interests:* Cluster visualization (simple flex-wrap of weighted chips — larger chip = higher frequency). Evidence on hover/tap.
- *Future Paths:* Path cards with title, why-it-fits, opportunity size badge, confidence %. "Gap analysis →" link to Section 3.

**Section 3 — Gap Analysis**
Per pathway: current readiness vs future readiness (two-bar comparison), required capabilities list, gap size badge, timeline, effort, how-to-close narrative.

**Section 4 — Actions**
Three groups: Immediate / Medium-Term / Long-Term. Each action: title, measurable description, pathway tag, priority badge (neon = high, grey = medium/low). Resources list below (books, courses, communities) — grey cards with neon link arrows.

---

## 9. Animation Principles

- All animations use **Framer Motion**
- Never animate for decoration — every animation explains state change
- Entrance: `initial={{ opacity: 0, y: 16 }}` → `animate={{ opacity: 1, y: 0 }}` with `duration: 0.4, ease: 'easeOut'`
- Stagger children: `staggerChildren: 0.08`
- Discovery step transitions: driven by SSE events, not timers
- Blueprint section reveal: `AnimatePresence` + scale + fade per section
- Interest chip select: subtle spring scale `{ type: 'spring', stiffness: 400, damping: 20 }`
- Progress bar fill: `animate={{ width: pct + '%' }}` with `duration: 0.6, ease: 'easeOut'`

---

## 10. Project Repository XLSX Template

5 sheets, generated via `xlsx` library, served from `GET /api/template`:

| Sheet | Key Fields |
|---|---|
| Projects | Name, Company, Year, Industry, Platform, Audience, Summary, Impact, Link |
| Contributions | Project Name + 13 contribution type checkboxes |
| Skills | Skill, Confidence (1–5), Years of Experience |
| Certifications | Certification, Provider, Year |
| Talks & Publications | Type, Title, Year, Link |

---

## 11. File Structure

```
wingspan/
├── app/
│   ├── layout.tsx              # root layout, theme provider
│   ├── page.tsx                # single page, renders WingspanApp
│   └── api/
│       ├── extract/route.ts    # Stage 1 extraction
│       ├── blueprint/route.ts  # Stage 2 streaming blueprint
│       └── template/route.ts  # XLSX template download
├── components/
│   ├── screens/
│   │   ├── WelcomeScreen.tsx
│   │   ├── FootprintScreen.tsx
│   │   ├── DiscoveryScreen.tsx
│   │   ├── ValidationScreen.tsx
│   │   └── BlueprintScreen.tsx
│   ├── blueprint/
│   │   ├── ProfileMap.tsx
│   │   ├── CareerIntelligence.tsx
│   │   ├── GapAnalysis.tsx
│   │   └── ActionsSection.tsx
│   └── ui/                     # shared: NeonButton, ProgressBar, InsightCard, etc.
├── context/
│   └── WingspanContext.tsx     # useWingspan hook + reducer
├── lib/
│   ├── parsers/
│   │   ├── pdf.ts              # pdf-parse + vision fallback
│   │   ├── docx.ts             # mammoth
│   │   └── xlsx.ts             # xlsx
│   ├── openai.ts               # GPT-4o client + prompts
│   └── template.ts             # XLSX template generator
└── types/
    └── wingspan.ts             # all shared types
```

---

## 12. Environment Variables

```
OPENAI_API_KEY=sk-...
```

---

## 13. Decisions Log

| Decision | Choice | Rationale |
|---|---|---|
| AI model | GPT-4o | Best balance of quality, speed, cost for MVP |
| Pipeline | Two-stage (extract → analyze) | Better output quality; natural error boundary; maps to discovery steps |
| PDF fallback | Vision via pdfjs-dist | Designer PDFs (Figma/Canva/InDesign) often contain no selectable text |
| Blueprint navigation | Progressive reveal (Option C) | Most "story-like" and cinematic; each section feels earned |
| Blueprint scope | Core 4 sections only | Validates the core hypothesis without overbuilding |
| Accent color | Neon lime `#a3e635` | High-contrast, distinctive, works as glow in dark mode |
| Dark mode default | Dark-first, toggle to light | Reference products all dark-first; neon reads better on dark |
| State management | useReducer + Context | No external library needed for this scope |
| Persistence | None | Single-session MVP; simplicity is a feature |
