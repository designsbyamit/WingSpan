# Interests Redesign & PDF Export Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat 14-tag interests list with 4 categorised modern interest groups, and fix PDF export to print all Blueprint sections instead of just the visible one.

**Architecture:** Two independent changes to existing files. Task 1 modifies `FootprintScreen.tsx` only — the data shape change is local to that file; `state.interests: string[]` in context is unchanged. Task 2 modifies `lib/export.ts` (adds `markdownToHTMLDocument` helper, updates `printAsPDF` signature) and `Resources.tsx` (updates the call site).

**Tech Stack:** React, TypeScript, Framer Motion (already installed), no new dependencies.

## Global Constraints

- `state.interests: string[]` in `WingspanContext` stays unchanged — stores selected tag labels as strings
- Min 3 tags required to proceed, max 5 — existing gate preserved
- No new npm packages
- All files are in the OneDrive2-SAPSE project path: `/Users/I752155/Library/CloudStorage/OneDrive2-SAPSE/Work/HolyExperiments/HHE/Projects/Wingspan`

---

### Task 1: Replace INTERESTS with INTEREST_CATEGORIES in FootprintScreen

**Files:**
- Modify: `components/screens/FootprintScreen.tsx`

**Interfaces:**
- Consumes: `useWingspan` hook — `state.interests: string[]`, `dispatch({ type: 'TOGGLE_INTEREST', interest: string })`
- Produces: same external interface — tag labels stored in `state.interests` unchanged

- [ ] **Step 1: Replace the INTERESTS constant**

In `components/screens/FootprintScreen.tsx`, replace lines 9–109 (the `INTERESTS` array) with:

```ts
const INTEREST_CATEGORIES: { label: string; interests: string[] }[] = [
  {
    label: 'Design Craft & User Experience',
    interests: [
      'Product Design',
      'UX Research',
      'UI & Visual Design',
      'Interaction Design',
      'Information Architecture',
      'Design Systems',
      'Service Design',
      'Accessibility & Inclusive Design',
      'Content Design & UX Writing',
      'Motion Design & Micro-interactions',
      'Customer Journey Design',
      'Enterprise UX',
    ],
  },
  {
    label: 'AI, Technology & Innovation',
    interests: [
      'Agentic Experience Design',
      'Human-AI Collaboration',
      'Agent-Agent Collaboration',
      'AI Product Design',
      'Prompt Engineering',
      'AI-assisted Design',
      'AI Governance & Responsible AI',
      'Automation & No-code',
      'Emerging Technologies (AR/VR/XR, Spatial, IoT)',
      'Front-end Development',
      'Data & Analytics',
      'Innovation & Experimentation',
    ],
  },
  {
    label: 'Product, Business & Strategy',
    interests: [
      'Product Strategy',
      'Business Strategy',
      'Systems Thinking',
      'Platform & Ecosystem Design',
      'Design Operations',
      'Growth Design',
      'Experimentation & A/B Testing',
      'Digital Transformation',
      'Entrepreneurship & Startups',
      'Domain Expertise (Finance, Healthcare, Retail, etc.)',
      'Metrics & Decision Making',
      'Venture Building',
    ],
  },
  {
    label: 'Leadership, Growth & Influence',
    interests: [
      'Design Leadership',
      'People Management',
      'Coaching & Mentorship',
      'Community Building',
      'Executive Communication',
      'Facilitation & Workshop Design',
      'Stakeholder Management',
      'Organizational Design',
      'Change Management',
      'Thought Leadership',
      'Public Speaking & Personal Branding',
      'Future Foresight & Design Ethics',
    ],
  },
]
```

- [ ] **Step 2: Replace the interests rendering section**

Find the `{/* Interest cards */}` block (currently a `<div className="grid grid-cols-2 gap-3">` that maps over `INTERESTS`) and replace it with this categorised layout:

```tsx
{/* Interest categories */}
<div className="flex flex-col gap-6">
  {INTEREST_CATEGORIES.map(({ label, interests }) => {
    const selectedInCategory = interests.filter(i => state.interests.includes(i)).length
    return (
      <div key={label} className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-[2px] uppercase text-[var(--text-muted)]">
            {label}
          </span>
          {selectedInCategory > 0 && (
            <span className="text-[10px] font-semibold text-[var(--neon)]">
              {selectedInCategory} selected
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => {
            const selected = state.interests.includes(interest)
            const atMax = state.interests.length >= 5 && !selected
            return (
              <motion.button
                key={interest}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                onClick={() => {
                  if (atMax) return
                  dispatch({ type: 'TOGGLE_INTEREST', interest })
                }}
                disabled={atMax}
                className={`
                  px-3 py-1.5 rounded-full border text-xs font-semibold transition-all
                  ${selected
                    ? 'bg-[var(--neon-surface)] border-[var(--neon)] text-[var(--neon)]'
                    : atMax
                    ? 'bg-transparent border-[var(--border-ws)] text-[var(--text-dim)] opacity-40 cursor-not-allowed'
                    : 'bg-transparent border-[var(--border-ws)] text-[var(--text-secondary)] hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }
                `}
              >
                {selected && <span className="mr-1">✓</span>}
                {interest}
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  })}
</div>
```

- [ ] **Step 3: Verify the max-5 gate still works**

The existing `canBeginAnalysis` check uses `state.interests.length >= 3` — this is unchanged. The new chips disable at 5 with `atMax`. The progress indicator below the grid also reads from `state.interests.length` — no changes needed there.

- [ ] **Step 4: Manual smoke test**

Navigate to `http://localhost:3000/wingspan`, proceed to step 2 (Your Interests). Verify:
- 4 category headers visible with uppercase labels
- Chips render as pills (not cards)
- Selecting a chip highlights it neon green
- "X selected" counter appears in the category header after selection
- At 5 selected, unselected chips become dimmed and unclickable
- At 3+ selected, "Build My Blueprint" button becomes active
- Back button returns to step 1

- [ ] **Step 5: Commit**

```bash
cd "/Users/I752155/Library/CloudStorage/OneDrive2-SAPSE/Work/HolyExperiments/HHE/Projects/Wingspan"
git add components/screens/FootprintScreen.tsx
git commit -m "feat: replace flat interest tags with 4 modern categorised interest groups"
```

---

### Task 2: Fix PDF export to print full Blueprint

**Files:**
- Modify: `lib/export.ts`
- Modify: `components/blueprint/Resources.tsx`

**Interfaces:**
- Produces: `printAsPDF(blueprint: Blueprint, selectedPath: string | null): void`
- Consumes (internal): `exportToNotionMarkdown(blueprint, selectedPath): string` — already exists in `lib/export.ts`
- Consumes (call site): `Resources.tsx` line 154 — currently `onClick={printAsPDF}`, updated to `onClick={() => printAsPDF(blueprint, selectedPath)}`

- [ ] **Step 1: Add `markdownToHTMLDocument` to `lib/export.ts`**

Add this function to `lib/export.ts` after the `downloadMarkdown` function:

```ts
function markdownToHTMLDocument(markdown: string): string {
  // Convert the markdown subset used by exportToNotionMarkdown to HTML
  const lines = markdown.split('\n')
  const htmlLines: string[] = []
  let inTable = false

  for (const line of lines) {
    if (line.startsWith('# ')) {
      htmlLines.push(`<h1>${escapeHtml(line.slice(2))}</h1>`)
    } else if (line.startsWith('## ')) {
      htmlLines.push(`<h2>${escapeHtml(line.slice(3))}</h2>`)
    } else if (line.startsWith('### ')) {
      htmlLines.push(`<h3>${escapeHtml(line.slice(4))}</h3>`)
    } else if (line.startsWith('> ')) {
      htmlLines.push(`<blockquote>${escapeHtml(line.slice(2))}</blockquote>`)
    } else if (line.startsWith('- [ ] ')) {
      htmlLines.push(`<p class="task">☐ ${escapeHtml(line.slice(6))}</p>`)
    } else if (line.startsWith('- ')) {
      htmlLines.push(`<li>${inlineMd(line.slice(2))}</li>`)
    } else if (line.startsWith('---')) {
      inTable = false
      htmlLines.push(`<hr>`)
    } else if (line.startsWith('|')) {
      if (!inTable) {
        htmlLines.push('<table>')
        inTable = true
      }
      const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1)
      const isHeader = cells.some(c => /^[-\s]+$/.test(c.trim()))
      if (!isHeader) {
        const tag = htmlLines[htmlLines.length - 1] === '<table>' ? 'th' : 'td'
        htmlLines.push(`<tr>${cells.map(c => `<${tag}>${inlineMd(c.trim())}</${tag}>`).join('')}</tr>`)
      }
    } else {
      if (inTable) { htmlLines.push('</table>'); inTable = false }
      if (line.trim() === '') {
        htmlLines.push('<br>')
      } else {
        htmlLines.push(`<p>${inlineMd(line)}</p>`)
      }
    }
  }
  if (inTable) htmlLines.push('</table>')

  const body = htmlLines.join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Future Self Blueprint™</title>
<style>
  body { font-family: system-ui, sans-serif; font-size: 12pt; color: #111; background: #fff; margin: 2cm; }
  h1 { font-size: 20pt; margin-top: 0; page-break-before: avoid; }
  h2 { font-size: 14pt; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 24px; }
  h3 { font-size: 12pt; font-weight: bold; margin-top: 16px; }
  hr { border: none; border-top: 1px solid #eee; margin: 20px 0; page-break-after: always; }
  blockquote { border-left: 3px solid #ccc; margin: 8px 0; padding-left: 12px; color: #555; font-style: italic; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; font-size: 11pt; }
  th { background: #f5f5f5; font-weight: bold; }
  li { margin: 3px 0; }
  p.task { font-family: monospace; font-size: 11pt; margin: 4px 0; }
  @media print { body { margin: 1.5cm; } }
</style>
</head>
<body>
${body}
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inlineMd(str: string): string {
  return escapeHtml(str)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
}
```

- [ ] **Step 2: Update `printAsPDF` signature in `lib/export.ts`**

Replace the existing `printAsPDF` function:

```ts
// OLD:
export function printAsPDF() {
  window.print()
}
```

With:

```ts
export function printAsPDF(blueprint: Blueprint, selectedPath: string | null) {
  const md = exportToNotionMarkdown(blueprint, selectedPath)
  const html = markdownToHTMLDocument(md)
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.onafterprint = () => win.close()
  win.print()
}
```

Also add the `Blueprint` import at the top of `lib/export.ts` if not already present:

```ts
import { Blueprint } from '@/types/wingspan'
```

- [ ] **Step 3: Update the call site in `Resources.tsx`**

In `components/blueprint/Resources.tsx`, find line 154:

```tsx
onClick={printAsPDF}
```

Replace with:

```tsx
onClick={() => printAsPDF(blueprint, selectedPath)}
```

`blueprint` and `selectedPath` are already in scope — `blueprint` is the component prop, `selectedPath` comes from `state.selectedPath` via `useWingspan` on line 7.

- [ ] **Step 4: Manual smoke test**

Navigate through the Wingspan flow to the Blueprint screen → Resources tab. Click "Export as PDF". Verify:
- A new tab opens with the full Blueprint content
- Content includes all sections: About, Chosen Direction, Positioning, Roadmap, Gap Analysis, Actions, Resources
- Print dialog appears automatically
- Tab closes after print dialog is dismissed
- No TypeScript errors in terminal

- [ ] **Step 5: Commit**

```bash
cd "/Users/I752155/Library/CloudStorage/OneDrive2-SAPSE/Work/HolyExperiments/HHE/Projects/Wingspan"
git add lib/export.ts components/blueprint/Resources.tsx
git commit -m "fix: PDF export now prints full blueprint via print-ready HTML window"
```
