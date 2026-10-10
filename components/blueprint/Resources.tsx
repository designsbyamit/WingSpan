'use client'
import { useState } from 'react'
import {
  Award, BookOpen, Bookmark, CalendarDays, Download, ExternalLink, FileText, GraduationCap, History,
  Layers, Library, Link2, Loader2, Newspaper, ScanSearch, Signpost, Users, Wrench, type LucideIcon,
} from 'lucide-react'
import { matchesPath } from '@/lib/path-match'
import { Blueprint, Resource } from '@/types/wingspan'
import { useWingspan } from '@/context/WingspanContext'
import { SectionFrame, type SectionTab } from './shell/SectionFrame'
import { useShell } from './shell/ShellContext'
import { Badge, Card, EmptyState, FOCUS_RING, INK, PrimaryButton, SecondaryButton } from './shell/ui'

type GroupId = 'learn' | 'community' | 'tools'
type ResourcesTab = GroupId | 'export'

const TYPE_META: Record<string, { label: string; plural: string; icon: LucideIcon; group: GroupId; order: number }> = {
  course:        { label: 'Course',        plural: 'Courses',        icon: GraduationCap, group: 'learn', order: 1 },
  certification: { label: 'Certification', plural: 'Certifications', icon: Award,         group: 'learn', order: 2 },
  book:          { label: 'Book',          plural: 'Books',          icon: BookOpen,      group: 'learn', order: 3 },
  article:       { label: 'Article',       plural: 'Articles',       icon: FileText,      group: 'learn', order: 4 },
  newsletter:    { label: 'Newsletter',    plural: 'Newsletters',    icon: Newspaper,     group: 'learn', order: 5 },
  community:     { label: 'Community',     plural: 'Communities',    icon: Users,         group: 'community', order: 1 },
  event:         { label: 'Event',         plural: 'Events',         icon: CalendarDays,  group: 'community', order: 2 },
  tool:          { label: 'Tool',          plural: 'Tools',          icon: Wrench,        group: 'tools', order: 1 },
  framework:     { label: 'Framework',     plural: 'Frameworks',     icon: Layers,        group: 'tools', order: 2 },
}

/** Unknown or missing types land in Learn under their own (capitalised) name. */
function typeMeta(type: unknown) {
  const key = typeof type === 'string' ? type.toLowerCase().trim() : ''
  const known = TYPE_META[key]
  if (known) return { key, ...known }
  const label = key ? key[0].toUpperCase() + key.slice(1) : 'Resource'
  return { key: key || 'other', label, plural: key ? `${label}s` : 'Other resources', icon: Link2, group: 'learn' as GroupId, order: 99 }
}

const GROUPS: { id: GroupId; label: string; description: string; empty: string }[] = [
  { id: 'learn', label: 'Learn', description: 'Courses, certifications, books and reading to build the capabilities your path needs.', empty: 'No learning resources for this path yet.' },
  { id: 'community', label: 'Communities & events', description: 'Where people on this path meet, share work and hire.', empty: 'No communities or events for this path yet.' },
  { id: 'tools', label: 'Tools & frameworks', description: 'What practitioners on this path use day to day.', empty: 'No tools or frameworks for this path yet.' },
]

const COST: Record<string, { label: string; tone: 'positive' | 'neutral' | 'warn' }> = {
  free:  { label: 'Free', tone: 'positive' },
  paid:  { label: 'Paid', tone: 'neutral' },
  mixed: { label: 'Free and paid', tone: 'neutral' },
}

function ResourceCard({ resource }: { resource: Resource }) {
  const meta = typeMeta(resource.type)
  const Icon = meta.icon
  const cost = resource.cost ? COST[resource.cost] : undefined
  const firstStep = resource.firstStep || resource.whereToStart

  return (
    <Card as="li" className="p-5 flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <span className="shrink-0 w-10 h-10 rounded-[10px] bg-[var(--surface-dim)] flex items-center justify-center text-[var(--text-secondary)]">
          <Icon size={18} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-[var(--text-muted)]">
            {meta.label}{resource.provider ? <> from <span className="text-[var(--text-secondary)]">{resource.provider}</span></> : null}
          </p>
          <h4 className="text-[15px] font-semibold text-[var(--text-primary)] leading-snug mt-1" style={{ fontFamily: 'var(--font-sora)' }}>
            {resource.url ? (
              <a href={resource.url} target="_blank" rel="noopener noreferrer" className={`rounded-[4px] hover:underline underline-offset-4 ${FOCUS_RING}`}>
                {resource.title}<span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : resource.title}
          </h4>
        </div>
      </div>

      {(cost || resource.phase) && (
        <div className="flex flex-wrap gap-2">
          {cost && <Badge tone={cost.tone}>{cost.label}</Badge>}
          {resource.phase && <Badge tone="neutral">Best at {resource.phase}</Badge>}
        </div>
      )}

      {resource.capability && (
        <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
          <span className="text-[var(--text-muted)]">Helps close </span>
          <span className={`font-semibold ${INK}`}>{resource.capability}</span>
        </p>
      )}

      {firstStep && (
        <div className="rounded-[10px] bg-[var(--card-inner)] border border-[var(--border-ws)] p-3.5">
          <p className="text-[12px] font-semibold text-[var(--text-muted)] mb-1">First step</p>
          <p className="text-[14px] text-[var(--text-primary)] leading-relaxed">{firstStep}</p>
        </div>
      )}

      {resource.url && (
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`mt-auto self-start inline-flex items-center gap-2 h-9 px-3.5 rounded-[10px] border border-[var(--border-ws)] text-[13px] font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-dim)] ${FOCUS_RING}`}
        >
          Open<ExternalLink size={13} aria-hidden /><span className="sr-only"> {resource.title} in a new tab</span>
        </a>
      )}
    </Card>
  )
}

function GroupPanel({ group, resources }: { group: (typeof GROUPS)[number]; resources: Resource[] }) {
  if (resources.length === 0) return <EmptyState icon={Library} title={group.empty} body="Check the other tabs, or run the analysis again later." />

  // Ordered by type (each card names its type), so similar items sit together without extra headings.
  const sorted = [...resources].sort((a, b) => typeMeta(a.type).order - typeMeta(b.type).order)
  const counts = new Map<string, { one: string; many: string; n: number }>()
  for (const r of sorted) {
    const m = typeMeta(r.type)
    const c = counts.get(m.key) ?? { one: m.label, many: m.plural, n: 0 }
    c.n += 1
    counts.set(m.key, c)
  }
  const summary = [...counts.values()].map(c => `${c.n} ${(c.n === 1 ? c.one : c.many).toLowerCase()}`).join(', ')

  return (
    <>
      <div className="flex flex-col gap-1.5 max-w-[68ch]">
        <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed">{group.description}</p>
        <p className="text-[13px] text-[var(--text-muted)]">{summary}</p>
      </div>
      <ul className="grid md:grid-cols-2 gap-4">
        {sorted.map((r, i) => <ResourceCard key={`${r.title}-${i}`} resource={r} />)}
      </ul>
    </>
  )
}

function TakeItWithYou() {
  const shell = useShell()
  const { signedIn, authLoading } = shell
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="p-6 flex flex-col gap-4 md:col-span-2">
        <div className="flex items-start gap-4">
          <span className={`shrink-0 w-10 h-10 rounded-[10px] bg-[var(--neon-surface)] border border-[var(--neon-border)] flex items-center justify-center ${INK}`}>
            <Download size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-[17px] font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>Continue in Notion</h3>
            <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mt-1.5 max-w-[60ch]">
              Export your roadmap, gap analysis, actions and resources as Notion-ready Markdown. In Notion, create a new page and paste the file’s contents.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:pl-14">
          <PrimaryButton onClick={shell.exportMarkdown} disabled={shell.exporting}>
            {shell.exporting ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Download size={14} aria-hidden />}
            {shell.exporting ? 'Exporting' : 'Export to Notion (.md)'}
          </PrimaryButton>
          {!authLoading && !signedIn && <p className="text-[13px] text-[var(--text-muted)]">You’ll be asked to sign in first.</p>}
        </div>
      </Card>

      {!authLoading && !signedIn ? (
        <Card tone="accent" className={`p-6 flex flex-col gap-4 ${shell.openDeepAnalysis ? '' : 'md:col-span-2'}`}>
          <div>
            <h3 className="text-[16px] font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>Save your Blueprint</h3>
            <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mt-1.5">Create a free account to keep this Blueprint and continue your journey.</p>
          </div>
          <PrimaryButton onClick={shell.openSave} className="self-start"><Bookmark size={14} aria-hidden />Create account and save</PrimaryButton>
        </Card>
      ) : (
        <Card className={`p-6 flex flex-col gap-4 ${shell.openDeepAnalysis ? '' : 'md:col-span-2'}`}>
          <div>
            <h3 className="text-[16px] font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>Keep a snapshot</h3>
            <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mt-1.5">Your Blueprint saves automatically. Save a named version to keep this one even after a new analysis.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton onClick={shell.openSave}><Bookmark size={14} aria-hidden />Save version</PrimaryButton>
            <SecondaryButton onClick={shell.openVersions}><History size={14} aria-hidden />Versions</SecondaryButton>
          </div>
        </Card>
      )}

      {shell.openDeepAnalysis && (
        <Card className="p-6 flex flex-col gap-4">
          <div>
            <h3 className="text-[16px] font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>Deep analysis</h3>
            <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed mt-1.5">See how each agent reached this recommendation, with the market evidence behind it.</p>
          </div>
          <SecondaryButton onClick={shell.openDeepAnalysis} className="self-start"><ScanSearch size={14} aria-hidden />Open deep analysis</SecondaryButton>
        </Card>
      )}
    </div>
  )
}

export function Resources({ blueprint }: { blueprint: Blueprint }) {
  const { state } = useWingspan()
  const { goTo } = useShell()
  const selectedPath = state.selectedPath
  const [tab, setTab] = useState<ResourcesTab | null>(null)
  const [showAllPaths, setShowAllPaths] = useState(false)

  const all = (Array.isArray(blueprint.actions?.resources) ? blueprint.actions.resources : []).filter(r => r && r.title)

  if (!selectedPath) {
    return (
      <SectionFrame section="resources" tabs={[]} activeTab="" onTabChange={() => {}}>
        <EmptyState
          icon={Signpost}
          title="Choose a path to see resources"
          body="Resources are picked for one direction. Choose it in Future Paths."
          action={<PrimaryButton onClick={() => goTo('path-selection')}>Go to Future Paths</PrimaryButton>}
        />
      </SectionFrame>
    )
  }

  const matched = all.filter(r => matchesPath(r.pathway, selectedPath))
  const shown = matched.length === 0 && showAllPaths ? all : matched
  const grouped: Record<GroupId, Resource[]> = { learn: [], community: [], tools: [] }
  for (const r of shown) grouped[typeMeta(r.type).group].push(r)

  const groupTabs = GROUPS.filter(g => shown.length === 0 ? g.id === 'learn' : grouped[g.id].length > 0)
  const tabs: SectionTab[] = [
    ...groupTabs.map(g => ({ id: g.id, label: g.label, count: grouped[g.id].length || undefined })),
    { id: 'export', label: 'Take it with you' },
  ]
  const active: ResourcesTab = tab && tabs.some(t => t.id === tab) ? tab : (tabs[0].id as ResourcesTab)
  const activeGroup = GROUPS.find(g => g.id === active)

  return (
    <SectionFrame
      section="resources"
      context={<Badge tone="accent">For {selectedPath}</Badge>}
      stat={matched.length ? { value: matched.length, label: matched.length === 1 ? 'resource for this path' : 'resources for this path' } : null}
      tabs={tabs}
      activeTab={active}
      onTabChange={id => setTab(id as ResourcesTab)}
    >
      {active === 'export' ? <TakeItWithYou /> : shown.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No resources matched this path"
          body={all.length > 0
            ? `The analysis suggested ${all.length} resource${all.length === 1 ? '' : 's'} for other paths. Some may still be useful.`
            : 'The analysis did not suggest resources this time. Run it again later, or use Take it with you to export your roadmap.'}
          action={all.length > 0
            ? <SecondaryButton onClick={() => setShowAllPaths(true)}>Show resources for all paths</SecondaryButton>
            : <SecondaryButton onClick={() => setTab('export')}>Take it with you</SecondaryButton>}
        />
      ) : (
        <>
          {matched.length === 0 && showAllPaths && (
            <p role="status" className="text-[13px] text-[var(--text-muted)]">
              Showing resources from every path because none were tagged for {selectedPath}.
            </p>
          )}
          {activeGroup && <GroupPanel group={activeGroup} resources={grouped[activeGroup.id]} />}
        </>
      )}
    </SectionFrame>
  )
}
