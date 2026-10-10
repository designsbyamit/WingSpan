// Controlled vocabulary for market observations, so figures from different reports can be compared.
export const METRICS = [
  'postings_index',        // job-postings level vs a baseline (Indeed index, 100 = Feb 2020)
  'postings_change_yoy',   // % change in postings, year on year
  'hiring_volume',         // number of hires / open roles
  'hiring_growth',         // % growth in hiring
  'talent_gap',            // shortfall of people vs demand
  'salary',                // pay level (use unit and region)
  'salary_growth',         // % change in pay
  'skill_demand',          // a skill is in demand / rising / falling (value = % where given)
  'skill_ai_adoption',     // share of workers/designers using AI
  'ai_exposure',           // share of jobs/tasks exposed to AI
  'ai_job_creation',       // AI-related roles created
  'market_size',           // size of a market or sector
  'market_growth',         // growth rate of a market or sector
  'employment_rate',       // official labour statistic
  'unemployment_rate',
  'remote_share',          // share of roles that are remote/hybrid
  'experience_mix',        // share of hiring by experience band
  'location_share',        // share of hiring by city/region
  'attrition',
  'other',
] as const
export type Metric = (typeof METRICS)[number]

export const isMetric = (m: string): m is Metric => (METRICS as readonly string[]).includes(m)

const REGION_ALIASES: Record<string, string> = {
  india: 'India', in: 'India', ind: 'India',
  us: 'US', usa: 'US', 'united states': 'US', america: 'US',
  uk: 'UK', gb: 'UK', gbr: 'UK', 'united kingdom': 'UK', britain: 'UK',
  eu: 'Europe', europe: 'Europe', 'european union': 'Europe',
  global: 'Global', world: 'Global', worldwide: 'Global',
  de: 'Germany', germany: 'Germany', fr: 'France', france: 'France', ca: 'Canada', canada: 'Canada',
  au: 'Australia', australia: 'Australia', sg: 'Singapore', singapore: 'Singapore', sea: 'Southeast Asia',
  'southeast asia': 'Southeast Asia', 'asia-pacific': 'Asia-Pacific', apac: 'Asia-Pacific',
}
export function normalizeRegion(r: string | undefined | null): string {
  const k = String(r ?? '').trim().toLowerCase()
  return REGION_ALIASES[k] ?? (k ? k.replace(/\b\w/g, (c) => c.toUpperCase()) : 'Global')
}
