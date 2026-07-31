// lib/template.ts
import * as XLSX from 'xlsx'

export function generateProjectRepositoryTemplate(): Buffer {
  const wb = XLSX.utils.book_new()

  const projects = XLSX.utils.aoa_to_sheet([
    ['Project Name', 'Company', 'Year', 'Industry', 'Platform', 'Audience', 'Project Summary', 'Impact', 'Project Link'],
    ['Example Project', 'Acme Corp', '2024', 'FinTech', 'Web', 'B2B', 'Redesigned onboarding flow', 'Reduced drop-off by 40%', 'https://'],
  ])
  XLSX.utils.book_append_sheet(wb, projects, 'Projects')

  const contributions = XLSX.utils.aoa_to_sheet([
    ['Project Name', 'Research', 'Stakeholder Interviews', 'Workshops', 'Journey Mapping', 'IA', 'Wireframing', 'Visual Design', 'Prototyping', 'Usability Testing', 'Design Systems', 'Analytics', 'Developer Handoff', 'Leadership'],
    ['Example Project', 'Yes', 'Yes', '', 'Yes', '', 'Yes', 'Yes', 'Yes', '', '', '', 'Yes', ''],
  ])
  XLSX.utils.book_append_sheet(wb, contributions, 'Contributions')

  const skills = XLSX.utils.aoa_to_sheet([
    ['Skill', 'Confidence (1-5)', 'Years of Experience'],
    ['Product Design', '5', '6'],
  ])
  XLSX.utils.book_append_sheet(wb, skills, 'Skills')

  const certs = XLSX.utils.aoa_to_sheet([
    ['Certification', 'Provider', 'Year'],
    ['Google UX Design Certificate', 'Google', '2022'],
  ])
  XLSX.utils.book_append_sheet(wb, certs, 'Certifications')

  const talks = XLSX.utils.aoa_to_sheet([
    ['Type', 'Title', 'Year', 'Link'],
    ['Talk', 'Designing for Complexity', '2023', 'https://'],
  ])
  XLSX.utils.book_append_sheet(wb, talks, 'Talks & Publications')

  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}
