import { UserRound, Sparkles, Signpost, Gauge, Route, Library, type LucideIcon } from 'lucide-react'
import type { BlueprintStep } from '@/types/wingspan'

export interface SectionMeta {
  id: BlueprintStep
  /** Short label used in the side nav and Prev/Next buttons. */
  label: string
  /** Page title shown in the section header. */
  title: string
  /** One-line purpose under the title. */
  purpose: string
  icon: LucideIcon
  /** Needs a chosen Future Path before it makes sense. */
  needsPath: boolean
}

export const SECTIONS: SectionMeta[] = [
  { id: 'profile',        label: 'Profile',      title: 'Profile map',         purpose: 'What your resume, projects and links say about you today.', icon: UserRound, needsPath: false },
  { id: 'intelligence',   label: 'Intelligence', title: 'Career intelligence', purpose: 'Where your strengths and interests point, and how strong the signal is.', icon: Sparkles, needsPath: false },
  { id: 'path-selection', label: 'Future Paths', title: 'Future paths',        purpose: 'Evidence-backed directions for your next chapter. Choose one to tailor the rest of the Blueprint.', icon: Signpost, needsPath: false },
  { id: 'gap-analysis',   label: 'Gap Analysis', title: 'Gap analysis',        purpose: 'What stands between you and the path you chose, and how big each gap is.', icon: Gauge, needsPath: true },
  { id: 'roadmap',        label: 'Roadmap',      title: 'Growth roadmap',      purpose: 'Milestones and concrete actions that close the gaps, in order.', icon: Route, needsPath: true },
  { id: 'resources',      label: 'Resources',    title: 'Resources',           purpose: 'Books, courses, communities and tools picked for your path.', icon: Library, needsPath: true },
]

export function sectionIndex(id: BlueprintStep) {
  return SECTIONS.findIndex(s => s.id === id)
}

export function sectionMeta(id: BlueprintStep): SectionMeta {
  return SECTIONS[Math.max(0, sectionIndex(id))]
}
