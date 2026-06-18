# Wingspan Blueprint Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Future Self Blueprint from a static progressive-reveal report into a guided 6-step career decision system with path selection, dynamic gap analysis, and contextual resources.

**Architecture:** The BlueprintScreen becomes a 6-step wizard (Profile → Intelligence → Path Selection → Gap Analysis → Roadmap → Resources). Path selection is a new interactive step that gates all downstream content. Gap analysis and roadmap are filtered to the selected path. New custom fonts (Sora + Plus Jakarta Sans) loaded via next/font. All glow/shadow effects removed per spec — neon color provides contrast without decoration.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Framer Motion v12, Recharts (radar chart), next/font (Sora + Plus Jakarta Sans).

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `types/wingspan.ts` | Modify | Add `selectedPath`, `BlueprintStep`, enriched `FuturePath`, `Interest`, `Strength` types |
| `context/WingspanContext.tsx` | Modify | Add `SELECT_PATH` action, `selectedPath` state |
| `app/globals.css` | Modify | Add Sora + Plus Jakarta Sans font variables, remove glow utilities, add font-display tokens |
| `app/layout.tsx` | Modify | Load Sora + Plus Jakarta Sans via next/font |
| `lib/mock-data.ts` | Modify | Enrich FuturePath, Interest, Strength, Gap fields with new required properties |
| `lib/openai.ts` | Modify | Update blueprint prompt to generate new enriched fields |
| `components/screens/BlueprintScreen.tsx` | Rewrite | 6-step wizard shell with step indicator nav |
| `components/blueprint/ProfileMap.tsx` | Rewrite | Hero stats + Career Summary + Industries + Skillsets + Tools + Projects grid |
| `components/blueprint/CareerIntelligence.tsx` | Rewrite | Horizontal scrollable strength cards + enriched interest cards + removed future paths |
| `components/blueprint/PathSelection.tsx` | Create | New: path cards with match score, timeline, market demand, "Select This Path" CTA |
| `components/blueprint/GapAnalysis.tsx` | Rewrite | Filtered by selectedPath, expandable gap type cards (Skills/Positioning/Leadership/Visibility/Domain) |
| `components/blueprint/GrowthRoadmap.tsx` | Create | New: replaces ActionsSection, gaps → actions → outcomes, per-path filtered |
| `components/blueprint/Resources.tsx` | Create | New: contextual resources per action, expandable, real links |
| `components/ui/StrengthRadar.tsx` | Create | New: Recharts radar overview of all strengths |
| `components/ui/StepNav.tsx` | Create | New: 6-step progress indicator for Blueprint wizard |

---

## Task 1: Types + Font Setup

**Files:**
- Modify: `types/wingspan.ts`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Extend types in `types/wingspan.ts`**

Replace the `Strength`, `Interest`, `FuturePath`, `Gap`, `Blueprint` interfaces with enriched versions. Add `BlueprintStep` type and `selectedPath` to state.

```typescript
// Add after existing imports at top of types/wingspan.ts

export type BlueprintStep = 'profile' | 'intelligence' | 'path-selection' | 'gap-analysis' | 'roadmap' | 'resources'

export interface Strength {
  name: string
  confidence: number
  evidence: string
  careerAdvantage: string   // NEW: how this strength benefits future growth
  projectCount: number
  projects: string[]
  rationale: string
}

export interface Interest {
  name: string
  frequency: number
  evidence: string
  whyItAppears: string[]    // NEW: list of signals e.g. "Repeated AI projects"
  marketOutlook: 'Very High Growth' | 'High Growth' | 'Emerging' | 'Stable'  // NEW
  futureRelevance: string   // NEW: trend-based reasoning
}

export interface FuturePath {
  title: string
  whyItFits: string
  evidence: string[]
  opportunitySize: 'emerging' | 'growing' | 'established'
  confidence: number
  recommendationStatus: 'Recommended' | 'Strongly Recommended' | 'Emerging Opportunity'  // NEW
  timeline: string          // NEW: e.g. "12-18 Months"
  marketDemand: 'Very High' | 'High' | 'Moderate' | 'Emerging'  // NEW
  growthPotential: 'Excellent' | 'Strong' | 'Good' | 'Moderate'  // NEW
  keyTransitionAreas: string[]  // NEW: e.g. ["AI Strategy", "Conversational Design"]
}

export type GapType = 'Skills Gap' | 'Positioning Gap' | 'Leadership Gap' | 'Visibility Gap' | 'Domain Gap'

export interface Gap {
  pathway: string
  gapType: GapType          // NEW
  currentReadiness: number
  futureReadiness: number
  currentState: string      // NEW: e.g. "Strong internal leadership presence"
  desiredState: string      // NEW: e.g. "Recognized AI design thought leader"
  requiredCapabilities: string[]
  gapSize: 'small' | 'medium' | 'large'
  whyItMatters: string      // NEW
  timeline: string
  effort: string
  howToClose: string
}
```

Add `selectedPath` to `WingspanState` and `SELECT_PATH` to `WingspanAction`:

```typescript
// In WingspanState interface, add:
selectedPath: string | null

// In WingspanAction type, add:
| { type: 'SELECT_PATH'; path: string }
```

- [ ] **Step 2: Install fonts**

```bash
npm install @next/font 2>/dev/null; true
```

(next/font is bundled with Next.js 16 — this is a no-op but confirms it's available.)

- [ ] **Step 3: Update `app/layout.tsx` to load Sora + Plus Jakarta Sans**

Replace the entire file:

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import { Sora, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { WingspanProvider } from '@/context/WingspanContext'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Wingspan — Future Self Blueprint',
  description: 'Discover the patterns hidden in your career.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${plusJakarta.variable}`}>
      <body>
        <WingspanProvider>{children}</WingspanProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Update `app/globals.css` — font tokens, remove glow utilities**

Find the `@theme inline` block and add font variables. Also update the `body` rule to use Plus Jakarta Sans:

```css
/* In @theme inline block, update the font lines to: */
--font-sans: var(--font-jakarta, -apple-system, 'Inter', sans-serif);
--font-heading: var(--font-sora, -apple-system, 'Inter', sans-serif);
```

```css
/* Update body rule in @layer base: */
body {
  background-color: var(--bg);
  color: var(--text-primary);
  font-family: var(--font-jakarta, -apple-system, 'Plus Jakarta Sans', sans-serif);
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

- [ ] **Step 5: Update `context/WingspanContext.tsx` — add selectedPath**

Add `selectedPath: null` to `initialState`, and handle `SELECT_PATH` in the reducer:

```typescript
// In initialState add:
selectedPath: null,

// In reducer switch, add case:
case 'SELECT_PATH':
  return { ...state, selectedPath: action.path }
```

- [ ] **Step 6: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors. If errors appear from new required fields not in mock data, that's expected — mock data is updated in Task 2.

- [ ] **Step 7: Commit**

```bash
git add types/wingspan.ts context/WingspanContext.tsx app/layout.tsx app/globals.css
git commit -m "feat: extend types for redesign, load Sora + Plus Jakarta Sans fonts"
```

---

## Task 2: Enrich Mock Data

**Files:**
- Modify: `lib/mock-data.ts`

- [ ] **Step 1: Replace `mockBlueprint` strengths with enriched versions**

In `lib/mock-data.ts`, replace the `strengths` array inside `mockBlueprint`:

```typescript
strengths: [
  {
    name: 'Systems Thinking',
    confidence: 95,
    evidence: 'Co-defined Grommet.io at HPE, anchored Data Governance design track at Accenture, built DesignOps frameworks across 4 organisations',
    careerAdvantage: 'Ability to operate effectively across complex systems and large organisations — rare at senior IC level, essential at executive level.',
    projectCount: 7,
    projects: ['HPE Grommet Design System', 'Data Governance Design Track', 'Cloud Migration Cost Optimiser'],
    rationale: 'Every role you\'ve held has involved building or improving the system around design — not just the artefacts.',
  },
  {
    name: 'Strategic Leadership',
    confidence: 92,
    evidence: 'Scaled a design team 8x at Accenture, founded first-ever design capability at Photon, drove RFPs with 100% conversion rate',
    careerAdvantage: 'Consistently trusted with undefined problems requiring building from scratch — the defining capability of a design executive.',
    projectCount: 5,
    projects: ['Cloud Migration Cost Optimiser', 'Data Governance Design Track', 'Photon Design Capability'],
    rationale: 'The 8x team scaling at Accenture is not an operational achievement — it\'s evidence of your ability to make the case for design at a leadership level.',
  },
  {
    name: 'AI-Driven Experience Design',
    confidence: 88,
    evidence: 'Anchoring Generative AI cohort of 20+ designers, researching LLMs for conversational experiences',
    careerAdvantage: 'Positions you in the top 5% of enterprise designers globally on the most in-demand emerging capability.',
    projectCount: 3,
    projects: ['Generative AI Cohort', 'Data Governance Design Track', 'AI-powered Business Insights'],
    rationale: 'You are one of the very few designers who has moved from curiosity about AI to active capability-building at enterprise scale.',
  },
  {
    name: 'Cross-Cultural Navigation',
    confidence: 85,
    evidence: 'Led international user research at HPE, designed for Middle Eastern airline, global workshop facilitation',
    careerAdvantage: 'Enables you to lead design for global products and diverse stakeholder groups without needing translation layers.',
    projectCount: 4,
    projects: ['Middle Eastern Airline Booking App', 'HPE Cloud Management Suite'],
    rationale: 'You\'ve consistently designed for audiences you didn\'t grow up with — and done it through research-led empathy.',
  },
  {
    name: 'High-Impact Delivery',
    confidence: 90,
    evidence: '92% engagement boost on airline app, $446K cost savings, 100% RFP conversion, 30% cloud cost optimisation',
    careerAdvantage: 'You speak the language of business outcomes — a critical differentiator when making the case for design investment at board level.',
    projectCount: 6,
    projects: ['Middle Eastern Airline Booking App', 'Telecom Multi-Channel Enterprise App', 'Cloud Migration Cost Optimiser'],
    rationale: 'You measure your impact in numbers that matter to the business. This is not common among designers.',
  },
],
```

- [ ] **Step 2: Replace interests with enriched versions**

```typescript
interests: [
  {
    name: 'Generative AI',
    frequency: 10,
    evidence: 'Active research into LLMs, cohort of 20+ designers, conversational AI experiences',
    whyItAppears: ['Anchoring Gen AI cohort at Accenture', 'LLM research for product experiences', 'AI-powered business insights delivery', 'Published on AI design capability'],
    marketOutlook: 'Very High Growth',
    futureRelevance: 'Expected to remain one of the highest-growth design specialisations over the next decade due to enterprise AI adoption and agent-based systems.',
  },
  {
    name: 'Design Leadership',
    frequency: 9,
    evidence: 'Team building at scale, CoE setup, mentoring academic and industry designers',
    whyItAppears: ['8x team scaling at Accenture', 'Founded design capability at Photon', 'Mentored 20+ designers formally'],
    marketOutlook: 'High Growth',
    futureRelevance: 'As organisations mature their AI practices, demand for experienced design leaders who can navigate ambiguity is accelerating.',
  },
  {
    name: 'Design Philosophy',
    frequency: 7,
    evidence: 'Talks on Design Lessons from Vedas, 5-chapter series on ancient design concepts',
    whyItAppears: ['5-part Vedas design series', 'DT Summit facilitation', 'Philosophical framing in public talks'],
    marketOutlook: 'Stable',
    futureRelevance: 'A niche but powerful differentiator — design thinkers who can articulate first principles attract followings and institutional trust.',
  },
  {
    name: 'Enterprise Transformation',
    frequency: 8,
    evidence: 'Consistent work in transforming large enterprise design practices across 4 organisations',
    whyItAppears: ['DesignOps builds at 3 companies', 'Data Governance design track', 'Cross-org design culture work'],
    marketOutlook: 'High Growth',
    futureRelevance: 'Legacy enterprises accelerating digital and AI transformation need exactly this experience profile.',
  },
  {
    name: 'Public Speaking',
    frequency: 6,
    evidence: 'DT Summit \'17 & \'18, UX India \'14, articles and talks on design',
    whyItAppears: ['DT Summit facilitator + presenter', 'UX India speaker', 'Written articles on design'],
    marketOutlook: 'Stable',
    futureRelevance: 'Thought leadership compound interest — every talk and article increases inbound opportunities over time.',
  },
],
```

- [ ] **Step 3: Replace futurePaths with enriched versions**

```typescript
futurePaths: [
  {
    title: 'VP / Head of Design',
    whyItFits: 'Your 13-year arc has been quietly preparing you for this. You\'ve built design teams, defined capability at scale, and delivered measurable business outcomes. You\'re not growing toward a VP role — you\'re already operating at that altitude.',
    evidence: ['8x team scaling', '100% RFP conversion', 'Data Governance design track leadership', 'Generative AI cohort anchor'],
    opportunitySize: 'established',
    confidence: 92,
    recommendationStatus: 'Strongly Recommended',
    timeline: '12-18 Months',
    marketDemand: 'Very High',
    growthPotential: 'Excellent',
    keyTransitionAreas: ['P&L Ownership', 'C-Suite Communication', 'Org Design at 50+', 'Executive Presence'],
  },
  {
    title: 'AI Design Strategist / CDO',
    whyItFits: 'You are ahead of 95% of designers on AI. You\'re not just using AI tools — you\'re building the frameworks and cohorts that teach others. An AI-native company building for enterprise would find you uniquely valuable.',
    evidence: ['Generative AI cohort of 20+', 'LLM research for conversational experiences', 'AI-powered business insights'],
    opportunitySize: 'emerging',
    confidence: 87,
    recommendationStatus: 'Strongly Recommended',
    timeline: '12-24 Months',
    marketDemand: 'Very High',
    growthPotential: 'Excellent',
    keyTransitionAreas: ['AI Prototyping', 'LLM Fluency', 'AI Ethics in Design', 'Product-Led Growth'],
  },
  {
    title: 'Design Educator / Thought Leader',
    whyItFits: 'Your Vedas series, DT Summit talks, and mentor history reveal a consistent drive to synthesise and teach. You don\'t just do — you reflect on what it means.',
    evidence: ['5-chapter Vedas series', 'DT Summit \'17 & \'18 facilitator', 'UX India \'14 speaker'],
    opportunitySize: 'growing',
    confidence: 78,
    recommendationStatus: 'Emerging Opportunity',
    timeline: '18-36 Months',
    marketDemand: 'High',
    growthPotential: 'Strong',
    keyTransitionAreas: ['Curriculum Design', 'Platform Building', 'Community Leadership', 'Content Strategy'],
  },
  {
    title: 'Fractional CDO / Consultant',
    whyItFits: 'Your breadth across aviation, cloud, telecom, insurance, and AI gives you the portfolio diversity that large consulting clients pay a premium for.',
    evidence: ['Multiple industry verticals', 'Design CoE setup experience', 'Business development and RFP leadership'],
    opportunitySize: 'growing',
    confidence: 82,
    recommendationStatus: 'Recommended',
    timeline: '6-18 Months',
    marketDemand: 'High',
    growthPotential: 'Strong',
    keyTransitionAreas: ['Personal Branding', 'Client Acquisition', 'Consulting Frameworks', 'Independent Operations'],
  },
],
```

- [ ] **Step 4: Replace gaps with enriched versions (filtered by pathway)**

```typescript
gaps: [
  {
    pathway: 'VP / Head of Design',
    gapType: 'Positioning Gap',
    currentReadiness: 82,
    futureReadiness: 95,
    currentState: 'Strong internal design leader with proven delivery track record',
    desiredState: 'Recognised VP-level executive with external market visibility',
    requiredCapabilities: ['P&L ownership', 'C-suite executive presence', 'Board-level communication'],
    gapSize: 'small',
    whyItMatters: 'The difference between your current impact and your current title is the single biggest lever you have.',
    timeline: '12-18 months',
    effort: 'Medium — primarily visibility and positioning',
    howToClose: 'Publish thought leadership, seek a VP title in your next move, build relationships with CDOs at peer organisations.',
  },
  {
    pathway: 'VP / Head of Design',
    gapType: 'Visibility Gap',
    currentReadiness: 60,
    futureReadiness: 85,
    currentState: 'Strong internal reputation, limited external brand',
    desiredState: 'Recognised design leader in the broader industry',
    requiredCapabilities: ['Public thought leadership', 'Conference presence', 'LinkedIn authority'],
    gapSize: 'medium',
    whyItMatters: 'External visibility accelerates every executive career move — it turns passive opportunities into active ones.',
    timeline: '6-12 months',
    effort: 'Medium — sustained monthly publishing',
    howToClose: 'One LinkedIn article per month on AI + enterprise design. Speak at one conference in the next 12 months.',
  },
  {
    pathway: 'AI Design Strategist / CDO',
    gapType: 'Skills Gap',
    currentReadiness: 72,
    futureReadiness: 90,
    currentState: 'Strong AI design strategy, limited hands-on AI prototyping',
    desiredState: 'Fluent in AI tools, able to prototype and demonstrate LLM-powered experiences',
    requiredCapabilities: ['Hands-on AI prototyping', 'LLM prompt engineering', 'AI product frameworks'],
    gapSize: 'medium',
    whyItMatters: 'In AI-native companies, CDOs who can prototype earn exponentially more credibility with engineering teams.',
    timeline: '12-24 months',
    effort: 'High — requires active experimentation and side projects',
    howToClose: 'Build 2-3 public AI design projects. Publish the process. Contribute to or advise an AI startup.',
  },
  {
    pathway: 'Fractional CDO / Consultant',
    gapType: 'Skills Gap',
    currentReadiness: 70,
    futureReadiness: 88,
    currentState: 'Extensive delivery experience inside organisations',
    desiredState: 'Independent practice with defined offer, clients, and pricing',
    requiredCapabilities: ['Personal brand', 'Client acquisition', 'Contract frameworks'],
    gapSize: 'medium',
    whyItMatters: 'The hardest part of consulting is finding clients. Your existing network is the shortcut.',
    timeline: '6-12 months to first client',
    effort: 'Medium — positioning and network activation',
    howToClose: 'Define your offer in one sentence. Register on Contra. Activate 10 conversations in your network.',
  },
],
```

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add lib/mock-data.ts
git commit -m "feat: enrich mock data with new type fields (careerAdvantage, whyItAppears, marketOutlook, gapType, etc.)"
```

---

## Task 3: StepNav Component

**Files:**
- Create: `components/ui/StepNav.tsx`

- [ ] **Step 1: Create `components/ui/StepNav.tsx`**

```typescript
// components/ui/StepNav.tsx
'use client'
import { motion } from 'framer-motion'
import { BlueprintStep } from '@/types/wingspan'

const STEPS: { id: BlueprintStep; label: string; short: string }[] = [
  { id: 'profile',        label: 'Profile',          short: '01' },
  { id: 'intelligence',   label: 'Intelligence',      short: '02' },
  { id: 'path-selection', label: 'Future Paths',      short: '03' },
  { id: 'gap-analysis',   label: 'Gap Analysis',      short: '04' },
  { id: 'roadmap',        label: 'Roadmap',           short: '05' },
  { id: 'resources',      label: 'Resources',         short: '06' },
]

interface StepNavProps {
  currentStep: BlueprintStep
  completedSteps: BlueprintStep[]
  onStepClick: (step: BlueprintStep) => void
}

export function StepNav({ currentStep, completedSteps, onStepClick }: StepNavProps) {
  return (
    <nav className="flex items-center gap-0 border border-[var(--border-ws)] rounded-[12px] overflow-hidden mb-8">
      {STEPS.map((step, idx) => {
        const isActive = step.id === currentStep
        const isCompleted = completedSteps.includes(step.id)
        const isClickable = isCompleted || isActive

        return (
          <button
            key={step.id}
            onClick={() => isClickable && onStepClick(step.id)}
            disabled={!isClickable}
            className={`
              flex-1 flex flex-col items-center py-3 px-2 text-center border-r border-[var(--border-ws)] last:border-r-0
              transition-colors relative
              ${isActive ? 'bg-[var(--neon)] text-[#0a0a0a]' : ''}
              ${isCompleted && !isActive ? 'bg-transparent text-[var(--neon)] cursor-pointer hover:bg-[var(--neon-surface)]' : ''}
              ${!isCompleted && !isActive ? 'bg-transparent text-[var(--text-dim)] cursor-not-allowed' : ''}
            `}
          >
            <span className={`text-[9px] font-bold tracking-[1.5px] ${isActive ? 'text-[#0a0a0a]' : ''}`}>
              {step.short}
            </span>
            <span className={`text-[10px] font-semibold mt-0.5 hidden sm:block ${isActive ? 'text-[#0a0a0a]' : ''}`}>
              {step.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="step-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0a0a0a]"
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/ui/StepNav.tsx
git commit -m "feat: add StepNav wizard progress indicator"
```

---

## Task 4: StrengthRadar Component

**Files:**
- Create: `components/ui/StrengthRadar.tsx`

- [ ] **Step 1: Install Recharts**

```bash
npm install recharts
```

- [ ] **Step 2: Create `components/ui/StrengthRadar.tsx`**

```typescript
// components/ui/StrengthRadar.tsx
'use client'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { Strength } from '@/types/wingspan'

interface StrengthRadarProps {
  strengths: Strength[]
}

export function StrengthRadar({ strengths }: StrengthRadarProps) {
  const data = strengths.map((s) => ({
    subject: s.name.length > 14 ? s.name.slice(0, 14) + '…' : s.name,
    value: s.confidence,
    fullMark: 100,
  }))

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
          <PolarGrid stroke="var(--border-ws)" strokeOpacity={0.6} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-jakarta)' }}
          />
          <Radar
            name="Strengths"
            dataKey="value"
            stroke="#a3e635"
            fill="#a3e635"
            fillOpacity={0.12}
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/StrengthRadar.tsx
git commit -m "feat: add StrengthRadar component using Recharts"
```

---

## Task 5: Redesign ProfileMap

**Files:**
- Rewrite: `components/blueprint/ProfileMap.tsx`

- [ ] **Step 1: Rewrite `components/blueprint/ProfileMap.tsx`**

```typescript
// components/blueprint/ProfileMap.tsx
'use client'
import { Blueprint } from '@/types/wingspan'

const SKILL_DOMAINS = [
  'Experience Strategy', 'Design Leadership', 'UX Research',
  'Information Architecture', 'Design Systems', 'DesignOps',
  'Generative AI', 'Product Mindset', 'Service Design',
]

const DESIGN_TOOLS = [
  'Figma', 'Framer', 'Miro', 'FigJam', 'Adobe CC',
  'JIRA', 'Notion', 'Google Analytics',
]

interface ProfileMapProps {
  blueprint: Blueprint
  extractedData?: {
    projects: Array<{ name: string; company: string; year?: string; industry?: string; platform?: string; audience?: string; summary?: string; impact?: string }>
    skills: string[]
    timeline: Array<{ role: string; company: string; startDate: string; endDate: string }>
  }
}

function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span className={`
      inline-block px-3 py-1.5 rounded-[8px] text-xs font-medium border
      ${accent
        ? 'bg-[var(--neon-surface)] text-[var(--neon)] border-[var(--neon-border)]'
        : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border-ws)]'
      }
    `}>
      {label}
    </span>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[var(--text-muted)] mb-3">
      {children}
    </p>
  )
}

export function ProfileMap({ blueprint, extractedData }: ProfileMapProps) {
  const { profileMap } = blueprint

  // Derive tools and skill domains from extractedData.skills if available
  const allSkills = extractedData?.skills ?? []
  const tools = allSkills.filter(s => DESIGN_TOOLS.includes(s)).length > 0
    ? allSkills.filter(s => DESIGN_TOOLS.includes(s))
    : DESIGN_TOOLS.filter(t => ['Figma', 'Framer', 'Miro', 'Adobe CC', 'JIRA', 'Notion'].includes(t))

  const skillDomains = allSkills.filter(s => !DESIGN_TOOLS.includes(s)).length > 0
    ? allSkills.filter(s => !DESIGN_TOOLS.includes(s)).slice(0, 12)
    : SKILL_DOMAINS

  const projects = extractedData?.projects ?? []
  const leadershipRoles = extractedData?.timeline?.filter(t =>
    t.role.toLowerCase().includes('lead') ||
    t.role.toLowerCase().includes('manager') ||
    t.role.toLowerCase().includes('director') ||
    t.role.toLowerCase().includes('head')
  ).length ?? 2

  const industryList = profileMap.industries

  return (
    <div className="flex flex-col gap-10">

      {/* Hero stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: profileMap.yearsOfExperience, label: 'Years Experience' },
          { value: industryList.length, label: 'Industries' },
          { value: profileMap.domains.length, label: 'Skill Domains' },
        ].map(({ value, label }) => (
          <div key={label} className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-4 text-center">
            <div
              className="text-3xl font-bold text-[var(--neon)]"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              {value}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Career Summary */}
      <div>
        <SectionLabel>Career Summary</SectionLabel>
        <p className="text-base text-[var(--text-secondary)] leading-relaxed" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {profileMap.careerEvolution}
        </p>
      </div>

      {/* Experience Snapshot */}
      <div>
        <SectionLabel>Experience Snapshot</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: `${profileMap.yearsOfExperience}+`, label: 'Years of Experience' },
            { value: industryList.length, label: 'Industries Worked In' },
            { value: projects.length || '7+', label: 'Projects Completed' },
            { value: leadershipRoles, label: 'Leadership Roles' },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] p-3 flex items-center gap-3">
              <span className="text-lg font-bold text-[var(--neon)]" style={{ fontFamily: 'var(--font-sora)' }}>
                {value}
              </span>
              <span className="text-xs text-[var(--text-muted)] leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Industries */}
      <div>
        <SectionLabel>Industries</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {industryList.map(ind => <Chip key={ind} label={ind} />)}
        </div>
      </div>

      {/* Skill Domains */}
      <div>
        <SectionLabel>Skill Domains</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {skillDomains.map(skill => <Chip key={skill} label={skill} accent />)}
        </div>
      </div>

      {/* Tools */}
      <div>
        <SectionLabel>Tools</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {tools.map(tool => <Chip key={tool} label={tool} />)}
        </div>
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div>
          <SectionLabel>Project Repository</SectionLabel>
          <div className="flex flex-col gap-3">
            {projects.map(p => (
              <div key={p.id || p.name} className="rounded-[10px] bg-[var(--surface)] border border-[var(--border-ws)] p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>
                    {p.name}
                  </span>
                  {p.audience && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border-ws)] text-[var(--text-muted)] flex-shrink-0">
                      {p.audience}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] mb-2">{p.company}{p.year ? ` · ${p.year}` : ''}{p.industry ? ` · ${p.industry}` : ''}</p>
                {p.summary && <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2">{p.summary}</p>}
                {p.impact && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold tracking-[1px] uppercase text-[var(--text-muted)]">Impact</span>
                    <span className="text-xs font-semibold text-[var(--neon)]">{p.impact}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/blueprint/ProfileMap.tsx
git commit -m "feat: redesign ProfileMap — hero stats, career summary, industries, skills, tools, project repository"
```

---

## Task 6: Redesign CareerIntelligence

**Files:**
- Rewrite: `components/blueprint/CareerIntelligence.tsx`

- [ ] **Step 1: Rewrite `components/blueprint/CareerIntelligence.tsx`**

```typescript
// components/blueprint/CareerIntelligence.tsx
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Blueprint } from '@/types/wingspan'
import { StrengthRadar } from '@/components/ui/StrengthRadar'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold tracking-[2.5px] uppercase text-[var(--text-muted)] mb-4">
      {children}
    </p>
  )
}

const MARKET_COLOR: Record<string, string> = {
  'Very High Growth': 'text-[var(--neon)] border-[var(--neon-border)] bg-[var(--neon-surface)]',
  'High Growth':      'text-emerald-400 border-emerald-800/50 bg-emerald-950/20',
  'Emerging':         'text-yellow-400 border-yellow-800/50 bg-yellow-950/20',
  'Stable':           'text-[var(--text-muted)] border-[var(--border-ws)] bg-transparent',
}

export function CareerIntelligence({ blueprint }: { blueprint: Blueprint }) {
  const { strengths, interests } = blueprint
  const [activeStrength, setActiveStrength] = useState(0)

  return (
    <div className="flex flex-col gap-12">

      {/* Strength Landscape */}
      <div>
        <SectionLabel>Strength Landscape</SectionLabel>

        {/* Radar overview */}
        <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-4 mb-4">
          <StrengthRadar strengths={strengths} />
        </div>

        {/* Horizontal scrollable strength cards */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
          {strengths.map((s, idx) => (
            <motion.button
              key={s.name}
              onClick={() => setActiveStrength(idx)}
              className={`
                flex-shrink-0 w-72 snap-start rounded-[12px] border p-4 text-left transition-all
                ${activeStrength === idx
                  ? 'bg-[var(--surface)] border-[var(--neon)]'
                  : 'bg-[var(--surface)] border-[var(--border-ws)]'
                }
              `}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>
                  {s.name}
                </span>
                <span className="text-sm font-bold text-[var(--neon)] tabular-nums flex-shrink-0 ml-2">
                  {s.confidence}%
                </span>
              </div>

              {/* Mini bar */}
              <div className="h-[2px] rounded-full bg-[var(--border-ws)] mb-3">
                <div
                  className="h-full rounded-full bg-[var(--neon)] transition-all duration-500"
                  style={{ width: `${s.confidence}%` }}
                />
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">{s.evidence}</p>

              <div className="rounded-[8px] bg-[#111] border border-[var(--border-ws)] p-3">
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Career Advantage</p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{s.careerAdvantage}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Interest Landscape */}
      <div>
        <SectionLabel>Interest Landscape</SectionLabel>
        <div className="flex flex-col gap-3">
          {interests.map((interest) => (
            <div key={interest.name} className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-4">

              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-primary)] mb-0.5" style={{ fontFamily: 'var(--font-sora)' }}>
                    {interest.name}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{interest.evidence}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-[6px] border flex-shrink-0 ${MARKET_COLOR[interest.marketOutlook] ?? MARKET_COLOR['Stable']}`}>
                  {interest.marketOutlook}
                </span>
              </div>

              {/* Why it appears */}
              {interest.whyItAppears && interest.whyItAppears.length > 0 && (
                <div className="mb-3">
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-2">Why this appears</p>
                  <div className="flex flex-wrap gap-1.5">
                    {interest.whyItAppears.map(reason => (
                      <span key={reason} className="text-[10px] px-2 py-1 rounded-[6px] bg-[var(--surface)] border border-[var(--border-ws)] text-[var(--text-muted)]">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Future relevance */}
              {interest.futureRelevance && (
                <div className="rounded-[8px] bg-[#111] border border-[var(--border-ws)] p-3">
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Future Relevance</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{interest.futureRelevance}</p>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/blueprint/CareerIntelligence.tsx
git commit -m "feat: redesign CareerIntelligence — radar overview, horizontal strength cards, enriched interest cards"
```

---

## Task 7: PathSelection Component (New)

**Files:**
- Create: `components/blueprint/PathSelection.tsx`

- [ ] **Step 1: Create `components/blueprint/PathSelection.tsx`**

```typescript
// components/blueprint/PathSelection.tsx
'use client'
import { motion } from 'framer-motion'
import { Blueprint } from '@/types/wingspan'
import { useWingspan } from '@/context/WingspanContext'

const DEMAND_COLOR: Record<string, string> = {
  'Very High': 'text-[var(--neon)]',
  'High':      'text-emerald-400',
  'Moderate':  'text-yellow-400',
  'Emerging':  'text-blue-400',
}

const STATUS_STYLE: Record<string, string> = {
  'Strongly Recommended': 'bg-[var(--neon-surface)] text-[var(--neon)] border-[var(--neon-border)]',
  'Recommended':          'bg-emerald-950/30 text-emerald-400 border-emerald-800/50',
  'Emerging Opportunity': 'bg-blue-950/30 text-blue-400 border-blue-800/50',
}

export function PathSelection({ blueprint }: { blueprint: Blueprint }) {
  const { state, dispatch } = useWingspan()
  const { futurePaths } = blueprint

  return (
    <div className="flex flex-col gap-6">

      <div className="mb-2">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Based on your profile, strengths, interests, and market trends — these are your strongest future directions. Select one path to generate your personalised gap analysis and roadmap.
        </p>
      </div>

      {futurePaths.map((path, idx) => {
        const isSelected = state.selectedPath === path.title

        return (
          <motion.div
            key={path.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.4 }}
            className={`
              rounded-[16px] border p-5 flex flex-col gap-4 transition-all
              ${isSelected
                ? 'border-[var(--neon)] bg-[var(--surface)]'
                : 'border-[var(--border-ws)] bg-[var(--surface)]'
              }
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className="text-base font-bold text-[var(--text-primary)]"
                    style={{ fontFamily: 'var(--font-sora)' }}
                  >
                    {path.title}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[path.recommendationStatus] ?? STATUS_STYLE['Recommended']}`}>
                    {path.recommendationStatus}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{path.whyItFits}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-bold text-[var(--neon)]" style={{ fontFamily: 'var(--font-sora)' }}>
                  {path.confidence}%
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">match</div>
              </div>
            </div>

            {/* Metadata row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[8px] bg-[#111] border border-[var(--border-ws)] p-2 text-center">
                <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--text-muted)] mb-0.5">Timeline</p>
                <p className="text-xs font-semibold text-[var(--text-primary)]">{path.timeline}</p>
              </div>
              <div className="rounded-[8px] bg-[#111] border border-[var(--border-ws)] p-2 text-center">
                <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--text-muted)] mb-0.5">Demand</p>
                <p className={`text-xs font-semibold ${DEMAND_COLOR[path.marketDemand] ?? 'text-[var(--text-primary)]'}`}>
                  {path.marketDemand}
                </p>
              </div>
              <div className="rounded-[8px] bg-[#111] border border-[var(--border-ws)] p-2 text-center">
                <p className="text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--text-muted)] mb-0.5">Growth</p>
                <p className="text-xs font-semibold text-[var(--text-primary)]">{path.growthPotential}</p>
              </div>
            </div>

            {/* Key transition areas */}
            {path.keyTransitionAreas && path.keyTransitionAreas.length > 0 && (
              <div>
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-2">Key Transition Areas</p>
                <div className="flex flex-wrap gap-1.5">
                  {path.keyTransitionAreas.map(area => (
                    <span key={area} className="text-xs px-2.5 py-1 rounded-[6px] bg-[var(--surface)] border border-[var(--border-ws)] text-[var(--text-secondary)]">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => dispatch({ type: 'SELECT_PATH', path: path.title })}
              className={`
                w-full py-3 rounded-[10px] text-sm font-bold transition-all border
                ${isSelected
                  ? 'bg-[var(--neon)] text-[#0a0a0a] border-[var(--neon)]'
                  : 'bg-transparent text-[var(--neon)] border-[var(--neon-border)] hover:bg-[var(--neon-surface)]'
                }
              `}
            >
              {isSelected ? '✓ Path Selected' : 'Select This Path'}
            </motion.button>

          </motion.div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/blueprint/PathSelection.tsx
git commit -m "feat: add PathSelection component with match scores, metadata, and Select CTA"
```

---

## Task 8: Redesign GapAnalysis

**Files:**
- Rewrite: `components/blueprint/GapAnalysis.tsx`

- [ ] **Step 1: Rewrite `components/blueprint/GapAnalysis.tsx`**

```typescript
// components/blueprint/GapAnalysis.tsx
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { Blueprint, Gap } from '@/types/wingspan'
import { useWingspan } from '@/context/WingspanContext'

const GAP_SIZE_STYLE = {
  small:  { label: 'Small Gap',  cls: 'text-[var(--neon)] border-[var(--neon-border)] bg-[var(--neon-surface)]' },
  medium: { label: 'Medium Gap', cls: 'text-yellow-400 border-yellow-800/50 bg-yellow-950/20' },
  large:  { label: 'High Gap',   cls: 'text-red-400 border-red-800/50 bg-red-950/20' },
}

function GapCard({ gap }: { gap: Gap }) {
  const [expanded, setExpanded] = useState(false)
  const sizeStyle = GAP_SIZE_STYLE[gap.gapSize]

  const currentPct = gap.currentReadiness
  const futurePct = gap.futureReadiness
  const gapPct = futurePct - currentPct

  return (
    <motion.div layout className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-start gap-3"
      >
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <span className="text-sm font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>
              {gap.gapType}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sizeStyle.cls}`}>
              {sizeStyle.label}
            </span>
          </div>

          {/* Current vs desired visual */}
          <div className="flex flex-col gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-16 text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-[1px] flex-shrink-0">Now</div>
              <div className="flex-1 h-[3px] rounded-full bg-[var(--border-ws)]">
                <div className="h-full rounded-full bg-[var(--text-muted)] transition-all" style={{ width: `${currentPct}%` }} />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] tabular-nums w-7 text-right">{currentPct}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 text-[9px] text-[var(--neon)] font-bold uppercase tracking-[1px] flex-shrink-0">Target</div>
              <div className="flex-1 h-[3px] rounded-full bg-[var(--border-ws)]">
                <div className="h-full rounded-full bg-[var(--neon)] transition-all" style={{ width: `${futurePct}%` }} />
              </div>
              <span className="text-[10px] text-[var(--neon)] tabular-nums w-7 text-right">{futurePct}%</span>
            </div>
          </div>

          <p className="text-xs text-[var(--text-muted)]">
            {gapPct} point gap to close · {gap.timeline} · {gap.effort}
          </p>
        </div>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0 mt-1">
          <ChevronDown size={16} className="text-[var(--text-muted)]" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-4 border-t border-[var(--border-ws)] pt-4">

              {/* Current vs Desired state */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[8px] bg-[#111] border border-[var(--border-ws)] p-3">
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Current State</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{gap.currentState}</p>
                </div>
                <div className="rounded-[8px] bg-[var(--neon-surface)] border border-[var(--neon-border)] p-3">
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--neon)] mb-1">Desired State</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{gap.desiredState}</p>
                </div>
              </div>

              {/* Why it matters */}
              {gap.whyItMatters && (
                <div>
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Why It Matters</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{gap.whyItMatters}</p>
                </div>
              )}

              {/* Required capabilities */}
              <div>
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-2">Required Capabilities</p>
                <div className="flex flex-wrap gap-1.5">
                  {gap.requiredCapabilities.map(cap => (
                    <span key={cap} className="text-[10px] px-2 py-1 rounded-[6px] bg-[var(--surface)] border border-[var(--border-ws)] text-[var(--text-muted)]">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* How to close */}
              <div className="rounded-[8px] bg-[#111] border border-[var(--border-ws)] p-3">
                <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">How to Close</p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{gap.howToClose}</p>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function GapAnalysis({ blueprint }: { blueprint: Blueprint }) {
  const { state } = useWingspan()
  const { gaps } = blueprint

  const selectedPath = state.selectedPath
  const filteredGaps = selectedPath
    ? gaps.filter(g => g.pathway === selectedPath || g.pathway.includes(selectedPath.split('/')[0].trim()))
    : gaps

  if (!selectedPath) {
    return (
      <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">Select a future path first to see your gap analysis.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <p className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Analysing gaps for</p>
        <p className="text-base font-bold text-[var(--neon)]" style={{ fontFamily: 'var(--font-sora)' }}>
          {selectedPath}
        </p>
      </div>
      {filteredGaps.map(gap => (
        <GapCard key={`${gap.pathway}-${gap.gapType}`} gap={gap} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/blueprint/GapAnalysis.tsx
git commit -m "feat: redesign GapAnalysis — path-filtered, expandable gap type cards with current/desired state"
```

---

## Task 9: GrowthRoadmap Component (New)

**Files:**
- Create: `components/blueprint/GrowthRoadmap.tsx`

- [ ] **Step 1: Create `components/blueprint/GrowthRoadmap.tsx`**

```typescript
// components/blueprint/GrowthRoadmap.tsx
'use client'
import { Blueprint } from '@/types/wingspan'
import { useWingspan } from '@/context/WingspanContext'
import { ActionsSection } from './ActionsSection'

export function GrowthRoadmap({ blueprint }: { blueprint: Blueprint }) {
  const { state } = useWingspan()
  const selectedPath = state.selectedPath

  if (!selectedPath) {
    return (
      <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">Select a future path first to see your personalised roadmap.</p>
      </div>
    )
  }

  // Filter actions to those relevant to the selected path
  const { actions } = blueprint
  const filteredBlueprint = {
    ...blueprint,
    actions: {
      ...actions,
      immediate: actions.immediate.filter(a =>
        !a.pathway || a.pathway === selectedPath || a.pathway.includes(selectedPath.split('/')[0].trim())
      ),
      mediumTerm: actions.mediumTerm.filter(a =>
        !a.pathway || a.pathway === selectedPath || a.pathway.includes(selectedPath.split('/')[0].trim())
      ),
      longTerm: actions.longTerm.filter(a =>
        !a.pathway || a.pathway === selectedPath || a.pathway.includes(selectedPath.split('/')[0].trim())
      ),
      resources: actions.resources.filter(r =>
        !r.pathway || r.pathway === selectedPath || r.pathway.includes(selectedPath.split('/')[0].trim())
      ),
    },
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Roadmap for</p>
        <p className="text-base font-bold text-[var(--neon)]" style={{ fontFamily: 'var(--font-sora)' }}>
          {selectedPath}
        </p>
      </div>
      <ActionsSection blueprint={filteredBlueprint} />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/blueprint/GrowthRoadmap.tsx
git commit -m "feat: add GrowthRoadmap — path-filtered wrapper over ActionsSection"
```

---

## Task 10: Resources Component (New)

**Files:**
- Create: `components/blueprint/Resources.tsx`

- [ ] **Step 1: Create `components/blueprint/Resources.tsx`**

```typescript
// components/blueprint/Resources.tsx
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, BookOpen, Users, Link2, ChevronDown } from 'lucide-react'
import { Blueprint, Resource } from '@/types/wingspan'
import { useWingspan } from '@/context/WingspanContext'

function ResourceCard({ resource }: { resource: Resource }) {
  const [expanded, setExpanded] = useState(false)
  const icon = resource.type === 'book' || resource.type === 'course'
    ? <BookOpen size={14} />
    : resource.type === 'community'
    ? <Users size={14} />
    : <Link2 size={14} />

  return (
    <motion.div layout className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-[8px] bg-[var(--surface)] border border-[var(--border-ws)] flex items-center justify-center text-[var(--text-muted)]">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[var(--text-muted)] capitalize mb-0.5">{resource.type}</p>
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug" style={{ fontFamily: 'var(--font-sora)' }}>
            {resource.title}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-[var(--neon)] hover:opacity-80 transition-opacity"
            >
              <ExternalLink size={14} />
            </a>
          )}
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} className="text-[var(--text-muted)]" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--border-ws)]"
          >
            <div className="p-4 flex flex-col gap-3">
              {resource.whereToStart && (
                <div>
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Where to Start</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{resource.whereToStart}</p>
                </div>
              )}
              {resource.firstStep && (
                <div>
                  <p className="text-[9px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">First Step</p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{resource.firstStep}</p>
                </div>
              )}
              {resource.url && (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[var(--neon)] text-[#0a0a0a] text-xs font-bold w-fit"
                >
                  Open Resource <ExternalLink size={11} />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function Resources({ blueprint }: { blueprint: Blueprint }) {
  const { state } = useWingspan()
  const selectedPath = state.selectedPath

  if (!selectedPath) {
    return (
      <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">Select a future path first to see contextual resources.</p>
      </div>
    )
  }

  const filteredResources = blueprint.actions.resources.filter(r =>
    !r.pathway || r.pathway === selectedPath || r.pathway.includes(selectedPath.split('/')[0].trim())
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <p className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--text-muted)] mb-1">Resources for</p>
        <p className="text-base font-bold text-[var(--neon)]" style={{ fontFamily: 'var(--font-sora)' }}>
          {selectedPath}
        </p>
      </div>

      {filteredResources.length === 0 ? (
        <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--border-ws)] p-6 text-center">
          <p className="text-sm text-[var(--text-muted)]">No specific resources for this path yet.</p>
        </div>
      ) : (
        filteredResources.map(resource => (
          <ResourceCard key={resource.title} resource={resource} />
        ))
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/blueprint/Resources.tsx
git commit -m "feat: add Resources component — path-filtered, expandable resource cards with first steps"
```

---

## Task 11: Rewrite BlueprintScreen (6-Step Wizard)

**Files:**
- Rewrite: `components/screens/BlueprintScreen.tsx`

- [ ] **Step 1: Rewrite `components/screens/BlueprintScreen.tsx`**

```typescript
// components/screens/BlueprintScreen.tsx
'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWingspan } from '@/context/WingspanContext'
import { StepNav } from '@/components/ui/StepNav'
import { ProfileMap } from '@/components/blueprint/ProfileMap'
import { CareerIntelligence } from '@/components/blueprint/CareerIntelligence'
import { PathSelection } from '@/components/blueprint/PathSelection'
import { GapAnalysis } from '@/components/blueprint/GapAnalysis'
import { GrowthRoadmap } from '@/components/blueprint/GrowthRoadmap'
import { Resources } from '@/components/blueprint/Resources'
import { Blueprint, BlueprintStep } from '@/types/wingspan'

const STEPS: { id: BlueprintStep; title: string; subtitle: string }[] = [
  { id: 'profile',        title: 'Profile Map',         subtitle: 'Who you are today' },
  { id: 'intelligence',   title: 'Career Intelligence',  subtitle: 'Strengths & interests' },
  { id: 'path-selection', title: 'Future Paths',         subtitle: 'Choose your direction' },
  { id: 'gap-analysis',   title: 'Gap Analysis',         subtitle: 'What stands between you and your goal' },
  { id: 'roadmap',        title: 'Growth Roadmap',       subtitle: 'Your personalised action plan' },
  { id: 'resources',      title: 'Resources',            subtitle: 'Tools to accelerate your journey' },
]

function StepContent({ step, blueprint, extractedData }: {
  step: BlueprintStep
  blueprint: Blueprint
  extractedData?: { projects: Blueprint['futurePaths'] extends unknown ? any : never; skills: string[]; timeline: any[] }
}) {
  switch (step) {
    case 'profile':        return <ProfileMap blueprint={blueprint} extractedData={extractedData as any} />
    case 'intelligence':   return <CareerIntelligence blueprint={blueprint} />
    case 'path-selection': return <PathSelection blueprint={blueprint} />
    case 'gap-analysis':   return <GapAnalysis blueprint={blueprint} />
    case 'roadmap':        return <GrowthRoadmap blueprint={blueprint} />
    case 'resources':      return <Resources blueprint={blueprint} />
    default:               return null
  }
}

export function BlueprintScreen() {
  const { state, dispatch } = useWingspan()
  const { blueprint, selectedPath } = state
  const [currentStep, setCurrentStep] = useState<BlueprintStep>('profile')
  const [completedSteps, setCompletedSteps] = useState<BlueprintStep[]>([])

  if (!blueprint) return null

  const currentStepIdx = STEPS.findIndex(s => s.id === currentStep)
  const currentStepMeta = STEPS[currentStepIdx]
  const isLastStep = currentStepIdx === STEPS.length - 1

  // Advance to next step — path-selection requires a path to be selected
  const canAdvance = currentStep !== 'path-selection' || !!selectedPath

  const handleNext = () => {
    if (!canAdvance) return
    setCompletedSteps(prev => prev.includes(currentStep) ? prev : [...prev, currentStep])
    const next = STEPS[currentStepIdx + 1]
    if (next) setCurrentStep(next.id)
  }

  const handleStepClick = (step: BlueprintStep) => {
    setCurrentStep(step)
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* Fixed top bar */}
      <div className="sticky top-0 z-40 bg-[var(--bg)] border-b border-[var(--border-ws)] px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs font-normal tracking-[0.2em] text-[var(--neon)]"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              Future Self Blueprint™
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {currentStepIdx + 1} / {STEPS.length}
            </span>
          </div>
          <StepNav
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-2xl mx-auto">

          {/* Step header */}
          <motion.div
            key={currentStep + '-header'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <h2
              className="text-2xl font-bold text-[var(--text-primary)] mb-1"
              style={{ fontFamily: 'var(--font-sora)' }}
            >
              {currentStepMeta.title}
            </h2>
            <p className="text-sm text-[var(--text-muted)]">{currentStepMeta.subtitle}</p>
          </motion.div>

          {/* Step body */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: 'easeOut' as const }}
            >
              <StepContent
                step={currentStep}
                blueprint={blueprint}
                extractedData={state.extractedData as any}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation footer */}
          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={() => {
                const prev = STEPS[currentStepIdx - 1]
                if (prev) setCurrentStep(prev.id)
              }}
              disabled={currentStepIdx === 0}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] disabled:opacity-0 transition-colors"
            >
              ← {currentStepIdx > 0 ? STEPS[currentStepIdx - 1].title : ''}
            </button>

            {!isLastStep && (
              <button
                onClick={handleNext}
                disabled={!canAdvance}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-sm font-bold transition-all
                  ${canAdvance
                    ? 'bg-[var(--neon)] text-[#0a0a0a]'
                    : 'bg-[var(--surface)] text-[var(--text-dim)] border border-[var(--border-ws)] cursor-not-allowed'
                  }
                `}
              >
                {currentStep === 'path-selection' && !selectedPath
                  ? 'Select a path to continue'
                  : `Continue to ${STEPS[currentStepIdx + 1]?.title} →`
                }
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add `SELECT_PATH` to reducer in `context/WingspanContext.tsx`**

Verify the reducer has the `SELECT_PATH` case added in Task 1. If it's missing, add it now:

```typescript
case 'SELECT_PATH':
  return { ...state, selectedPath: action.path }
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Build check**

```bash
npm run build 2>&1 | tail -15
```

Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add components/screens/BlueprintScreen.tsx context/WingspanContext.tsx
git commit -m "feat: rewrite BlueprintScreen as 6-step wizard with StepNav, path selection gating, and animated transitions"
```

---

## Task 12: Remove Glow Effects, Update Typography

**Files:**
- Modify: All blueprint components — remove `textShadow` glow inline styles
- Modify: `app/globals.css` — add heading font utility

- [ ] **Step 1: Remove glow effects from all blueprint components**

Search for all `textShadow` usages and remove them:

```bash
grep -rn "textShadow\|neon-glow\|box-shadow.*neon" components/blueprint/ components/ui/StepNav.tsx components/ui/StrengthRadar.tsx
```

For each found instance, remove the `style={{ textShadow: ... }}` or `style={{ boxShadow: ... }}` prop entirely. The neon color alone provides sufficient contrast per the spec ("Remove glow effects — neon green already provides enough visual contrast").

Keep: `boxShadow` on the neon CTA button in `ActionsSection.tsx` only — that's a structural shadow, not a decorative glow.
Remove: All `textShadow` on neon text, all `boxShadow` on progress bars, all glow on dots and wordmarks.

- [ ] **Step 2: Add font utilities to `app/globals.css`**

Add after the `@theme inline` block:

```css
.font-sora {
  font-family: var(--font-sora, 'Sora', sans-serif);
}

.font-jakarta {
  font-family: var(--font-jakarta, 'Plus Jakarta Sans', sans-serif);
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: remove glow effects, add font utility classes"
```

---

## Task 13: End-to-End Verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Go through complete 6-step wizard**

Open http://localhost:3000 and run through the full flow:

1. Welcome → click Start Discovery
2. Upload a file, select 3 interests → Begin Analysis
3. Discovery screen completes, arrives at Validation
4. Confirm timeline → View My Blueprint

In Blueprint:
5. Step 1 Profile — verify hero stats (years, industries, skill domains), career summary, industries chips, skills chips, tools chips, project repository cards all visible
6. Click Continue → Step 2 Intelligence — verify radar chart renders, horizontal strength cards scroll, interest cards show market outlook + why it appears + future relevance
7. Click Continue → Step 3 Future Paths — verify 4 path cards with match score, timeline, demand, growth, key areas, "Select This Path" CTA
8. Select a path — verify button changes to "✓ Path Selected", Continue unlocks
9. Click Continue → Step 4 Gap Analysis — verify gaps filtered to selected path, expandable cards with current/desired state
10. Click Continue → Step 5 Roadmap — verify actions filtered to selected path
11. Click Continue → Step 6 Resources — verify resources filtered to selected path

- [ ] **Step 3: Verify fonts loaded**

Open browser DevTools → Elements panel → body element. Confirm `font-family` computed value includes "Plus Jakarta Sans" not "Inter" or system font.

- [ ] **Step 4: Verify no glow effects**

Open DevTools → Elements panel → any neon-colored text. Confirm `text-shadow: none` in computed styles.

- [ ] **Step 5: TypeScript clean**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: Wingspan Blueprint redesign complete — 6-step guided career system"
```

---

## Self-Review Against Spec

| Spec Requirement | Task |
|---|---|
| 6-step IA: Profile → Intelligence → Path Selection → Gap Analysis → Roadmap → Resources | Task 11 |
| Profile: hero stats (years, industries, skill domains — not future paths) | Task 5 |
| Profile: industries chips, skillsets chips, tools section, career summary | Task 5 |
| Profile: project repository (from extractedData.projects) | Task 5 |
| Strength landscape: horizontal scrollable cards, career advantage field | Task 6 |
| Strength landscape: radar overview | Tasks 4 + 6 |
| Interest landscape: whyItAppears, marketOutlook, futureRelevance | Tasks 2 + 6 |
| Future paths separated from intelligence — own step | Task 7 |
| Future path cards: match score, recommendationStatus, timeline, marketDemand, growthPotential, keyTransitionAreas | Tasks 2 + 7 |
| Future paths: single CTA "Select This Path" | Task 7 |
| Gap analysis gated behind path selection | Tasks 8 + 11 |
| Gap analysis: gapType, currentState, desiredState, whyItMatters | Tasks 2 + 8 |
| Roadmap filtered to selected path, gaps → actions → outcomes | Task 9 |
| Resources contextual to selected path and actions | Task 10 |
| Typography: Sora headlines + Plus Jakarta Sans body | Tasks 1 + 12 |
| Remove glow effects | Task 12 |
| StepNav progress indicator | Task 3 |
| SELECT_PATH action + selectedPath state | Task 1 |
