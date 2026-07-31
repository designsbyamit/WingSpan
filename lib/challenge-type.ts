// lib/challenge-type.ts

export type ChallengeType = 'observation' | 'analysis' | 'creation' | 'reflection' | 'research'

export interface ChallengeField {
  id: string
  label: string
  placeholder: string
  multiline: boolean
}

export function detectChallengeType(scenarioText: string): ChallengeType {
  const t = scenarioText.toLowerCase()
  if (/find.*example|document.*example|photograph|spot.*example|hunt.*app|observe/i.test(t)) return 'observation'
  if (/critique|analyze|audit|review.*design|evaluate/i.test(t)) return 'analysis'
  if (/design.*dashboard|create.*system|build.*component|design.*color|create.*timeline/i.test(t)) return 'creation'
  if (/write.*statement|keep.*journal|reflect|designer.*statement|observation journal/i.test(t)) return 'reflection'
  if (/research.*discipline|document.*language|choose.*discipline|pick.*app.*document/i.test(t)) return 'research'
  return 'reflection'
}

export function getChallengeFields(type: ChallengeType, scenarioText: string): ChallengeField[] {
  switch (type) {
    case 'observation': {
      const countMatch = scenarioText.match(/\b(\d+)\s+examples?\b/i)
      const count = countMatch ? Math.min(parseInt(countMatch[1]), 5) : 3
      return Array.from({ length: count }, (_, i) => ([
        { id: `example-${i + 1}-what`, label: `Example ${i + 1} — What is it?`, placeholder: 'Describe the designed thing...', multiline: false },
        { id: `example-${i + 1}-problem`, label: 'What problem does it solve?', placeholder: 'What would be worse without this design decision?', multiline: false },
        { id: `example-${i + 1}-decision`, label: 'What specific decision makes it work?', placeholder: 'The detail that makes the difference is...', multiline: false },
      ])).flat()
    }

    case 'analysis':
      return [
        { id: 'artifact', label: 'What are you analyzing?', placeholder: 'Name the product, poster, or interface...', multiline: false },
        { id: 'what-works', label: 'What works well and why?', placeholder: 'Be specific — name the principle at work...', multiline: true },
        { id: 'what-fails', label: 'What fails and why?', placeholder: 'What would you change and what would improve?', multiline: true },
        { id: 'insight', label: 'What did you learn?', placeholder: 'The most surprising thing I noticed was...', multiline: true },
      ]

    case 'creation':
      return [
        { id: 'approach', label: 'Describe your approach', placeholder: 'What decisions did you make and why?', multiline: true },
        { id: 'challenges', label: 'What was hardest?', placeholder: 'The constraint that shaped the design most was...', multiline: true },
        { id: 'link', label: 'Link to your work (optional)', placeholder: 'Figma, Notion, image URL...', multiline: false },
      ]

    case 'research':
      return [
        { id: 'topic', label: 'What did you research?', placeholder: 'The discipline or topic I explored...', multiline: false },
        { id: 'finding-1', label: 'Most surprising finding', placeholder: 'I did not expect to discover...', multiline: true },
        { id: 'finding-2', label: 'How does it connect to your own practice?', placeholder: 'This changes how I think about...', multiline: true },
      ]

    case 'reflection':
    default:
      return [
        { id: 'reflection', label: 'Your reflection', placeholder: 'Write your response here...', multiline: true },
      ]
  }
}
