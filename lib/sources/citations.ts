// One shape for "where did this come from", used wherever the student coach shows a fact, a number or an opening.
// Rule: nothing is shown to a student without a citation. If a fact has no link, the citation says so plainly.

export interface Citation {
  id?: string
  kind: 'REPORT' | 'POSTING'
  label: string               // report or posting title
  publisher: string
  url: string | null          // null only for hand-entered summaries with no public page
  publishedAt?: string | null // when the source says it was published
  retrievedAt: string | null  // when WingSpan last read it
  reliability?: number        // 0-1, how far the publisher's numbers are trusted
  note?: string
}

const day = (d: Date | string | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : null)

export function postingCitation(p: { title: string; url: string; lastSeenAt: Date; source: string; company: { name: string } }): Citation {
  return {
    kind: 'POSTING', label: p.title, publisher: p.company.name, url: p.url, retrievedAt: day(p.lastSeenAt),
    note: p.source === 'CAREER_PAGE' ? "Read from the employer's own careers page" : "Read from the employer's public job board",
  }
}

export function reportCitation(i: { id?: string; title: string | null; publisher: string; url: string | null; when?: string; retrievedAt?: string | null; reliability?: number }): Citation {
  return { kind: 'REPORT', id: i.id, label: i.title ?? i.publisher, publisher: i.publisher, url: i.url, publishedAt: i.when ?? null, retrievedAt: i.retrievedAt ?? null, reliability: i.reliability }
}

export function formatCitation(c: Citation): string {
  const bits = [c.publisher, c.publishedAt && c.publishedAt !== 'undated' ? `published ${c.publishedAt}` : null, c.retrievedAt ? `read ${c.retrievedAt}` : null].filter(Boolean).join(', ')
  return `${c.label} (${bits})${c.url ? ` ${c.url}` : ' [no public link]'}`
}
