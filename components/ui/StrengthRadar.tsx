// components/ui/StrengthRadar.tsx
'use client'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { Strength } from '@/types/wingspan'

interface StrengthRadarProps {
  strengths: Strength[]
}

export function StrengthRadar({ strengths }: StrengthRadarProps) {
  const data = strengths.map((s) => ({
    subject: s.name.length > 14 ? s.name.slice(0, 14) + '…' : s.name,
    value: s.confidence,
    fullMark: 100,
  }))

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 16, right: 24, bottom: 16, left: 24 }}>
          <PolarGrid stroke="var(--border-ws)" strokeOpacity={0.6} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-jakarta)' }}
          />
          <Radar
            name="Strengths"
            dataKey="value"
            stroke="#a3e635"
            fill="#a3e635"
            fillOpacity={0.12}
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
