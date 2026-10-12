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
    url: 'https://design.careers360.com/articles/iit-bombay-design-placement',
    title: 'IDC School of Design, IIT Bombay: placements 2023-24 (Careers360, citing the institute placement report)', publishedAt: '2026-03-18', category: 'JOB_MARKET',
    observations: [
      o('placement_rate', 'IDC IIT Bombay M.Des', 'India', 57.1, '% of participants placed', '2023-24', 'IDC IIT Bombay 2023-24: 36 of 63 participating M.Des students placed on campus (57.1%).', 0.6),
      o('placement_rate', 'IDC IIT Bombay B.Des', 'India', 52.9, '% of participants placed', '2023-24', 'IDC IIT Bombay 2023-24: 9 of 17 participating B.Des students placed on campus (52.9%).', 0.6),
      o('hiring_volume', 'Design offers at IIT Bombay', 'India', 33, 'offers', '2023-24', 'IIT Bombay received 33 design offers from 17 companies in 2023-24, about 2.2% of all its campus offers; recruiters include Google, Microsoft, Adobe, Oracle, Atlassian, Nvidia, Samsung, Myntra.', 0.6),
    ],
  },
  {
    url: 'https://design.careers360.com/articles/iit-placements-for-bdesign',
    title: 'B.Des placements at IITs 2023-24 (Careers360)', publishedAt: null, category: 'JOB_MARKET',
    observations: [
      o('placement_rate', 'IIT Guwahati design', 'India', 55, '% placed', '2023-24', 'IIT Guwahati design placement was 55% in 2023-24, down from 74% in 2022-23 and 71% in 2021-22.', 0.6),
      o('salary', 'IIT Guwahati design (median)', 'India', 30.75, 'INR lakh/yr', '2023-24', 'IIT Guwahati design median package 30.75 LPA (average 36.17, lowest 8.16) in 2023-24; applies to the placed minority from a top-tier institute.', 0.6),
      o('placement_rate', 'IIT Hyderabad design', 'India', 12.5, '% placed', '2023-24', 'IIT Hyderabad design placement fell to 12.5% in 2023-24 from 55.6% in 2022-23.', 0.6),
    ],
  },
  {
    url: 'https://design.careers360.com/articles/nid-placements',
    title: 'NID placements (Careers360, data to 2023-24)', publishedAt: '2025-12-19', category: 'JOB_MARKET',
    observations: [
      o('placement_rate', 'NID offers per student', 'India', 69, '% offers per student (derived)', '2023-24', 'NID campuses recorded offers equal to roughly 65-73% of students in 2023-24, down from about 83-87% in 2021-22 (derived from reported counts, not an official placement rate).', 0.5),
      o('salary', 'NID lowest package', 'India', 3, 'INR lakh/yr', '2023-24', 'NID campus-wide lowest packages ran about 3-4 LPA through 2021-24; highest 30-46 LPA. Recruiters include Microsoft, Cognizant, Titan, Hindustan Unilever, Hero MotoCorp.', 0.5),
    ],
  },
  {
    url: 'https://www.peoplematters.in/news/workforce-planning/fresher-hiring-intent-rises-to-75percent-but-it-demand-loses-ground-report-51352',
    title: 'TeamLease EdTech fresher hiring outlook, July-December 2026 (1,097 employers) - coverage', publishedAt: '2026-08-11', category: 'JOB_MARKET',
    observations: [
      o('fresher_hiring_intent', 'All employers', 'India', 75, '% of employers', '2026-H2', '75% of employers plan to hire freshers in July-December 2026, up from 73% in the first half (TeamLease EdTech, 1,097 employers).', 0.75),
      o('fresher_hiring_intent', 'E-commerce and tech startups', 'India', 93, '% of employers', '2026-H2', 'E-commerce and tech startups show the highest fresher hiring intent, 93% of surveyed employers.', 0.75),
      o('fresher_hiring_intent', 'IT', 'India', 76, '% of employers', '2026-H2', 'IT fresher hiring intent fell to 76% from 81% in the first half of 2026.', 0.75),
      o('fresher_hiring_intent', 'Marketing, advertising and media', 'India', null, null, '2026-H2', 'Consulting, telecom, marketing and advertising, media and entertainment, and education services all reduced fresher hiring plans (no figures given).', 0.7),
      o('fresher_hiring_intent', 'Bengaluru', 'India', 89, '% of employers', '2026-H2', 'Bengaluru has the highest city-level fresher hiring intent (89%), then Mumbai 75%, Chennai 71%, Hyderabad 60%, Delhi 49%, Pune 41%.', 0.75),
      o('entry_requirement', 'Entry-level skills sought', 'India', null, null, '2026-H2', 'Employers say they want AI fluency, applied problem-solving and hands-on project experience, shown through internships, portfolios, assessments and real projects.', 0.75),
    ],
  },
  {
    url: 'https://newsable.asianetnews.com/business/indias-fresher-hiring-to-rise-in-2026-employers-want-proofofwork-articleshow-65p63xu',
    title: 'TeamLease EdTech Career Outlook Report, January-June 2026 (1,051 employers) - coverage', publishedAt: '2026-02-18', category: 'JOB_MARKET',
    observations: [
      o('fresher_hiring_intent', 'All employers', 'India', 73, '% of employers', '2026-H1', 'About 73% of Indian employers planned to hire freshers in January-June 2026, up about 3 points (TeamLease EdTech, 1,051 employers).', 0.75),
      o('entry_requirement', 'Proof of work', 'India', null, null, '2026-H1', 'Employers value proof of work (internships, real projects, active online professional communities) above degrees alone; applied-skill candidates advance faster.', 0.75),
    ],
  },
  {
    url: 'https://www.businesstoday.in/amp/jobs/story/ai-gccs-and-a-changing-job-market-indias-fresher-hiring-is-no-longer-just-an-it-story-whos-driving-the-shift-547654-2026-08-06',
    title: 'foundit Insights Tracker July 2026: fresher hiring in India - coverage', publishedAt: '2026-08-06', category: 'JOB_MARKET',
    observations: [
      o('hiring_growth', 'Entry-level hiring', 'India', -10, '% YoY', '2026-07', 'Overall entry-level hiring in India fell about 10% year on year in July 2026 and 2% month on month (foundit).', 0.7),
      o('experience_mix', 'IT share of fresher hiring', 'India', 24, '%', '2026', 'IT\'s share of fresher hiring fell from 32% in 2025 to 24% in 2026; GCCs rose from 8% to 11% (foundit).', 0.7),
      o('skill_demand', 'AI-led fresher roles', 'India', 4, '% of fresher hiring', '2026', 'AI-led roles are about 4% of fresher hiring, up from about 1% a year earlier; 51% are AI operations roles rather than model building (foundit).', 0.7),
      o('entry_requirement', 'Internship expectation', 'India', 60, '% of fresher postings', '2026', 'Nearly six in ten fresher postings prefer or require prior internships, while 42% accept none (foundit).', 0.7),
      o('location_share', 'Fresher hiring: Delhi NCR', 'India', 19, '%', '2026', 'Delhi NCR leads fresher hiring (19%), then Bengaluru and Mumbai and Pune (14% each), Hyderabad 11%, Chennai 9%; tier-2 cities such as Coimbatore, Jaipur and Kochi fell less (foundit).', 0.7),
    ],
  },
  {
    url: 'https://www.naukri.com/blog/naukri-jobspeak-white-collar-hiring-opens-2026-with-3-yoy-growth-driven-by-non-it-sectors-and-fresher-hiring/amp',
    title: 'Naukri JobSpeak January 2026', publishedAt: '2026-02-01', category: 'JOB_MARKET',
    observations: [
      o('hiring_growth', 'Fresher (0-3 years) hiring', 'India', 8, '% YoY', '2026-01', 'Naukri JobSpeak: fresher hiring (0-3 years) up about 8% year on year in January 2026, led by non-IT sectors; the report does not break out design roles.', 0.8),
      o('hiring_growth', 'AI/ML roles', 'India', 34, '% YoY', '2026-01', 'Naukri JobSpeak: AI/ML roles up about 34% year on year in January 2026.', 0.8),
    ],
  },
  {
    url: 'https://digitaleconomy.stanford.edu/publications/canaries-in-the-coal-mine',
    title: 'Canaries in the Coal Mine? Stanford Digital Economy Lab (revised August 2026)', publishedAt: '2026-08-12', category: 'JOB_MARKET',
    observations: [
      o('entry_level_employment', 'Early-career workers (22-25) in AI-exposed jobs', 'US', -19, '% relative gap', 'through 2026-06', 'Employment of 22-25 year olds in AI-exposed occupations is about 19% below where it would be if it had tracked less-exposed peers; no comparable gap for experienced workers; no economy-wide displacement found (ADP payroll data).', 0.9),
    ],
  },
  {
    url: 'https://www.newyorkfed.org/research/college-labor-market',
    title: 'New York Fed: labor market for recent college graduates (2026 Q2)', publishedAt: '2026-09-01', category: 'JOB_MARKET',
    observations: [
      o('unemployment_rate', 'Recent college graduates', 'US', 5.6, '%', '2026-Q2', 'Recent-graduate unemployment is about 5.6% in 2026 Q2.', 0.95),
      o('entry_level_employment', 'Recent graduate underemployment', 'US', 42, '%', '2026-Q2', 'About 42% of recent graduates are underemployed, in jobs not typically requiring a degree (2026 Q2).', 0.95),
    ],
  },
  {
    url: 'https://www.uxdesigninstitute.com/state-of-ux-hiring',
    title: 'State of UX Hiring (UX Design Institute, 500+ UX professionals and hiring managers)', publishedAt: null, category: 'INDUSTRY_PERFORMANCE',
    observations: [
      o('entry_requirement', 'Portfolio importance (UX hiring managers)', 'Global', 90, '% of hiring managers', '2024', '90% of UX hiring managers say a portfolio is an important part of an application; reviewers skim one or two case studies, so a few strong ones beat many.', 0.55),
      o('entry_requirement', 'Entry-level UX skill sought', 'Global', null, null, '2024', 'Problem-solving ranks as the top skill hiring managers want from entry-level UX candidates; transferable skills from other careers are valued when linked to the role.', 0.55),
    ],
  },
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
