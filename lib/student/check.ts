import { z } from 'zod'
import { callValidated } from '@/lib/v02-agents'
import { applySupport, type SupportVerdict } from '@/lib/student/verify'
import type { Claim, SourceRef } from '@/lib/student/types'

// The claim checker: a second, independent reading. For every statement that cites sources it asks whether those
// sources really say what the statement says. Sources that do not are removed; a statement left with none is shown
// as general guidance. If the checker itself is unavailable the statements are kept but labelled "not independently checked".

const verdicts = z.object({ checks: z.array(z.object({ i: z.coerce.number(), supported: z.string().transform((s) => (/^y/i.test(s) ? 'yes' : /^p/i.test(s) ? 'partly' : 'no') as SupportVerdict['supported']), keep: z.array(z.string()).default([]) })) })

export async function checkSupport(claims: Claim[], known: Map<string, SourceRef>): Promise<Claim[]> {
  const toCheck = claims.map((c, i) => ({ c, i })).filter(({ c }) => c.sources.length > 0)
  if (!toCheck.length) return claims
  const system = `You are a strict fact-checker. For each statement you are given the exact source passages it cites. Decide whether those passages actually support what the statement says, including its region (a US figure does not support an India claim), its direction (rising vs falling) and its numbers. "yes" = supported; "partly" = some of it is supported; "no" = the sources do not say this. In "keep" list only the source ids whose passage genuinely supports the statement. Be strict: a source that is merely on a related topic does not support the statement. Return only JSON.`
  const user = toCheck.map(({ c, i }) => `STATEMENT ${i}: ${c.text}\n${c.sources.map((id) => `  ${id} [${known.get(id)?.publisher ?? ''}${known.get(id)?.region ? `, ${known.get(id)!.region}` : ''}]: ${known.get(id)?.statement ?? ''}`).join('\n')}`).join('\n\n')
    + '\n\nReturn exactly: {"checks": [{"i": number, "supported": "yes"|"partly"|"no", "keep": ["source id"]}]} with one entry per statement.'
  let by = new Map<number, SupportVerdict>()
  try {
    const out = await callValidated(system, user, (o) => verdicts.parse(o), 3500)
    by = new Map(out.checks.map((c) => [c.i, c]))
  } catch (e) {
    console.warn('Claim checker unavailable:', e instanceof Error ? e.message.slice(0, 160) : e)
  }
  return claims.map((c, i) => (c.sources.length ? applySupport(c, by.get(i)) : c))
}
