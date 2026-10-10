import type { MarketCategory } from '@/lib/generated/prisma/enums'

// The source register. Adding a source = adding a row here; ensureSources() syncs it to the database.
// kind: INDEX  – a listing page; new article links matching `linkPattern` are crawled
//       PAGE   – a single report page or PDF
//       CSV / API – numeric feeds parsed without AI (see feeds.ts)
//       MANUAL – curated documents entered by hand (see curated.ts)
// reliability is how far we trust the publisher's numbers (0-1); secondary writeups that cite nothing score low.

export interface SourceSeed {
  key: string
  name: string
  publisher: string
  category: keyof typeof MarketCategory
  kind: 'INDEX' | 'PAGE' | 'CSV' | 'API' | 'MANUAL'
  url: string
  region: string
  licence: string
  reliability: number
  cadenceDays?: number
  config?: Record<string, unknown>
  notes?: string
  enabled?: false // set only to switch a source off in the register
}

export const SOURCES: SourceSeed[] = [
  // ------------------------------------------------------------ JOB MARKET
  {
    key: 'indeed-postings-tracker', name: 'Indeed job postings index by sector', publisher: 'Indeed Hiring Lab',
    category: 'JOB_MARKET', kind: 'CSV', url: 'https://github.com/hiring-lab/job_postings_tracker', region: 'Global',
    licence: 'CC BY 4.0 (attribute Indeed Hiring Lab)', reliability: 0.95,
    config: {
      countries: ['US', 'GB', 'DE', 'FR', 'CA', 'AU'],
      sectors: ['Software Development', 'Data & Analytics', 'Marketing', 'Media & Communications', 'Arts & Entertainment', 'Management', 'IT Systems & Solutions', 'Scientific Research & Development'],
    },
    notes: 'Daily index, 100 = 1 Feb 2020. India is not covered by this dataset.',
  },
  {
    key: 'worldbank-labour', name: 'World Bank labour indicators', publisher: 'World Bank',
    category: 'JOB_MARKET', kind: 'API', url: 'https://api.worldbank.org/v2', region: 'Global',
    licence: 'CC BY 4.0 (World Bank Open Data)', reliability: 0.9,
    config: {
      countries: ['IND', 'USA', 'GBR', 'DEU', 'SGP'],
      indicators: { 'SL.UEM.TOTL.ZS': 'unemployment_rate', 'SL.SRV.EMPL.ZS': 'employment_rate' },
    },
  },
  {
    key: 'indeed-hiring-lab-articles', name: 'Indeed Hiring Lab research', publisher: 'Indeed Hiring Lab',
    category: 'JOB_MARKET', kind: 'INDEX', url: 'https://hiringlab.indeed.com/all-articles/', region: 'Global',
    licence: 'Facts and figures cited with attribution', reliability: 0.9,
    config: { linkPattern: '/20\\d\\d/\\d\\d/\\d\\d/', include: 'design|creative|software|\\bai\\b|artificial|tech|skills|india|europe|postings|entry|junior', maxNew: 4 },
  },
  {
    key: 'zinnov-nasscom-gcc-2026', name: 'India GCC landscape 2026', publisher: 'Zinnov x NASSCOM',
    category: 'JOB_MARKET', kind: 'PAGE', url: 'https://media.zinnov.com/wp-content/uploads/2026/05/zinnov-nasscom-india-gcc-landscape-2026-report.pdf', region: 'India',
    licence: 'Published report; facts cited with attribution', reliability: 0.85, cadenceDays: 60,
  },
  {
    key: 'linkedin-economic-graph', name: 'LinkedIn Economic Graph research', publisher: 'LinkedIn Economic Graph',
    category: 'JOB_MARKET', kind: 'INDEX', url: 'https://economicgraph.linkedin.com/research', region: 'Global',
    licence: 'Facts and figures cited with attribution', reliability: 0.85,
    config: { linkPattern: '/research/', include: 'skills|jobs|ai|work|talent|india|design|creative', maxNew: 3 },
  },
  // ------------------------------------------------------------ INDUSTRY PERFORMANCE / SKILLS
  {
    key: 'wef-future-of-jobs-2025', name: 'Future of Jobs Report 2025', publisher: 'World Economic Forum',
    category: 'INDUSTRY_PERFORMANCE', kind: 'PAGE', url: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/digest/', region: 'Global',
    licence: 'Published report; facts cited with attribution', reliability: 0.85, cadenceDays: 90,
    enabled: false,
    notes: 'Disabled: the publisher returns HTTP 403 to automated fetches. Its findings are entered through curated documents instead.',
  },
  {
    key: 'anthropic-economic-index', name: 'Anthropic Economic Index', publisher: 'Anthropic',
    category: 'INDUSTRY_PERFORMANCE', kind: 'PAGE', url: 'https://www.anthropic.com/economic-index', region: 'Global',
    licence: 'Published research; facts cited with attribution', reliability: 0.85, cadenceDays: 30,
    enabled: false,
    notes: 'Disabled: the page is rendered by script, so a plain fetch finds no text.',
  },
  {
    key: 'figma-state-of-designer', name: 'State of the Designer', publisher: 'Figma',
    category: 'INDUSTRY_PERFORMANCE', kind: 'PAGE', url: 'https://www.figma.com/reports/state-of-the-designer-2026/', region: 'Global',
    licence: 'Published survey; facts cited with attribution', reliability: 0.75, cadenceDays: 60,
    enabled: false,
    notes: 'Disabled: robots.txt forbids automated access, so it is not crawled. Vendor survey (906 designers in 2026); its headline AI-adoption figure is entered through curated documents.',
  },
  {
    key: 'cybertize-india-uiux', name: 'State of UI/UX Design in India 2026-2027', publisher: 'Cybertize Technologies',
    category: 'INDUSTRY_PERFORMANCE', kind: 'PAGE', url: 'https://cybertizeweb.com/blog/ui-ux/state-of-ui-ux-design/', region: 'India',
    licence: 'Blog article; facts cited with attribution', reliability: 0.4, cadenceDays: 30,
    notes: 'Secondary write-up. Most salary, hiring and talent-gap figures carry no inline source, so they are held at low reliability.',
  },
  {
    key: 'manual-curated', name: 'Curated reports and press coverage', publisher: 'Various (see each document)',
    category: 'JOB_MARKET', kind: 'MANUAL', url: 'manual:curated', region: 'Global',
    licence: 'Facts cited with attribution', reliability: 0.6, cadenceDays: 3650,
    notes: 'Findings entered by hand from reports that cannot be crawled directly.',
  },
]
