'use client'

import { useWingspan } from '@/context/WingspanContext'
import { FootprintScreen } from '@/components/screens/FootprintScreen'
import { ValidationScreen } from '@/components/screens/ValidationScreen'
import { BlueprintScreen } from '@/components/screens/BlueprintScreen'
import { TopNav } from '@/components/layout/TopNav'

export default function WingspanPage() {
  const { state } = useWingspan()

  const screens = {
    footprint: <FootprintScreen />,
    // 'discovering' is no longer a separate step: progress lives on the processed-data screen.
    discovering: <ValidationScreen />,
    validating: <ValidationScreen />,
    blueprint: <BlueprintScreen />,
  }

  return (
    <>
      {state.screen !== 'blueprint' && <TopNav />}
      {screens[state.screen as keyof typeof screens] ?? <FootprintScreen />}
    </>
  )
}
