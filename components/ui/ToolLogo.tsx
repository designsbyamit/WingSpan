// components/ui/ToolLogo.tsx
'use client'

const TOOL_LOGOS: Record<string, string> = {
  'Figma':            'https://cdn.simpleicons.org/figma/a3e635',
  'Framer':           'https://cdn.simpleicons.org/framer/a3e635',
  'Miro':             'https://cdn.simpleicons.org/miro/a3e635',
  'Notion':           'https://cdn.simpleicons.org/notion/f0f0f0',
  'Jira':             'https://cdn.simpleicons.org/jira/a3e635',
  'JIRA':             'https://cdn.simpleicons.org/jira/a3e635',
  'Adobe CC':         'https://cdn.simpleicons.org/adobe/a3e635',
  'ChatGPT':          'https://cdn.simpleicons.org/openai/f0f0f0',
  'GitHub':           'https://cdn.simpleicons.org/github/f0f0f0',
  'Slack':            'https://cdn.simpleicons.org/slack/a3e635',
  'Cursor':           'https://cdn.simpleicons.org/cursor/f0f0f0',
  'FigJam':           'https://cdn.simpleicons.org/figma/a3e635',
  'Google Analytics': 'https://cdn.simpleicons.org/googleanalytics/a3e635',
  'Typeform':         'https://cdn.simpleicons.org/typeform/a3e635',
}

interface ToolLogoProps {
  name: string
  size?: number
}

export function ToolLogo({ name, size = 20 }: ToolLogoProps) {
  const url = TOOL_LOGOS[name]

  if (!url) {
    const initials = name.slice(0, 2).toUpperCase()
    return (
      <div
        className="flex items-center justify-center rounded-[6px] bg-[var(--surface)] border border-[var(--border-ws)] text-[var(--text-muted)] font-bold"
        style={{ width: size + 8, height: size + 8, fontSize: size * 0.45 }}
      >
        {initials}
      </div>
    )
  }

  return (
    <div
      className="flex items-center justify-center rounded-[6px] bg-[var(--surface)] border border-[var(--border-ws)]"
      style={{ width: size + 8, height: size + 8 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        style={{ objectFit: 'contain' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    </div>
  )
}
