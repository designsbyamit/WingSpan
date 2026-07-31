'use client'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts'

export interface CompetencyRadarData {
  competency: string  // label — truncated to 18 chars
  level: number       // 0–10 (UserCompetency.level), scaled to 0–100 for display
  target: number      // 60 — aspirational reference line
}

interface Props {
  data: CompetencyRadarData[]
}

export function CompetencyRadar({ data }: Props) {
  const chartData = data.map(d => ({
    ...d,
    competency:
      d.competency.length > 18
        ? d.competency.slice(0, 17) + '…'
        : d.competency,
  }))

  return (
    <div className="w-full h-[420px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={chartData}
          margin={{ top: 24, right: 40, bottom: 24, left: 40 }}
        >
          <PolarGrid
            stroke="#353B45"
            strokeOpacity={0.9}
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="competency"
            tick={{
              fill: '#6b7280',
              fontSize: 11,
              fontFamily: 'var(--font-jakarta, sans-serif)',
            }}
          />
          {/* Target reference line at 60 */}
          <Radar
            name="Target"
            dataKey="target"
            stroke="#B6FF2E"
            strokeWidth={1}
            strokeDasharray="4 4"
            fill="#B6FF2E"
            fillOpacity={0.04}
            animationDuration={800}
            isAnimationActive={true}
          />
          {/* User's actual levels */}
          <Radar
            name="Your Score"
            dataKey="level"
            stroke="#B6FF2E"
            strokeWidth={2}
            fill="#B6FF2E"
            fillOpacity={0.28}
            animationDuration={1500}
            isAnimationActive={true}
          />
          <Legend
            iconSize={10}
            wrapperStyle={{
              fontSize: '11px',
              fontFamily: 'var(--font-jakarta, sans-serif)',
              color: '#6b7280',
              paddingTop: '8px',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
