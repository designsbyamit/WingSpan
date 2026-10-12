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
  c('razorpay', 'Razorpay', 'PRODUCT', 'fintech', ['Bengaluru'], { careersUrl: 'https://razorpay.com/jobs/' }), c('cred', 'CRED', 'PRODUCT', 'fintech', ['Bengaluru']),
  c('groww', 'Groww', 'PRODUCT', 'fintech', ['Bengaluru']), c('phonepe', 'PhonePe', 'PRODUCT', 'fintech', ['Bengaluru', 'Pune'], { careersUrl: 'https://www.phonepe.com/careers/' }),
  c('slice', 'Slice', 'STARTUP', 'fintech', ['Bengaluru']), c('jupiter', 'Jupiter', 'STARTUP', 'fintech', ['Bengaluru']),
  c('navi', 'Navi', 'PRODUCT', 'fintech', ['Bengaluru']), c('paytm', 'Paytm', 'PRODUCT', 'fintech', ['Noida']),
  c('zeta', 'Zeta', 'PRODUCT', 'fintech', ['Bengaluru', 'Mumbai']), c('juspay', 'Juspay', 'PRODUCT', 'fintech', ['Bengaluru'], { careersUrl: 'https://juspay.in/careers' }),
  // commerce and consumer
  c('meesho', 'Meesho', 'PRODUCT', 'e-commerce', ['Bengaluru']), c('flipkart', 'Flipkart', 'PRODUCT', 'e-commerce', ['Bengaluru'], { careersUrl: 'https://www.flipkartcareers.com/' }),
  c('myntra', 'Myntra', 'PRODUCT', 'e-commerce', ['Bengaluru'], { careersUrl: 'https://careers.myntra.com/' }), c('nykaa', 'Nykaa', 'PRODUCT', 'e-commerce', ['Mumbai'], { careersUrl: 'https://www.nykaa.com/careers' }),
  c('swiggy', 'Swiggy', 'PRODUCT', 'consumer', ['Bengaluru'], { careersUrl: 'https://careers.swiggy.com/' }), c('zepto', 'Zepto', 'STARTUP', 'consumer', ['Mumbai', 'Bengaluru']),
  c('urbancompany', 'Urban Company', 'PRODUCT', 'consumer', ['Gurugram'], { careersUrl: 'https://careers.urbancompany.com/' }), c('lenskart', 'Lenskart', 'PRODUCT', 'consumer', ['Delhi', 'Bengaluru'], { careersUrl: 'https://www.lenskart.com/careers' }),
  c('rapido', 'Rapido', 'STARTUP', 'mobility', ['Bengaluru']), c('cars24', 'Cars24', 'PRODUCT', 'mobility', ['Gurugram']),
  c('dream11', 'Dream11', 'PRODUCT', 'gaming', ['Mumbai'], { careersUrl: 'https://www.dreamsports.group/careers' }), c('sharechat', 'ShareChat', 'PRODUCT', 'social', ['Bengaluru']),
  // SaaS and developer products
  c('postman', 'Postman', 'PRODUCT', 'saas', ['Bengaluru'], { careersUrl: 'https://www.postman.com/company/careers/' }), c('freshworks', 'Freshworks', 'PRODUCT', 'saas', ['Chennai'], { careersUrl: 'https://www.freshworks.com/company/careers/' }),
  c('browserstack', 'BrowserStack', 'PRODUCT', 'saas', ['Mumbai'], { careersUrl: 'https://www.browserstack.com/careers' }), c('chargebee', 'Chargebee', 'PRODUCT', 'saas', ['Chennai'], { careersUrl: 'https://www.chargebee.com/company/careers/' }),
  c('clevertap', 'CleverTap', 'PRODUCT', 'saas', ['Mumbai'], { careersUrl: 'https://clevertap.com/careers/' }), c('moengage', 'MoEngage', 'PRODUCT', 'saas', ['Bengaluru'], { careersUrl: 'https://www.moengage.com/careers/' }),
  c('whatfix', 'Whatfix', 'PRODUCT', 'saas', ['Bengaluru'], { careersUrl: 'https://whatfix.com/careers/' }), c('sprinklr', 'Sprinklr', 'PRODUCT', 'saas', ['Gurugram'], { careersUrl: 'https://www.sprinklr.com/careers/' }),
  c('innovaccer', 'Innovaccer', 'PRODUCT', 'healthtech', ['Noida']), c('zoho', 'Zoho', 'PRODUCT', 'saas', ['Chennai'], { careersUrl: 'https://www.zoho.com/careers/' }),
  // global product companies with Indian design teams
  c('figma', 'Figma', 'PRODUCT', 'design tools', ['Remote']), c('canva', 'Canva', 'PRODUCT', 'design tools', ['Remote'], { careersUrl: 'https://www.canva.com/careers/jobs/' }),
  c('atlassian', 'Atlassian', 'PRODUCT', 'saas', ['Bengaluru'], { careersUrl: 'https://www.atlassian.com/company/careers/all-jobs' }), c('notion', 'Notion', 'PRODUCT', 'saas', ['Remote']),
  c('miro', 'Miro', 'PRODUCT', 'saas', ['Remote']), c('rippling', 'Rippling', 'PRODUCT', 'saas', ['Bengaluru']),
  c('uber', 'Uber', 'PRODUCT', 'mobility', ['Bengaluru'], { careersUrl: 'https://www.uber.com/in/en/careers/list/' }), c('elastic', 'Elastic', 'PRODUCT', 'saas', ['Remote']),
  // GCCs and agencies (mostly outside public boards; tracked by careers page for now)
  c('thoughtworks', 'Thoughtworks', 'AGENCY', 'consulting', ['Bengaluru', 'Pune', 'Gurugram']),
  c('publicissapient', 'Publicis Sapient', 'AGENCY', 'consulting', ['Bengaluru', 'Gurugram']),
  c('sap', 'SAP Labs India', 'GCC', 'enterprise software', ['Bengaluru'], { careersUrl: 'https://jobs.sap.com/' }),
  c('adobe', 'Adobe', 'GCC', 'software', ['Noida', 'Bengaluru'], { careersUrl: 'https://careers.adobe.com/' }),
  c('google', 'Google', 'GCC', 'software', ['Bengaluru', 'Hyderabad'], { careersUrl: 'https://www.google.com/about/careers/applications/' }),
  c('microsoft', 'Microsoft', 'GCC', 'software', ['Hyderabad', 'Bengaluru'], { careersUrl: 'https://careers.microsoft.com/' }),
]
