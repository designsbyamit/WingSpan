import type { SourceRef, StudentPlan } from '@/lib/student/types'

// Plain-text version of the plan for download. Every claim keeps its citation ids and the full source list is at the end.
const cite = (ids: string[]) => (ids.length ? ` [${ids.join(', ')}]` : '')
const tag = (c: { general?: boolean; unverifiedNumber?: boolean; unchecked?: boolean }) => (c.general ? ' (general guidance, no source)' : c.unverifiedNumber ? ' (figure not confirmed by the cited source)' : c.unchecked ? ' (source not independently checked)' : '')
const src = (s: SourceRef) => `- ${s.id}: ${s.label} (${s.publisher}${s.publishedAt ? `, published ${s.publishedAt}` : ''}${s.retrievedAt ? `, read ${s.retrievedAt}` : ''}) ${s.url ?? '[no public link]'}`

export function studentPlanToMarkdown(p: StudentPlan): string {
  const L: string[] = ['# Your Student Plan', '', `Generated ${p.generatedAt.slice(0, 10)}`, '', '## Your edge', '', `**${p.edge.headline}**`, '']
  for (const d of p.edge.differentiators) L.push(`- **${d.title}** (${d.strength}): ${d.whyHirersCare}`)
  if (p.edge.alreadyProven.length) { L.push('', '### Already proven', ''); for (const a of p.edge.alreadyProven) L.push(`- ${a.text}`) }
  if (p.edge.honestGaps.length) { L.push('', '### Honest gaps', ''); for (const g of p.edge.honestGaps) L.push(`- ${g}`) }
  L.push('', '## Where freshers are being hired', '')
  for (const m of p.market) L.push(`- ${m.text}${cite(m.sources)}${tag(m)}`)
  L.push('', '## Your two lanes', '')
  for (const l of p.lanes) {
    L.push(`### ${l.name}`, '', l.whyYou, '', `Demand: ${l.demand.text}${cite(l.demand.sources)}${tag(l.demand)}`)
    if (l.whoHires.length) L.push('', `Employers to watch: ${l.whoHires.map((w) => w.name).join(', ')}`)
    if (l.proofNeeded.length) L.push('', 'Proof this lane expects:', ...l.proofNeeded.map((x) => `- ${x}`))
    if (l.honestOdds) L.push('', `Honest odds: ${l.honestOdds}`)
    L.push('')
  }
  L.push('## Your bridge job', '', `**${p.bridge.title}**: ${p.bridge.why}${cite(p.bridge.claim.sources)}${tag(p.bridge.claim)}`)
  if (p.bridge.whereToLook.length) L.push('', ...p.bridge.whereToLook.map((x) => `- ${x}`))
  L.push('', '## Openings we found', '', p.openingsNote, '')
  for (const o of p.openings) L.push(`- ${o.title}, ${o.company}${o.location ? ` (${o.location})` : ''}: ${o.fresherFriendly ? 'open to freshers' : `${o.seniority.toLowerCase()}${o.minYears !== null ? `, asks ${o.minYears}+ years` : ''}`} [${o.sourceId}, read ${o.retrievedAt}] ${o.url}`)
  L.push('', '## Your first 14 days', '')
  for (const d of p.days) L.push(`**Day ${d.day} · ${d.theme} · ${d.minutes} min**`, d.action, `Why: ${d.why}`, `How: ${d.guidance}`, '')
  L.push('## Things to keep in mind', '', ...p.caveats.map((c) => `- ${c}`), '', '## Sources', '', ...p.sources.map(src))
  return L.join('\n')
}
