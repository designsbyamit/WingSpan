import type { ExtractedCareerData } from '@/types/wingspan'

// Reads the person's name and contact details straight from the resume text. The AI reading of the resume is the
// first choice, but it is not reliable for these fields (it is asked for skills and roles), so this plain-text
// reading backs it up. It only ever fills what is missing and never guesses a name from anything but the header.

export interface Contact { email?: string; phone?: string; location?: string; linkedinUrl?: string; portfolioUrl?: string; githubUrl?: string }
export interface Identity { name: string; contact: Contact }

const TITLE_WORDS = /\b(designer|developer|engineer|manager|analyst|resume|curriculum|vitae|cv|summary|profile|contact|objective|portfolio|lead|director|consultant|intern|student|experience|education|skills|researcher|architect|specialist|associate)\b/i
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/
const PHONE = /(\+\d{1,3}[\s-]?\d[\d\s-]{7,13}\d)|(?<![\d])([6-9]\d{4}[\s-]?\d{5})(?![\d])/
const LINKEDIN = /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/(?:in|pub)\/[\w%-]+/i
const GITHUB = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i
const OTHER_PROFILE = /(linkedin|github|behance|dribbble|medium|twitter|x\.com|instagram|facebook)\./i
const PORTFOLIO_HOST = /(?:[a-z0-9-]+\.)+(?:framer\.website|framer\.ai|notion\.site|webflow\.io|wixsite\.com|carrd\.co|github\.io|vercel\.app|netlify\.app|squarespace\.com|design|studio)\b/i
const DOMAIN = /(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s|,;)]*)?/gi

const cleanUrl = (u: string) => u.replace(/[.,;)]+$/, '')

export function readContactFromText(text: string): Identity {
  const lines = String(text ?? '').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !/^\[UPLOADED DOCUMENT/i.test(l))
  const head = lines.slice(0, 14)
  const headText = head.join('\n')
  const contact: Contact = {}

  const email = headText.match(EMAIL)?.[0] ?? text.match(EMAIL)?.[0]
  if (email) contact.email = email
  const phone = headText.match(PHONE)
  if (phone) contact.phone = (phone[1] ?? phone[2]).trim()
  const li = text.match(LINKEDIN)?.[0]; if (li) contact.linkedinUrl = cleanUrl(li)
  const gh = text.match(GITHUB)?.[0]; if (gh) contact.githubUrl = cleanUrl(gh)

  // Portfolio: a labelled line first, then a known portfolio host in the header.
  const stripped = (s: string) => s.replace(EMAIL, ' ')
  const labelled = head.find((l) => /\b(portfolio|website|personal site|web)\b\s*[:\-]/i.test(l))
  const candidates = [...(labelled ? stripped(labelled).match(DOMAIN) ?? [] : []), ...(stripped(headText).match(PORTFOLIO_HOST) ?? [])]
  const portfolio = candidates.map(cleanUrl).find((u) => !OTHER_PROFILE.test(u) && !/@/.test(u) && /\./.test(u))
  if (portfolio) contact.portfolioUrl = portfolio

  // Location: a "City, State, Country" segment in the header, between separators.
  for (const l of head.slice(0, 8)) {
    const seg = l.split(/\s*[|•·]\s*/).find((s) => /^[A-Za-z .'-]+(?:,\s*[A-Za-z .'-]+){1,3}$/.test(s) && !/@|\d|linkedin|portfolio|github/i.test(s) && !TITLE_WORDS.test(s))
    if (seg) { contact.location = seg.trim(); break }
  }

  // Name: an explicit "Name:" line, otherwise the first short, name-shaped line at the very top.
  let name = ''
  for (const l of head.slice(0, 6)) {
    const m = l.match(/^name\s*[:\-]\s*(.+)$/i)
    if (m) { name = m[1].trim(); break }
  }
  if (!name) {
    for (const l of head.slice(0, 5)) {
      if (/[|@\d:/]/.test(l) || TITLE_WORDS.test(l)) continue
      if (/^[A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*){1,3}$/.test(l)) { name = l; break }
    }
  }
  return { name: name.replace(/\s+/g, ' ').slice(0, 80), contact }
}

/** The person's name and contact details from extracted data, filling gaps from the resume text. */
export function identityFrom(data: Partial<ExtractedCareerData> | null | undefined): Identity {
  const read = readContactFromText(data?.rawText ?? '')
  const have = (data?.contact ?? {}) as Contact
  const pick = (a?: string, b?: string) => (a && a.trim() ? a.trim() : b ?? '')
  return {
    name: pick(data?.candidateName, read.name),
    contact: {
      email: pick(have.email, read.contact.email), phone: pick(have.phone, read.contact.phone), location: pick(have.location, read.contact.location),
      linkedinUrl: pick(have.linkedinUrl, read.contact.linkedinUrl), portfolioUrl: pick(have.portfolioUrl, read.contact.portfolioUrl), githubUrl: pick(have.githubUrl, read.contact.githubUrl),
    },
  }
}
