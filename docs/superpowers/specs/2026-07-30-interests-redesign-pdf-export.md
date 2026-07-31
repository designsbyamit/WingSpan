# Wingspan: Interests Redesign & PDF Export Fix
**Date:** 2026-07-30
**Status:** Approved for implementation

---

## 1. Interests Step Redesign

### Problem
The current interests step in `FootprintScreen.tsx` shows 14 hardcoded tags that are skewed toward senior/expert roles (Leadership, Entrepreneurship, Management). They don't reflect modern design roles and exclude foundational craft skills relevant to early-career designers.

### Solution
Replace the flat tag list with 4 domain categories covering the full spectrum of modern design roles and career directions. Every user sees all 4 categories — no career level filtering. No personalisation or AI inference on this step.

### Interest Categories

**1. Design Craft & User Experience**
Product Design, UX Research, UI & Visual Design, Interaction Design, Information Architecture, Design Systems, Service Design, Accessibility & Inclusive Design, Content Design & UX Writing, Motion Design & Micro-interactions, Customer Journey Design, Enterprise UX

**2. AI, Technology & Innovation**
Agentic Experience Design, Human-AI Collaboration, Agent-Agent Collaboration, AI Product Design, Prompt Engineering, AI-assisted Design, AI Governance & Responsible AI, Automation & No-code, Emerging Technologies (AR/VR/XR, Spatial, IoT), Front-end Development, Data & Analytics, Innovation & Experimentation

**3. Product, Business & Strategy**
Product Strategy, Business Strategy, Systems Thinking, Platform & Ecosystem Design, Design Operations, Growth Design, Experimentation & A/B Testing, Digital Transformation, Entrepreneurship & Startups, Domain Expertise (Finance, Healthcare, Retail, etc.), Metrics & Decision Making, Venture Building

**4. Leadership, Growth & Influence**
Design Leadership, People Management, Coaching & Mentorship, Community Building, Executive Communication, Facilitation & Workshop Design, Stakeholder Management, Organizational Design, Change Management, Thought Leadership, Public Speaking & Personal Branding, Future Foresight & Design Ethics

### UI Behaviour
- Categories are shown as collapsible or scrollable sections, each with a header label
- Tags within each category are selectable chips (existing toggle mechanic preserved)
- Minimum 3 tags required to proceed (existing gate preserved)
- Maximum 5 tags (existing gate preserved)
- Category headers are visually distinct — label + subtle count of selected tags within that category

### Data Shape
The `INTERESTS` constant in `FootprintScreen.tsx` changes from a flat array to a categorised structure:

```ts
const INTEREST_CATEGORIES: {
  label: string
  interests: { label: string; bullets: [string, string] }[]
}[]
```

The `bullets` field on each interest can be kept for tooltip/hover detail or simplified to a single description string. The `state.interests: string[]` shape in `WingspanContext` is unchanged — still stores selected tag labels.

### Files Changed
- `components/screens/FootprintScreen.tsx` — replace `INTERESTS` constant and interests rendering section

---

## 2. PDF Export Fix

### Problem
`printAsPDF()` in `lib/export.ts` calls `window.print()` which only prints the currently visible Blueprint step. The Blueprint is a 6-step paginated screen — a print of any single step misses all other content.

### Solution
Replace `window.print()` with a print-ready HTML window approach:

1. Call existing `exportToNotionMarkdown(blueprint, selectedPath)` to get the full serialised content
2. Convert the markdown to a clean HTML document with print-optimised styles (light background, readable typography, page breaks between sections)
3. Open in a new `window.open()` tab
4. Auto-trigger `window.print()` on that window after load
5. Window closes itself after the print dialog is dismissed

### What's included in the export
All sections already covered by `exportToNotionMarkdown`:
- About (identity statement, career evolution, years of experience, industries, domains)
- Chosen Direction (selected path, rationale, scores)
- Positioning Strategy
- Growth Roadmap
- Gap Analysis
- Immediate Actions
- Resources

### Implementation
`printAsPDF()` in `lib/export.ts` is updated to accept `blueprint: Blueprint` and `selectedPath: string | null`:

```ts
export function printAsPDF(blueprint: Blueprint, selectedPath: string | null) {
  const md = exportToNotionMarkdown(blueprint, selectedPath)
  const html = markdownToHTMLDocument(md)  // local helper, no new deps
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.onafterprint = () => win.close()
  win.print()
}
```

`markdownToHTMLDocument` is a local function in `lib/export.ts` that converts the markdown string to a complete `<!DOCTYPE html>` document with inline styles — no library needed for this subset of markdown (headings, paragraphs, bold, lists, horizontal rules, blockquotes, tables).

### Print styles
- White background, dark text
- Font: system-ui, 12pt base
- `h1`: 20pt, page break before (except first)
- `h2`: 14pt, border-bottom
- `h3`: 12pt, bold
- `hr`: page break suggestion (`page-break-after: always` on the preceding section)
- Checkboxes rendered as `☐`
- No interactive elements, no navigation

### Files Changed
- `lib/export.ts` — update `printAsPDF` signature, add `markdownToHTMLDocument` helper
- `components/blueprint/Resources.tsx` — pass `blueprint` and `selectedPath` to `printAsPDF` call site (already has both via `useWingspan`)
