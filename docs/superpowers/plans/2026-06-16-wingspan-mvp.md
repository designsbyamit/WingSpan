# Wingspan MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Wingspan MVP — a 5-screen AI-native career intelligence web app that transforms a resume upload into a Future Self Blueprint™.

**Architecture:** Next.js 15 App Router, single page with screen state machine, two-stage GPT-4o pipeline (extract → blueprint), SSE streaming for the discovery experience, no auth/persistence.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, ShadCN UI, Framer Motion, Lucide Icons, OpenAI SDK (gpt-4o), pdf-parse, pdfjs-dist, mammoth, xlsx.

---

## File Map

| File | Responsibility |
|---|---|
| `types/wingspan.ts` | All shared TypeScript types (Blueprint, Strength, Gap, Action, state shape) |
| `lib/parsers/pdf.ts` | PDF text extraction with Vision fallback |
| `lib/parsers/docx.ts` | DOCX text extraction via mammoth |
| `lib/parsers/xlsx.ts` | XLSX/CSV text extraction via xlsx |
| `lib/parsers/index.ts` | Route file dispatch by extension |
| `lib/openai.ts` | OpenAI client, Stage 1 extract prompt, Stage 2 blueprint prompt |
| `lib/template.ts` | XLSX Project Repository template generator |
| `context/WingspanContext.tsx` | useReducer state machine, useWingspan hook |
| `app/layout.tsx` | Root layout, ThemeProvider, Tailwind dark class |
| `app/page.tsx` | Renders WingspanApp, switches screens by state |
| `app/globals.css` | CSS custom properties (color tokens), base styles |
| `app/api/extract/route.ts` | POST handler: parse files → GPT-4o extract → return ExtractedCareerData |
| `app/api/blueprint/route.ts` | POST handler: SSE stream, GPT-4o blueprint → emit step/observation/complete events |
| `app/api/template/route.ts` | GET handler: return XLSX template download |
| `components/ui/NeonButton.tsx` | Primary neon CTA button with glow |
| `components/ui/GhostButton.tsx` | Ghost/outline button |
| `components/ui/ProgressBar.tsx` | Neon fill progress bar with Framer Motion |
| `components/ui/InsightCard.tsx` | Expandable card: name, confidence %, evidence, progress bar |
| `components/ui/ThemeToggle.tsx` | Light/dark toggle, persists to localStorage |
| `components/screens/WelcomeScreen.tsx` | Screen 1: wordmark, headline, CTA, trust chips |
| `components/screens/FootprintScreen.tsx` | Screen 2: upload, URLs, interests, CTA |
| `components/screens/DiscoveryScreen.tsx` | Screen 3: SSE-driven step list, observations, progress |
| `components/screens/ValidationScreen.tsx` | Screen 4: timeline cards, confidence scores, CTA |
| `components/screens/BlueprintScreen.tsx` | Screen 5: progressive reveal shell + section orchestration |
| `components/blueprint/ProfileMap.tsx` | Blueprint Section 1: identity statement, stats, tags |
| `components/blueprint/CareerIntelligence.tsx` | Blueprint Section 2: strengths, interests, future paths |
| `components/blueprint/GapAnalysis.tsx` | Blueprint Section 3: readiness bars, capabilities, close plan |
| `components/blueprint/ActionsSection.tsx` | Blueprint Section 4: immediate/medium/long-term actions, resources |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json` (via npx)
- Create: `tailwind.config.ts`
- Create: `app/globals.css`
- Create: `.env.local`

- [ ] **Step 1: Scaffold Next.js 15 project**

```bash
cd /Users/I752155/Library/CloudStorage/OneDrive-SAPSE/Work/HolyExperiments/HHE/Projects/Wingspan
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*" --yes
```

Expected: project files created in the Wingspan directory.

- [ ] **Step 2: Install dependencies**

```bash
npm install framer-motion lucide-react openai pdf-parse pdfjs-dist mammoth xlsx
npm install -D @types/pdf-parse
npx shadcn@latest init -d
npx shadcn@latest add button
```

When shadcn asks for config: style=default, base color=neutral, CSS variables=yes.

- [ ] **Step 3: Add CSS custom properties to `app/globals.css`**

Replace the entire file:

```css
@import "tailwindcss";

:root {
  --bg: #141414;
  --surface: #333333;
  --surface-dim: #1a1a1a;
  --border: #404040;
  --border-dim: #363636;
  --text-primary: #f0f0f0;
  --text-secondary: #999999;
  --text-muted: #888888;
  --text-dim: #555555;
  --neon: #a3e635;
  --neon-glow: rgba(163, 230, 53, 0.45);
  --neon-surface: rgba(163, 230, 53, 0.1);
  --neon-border: rgba(163, 230, 53, 0.22);
}

.light {
  --bg: #f7f8ff;
  --surface: #ffffff;
  --surface-dim: #f0f0f8;
  --border: rgba(99, 102, 241, 0.1);
  --border-dim: rgba(99, 102, 241, 0.07);
  --text-primary: #11121e;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --text-dim: #d1d5db;
  --neon: #a3e635;
  --neon-glow: rgba(163, 230, 53, 0.35);
  --neon-surface: rgba(163, 230, 53, 0.08);
  --neon-border: rgba(163, 230, 53, 0.2);
}

* {
  box-sizing: border-box;
}

body {
  background-color: var(--bg);
  color: var(--text-primary);
  font-family: -apple-system, 'Inter', sans-serif;
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

- [ ] **Step 4: Create `.env.local`**

```bash
echo "OPENAI_API_KEY=your-key-here" > .env.local
```

Replace `your-key-here` with the actual key.

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
```

Expected: server running at http://localhost:3000 with no errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 15 project with Tailwind, ShadCN, Framer Motion"
```

---

## Task 2: Shared Types

**Files:**
- Create: `types/wingspan.ts`

- [ ] **Step 1: Create `types/wingspan.ts`**

```typescript
// types/wingspan.ts

export type Screen = 'welcome' | 'footprint' | 'discovering' | 'validating' | 'blueprint'

export interface TimelineEntry {
  id: string
  role: string
  company: string
  startDate: string
  endDate: string
  description?: string
  confirmed: boolean
}

export interface Project {
  id: string
  name: string
  company: string
  year?: string
  industry?: string
  platform?: string
  audience?: string
  summary?: string
  impact?: string
}

export interface ExtractedCareerData {
  timeline: TimelineEntry[]
  projects: Project[]
  skills: string[]
  education: Array<{ institution: string; degree: string; year?: string }>
  rawText: string
}

export interface ValidatedCareerData extends ExtractedCareerData {
  interests: string[]
}

export interface Strength {
  name: string
  confidence: number
  evidence: string
  projectCount: number
  projects: string[]
  rationale: string
}

export interface Interest {
  name: string
  frequency: number
  evidence: string
}

export interface FuturePath {
  title: string
  whyItFits: string
  evidence: string[]
  opportunitySize: 'emerging' | 'growing' | 'established'
  confidence: number
}

export interface Gap {
  pathway: string
  currentReadiness: number
  futureReadiness: number
  requiredCapabilities: string[]
  gapSize: 'small' | 'medium' | 'large'
  timeline: string
  effort: string
  howToClose: string
}

export interface Action {
  title: string
  description: string
  measurable: string
  pathway: string
  priority: 'high' | 'medium' | 'low'
}

export interface Resource {
  type: 'book' | 'course' | 'community' | 'event' | 'article' | 'framework'
  title: string
  url?: string
  pathway: string
}

export interface Blueprint {
  profileMap: {
    identityStatement: string
    yearsOfExperience: number
    industries: string[]
    platforms: string[]
    domains: string[]
    careerEvolution: string
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
  insights: string[]
  rationale: Record<string, string>
}

export type DiscoveryStep =
  | 'parsing'
  | 'structuring'
  | 'timeline'
  | 'strengths'
  | 'paths'
  | 'gaps'
  | 'actions'
  | 'complete'

export interface DiscoveryProgress {
  currentStep: DiscoveryStep | null
  completedSteps: DiscoveryStep[]
  observations: string[]
  percentage: number
}

export interface WingspanState {
  screen: Screen
  files: File[]
  urls: Record<string, string>
  interests: string[]
  extractedData: ExtractedCareerData | null
  discoveryProgress: DiscoveryProgress
  validatedData: ValidatedCareerData | null
  blueprint: Blueprint | null
  error: string | null
}

export type WingspanAction =
  | { type: 'SET_SCREEN'; screen: Screen }
  | { type: 'SET_FILES'; files: File[] }
  | { type: 'SET_URL'; key: string; value: string }
  | { type: 'TOGGLE_INTEREST'; interest: string }
  | { type: 'SET_EXTRACTED_DATA'; data: ExtractedCareerData }
  | { type: 'SET_DISCOVERY_STEP'; step: DiscoveryStep; percentage: number }
  | { type: 'ADD_OBSERVATION'; text: string }
  | { type: 'COMPLETE_STEP'; step: DiscoveryStep }
  | { type: 'SET_VALIDATED_DATA'; data: ValidatedCareerData }
  | { type: 'UPDATE_TIMELINE_ENTRY'; entry: TimelineEntry }
  | { type: 'REMOVE_TIMELINE_ENTRY'; id: string }
  | { type: 'SET_BLUEPRINT'; blueprint: Blueprint }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'CLEAR_ERROR' }
```

- [ ] **Step 2: Commit**

```bash
git add types/wingspan.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: State Machine Context

**Files:**
- Create: `context/WingspanContext.tsx`

- [ ] **Step 1: Create `context/WingspanContext.tsx`**

```typescript
// context/WingspanContext.tsx
'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import {
  WingspanState,
  WingspanAction,
  DiscoveryProgress,
} from '@/types/wingspan'

const initialProgress: DiscoveryProgress = {
  currentStep: null,
  completedSteps: [],
  observations: [],
  percentage: 0,
}

const initialState: WingspanState = {
  screen: 'welcome',
  files: [],
  urls: {},
  interests: [],
  extractedData: null,
  discoveryProgress: initialProgress,
  validatedData: null,
  blueprint: null,
  error: null,
}

function reducer(state: WingspanState, action: WingspanAction): WingspanState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen, error: null }
    case 'SET_FILES':
      return { ...state, files: action.files }
    case 'SET_URL':
      return { ...state, urls: { ...state.urls, [action.key]: action.value } }
    case 'TOGGLE_INTEREST':
      return {
        ...state,
        interests: state.interests.includes(action.interest)
          ? state.interests.filter((i) => i !== action.interest)
          : state.interests.length < 5
          ? [...state.interests, action.interest]
          : state.interests,
      }
    case 'SET_EXTRACTED_DATA':
      return { ...state, extractedData: action.data }
    case 'SET_DISCOVERY_STEP':
      return {
        ...state,
        discoveryProgress: {
          ...state.discoveryProgress,
          currentStep: action.step,
          percentage: action.percentage,
        },
      }
    case 'ADD_OBSERVATION':
      return {
        ...state,
        discoveryProgress: {
          ...state.discoveryProgress,
          observations: [...state.discoveryProgress.observations, action.text],
        },
      }
    case 'COMPLETE_STEP':
      return {
        ...state,
        discoveryProgress: {
          ...state.discoveryProgress,
          completedSteps: [...state.discoveryProgress.completedSteps, action.step],
        },
      }
    case 'SET_VALIDATED_DATA':
      return { ...state, validatedData: action.data }
    case 'UPDATE_TIMELINE_ENTRY':
      return {
        ...state,
        extractedData: state.extractedData
          ? {
              ...state.extractedData,
              timeline: state.extractedData.timeline.map((e) =>
                e.id === action.entry.id ? action.entry : e
              ),
            }
          : state.extractedData,
      }
    case 'REMOVE_TIMELINE_ENTRY':
      return {
        ...state,
        extractedData: state.extractedData
          ? {
              ...state.extractedData,
              timeline: state.extractedData.timeline.filter((e) => e.id !== action.id),
            }
          : state.extractedData,
      }
    case 'SET_BLUEPRINT':
      return { ...state, blueprint: action.blueprint }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

const WingspanContext = createContext<{
  state: WingspanState
  dispatch: React.Dispatch<WingspanAction>
} | null>(null)

export function WingspanProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <WingspanContext.Provider value={{ state, dispatch }}>
      {children}
    </WingspanContext.Provider>
  )
}

export function useWingspan() {
  const ctx = useContext(WingspanContext)
  if (!ctx) throw new Error('useWingspan must be used within WingspanProvider')
  return ctx
}
```

- [ ] **Step 2: Commit**

```bash
git add context/WingspanContext.tsx
git commit -m "feat: add WingspanContext state machine"
```

---

## Task 4: File Parsers

**Files:**
- Create: `lib/parsers/pdf.ts`
- Create: `lib/parsers/docx.ts`
- Create: `lib/parsers/xlsx.ts`
- Create: `lib/parsers/index.ts`

- [ ] **Step 1: Create `lib/parsers/pdf.ts`**

```typescript
// lib/parsers/pdf.ts
import pdfParse from 'pdf-parse'
import OpenAI from 'openai'

const VISION_THRESHOLD = 100

export async function parsePdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer)
  if (data.text.trim().length >= VISION_THRESHOLD) {
    return data.text
  }
  return extractPdfViaVision(buffer)
}

async function extractPdfViaVision(buffer: Buffer): Promise<string> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise
  const pageImages: string[] = []

  for (let i = 1; i <= Math.min(pdf.numPages, 6); i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1.5 })
    const { createCanvas } = await import('canvas')
    const canvas = createCanvas(viewport.width, viewport.height)
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise
    pageImages.push(canvas.toDataURL('image/jpeg', 0.85).split(',')[1])
  }

  const client = new OpenAI()
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract all text content from these resume pages. Return plain text only, preserving structure (job titles, dates, descriptions). No commentary.',
          },
          ...pageImages.map((img) => ({
            type: 'image_url' as const,
            image_url: { url: `data:image/jpeg;base64,${img}` },
          })),
        ],
      },
    ],
    max_tokens: 4096,
  })

  return response.choices[0].message.content ?? ''
}
```

- [ ] **Step 2: Create `lib/parsers/docx.ts`**

```typescript
// lib/parsers/docx.ts
import mammoth from 'mammoth'

export async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}
```

- [ ] **Step 3: Create `lib/parsers/xlsx.ts`**

```typescript
// lib/parsers/xlsx.ts
import * as XLSX from 'xlsx'

export function parseXlsx(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const lines: string[] = []
  for (const sheetName of workbook.SheetNames) {
    lines.push(`--- Sheet: ${sheetName} ---`)
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    lines.push(csv)
  }
  return lines.join('\n')
}
```

- [ ] **Step 4: Create `lib/parsers/index.ts`**

```typescript
// lib/parsers/index.ts
import { parsePdf } from './pdf'
import { parseDocx } from './docx'
import { parseXlsx } from './xlsx'

export async function parseFile(
  buffer: Buffer,
  filename: string
): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf':
      return parsePdf(buffer)
    case 'docx':
      return parseDocx(buffer)
    case 'xlsx':
    case 'csv':
      return parseXlsx(buffer)
    case 'txt':
      return buffer.toString('utf-8')
    default:
      throw new Error(`Unsupported file type: ${ext}`)
  }
}
```

- [ ] **Step 5: Install canvas for PDF vision rendering**

```bash
npm install canvas
```

- [ ] **Step 6: Commit**

```bash
git add lib/parsers/
git commit -m "feat: add file parsers (PDF with vision fallback, DOCX, XLSX)"
```

---

## Task 5: OpenAI Prompts & Client

**Files:**
- Create: `lib/openai.ts`

- [ ] **Step 1: Create `lib/openai.ts`**

```typescript
// lib/openai.ts
import OpenAI from 'openai'
import { ExtractedCareerData, Blueprint, ValidatedCareerData } from '@/types/wingspan'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function extractCareerData(
  rawText: string,
  urls: Record<string, string>
): Promise<ExtractedCareerData> {
  const urlContext = Object.entries(urls)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a career data extraction assistant. Extract structured career information from resume text and return valid JSON matching this schema exactly:
{
  "timeline": [{ "id": "string (uuid)", "role": "string", "company": "string", "startDate": "string (YYYY-MM or Year)", "endDate": "string (YYYY-MM, Year, or Present)", "description": "string", "confirmed": false }],
  "projects": [{ "id": "string (uuid)", "name": "string", "company": "string", "year": "string", "industry": "string", "platform": "string", "audience": "string", "summary": "string", "impact": "string" }],
  "skills": ["string"],
  "education": [{ "institution": "string", "degree": "string", "year": "string" }],
  "rawText": "string (first 2000 chars of input)"
}
Extract as much as possible. Generate UUIDs for ids. Be comprehensive.`,
      },
      {
        role: 'user',
        content: `Resume text:\n${rawText}\n\n${urlContext ? `Profile URLs:\n${urlContext}` : ''}`,
      },
    ],
  })

  const json = JSON.parse(response.choices[0].message.content ?? '{}')
  return { ...json, rawText: rawText.slice(0, 2000) }
}

export const STEP_PERCENTAGES: Record<string, number> = {
  parsing: 10,
  structuring: 20,
  timeline: 35,
  strengths: 50,
  paths: 65,
  gaps: 78,
  actions: 90,
  complete: 100,
}

export async function* streamBlueprint(
  validatedData: ValidatedCareerData
): AsyncGenerator<{ type: string; [key: string]: unknown }> {
  yield { type: 'step', step: 'timeline', label: 'Reconstructing career timeline…', percentage: STEP_PERCENTAGES.timeline }

  const prompt = buildBlueprintPrompt(validatedData)

  const stream = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    stream: false,
    messages: [
      {
        role: 'system',
        content: `You are an expert career intelligence analyst. Generate a deeply personal, evidence-based Future Self Blueprint. Return valid JSON matching this schema exactly:
{
  "profileMap": {
    "identityStatement": "string (1-2 sentences, deeply personal professional narrative)",
    "yearsOfExperience": number,
    "industries": ["string"],
    "platforms": ["string"],
    "domains": ["string"],
    "careerEvolution": "string (2-3 sentence arc narrative)"
  },
  "strengths": [{
    "name": "string",
    "confidence": number (0-100),
    "evidence": "string (1 sentence with specific evidence)",
    "projectCount": number,
    "projects": ["string"],
    "rationale": "string (2-3 sentences of deep reasoning)"
  }],
  "interests": [{
    "name": "string",
    "frequency": number (1-10),
    "evidence": "string"
  }],
  "futurePaths": [{
    "title": "string",
    "whyItFits": "string (2-3 sentences, highly specific)",
    "evidence": ["string"],
    "opportunitySize": "emerging|growing|established",
    "confidence": number (0-100)
  }],
  "gaps": [{
    "pathway": "string (must match a futurePaths title)",
    "currentReadiness": number (0-100),
    "futureReadiness": number (0-100),
    "requiredCapabilities": ["string"],
    "gapSize": "small|medium|large",
    "timeline": "string (e.g. '6-12 months')",
    "effort": "string (e.g. 'High — requires active project work')",
    "howToClose": "string (specific, actionable 2-3 sentences)"
  }],
  "actions": {
    "immediate": [{ "title": "string", "description": "string", "measurable": "string (specific outcome)", "pathway": "string", "priority": "high|medium|low" }],
    "mediumTerm": [{ "title": "string", "description": "string", "measurable": "string", "pathway": "string", "priority": "high|medium|low" }],
    "longTerm": [{ "title": "string", "description": "string", "measurable": "string", "pathway": "string", "priority": "high|medium|low" }],
    "resources": [{ "type": "book|course|community|event|article|framework", "title": "string", "url": "string or null", "pathway": "string" }]
  },
  "confidenceScores": {
    "timeline": number (0-100),
    "projects": number (0-100),
    "strengths": number (0-100),
    "futurePaths": number (0-100)
  },
  "insights": ["string (3-5 surprising, specific observations about patterns)"],
  "rationale": { "key": "value" }
}

Be deeply personal and specific. Reference actual projects and roles from the data. Every insight must have evidence. Make the person feel truly seen.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  yield { type: 'step', step: 'strengths', label: 'Detecting strength patterns…', percentage: STEP_PERCENTAGES.strengths }
  yield { type: 'observation', text: 'Patterns emerging from your career data…' }
  yield { type: 'step', step: 'paths', label: 'Mapping future opportunities…', percentage: STEP_PERCENTAGES.paths }
  yield { type: 'step', step: 'gaps', label: 'Analyzing gaps…', percentage: STEP_PERCENTAGES.gaps }
  yield { type: 'step', step: 'actions', label: 'Generating your Blueprint…', percentage: STEP_PERCENTAGES.actions }

  const blueprint: Blueprint = JSON.parse(stream.choices[0].message.content ?? '{}')

  if (blueprint.insights?.length > 0) {
    yield { type: 'observation', text: blueprint.insights[0] }
  }

  yield { type: 'complete', blueprint, percentage: 100 }
}

function buildBlueprintPrompt(data: ValidatedCareerData): string {
  return `Career Profile:
- Timeline: ${JSON.stringify(data.timeline)}
- Projects: ${JSON.stringify(data.projects)}
- Skills: ${data.skills.join(', ')}
- Education: ${JSON.stringify(data.education)}
- Future Interests: ${data.interests.join(', ')}

Generate a comprehensive, deeply personal Future Self Blueprint for this person. Be specific and reference their actual work. Make every insight feel like it could only have been written for them.`
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/openai.ts
git commit -m "feat: add OpenAI client with extract and streaming blueprint prompts"
```

---

## Task 6: XLSX Template Generator

**Files:**
- Create: `lib/template.ts`

- [ ] **Step 1: Create `lib/template.ts`**

```typescript
// lib/template.ts
import * as XLSX from 'xlsx'

export function generateProjectRepositoryTemplate(): Buffer {
  const wb = XLSX.utils.book_new()

  const projects = XLSX.utils.aoa_to_sheet([
    ['Project Name', 'Company', 'Year', 'Industry', 'Platform', 'Audience', 'Project Summary', 'Impact', 'Project Link'],
    ['Example Project', 'Acme Corp', '2024', 'FinTech', 'Web', 'B2B', 'Redesigned onboarding flow', 'Reduced drop-off by 40%', 'https://'],
  ])
  XLSX.utils.book_append_sheet(wb, projects, 'Projects')

  const contributions = XLSX.utils.aoa_to_sheet([
    ['Project Name', 'Research', 'Stakeholder Interviews', 'Workshops', 'Journey Mapping', 'IA', 'Wireframing', 'Visual Design', 'Prototyping', 'Usability Testing', 'Design Systems', 'Analytics', 'Developer Handoff', 'Leadership'],
    ['Example Project', 'Yes', 'Yes', '', 'Yes', '', 'Yes', 'Yes', 'Yes', '', '', '', 'Yes', ''],
  ])
  XLSX.utils.book_append_sheet(wb, contributions, 'Contributions')

  const skills = XLSX.utils.aoa_to_sheet([
    ['Skill', 'Confidence (1-5)', 'Years of Experience'],
    ['Product Design', '5', '6'],
  ])
  XLSX.utils.book_append_sheet(wb, skills, 'Skills')

  const certs = XLSX.utils.aoa_to_sheet([
    ['Certification', 'Provider', 'Year'],
    ['Google UX Design Certificate', 'Google', '2022'],
  ])
  XLSX.utils.book_append_sheet(wb, certs, 'Certifications')

  const talks = XLSX.utils.aoa_to_sheet([
    ['Type', 'Title', 'Year', 'Link'],
    ['Talk', 'Designing for Complexity', '2023', 'https://'],
  ])
  XLSX.utils.book_append_sheet(wb, talks, 'Talks & Publications')

  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/template.ts
git commit -m "feat: add XLSX project repository template generator"
```

---

## Task 7: API Routes

**Files:**
- Create: `app/api/extract/route.ts`
- Create: `app/api/blueprint/route.ts`
- Create: `app/api/template/route.ts`

- [ ] **Step 1: Create `app/api/extract/route.ts`**

```typescript
// app/api/extract/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { parseFile } from '@/lib/parsers'
import { extractCareerData } from '@/lib/openai'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    const urlsRaw = formData.get('urls') as string | null
    const urls: Record<string, string> = urlsRaw ? JSON.parse(urlsRaw) : {}

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const texts: string[] = []
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const text = await parseFile(buffer, file.name)
      texts.push(text)
    }

    const combinedText = texts.join('\n\n---\n\n')
    const extractedData = await extractCareerData(combinedText, urls)

    return NextResponse.json(extractedData)
  } catch (err) {
    console.error('Extract error:', err)
    return NextResponse.json(
      { error: 'Failed to extract career data' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Create `app/api/blueprint/route.ts`**

```typescript
// app/api/blueprint/route.ts
import { NextRequest } from 'next/server'
import { streamBlueprint } from '@/lib/openai'
import { ValidatedCareerData } from '@/types/wingspan'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const validatedData: ValidatedCareerData = body.validatedData

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of streamBlueprint(validatedData)) {
          const line = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`
          controller.enqueue(encoder.encode(line))
        }
      } catch (err) {
        const errLine = `event: error\ndata: ${JSON.stringify({ error: String(err) })}\n\n`
        controller.enqueue(encoder.encode(errLine))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
```

- [ ] **Step 3: Create `app/api/template/route.ts`**

```typescript
// app/api/template/route.ts
import { NextResponse } from 'next/server'
import { generateProjectRepositoryTemplate } from '@/lib/template'

export async function GET() {
  const buffer = generateProjectRepositoryTemplate()
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="wingspan-project-repository.xlsx"',
    },
  })
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/
git commit -m "feat: add API routes for extract, blueprint SSE, and template download"
```

---

## Task 8: Shared UI Components

**Files:**
- Create: `components/ui/NeonButton.tsx`
- Create: `components/ui/GhostButton.tsx`
- Create: `components/ui/ProgressBar.tsx`
- Create: `components/ui/InsightCard.tsx`
- Create: `components/ui/ThemeToggle.tsx`

- [ ] **Step 1: Create `components/ui/NeonButton.tsx`**

```typescript
// components/ui/NeonButton.tsx
'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface NeonButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  fullWidth?: boolean
  className?: string
}

export function NeonButton({ children, onClick, disabled, fullWidth, className = '' }: NeonButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2
        px-5 py-2.5 rounded-[10px]
        text-sm font-bold tracking-tight
        transition-all duration-200
        ${disabled
          ? 'bg-[#2a2a2a] text-[#555] cursor-not-allowed'
          : 'bg-[var(--neon)] text-[#0a0a0a] cursor-pointer'
        }
        ${!disabled ? 'shadow-[0_0_16px_var(--neon-glow)]' : ''}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </motion.button>
  )
}
```

- [ ] **Step 2: Create `components/ui/GhostButton.tsx`**

```typescript
// components/ui/GhostButton.tsx
'use client'
import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface GhostButtonProps {
  children: ReactNode
  onClick?: () => void
  className?: string
}

export function GhostButton({ children, onClick, className = '' }: GhostButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        inline-flex items-center gap-2
        px-4 py-2 rounded-[8px]
        text-xs font-bold tracking-tight
        bg-[var(--neon-surface)] text-[var(--neon)]
        border border-[var(--neon-border)]
        cursor-pointer transition-all duration-200
        ${className}
      `}
    >
      {children}
    </motion.button>
  )
}
```

- [ ] **Step 3: Create `components/ui/ProgressBar.tsx`**

```typescript
// components/ui/ProgressBar.tsx
'use client'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number // 0-100
  showLabel?: boolean
  label?: string
}

export function ProgressBar({ value, showLabel, label }: ProgressBarProps) {
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-[8px] text-[var(--text-muted)]">{label}</span>
          <span
            className="text-[8px] font-bold text-[var(--neon)]"
            style={{ textShadow: '0 0 8px var(--neon-glow)' }}
          >
            {value}%
          </span>
        </div>
      )}
      <div className="h-[1.5px] rounded-full bg-[var(--border)]">
        <motion.div
          className="h-full rounded-full bg-[var(--neon)]"
          style={{ boxShadow: '0 0 5px var(--neon-glow)' }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `components/ui/InsightCard.tsx`**

```typescript
// components/ui/InsightCard.tsx
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { ProgressBar } from './ProgressBar'

interface InsightCardProps {
  name: string
  confidence: number
  evidence: string
  rationale?: string
  projects?: string[]
  projectCount?: number
}

export function InsightCard({ name, confidence, evidence, rationale, projects, projectCount }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-[10px] bg-[var(--surface)] border border-[var(--border)] p-3">
      <div className="flex justify-between items-start mb-1">
        <span className="text-sm font-semibold text-[var(--text-primary)]">{name}</span>
        <span
          className="text-xs font-bold text-[var(--neon)] tabular-nums"
          style={{ textShadow: '0 0 8px var(--neon-glow)' }}
        >
          {confidence}%
        </span>
      </div>
      <p className="text-xs text-[var(--text-muted)] mb-2">{evidence}</p>
      <ProgressBar value={confidence} />

      {(rationale || projects) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 mt-2 text-xs text-[var(--text-muted)] hover:text-[var(--neon)] transition-colors"
        >
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={12} />
          </motion.span>
          {expanded ? 'Less detail' : 'More detail'}
        </button>
      )}

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {rationale && (
              <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">{rationale}</p>
            )}
            {projects && projects.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {projects.map((p) => (
                  <span
                    key={p}
                    className="text-[10px] px-2 py-0.5 rounded bg-[var(--neon-surface)] text-[var(--neon)] border border-[var(--neon-border)]"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 5: Create `components/ui/ThemeToggle.tsx`**

```typescript
// components/ui/ThemeToggle.tsx
'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { motion } from 'framer-motion'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('wingspan-theme')
    if (stored === 'light') {
      setIsDark(false)
      document.documentElement.classList.add('light')
    }
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.remove('light')
      localStorage.setItem('wingspan-theme', 'dark')
    } else {
      document.documentElement.classList.add('light')
      localStorage.setItem('wingspan-theme', 'light')
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
      aria-label="Toggle theme"
    >
      <motion.div
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ duration: 0.3 }}
      >
        {isDark ? <Moon size={16} /> : <Sun size={16} />}
      </motion.div>
    </button>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/ui/
git commit -m "feat: add shared UI components (NeonButton, GhostButton, ProgressBar, InsightCard, ThemeToggle)"
```

---

## Task 9: Root Layout & App Shell

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/layout.tsx`**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { WingspanProvider } from '@/context/WingspanContext'

export const metadata: Metadata = {
  title: 'Wingspan — Future Self Blueprint',
  description: 'Discover the patterns hidden in your career.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WingspanProvider>{children}</WingspanProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Replace `app/page.tsx`**

```typescript
// app/page.tsx
'use client'
import { useWingspan } from '@/context/WingspanContext'
import { WelcomeScreen } from '@/components/screens/WelcomeScreen'
import { FootprintScreen } from '@/components/screens/FootprintScreen'
import { DiscoveryScreen } from '@/components/screens/DiscoveryScreen'
import { ValidationScreen } from '@/components/screens/ValidationScreen'
import { BlueprintScreen } from '@/components/screens/BlueprintScreen'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { AnimatePresence, motion } from 'framer-motion'

export default function Home() {
  const { state } = useWingspan()

  const screens = {
    welcome: <WelcomeScreen />,
    footprint: <FootprintScreen />,
    discovering: <DiscoveryScreen />,
    validating: <ValidationScreen />,
    blueprint: <BlueprintScreen />,
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={state.screen}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {screens[state.screen]}
        </motion.div>
      </AnimatePresence>
    </main>
  )
}
```

- [ ] **Step 3: Verify the app loads at http://localhost:3000 without errors**

```bash
npm run dev
```

Expected: app loads, dark background visible (WelcomeScreen will be empty until Task 10).

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "feat: add root layout, app shell with screen state machine"
```

---

## Task 10: Screen 1 — Welcome

**Files:**
- Create: `components/screens/WelcomeScreen.tsx`

- [ ] **Step 1: Create `components/screens/WelcomeScreen.tsx`**

```typescript
// components/screens/WelcomeScreen.tsx
'use client'
import { motion } from 'framer-motion'
import { useWingspan } from '@/context/WingspanContext'
import { NeonButton } from '@/components/ui/NeonButton'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

export function WelcomeScreen() {
  const { dispatch } = useWingspan()

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6">
      {/* Neon radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 40%, rgba(163,230,53,0.04) 0%, transparent 70%)',
        }}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-xl w-full text-center flex flex-col items-center gap-5"
      >
        {/* Wordmark */}
        <motion.div variants={item}>
          <span
            className="text-xs font-normal tracking-[0.2em] text-[var(--neon)]"
            style={{ textShadow: '0 0 16px var(--neon-glow)' }}
          >
            Wingspan
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={item}
          className="text-4xl md:text-5xl font-light leading-tight tracking-tight text-[var(--text-primary)]"
        >
          Discover the patterns<br />
          <strong className="font-bold text-white">hidden in your career.</strong>
        </motion.h1>

        {/* Body */}
        <motion.p
          variants={item}
          className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-sm"
        >
          Transform your professional footprint into a personalized Future Self Blueprint™ powered by AI.
        </motion.p>

        {/* CTA */}
        <motion.div variants={item}>
          <NeonButton onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'footprint' })}>
            Start Discovery →
          </NeonButton>
        </motion.div>

        {/* Trust chips */}
        <motion.div variants={item} className="flex gap-2 flex-wrap justify-center">
          {['AI-powered', 'Single session', 'No signup'].map((chip) => (
            <span
              key={chip}
              className="text-xs px-3 py-1 rounded-md bg-[#222] text-[#888] border border-[var(--border)]"
            >
              {chip}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Verify Welcome screen renders correctly at http://localhost:3000**

Check: wordmark in neon green, headline fades up, CTA button neon with glow, trust chips grey.

- [ ] **Step 3: Commit**

```bash
git add components/screens/WelcomeScreen.tsx
git commit -m "feat: add Welcome screen with Framer Motion entrance animation"
```

---

## Task 11: Screen 2 — Footprint Collection

**Files:**
- Create: `components/screens/FootprintScreen.tsx`

- [ ] **Step 1: Create `components/screens/FootprintScreen.tsx`**

```typescript
// components/screens/FootprintScreen.tsx
'use client'
import { useCallback, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Download, ChevronDown, ChevronUp, X } from 'lucide-react'
import { useWingspan } from '@/context/WingspanContext'
import { NeonButton } from '@/components/ui/NeonButton'
import { GhostButton } from '@/components/ui/GhostButton'

const INTERESTS = [
  'AI', 'Design Leadership', 'Product Strategy', 'Entrepreneurship',
  'Design Systems', 'Research', 'Community Building', 'Education',
  'Sustainability', 'Innovation', 'Emerging Technology', 'Management',
  'Writing', 'Public Speaking',
]

const URL_FIELDS = [
  { key: 'linkedin', label: 'LinkedIn URL' },
  { key: 'github', label: 'GitHub URL' },
  { key: 'portfolio', label: 'Portfolio URL' },
  { key: 'behance', label: 'Behance URL' },
  { key: 'dribbble', label: 'Dribbble URL' },
  { key: 'medium', label: 'Medium URL' },
]

export function FootprintScreen() {
  const { state, dispatch } = useWingspan()
  const [dragOver, setDragOver] = useState(false)
  const [showExtraFiles, setShowExtraFiles] = useState(false)
  const [loading, setLoading] = useState(false)

  const primaryFile = state.files[0]
  const canProceed = primaryFile && state.interests.length >= 3

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      dispatch({ type: 'SET_FILES', files: [files[0], ...state.files.slice(1)] })
    }
  }, [dispatch, state.files])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, replace = false) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    if (replace) {
      dispatch({ type: 'SET_FILES', files: [files[0], ...state.files.slice(1)] })
    } else {
      dispatch({ type: 'SET_FILES', files: [...state.files, ...files] })
    }
  }

  const handleBeginAnalysis = async () => {
    if (!canProceed) return
    setLoading(true)
    dispatch({ type: 'SET_SCREEN', screen: 'discovering' })

    try {
      const formData = new FormData()
      for (const file of state.files) {
        formData.append('files', file)
      }
      formData.append('urls', JSON.stringify(state.urls))

      const res = await fetch('/api/extract', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Extraction failed')
      const data = await res.json()
      dispatch({ type: 'SET_EXTRACTED_DATA', data })
    } catch (err) {
      dispatch({ type: 'SET_ERROR', error: String(err) })
      dispatch({ type: 'SET_SCREEN', screen: 'footprint' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-xl w-full flex flex-col gap-6">
        <div>
          <span className="text-xs font-normal tracking-[0.2em] text-[var(--neon)]" style={{ textShadow: '0 0 12px var(--neon-glow)' }}>
            Wingspan
          </span>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-2 leading-tight">
            Your professional footprint
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Upload your resume to begin.
          </p>
        </div>

        {/* Primary upload */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          className={`
            border-[1.5px] border-dashed rounded-[10px] p-6 text-center transition-all
            ${dragOver ? 'border-[var(--neon)] bg-[var(--neon-surface)]' : 'border-[var(--border)] bg-[#1e1e1e]'}
          `}
        >
          {primaryFile ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--text-secondary)]">{primaryFile.name}</span>
              <button
                onClick={() => dispatch({ type: 'SET_FILES', files: state.files.slice(1) })}
                className="text-[var(--text-muted)] hover:text-[var(--neon)] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <label className="cursor-pointer flex flex-col items-center gap-2">
              <Upload size={20} className="text-[var(--text-muted)]" />
              <span className="text-sm font-bold text-[var(--neon)]">Upload Resume</span>
              <span className="text-xs text-[var(--text-muted)]">PDF · DOCX · XLSX · TXT · Drag & drop</span>
              <input
                type="file"
                accept=".pdf,.docx,.xlsx,.csv,.txt"
                className="hidden"
                onChange={(e) => handleFileInput(e, true)}
              />
            </label>
          )}
        </div>

        {/* Template download */}
        <a href="/api/template" download>
          <GhostButton>
            <Download size={12} />
            Download Project Repository Template
          </GhostButton>
        </a>

        {/* Optional URLs */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">
            Optional links
          </span>
          <div className="grid grid-cols-1 gap-2">
            {URL_FIELDS.map(({ key, label }) => (
              <input
                key={key}
                type="url"
                placeholder={label}
                value={state.urls[key] ?? ''}
                onChange={(e) => dispatch({ type: 'SET_URL', key, value: e.target.value })}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-[6px] px-3 py-2 text-xs text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon)] transition-colors"
              />
            ))}
          </div>
        </div>

        {/* Additional files */}
        <div>
          <button
            onClick={() => setShowExtraFiles(!showExtraFiles)}
            className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            {showExtraFiles ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Add more files (case studies, reports, templates…)
          </button>
          {showExtraFiles && (
            <motion.label
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 flex items-center gap-2 text-xs text-[var(--neon)] cursor-pointer"
            >
              <Upload size={12} />
              Choose additional files
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.xlsx,.csv,.txt,.pptx"
                className="hidden"
                onChange={(e) => handleFileInput(e, false)}
              />
            </motion.label>
          )}
          {state.files.slice(1).map((f) => (
            <div key={f.name} className="flex items-center justify-between mt-1">
              <span className="text-xs text-[var(--text-muted)]">{f.name}</span>
            </div>
          ))}
        </div>

        {/* Interests */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">
            What excites you next? <span className="text-[var(--text-dim)]">(pick 3–5)</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => {
              const selected = state.interests.includes(interest)
              return (
                <motion.button
                  key={interest}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  onClick={() => dispatch({ type: 'TOGGLE_INTEREST', interest })}
                  className={`
                    text-xs font-medium px-3 py-1.5 rounded-[6px] border transition-all
                    ${selected
                      ? 'bg-[var(--neon-surface)] text-[var(--neon)] border-[var(--neon-border)]'
                      : 'bg-[#222] text-[#888] border-[var(--border)] hover:border-[var(--text-muted)]'
                    }
                  `}
                >
                  {selected ? `${interest} ✓` : interest}
                </motion.button>
              )
            })}
          </div>
        </div>

        <NeonButton
          onClick={handleBeginAnalysis}
          disabled={!canProceed || loading}
          fullWidth
        >
          {loading ? 'Starting analysis…' : 'Begin Analysis →'}
        </NeonButton>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify Screen 2 manually at http://localhost:3000**

Click "Start Discovery →" on Welcome. Check: upload zone, URL inputs, interest chips (neon when selected), CTA disabled until resume + 3 interests.

- [ ] **Step 3: Commit**

```bash
git add components/screens/FootprintScreen.tsx
git commit -m "feat: add Footprint Collection screen with upload, URLs, interests"
```

---

## Task 12: Screen 3 — AI Discovery

**Files:**
- Create: `components/screens/DiscoveryScreen.tsx`

- [ ] **Step 1: Create `components/screens/DiscoveryScreen.tsx`**

```typescript
// components/screens/DiscoveryScreen.tsx
'use client'
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWingspan } from '@/context/WingspanContext'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { DiscoveryStep } from '@/types/wingspan'

const STEPS: { id: DiscoveryStep; label: string }[] = [
  { id: 'parsing', label: 'Parsing your resume' },
  { id: 'structuring', label: 'Structuring career data' },
  { id: 'timeline', label: 'Reconstructing career timeline' },
  { id: 'strengths', label: 'Detecting strength patterns' },
  { id: 'paths', label: 'Mapping future opportunities' },
  { id: 'gaps', label: 'Analyzing gaps' },
  { id: 'actions', label: 'Generating your Blueprint' },
]

export function DiscoveryScreen() {
  const { state, dispatch } = useWingspan()
  const { discoveryProgress, extractedData } = state
  const sseStarted = useRef(false)

  useEffect(() => {
    if (!extractedData || sseStarted.current) return
    sseStarted.current = true

    dispatch({ type: 'SET_DISCOVERY_STEP', step: 'parsing', percentage: 10 })
    dispatch({ type: 'COMPLETE_STEP', step: 'parsing' })
    dispatch({ type: 'SET_DISCOVERY_STEP', step: 'structuring', percentage: 20 })
    dispatch({ type: 'COMPLETE_STEP', step: 'structuring' })

    const validatedData = {
      ...extractedData,
      interests: state.interests,
    }

    const eventSource = new EventSource('/api/blueprint-sse')

    fetch('/api/blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validatedData }),
    }).then(async (res) => {
      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const chunk of lines) {
          const eventMatch = chunk.match(/^event: (\w+)\ndata: (.+)$/s)
          if (!eventMatch) continue
          const [, eventType, dataStr] = eventMatch
          const data = JSON.parse(dataStr)

          if (eventType === 'step') {
            dispatch({ type: 'SET_DISCOVERY_STEP', step: data.step, percentage: data.percentage })
            if (data.step !== discoveryProgress.currentStep) {
              if (discoveryProgress.currentStep) {
                dispatch({ type: 'COMPLETE_STEP', step: discoveryProgress.currentStep })
              }
            }
          } else if (eventType === 'observation') {
            dispatch({ type: 'ADD_OBSERVATION', text: data.text })
          } else if (eventType === 'complete') {
            dispatch({ type: 'SET_BLUEPRINT', blueprint: data.blueprint })
            dispatch({ type: 'SET_VALIDATED_DATA', data: validatedData })
            setTimeout(() => dispatch({ type: 'SET_SCREEN', screen: 'validating' }), 800)
          } else if (eventType === 'error') {
            dispatch({ type: 'SET_ERROR', error: data.error })
            dispatch({ type: 'SET_SCREEN', screen: 'footprint' })
          }
        }
      }
    })

    return () => eventSource.close()
  }, [extractedData])

  const stepStatus = (stepId: DiscoveryStep) => {
    if (discoveryProgress.completedSteps.includes(stepId)) return 'done'
    if (discoveryProgress.currentStep === stepId) return 'active'
    return 'idle'
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full flex flex-col gap-6">
        <div>
          <span className="text-xs font-normal tracking-[0.2em] text-[var(--neon)]" style={{ textShadow: '0 0 12px var(--neon-glow)' }}>
            Wingspan
          </span>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mt-2">
            Building your Blueprint…
          </h2>
        </div>

        {/* Step list */}
        <div className="flex flex-col gap-3">
          {STEPS.map(({ id, label }) => {
            const status = stepStatus(id)
            return (
              <div key={id} className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  {status === 'done' && (
                    <div className="w-2 h-2 rounded-full bg-[var(--neon)]" style={{ boxShadow: '0 0 5px var(--neon-glow)' }} />
                  )}
                  {status === 'active' && (
                    <motion.div
                      className="w-2 h-2 rounded-full bg-[var(--neon)]"
                      animate={{ opacity: [1, 0.4, 1], boxShadow: ['0 0 5px var(--neon-glow)', '0 0 12px var(--neon-glow)', '0 0 5px var(--neon-glow)'] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                  )}
                  {status === 'idle' && (
                    <div className="w-2 h-2 rounded-full bg-[var(--border)]" />
                  )}
                </div>
                <span className={`text-sm ${
                  status === 'done' ? 'text-[#606050]' :
                  status === 'active' ? 'text-[var(--neon)] font-semibold' :
                  'text-[#505050]'
                }`}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>

        {/* Observation cards */}
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {discoveryProgress.observations.map((obs, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="rounded-[8px] bg-[#1e1e18] border-l-2 border-[var(--neon)] border border-[#3a3e20] px-3 py-2"
                style={{ borderLeft: '2px solid var(--neon)' }}
              >
                <p className="text-xs italic text-[#7a8840] leading-relaxed">"{obs}"</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <ProgressBar value={discoveryProgress.percentage} showLabel label="Analysis progress" />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/screens/DiscoveryScreen.tsx
git commit -m "feat: add Discovery screen with SSE-driven step list and observations"
```

---

## Task 13: Screen 4 — Validation

**Files:**
- Create: `components/screens/ValidationScreen.tsx`

- [ ] **Step 1: Create `components/screens/ValidationScreen.tsx`**

```typescript
// components/screens/ValidationScreen.tsx
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Pencil, X, Download } from 'lucide-react'
import { useWingspan } from '@/context/WingspanContext'
import { NeonButton } from '@/components/ui/NeonButton'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { TimelineEntry } from '@/types/wingspan'

export function ValidationScreen() {
  const { state, dispatch } = useWingspan()
  const { extractedData, blueprint } = state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<TimelineEntry>>({})

  const scores = blueprint?.confidenceScores
  const lowConfidence = scores && Object.values(scores).some((s) => s < 80)

  const startEdit = (entry: TimelineEntry) => {
    setEditingId(entry.id)
    setEditDraft({ role: entry.role, company: entry.company, startDate: entry.startDate, endDate: entry.endDate })
  }

  const saveEdit = (entry: TimelineEntry) => {
    dispatch({ type: 'UPDATE_TIMELINE_ENTRY', entry: { ...entry, ...editDraft, confirmed: true } })
    setEditingId(null)
  }

  const confirmEntry = (entry: TimelineEntry) => {
    dispatch({ type: 'UPDATE_TIMELINE_ENTRY', entry: { ...entry, confirmed: true } })
  }

  const handleProceed = () => {
    if (!extractedData) return
    dispatch({
      type: 'SET_VALIDATED_DATA',
      data: { ...extractedData, interests: state.interests },
    })
    dispatch({ type: 'SET_SCREEN', screen: 'blueprint' })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-xl w-full flex flex-col gap-6">
        <div>
          <span className="text-xs font-normal tracking-[0.2em] text-[var(--neon)]" style={{ textShadow: '0 0 12px var(--neon-glow)' }}>
            Wingspan
          </span>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-2">Does this look right?</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Confirm or correct before we finalize your Blueprint.</p>
        </div>

        {/* Timeline */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Career Timeline</span>
          {(extractedData?.timeline ?? []).map((entry) => (
            <motion.div
              key={entry.id}
              layout
              className="rounded-[10px] bg-[var(--surface)] border border-[var(--border)] p-3"
            >
              {editingId === entry.id ? (
                <div className="flex flex-col gap-2">
                  <input
                    className="bg-[#2a2a2a] border border-[var(--border)] rounded px-2 py-1 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--neon)]"
                    value={editDraft.role ?? ''}
                    onChange={(e) => setEditDraft({ ...editDraft, role: e.target.value })}
                    placeholder="Role"
                  />
                  <input
                    className="bg-[#2a2a2a] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-secondary)] focus:outline-none focus:border-[var(--neon)]"
                    value={editDraft.company ?? ''}
                    onChange={(e) => setEditDraft({ ...editDraft, company: e.target.value })}
                    placeholder="Company"
                  />
                  <div className="flex gap-2">
                    <input
                      className="bg-[#2a2a2a] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon)] flex-1"
                      value={editDraft.startDate ?? ''}
                      onChange={(e) => setEditDraft({ ...editDraft, startDate: e.target.value })}
                      placeholder="Start"
                    />
                    <input
                      className="bg-[#2a2a2a] border border-[var(--border)] rounded px-2 py-1 text-xs text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon)] flex-1"
                      value={editDraft.endDate ?? ''}
                      onChange={(e) => setEditDraft({ ...editDraft, endDate: e.target.value })}
                      placeholder="End"
                    />
                  </div>
                  <button
                    onClick={() => saveEdit(entry)}
                    className="text-xs text-[var(--neon)] font-semibold self-start"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-[#e0e0e0]">{entry.role} · {entry.company}</p>
                    <p className="text-xs text-[var(--text-muted)]">{entry.startDate} – {entry.endDate}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => confirmEntry(entry)} aria-label="Confirm">
                      <Check size={14} className={entry.confirmed ? 'text-[var(--neon)]' : 'text-[var(--text-muted)] hover:text-[var(--neon)]'} style={entry.confirmed ? { filter: 'drop-shadow(0 0 4px var(--neon-glow))' } : {}} />
                    </button>
                    <button onClick={() => startEdit(entry)} aria-label="Edit">
                      <Pencil size={13} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]" />
                    </button>
                    <button onClick={() => dispatch({ type: 'REMOVE_TIMELINE_ENTRY', id: entry.id })} aria-label="Remove">
                      <X size={13} className="text-[var(--text-muted)] hover:text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Confidence scores */}
        {scores && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Analysis Confidence</span>
            {[
              { label: 'Career Timeline', value: scores.timeline },
              { label: 'Strength Analysis', value: scores.strengths },
              { label: 'Future Opportunities', value: scores.futurePaths },
            ].map(({ label, value }) => (
              <ProgressBar key={label} label={label} value={value} showLabel />
            ))}
          </div>
        )}

        {/* Low confidence tip */}
        {lowConfidence && (
          <div className="rounded-[10px] bg-[var(--surface)] border border-[var(--border)] p-3 flex items-start gap-3">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Uploading a Project Repository Template can improve analysis accuracy.{' '}
              <a href="/api/template" download className="text-[var(--neon)] font-semibold">
                Download template →
              </a>
            </p>
          </div>
        )}

        <NeonButton onClick={handleProceed} fullWidth>
          View My Blueprint →
        </NeonButton>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/screens/ValidationScreen.tsx
git commit -m "feat: add Validation screen with inline timeline editing and confidence scores"
```

---

## Task 14: Blueprint Sections

**Files:**
- Create: `components/blueprint/ProfileMap.tsx`
- Create: `components/blueprint/CareerIntelligence.tsx`
- Create: `components/blueprint/GapAnalysis.tsx`
- Create: `components/blueprint/ActionsSection.tsx`

- [ ] **Step 1: Create `components/blueprint/ProfileMap.tsx`**

```typescript
// components/blueprint/ProfileMap.tsx
import { Blueprint } from '@/types/wingspan'

export function ProfileMap({ blueprint }: { blueprint: Blueprint }) {
  const { profileMap } = blueprint
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed italic">
        "{profileMap.identityStatement}"
      </p>
      <div className="flex flex-wrap gap-2">
        {[...profileMap.industries, ...profileMap.platforms, ...profileMap.domains].map((tag) => (
          <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]">
            {tag}
          </span>
        ))}
      </div>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        {profileMap.careerEvolution}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/blueprint/CareerIntelligence.tsx`**

```typescript
// components/blueprint/CareerIntelligence.tsx
import { Blueprint } from '@/types/wingspan'
import { InsightCard } from '@/components/ui/InsightCard'
import { GhostButton } from '@/components/ui/GhostButton'

export function CareerIntelligence({ blueprint }: { blueprint: Blueprint }) {
  const { strengths, interests, futurePaths } = blueprint

  const sizeCls = (freq: number) =>
    freq >= 8 ? 'text-base' : freq >= 5 ? 'text-sm' : 'text-xs'

  return (
    <div className="flex flex-col gap-8">
      {/* Strengths */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Strength Landscape</h3>
        {strengths.map((s) => (
          <InsightCard
            key={s.name}
            name={s.name}
            confidence={s.confidence}
            evidence={s.evidence}
            rationale={s.rationale}
            projects={s.projects}
            projectCount={s.projectCount}
          />
        ))}
      </div>

      {/* Interests */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Interest Landscape</h3>
        <div className="flex flex-wrap gap-2">
          {interests.map((i) => (
            <span
              key={i.name}
              title={i.evidence}
              className={`${sizeCls(i.frequency)} font-medium px-3 py-1.5 rounded-[8px] bg-[var(--neon-surface)] text-[var(--neon)] border border-[var(--neon-border)] cursor-default`}
            >
              {i.name}
            </span>
          ))}
        </div>
      </div>

      {/* Future Paths */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Future Paths</h3>
        {futurePaths.map((path) => (
          <div key={path.title} className="rounded-[10px] bg-[var(--surface)] border border-[var(--border)] p-4 flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <h4 className="text-sm font-semibold text-[var(--text-primary)]">{path.title}</h4>
              <span className="text-xs font-bold text-[var(--neon)] tabular-nums" style={{ textShadow: '0 0 8px var(--neon-glow)' }}>
                {path.confidence}%
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{path.whyItFits}</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--neon-surface)] text-[var(--neon)] border border-[var(--neon-border)] capitalize">
                {path.opportunitySize}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/blueprint/GapAnalysis.tsx`**

```typescript
// components/blueprint/GapAnalysis.tsx
import { Blueprint } from '@/types/wingspan'
import { ProgressBar } from '@/components/ui/ProgressBar'

export function GapAnalysis({ blueprint }: { blueprint: Blueprint }) {
  const { gaps } = blueprint

  const gapColor = (size: 'small' | 'medium' | 'large') =>
    size === 'small' ? 'text-[var(--neon)]' : size === 'medium' ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="flex flex-col gap-6">
      {gaps.map((gap) => (
        <div key={gap.pathway} className="rounded-[10px] bg-[var(--surface)] border border-[var(--border)] p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">{gap.pathway}</h4>
            <span className={`text-xs font-bold capitalize ${gapColor(gap.gapSize)}`}>
              {gap.gapSize} gap
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <ProgressBar value={gap.currentReadiness} label="Current readiness" showLabel />
            <ProgressBar value={gap.futureReadiness} label="Required readiness" showLabel />
          </div>
          <div className="flex gap-4 text-xs text-[var(--text-muted)]">
            <span>Timeline: <span className="text-[var(--text-secondary)]">{gap.timeline}</span></span>
            <span>Effort: <span className="text-[var(--text-secondary)]">{gap.effort}</span></span>
          </div>
          <div className="flex flex-wrap gap-1">
            {gap.requiredCapabilities.map((cap) => (
              <span key={cap} className="text-[10px] px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]">
                {cap}
              </span>
            ))}
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{gap.howToClose}</p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Create `components/blueprint/ActionsSection.tsx`**

```typescript
// components/blueprint/ActionsSection.tsx
import { Blueprint, Action, Resource } from '@/types/wingspan'
import { ExternalLink } from 'lucide-react'

function ActionGroup({ title, actions }: { title: string; actions: Action[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">{title}</h3>
      {actions.map((action) => (
        <div key={action.title} className="rounded-[10px] bg-[var(--surface)] border border-[var(--border)] p-3 flex flex-col gap-1">
          <div className="flex justify-between items-start">
            <span className="text-sm font-semibold text-[var(--text-primary)]">{action.title}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
              action.priority === 'high'
                ? 'bg-[var(--neon-surface)] text-[var(--neon)] border border-[var(--neon-border)]'
                : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]'
            }`}>
              {action.priority}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{action.description}</p>
          <p className="text-xs text-[var(--text-muted)] italic">Outcome: {action.measurable}</p>
        </div>
      ))}
    </div>
  )
}

export function ActionsSection({ blueprint }: { blueprint: Blueprint }) {
  const { actions } = blueprint

  return (
    <div className="flex flex-col gap-8">
      <ActionGroup title="Immediate Actions" actions={actions.immediate} />
      <ActionGroup title="Medium-Term Actions" actions={actions.mediumTerm} />
      <ActionGroup title="Long-Term Actions" actions={actions.longTerm} />

      {actions.resources.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-bold tracking-[2px] uppercase text-[var(--text-muted)]">Resources</h3>
          {actions.resources.map((resource) => (
            <div key={resource.title} className="rounded-[10px] bg-[var(--surface)] border border-[var(--border)] p-3 flex justify-between items-center">
              <div>
                <span className="text-xs text-[#888] capitalize">{resource.type} · </span>
                <span className="text-sm text-[var(--text-primary)]">{resource.title}</span>
              </div>
              {resource.url && (
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-[var(--neon)] hover:opacity-80">
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add components/blueprint/
git commit -m "feat: add Blueprint section components (ProfileMap, CareerIntelligence, GapAnalysis, ActionsSection)"
```

---

## Task 15: Screen 5 — Blueprint (Progressive Reveal)

**Files:**
- Create: `components/screens/BlueprintScreen.tsx`

- [ ] **Step 1: Create `components/screens/BlueprintScreen.tsx`**

```typescript
// components/screens/BlueprintScreen.tsx
'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWingspan } from '@/context/WingspanContext'
import { GhostButton } from '@/components/ui/GhostButton'
import { ProfileMap } from '@/components/blueprint/ProfileMap'
import { CareerIntelligence } from '@/components/blueprint/CareerIntelligence'
import { GapAnalysis } from '@/components/blueprint/GapAnalysis'
import { ActionsSection } from '@/components/blueprint/ActionsSection'
import { Blueprint } from '@/types/wingspan'

const SECTIONS = [
  { id: 'profile', title: 'Profile Map', next: 'Career Intelligence' },
  { id: 'intelligence', title: 'Career Intelligence', next: 'Gap Analysis' },
  { id: 'gaps', title: 'Gap Analysis', next: 'Actions' },
  { id: 'actions', title: 'Actions', next: null },
]

function SectionContent({ id, blueprint }: { id: string; blueprint: Blueprint }) {
  switch (id) {
    case 'profile': return <ProfileMap blueprint={blueprint} />
    case 'intelligence': return <CareerIntelligence blueprint={blueprint} />
    case 'gaps': return <GapAnalysis blueprint={blueprint} />
    case 'actions': return <ActionsSection blueprint={blueprint} />
    default: return null
  }
}

export function BlueprintScreen() {
  const { state } = useWingspan()
  const { blueprint } = state
  const [revealedCount, setRevealedCount] = useState(1)

  if (!blueprint) return null

  const { profileMap, confidenceScores } = blueprint

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="max-w-xl w-full flex flex-col gap-6">
        {/* Header */}
        <div>
          <span className="text-xs font-normal tracking-[0.2em] text-[var(--neon)]" style={{ textShadow: '0 0 12px var(--neon-glow)' }}>
            Future Self Blueprint™
          </span>
          <p className="text-sm text-[var(--text-secondary)] mt-3 leading-relaxed">
            {profileMap.identityStatement}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: profileMap.yearsOfExperience, label: 'yrs experience' },
            { value: profileMap.industries.length, label: 'industries' },
            { value: blueprint.futurePaths.length, label: 'future paths' },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-[10px] bg-[var(--surface)] border border-[var(--border)] p-3 text-center">
              <div className="text-2xl font-bold text-[var(--neon)]" style={{ textShadow: '0 0 8px var(--neon-glow)' }}>
                {value}
              </div>
              <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Progressive sections */}
        {SECTIONS.map((section, idx) => {
          const isRevealed = idx < revealedCount
          const isLocked = idx >= revealedCount

          return (
            <div key={section.id}>
              {isLocked ? (
                <div
                  className="rounded-[10px] border border-dashed border-[var(--border-dim)] p-4 opacity-50"
                  style={{ background: 'var(--surface-dim)' }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[var(--text-dim)]">{section.title}</span>
                    <span className="text-[10px] font-bold tracking-[1.5px] text-[var(--text-dim)]">LOCKED</span>
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="rounded-[10px] bg-[var(--surface)] border border-[var(--border)] p-4 flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-[var(--text-primary)]">{section.title}</span>
                      <span className="text-[10px] font-bold tracking-[1.5px] text-[var(--neon)]">
                        {idx === revealedCount - 1 && revealedCount < SECTIONS.length ? 'REVEALED' : 'REVEALED'}
                      </span>
                    </div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                    >
                      <SectionContent id={section.id} blueprint={blueprint} />
                    </motion.div>

                    {section.next && idx === revealedCount - 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                      >
                        <GhostButton onClick={() => setRevealedCount(revealedCount + 1)}>
                          Continue to {section.next} →
                        </GhostButton>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/screens/BlueprintScreen.tsx
git commit -m "feat: add Blueprint screen with progressive section reveal"
```

---

## Task 16: End-to-End Verification

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Run through the full happy path**

1. Open http://localhost:3000 — Welcome screen loads, animations fire
2. Click "Start Discovery →" — navigates to Footprint screen
3. Upload a real PDF resume
4. Select 3+ interests
5. Click "Begin Analysis →" — navigates to Discovery screen, extraction starts
6. Watch steps animate through as pipeline runs (~30s total)
7. Observe observation cards appear
8. Arrives at Validation screen — timeline cards show, confidence bars render
9. Edit one entry (pencil icon), save it, confirm another (✓)
10. Click "View My Blueprint →"
11. Blueprint screen: stats load, "Profile Map" section visible, locked sections dim
12. Click "Continue to Career Intelligence →" — section animates in
13. Continue through all 4 sections

- [ ] **Step 3: Test light mode**

Click the moon/sun icon top-right. All text remains readable. Neon green persists.

- [ ] **Step 4: Test template download**

Click "Download Project Repository Template →" on Footprint screen. Verify a valid .xlsx file downloads and opens with 5 sheets.

- [ ] **Step 5: Test PDF vision fallback with an image-based PDF**

Upload a PDF created from an image (no selectable text). Verify extraction still returns career data via the vision path.

- [ ] **Step 6: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: Wingspan MVP complete — 5-screen AI career intelligence app"
```

---

## Self-Review Against Spec

**Spec coverage check:**

| Spec Requirement | Covered By |
|---|---|
| 5-screen single-session experience | Tasks 9–15 |
| Resume upload + PDF vision fallback | Task 4 |
| DOCX, XLSX, CSV, TXT parsing | Task 4 |
| Interest chip selector (3–5) | Task 11 |
| Two-stage AI pipeline | Tasks 5, 7 |
| SSE streaming discovery | Tasks 5, 7, 12 |
| Discovery step list + observations | Task 12 |
| Career timeline validation + inline edit | Task 13 |
| Confidence scores with suggestion | Task 13 |
| Blueprint: Profile Map | Task 14 |
| Blueprint: Career Intelligence (Strengths, Interests, Paths) | Task 14 |
| Blueprint: Gap Analysis | Task 14 |
| Blueprint: Actions + Resources | Task 14 |
| Progressive section reveal | Task 15 |
| Light/dark mode toggle | Tasks 1, 8 |
| XLSX template download | Tasks 6, 7 |
| Neon green `#a3e635` accent | Task 1 (CSS tokens) |
| Framer Motion animations | Tasks 10–15 |
| Grey-only structural elements | All screen tasks |
| Wordmark: Regular weight, not all-caps | Tasks 10–15 |
| No auth, no DB, no persistence | Architecture (no such tasks) |
