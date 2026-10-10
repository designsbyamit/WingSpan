import type { Metric } from '@/lib/market/vocabulary'

// Findings entered by hand from reports that were read directly (or that cannot be crawled).
// Each carries its own reliability: a figure traced to a named dataset scores higher than one repeated
// from an unsourced write-up. Statements are short paraphrases; the url points to the original.

export interface CuratedObservation {
  metric: Metric; subject: string; region: string; value: number | null; unit: string | null
  period: string | null; statement: string; reliability: number
}
export interface CuratedDocument {
  url: string; title: string; publishedAt: string | null; category: 'JOB_MARKET' | 'INDUSTRY_PERFORMANCE'
  observations: CuratedObservation[]
}
const o = (metric: Metric, subject: string, region: string, value: number | null, unit: string | null, period: string | null, statement: string, reliability: number): CuratedObservation =>
  ({ metric, subject, region, value, unit, period, statement, reliability })

export const CURATED: CuratedDocument[] = [
  {
    url: 'manual:design-ai-job-market-report',
    title: 'UX/UI/AI design job market report (compiled, supplied by the product owner)',
    publishedAt: null, category: 'JOB_MARKET',
    observations: [
      o('market_growth', 'Design services', 'India', 18, '% YoY', '2026', 'Indian design services sector reported growing about 18% a year (NASSCOM via a secondary write-up).', 0.45),
      o('talent_gap', 'UI/UX designers', 'India', 80000, 'count', 'by 2027', 'About 80,000 more UI/UX designers estimated to be needed in India by 2027; the estimate is unattributed.', 0.3),
      o('market_size', 'UI/UX market', 'Global', 2.9, 'USD bn', '2026', 'Global UI/UX market projected at about USD 2.9bn in 2026 and USD 11.7bn by 2031 (Mordor Intelligence, via secondary write-up).', 0.5),
      o('skill_ai_adoption', 'Designers', 'Global', 72, '%', '2026', 'About 72% of designers say they use generative AI in their workflow (Figma State of the Designer, via secondary write-up).', 0.65),
      o('salary', 'UX Designer (mid)', 'India', 10.6, 'INR lakh/yr', '2026', 'Mid-level UX designers in India average about INR 10.6 lakh a year (range 3-21.9) per salary-site data.', 0.4),
      o('salary', 'UI/UX Designer', 'India', 7.1, 'INR lakh/yr', '2026', 'UI/UX designers in India average about INR 7.1 lakh a year (range 2-13.9).', 0.4),
      o('salary', 'UX Manager', 'India', 18, 'INR lakh/yr', '2026', 'UX managers in India average about INR 18 lakh a year (range 7-45).', 0.4),
      o('salary_growth', 'UX/UI Designer', 'India', 35, '%', '2023-2026', 'Indian UX/UI salaries reported up roughly 30-40% since 2023; the claim has no inline source.', 0.3),
      o('salary', 'UX Designer', 'US', 91.7, 'USD k/yr', '2023', 'Average US UX designer base salary about USD 91.7k (Built In, 2023).', 0.6),
      o('salary', 'UX/UI Designer', 'France', 47.5, 'EUR k/yr', '2026', 'French UX/UI designers earn a median of about EUR 47.5k.', 0.5),
      o('salary', 'Senior UX Designer (London)', 'UK', null, 'GBP k/yr', '2026', 'London senior UX designers typically earn GBP 51-91k.', 0.5),
      o('ai_job_creation', 'AI-related roles', 'US', 640000, 'count', '2023-2025', 'LinkedIn analysis: roughly 640,000 AI-related US jobs created 2023-2025.', 0.6),
      o('ai_exposure', 'Global jobs', 'Global', 12000000, 'count', 'by 2030', 'McKinsey: up to 12 million global job transitions by 2030, mostly in admin and clerical work (via secondary write-up).', 0.5),
      o('remote_share', 'UX hiring', 'India', 70, '%', '2026', 'More than 70% of Indian UX hires reportedly offer remote options; no inline source.', 0.3),
      o('location_share', 'UX hiring', 'India', 80, '%', '2026', 'Bengaluru, NCR, Mumbai, Pune and Hyderabad reportedly hold about 80% of Indian design openings; no inline source.', 0.3),
    ],
  },
  {
    url: 'https://www.storyboard18.com/brand-makers/linkedins-skills-on-the-rise-2026-identifies-top-skill-stacks-reshaping-indias-workforce-90556.htm',
    title: 'LinkedIn Skills on the Rise 2026 (India) - coverage', publishedAt: '2026-02-24', category: 'JOB_MARKET',
    observations: [
      o('skill_demand', 'AI & automation', 'India', null, null, '2026', 'LinkedIn ranks AI and automation the fastest-growing skill stack in India for 2026; prompt engineering, workflow automation, LLMOps and API integration lead.', 0.8),
      o('skill_demand', 'Data & analytics', 'India', null, null, '2026', 'Data and analytics is the second-fastest-growing skill stack in India (data storytelling, querying, data-driven decisions).', 0.8),
      o('skill_demand', 'People & leadership', 'India', null, null, '2026', 'People and leadership skills (collaboration, team and stakeholder management) are one of five rising skill stacks in India.', 0.8),
      o('skill_demand', 'Visual storytelling', 'India', null, null, '2026', 'Visual storytelling appears among rising skills for marketing and business-growth roles in India.', 0.75),
      o('talent_gap', 'All roles', 'India', 74, '% of recruiters', '2026', '74% of recruiters in India report difficulty finding qualified talent (LinkedIn).', 0.8),
      o('other', 'Job seekers', 'India', 38, '%', '2026', '38% of Indian job seekers feel unprepared for how fast technology is changing the skills required (LinkedIn).', 0.8),
    ],
  },
  {
    url: 'https://www.storyboard18.com/digital/ai-reshaping-roles-but-95-of-job-listings-omit-it-report-ws-l-93591.htm',
    title: 'Indeed Hiring Lab Global Labour Market and Workforce Trends Chartbook (Feb 2026) - coverage', publishedAt: '2026-03-29', category: 'INDUSTRY_PERFORMANCE',
    observations: [
      o('other', 'AI mentions in job listings', 'Global', 95, '% of listings without AI', '2026', 'About 95% of Indeed job listings do not mention AI skills or tools (Indeed Hiring Lab, Feb 2026).', 0.85),
      o('ai_exposure', 'Jobs highly transformable by generative AI', 'Global', 25, '%', '2026', 'About 25% of jobs are highly transformable by generative AI (Indeed Hiring Lab).', 0.85),
      o('ai_exposure', 'Jobs with hybrid AI transformation', 'Global', 40, '%', '2026', 'About 40% of jobs are expected to see hybrid transformation, with AI supporting tasks and humans overseeing (Indeed Hiring Lab).', 0.85),
      o('ai_exposure', 'Skills fully automatable', 'Global', 1, '% (below)', '2026', 'Less than 1% of individual job skills can currently be fully automated (Indeed Hiring Lab).', 0.85),
    ],
  },
  {
    url: 'https://swarajyamag.com/economy/ai-data-skills-now-drive-two-in-three-new-gcc-jobs-in-india-as-hiring-rises-11-per-cent',
    title: 'Nasscom-Zinnov 2026: AI and data skills drive new GCC jobs in India - coverage', publishedAt: '2026-07-02', category: 'JOB_MARKET',
    observations: [
      o('hiring_volume', 'Global capability centres (GCCs)', 'India', 227991, 'count', '2026-H1', 'India GCCs hired about 228,000 people in the first half of 2026, up 11% year on year.', 0.8),
      o('hiring_growth', 'Broader white-collar hiring', 'India', -9, '% YoY', '2026-06', 'Broader white-collar hiring in India fell 9% year on year in June 2026 while GCC hiring grew.', 0.75),
      o('skill_demand', 'AI, data science, automation', 'India', 67, '% of new GCC roles', '2026', 'Nearly two in three new GCC roles in India require AI, data science or intelligent-automation skills.', 0.8),
      o('hiring_growth', 'AI, data science & analytics function', 'India', 38, '% YoY', '2026', 'AI, data science and analytics is the fastest-growing GCC function in India, up 38% year on year.', 0.8),
      o('location_share', 'GCC hiring: Bengaluru', 'India', 30, '%', '2026', 'Bengaluru accounts for about 30% of India GCC hiring; tier-2 cities are growing about 23% a year.', 0.8),
      o('experience_mix', 'GCC hiring: 4-10 years experience', 'India', 56, '%', '2026', 'Professionals with 4-10 years of experience make up about 56% of India GCC hiring; early-career hires about 30%.', 0.8),
      o('attrition', 'GCC attrition: tier-1 vs tier-2', 'India', null, null, '2026', 'Attrition is 8-12% in tier-2 cities versus 18-22% in tier-1 cities for India GCCs.', 0.75),
    ],
  },
]
