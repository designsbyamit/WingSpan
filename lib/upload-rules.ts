// Shared by the browser (before upload) and the extract route (before parsing), so both give the same answer.
export const MAX_RESUME_BYTES = 4 * 1024 * 1024 // Vercel rejects request bodies above ~4.5 MB, so stay under it
export const RESUME_EXTENSIONS = ['pdf', 'docx', 'txt']
export const RESUME_ACCEPT = RESUME_EXTENSIONS.map((e) => `.${e}`).join(',')

export type UploadProblemCode =
  | 'TOO_LARGE' | 'UNSUPPORTED_TYPE' | 'EMPTY_FILE' | 'UNREADABLE' | 'PASSWORD_PROTECTED' | 'NOT_A_RESUME' | 'TOO_LITTLE'

/** Problems with the file itself (as opposed to a temporary service failure). Retrying will not help. */
export const FILE_PROBLEMS: UploadProblemCode[] = ['TOO_LARGE', 'UNSUPPORTED_TYPE', 'EMPTY_FILE', 'UNREADABLE', 'PASSWORD_PROTECTED', 'NOT_A_RESUME', 'TOO_LITTLE']

export class UploadProblem extends Error {
  constructor(public code: UploadProblemCode, message: string, public status = 422) { super(message) }
}

export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`

export const extensionOf = (name: string) => (name.includes('.') ? name.split('.').pop()!.toLowerCase() : '')

/** Quick checks that need only the name, size and type. Returns a problem or null. */
export function checkFileBasics(name: string, size: number): UploadProblem | null {
  const ext = extensionOf(name)
  if (size === 0) return new UploadProblem('EMPTY_FILE', 'That file is empty. Choose your resume and try again.', 400)
  if (!RESUME_EXTENSIONS.includes(ext)) {
    const what = ext ? `.${ext} files` : 'that kind of file'
    const extra = ['jpg', 'jpeg', 'png', 'heic', 'webp', 'gif'].includes(ext)
      ? ' Photos and screenshots of a resume are not supported.'
      : ['doc', 'rtf', 'pages', 'odt'].includes(ext) ? ` Save it as a PDF or Word (.docx) file first.` : ''
    return new UploadProblem('UNSUPPORTED_TYPE', `We can't read ${what}. Upload your resume as a PDF or Word (.docx) file, or plain text.${extra}`, 415)
  }
  if (size > MAX_RESUME_BYTES) {
    return new UploadProblem('TOO_LARGE', `That file is ${formatBytes(size)}, and the limit is ${formatBytes(MAX_RESUME_BYTES)}. Export your resume again as a PDF without large images, or compress it, then upload it.`, 413)
  }
  return null
}

/** The first bytes tell us whether a .pdf or .docx really is one (e.g. a renamed photo). */
export function sniffMismatch(ext: string, head: Uint8Array): boolean {
  const starts = (s: string) => s.split('').every((c, i) => head[i] === c.charCodeAt(0))
  if (ext === 'pdf') return !starts('%PDF')
  if (ext === 'docx') return !(head[0] === 0x50 && head[1] === 0x4b) // "PK" zip container
  return false
}

const SECTION = /\b(experience|employment|work history|professional summary|summary|profile|objective|education|skills|projects|certifications?|achievements|languages|publications|references)\b/gi
const DATE_RANGE = /\b(19|20)\d{2}\s*(?:[-–—]|to)\s*((19|20)\d{2}|present|current|now|ongoing)\b|\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(19|20)\d{2}\b/gi
const CONTACT = /[\w.+-]+@[\w-]+\.[\w.-]+|\+?\d[\d\s().-]{8,}\d|linkedin\.com/i
const DEGREE = /\b(b\.?tech|b\.?e\.?|b\.?sc|m\.?sc|m\.?tech|mba|bachelor|master|ph\.?d|diploma|degree|university|college|institute)\b/i
const ROLE = /\b(manager|designer|engineer|developer|director|lead|head|analyst|consultant|architect|founder|officer|specialist|associate|intern|researcher|executive|strategist|product|vp)\b/i

export interface ResumeSignals { sections: number; dates: number; contact: boolean; degree: boolean; role: boolean; words: number }

export function resumeSignals(text: string): ResumeSignals {
  const sections = new Set((text.match(SECTION) ?? []).map((s) => s.toLowerCase())).size
  return {
    sections,
    dates: (text.match(DATE_RANGE) ?? []).length,
    contact: CONTACT.test(text),
    degree: DEGREE.test(text),
    role: ROLE.test(text),
    words: text.split(/\s+/).filter(Boolean).length,
  }
}

/** Deterministic "does this read like a CV?" test. Deliberately lenient: it only rejects clear non-resumes. */
export function checkLooksLikeResume(text: string): UploadProblem | null {
  const t = text.trim()
  const s = resumeSignals(t)
  if (s.words < 60) {
    return new UploadProblem('TOO_LITTLE', 'We found very little text in that file, not enough to build a Blueprint from. If it is a scan or an image-only PDF, export a text-based PDF or upload a Word file.')
  }
  const score = (s.sections >= 2 ? 2 : s.sections) + Math.min(s.dates, 3) + (s.contact ? 1 : 0) + (s.degree ? 1 : 0) + (s.role ? 1 : 0)
  if (score < 4) {
    return new UploadProblem('NOT_A_RESUME', "This doesn't look like a resume or CV. We couldn't find roles, dates, education or skills in it. Upload your resume as a PDF or Word file.")
  }
  return null
}
