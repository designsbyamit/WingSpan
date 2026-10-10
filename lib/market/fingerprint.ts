import { sha1 } from '@/lib/market/fetch'

/** Identity of one observation within a source: the same fact seen again updates it instead of duplicating it. */
export const fingerprint = (sourceId: string, o: { metric: string; subject: string; region: string; period?: string | null; value?: number | null }) =>
  sha1([sourceId, o.metric, o.subject.toLowerCase(), o.region, o.period ?? '', o.value ?? ''].join('|'))
