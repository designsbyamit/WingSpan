// The curated employer list the product owner maintains. Seeded companies outrank anything machine-found.
// The job-board type and name are discovered automatically on first crawl; add `ats` here once a board is confirmed,
// or `careersUrl` for companies whose boards are not on a public feed.

export interface CompanySeed {
  key: string; name: string; kind: 'PRODUCT' | 'GCC' | 'STARTUP' | 'AGENCY' | 'ENTERPRISE'; sector: string
  cities: string[]; ats?: { type: 'GREENHOUSE' | 'LEVER' | 'ASHBY' | 'WORKABLE'; token: string }; careersUrl?: string
}
const c = (key: string, name: string, kind: CompanySeed['kind'], sector: string, cities: string[], extra: Partial<CompanySeed> = {}): CompanySeed => ({ key, name, kind, sector, cities, ...extra })

export const COMPANIES: CompanySeed[] = [
  // fintech
  c('razorpay', 'Razorpay', 'PRODUCT', 'fintech', ['Bengaluru']), c('cred', 'CRED', 'PRODUCT', 'fintech', ['Bengaluru']),
  c('groww', 'Groww', 'PRODUCT', 'fintech', ['Bengaluru']), c('phonepe', 'PhonePe', 'PRODUCT', 'fintech', ['Bengaluru', 'Pune']),
  c('slice', 'Slice', 'STARTUP', 'fintech', ['Bengaluru']), c('jupiter', 'Jupiter', 'STARTUP', 'fintech', ['Bengaluru']),
  c('navi', 'Navi', 'PRODUCT', 'fintech', ['Bengaluru']), c('paytm', 'Paytm', 'PRODUCT', 'fintech', ['Noida']),
  c('zeta', 'Zeta', 'PRODUCT', 'fintech', ['Bengaluru', 'Mumbai']), c('juspay', 'Juspay', 'PRODUCT', 'fintech', ['Bengaluru']),
  // commerce and consumer
  c('meesho', 'Meesho', 'PRODUCT', 'e-commerce', ['Bengaluru']), c('flipkart', 'Flipkart', 'PRODUCT', 'e-commerce', ['Bengaluru']),
  c('myntra', 'Myntra', 'PRODUCT', 'e-commerce', ['Bengaluru']), c('nykaa', 'Nykaa', 'PRODUCT', 'e-commerce', ['Mumbai']),
  c('swiggy', 'Swiggy', 'PRODUCT', 'consumer', ['Bengaluru']), c('zepto', 'Zepto', 'STARTUP', 'consumer', ['Mumbai', 'Bengaluru']),
  c('urbancompany', 'Urban Company', 'PRODUCT', 'consumer', ['Gurugram']), c('lenskart', 'Lenskart', 'PRODUCT', 'consumer', ['Delhi', 'Bengaluru']),
  c('rapido', 'Rapido', 'STARTUP', 'mobility', ['Bengaluru']), c('cars24', 'Cars24', 'PRODUCT', 'mobility', ['Gurugram']),
  c('dream11', 'Dream11', 'PRODUCT', 'gaming', ['Mumbai']), c('sharechat', 'ShareChat', 'PRODUCT', 'social', ['Bengaluru']),
  // SaaS and developer products
  c('postman', 'Postman', 'PRODUCT', 'saas', ['Bengaluru']), c('freshworks', 'Freshworks', 'PRODUCT', 'saas', ['Chennai']),
  c('browserstack', 'BrowserStack', 'PRODUCT', 'saas', ['Mumbai']), c('chargebee', 'Chargebee', 'PRODUCT', 'saas', ['Chennai']),
  c('clevertap', 'CleverTap', 'PRODUCT', 'saas', ['Mumbai']), c('moengage', 'MoEngage', 'PRODUCT', 'saas', ['Bengaluru']),
  c('whatfix', 'Whatfix', 'PRODUCT', 'saas', ['Bengaluru']), c('sprinklr', 'Sprinklr', 'PRODUCT', 'saas', ['Gurugram']),
  c('innovaccer', 'Innovaccer', 'PRODUCT', 'healthtech', ['Noida']), c('zoho', 'Zoho', 'PRODUCT', 'saas', ['Chennai'], { careersUrl: 'https://www.zoho.com/careers/' }),
  // global product companies with Indian design teams
  c('figma', 'Figma', 'PRODUCT', 'design tools', ['Remote']), c('canva', 'Canva', 'PRODUCT', 'design tools', ['Remote']),
  c('atlassian', 'Atlassian', 'PRODUCT', 'saas', ['Bengaluru']), c('notion', 'Notion', 'PRODUCT', 'saas', ['Remote']),
  c('miro', 'Miro', 'PRODUCT', 'saas', ['Remote']), c('rippling', 'Rippling', 'PRODUCT', 'saas', ['Bengaluru']),
  c('uber', 'Uber', 'PRODUCT', 'mobility', ['Bengaluru']), c('elastic', 'Elastic', 'PRODUCT', 'saas', ['Remote']),
  // GCCs and agencies (mostly outside public boards; tracked by careers page for now)
  c('thoughtworks', 'Thoughtworks', 'AGENCY', 'consulting', ['Bengaluru', 'Pune', 'Gurugram']),
  c('publicissapient', 'Publicis Sapient', 'AGENCY', 'consulting', ['Bengaluru', 'Gurugram']),
  c('sap', 'SAP Labs India', 'GCC', 'enterprise software', ['Bengaluru'], { careersUrl: 'https://jobs.sap.com/' }),
  c('adobe', 'Adobe', 'GCC', 'software', ['Noida', 'Bengaluru'], { careersUrl: 'https://careers.adobe.com/' }),
  c('google', 'Google', 'GCC', 'software', ['Bengaluru', 'Hyderabad'], { careersUrl: 'https://www.google.com/about/careers/applications/' }),
  c('microsoft', 'Microsoft', 'GCC', 'software', ['Hyderabad', 'Bengaluru'], { careersUrl: 'https://careers.microsoft.com/' }),
]
