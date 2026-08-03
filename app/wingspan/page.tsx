'use client'

import { useEffect } from 'react'
import { useWingspan } from '@/context/WingspanContext'
import { FootprintScreen } from '@/components/screens/FootprintScreen'
import { DiscoveryScreen } from '@/components/screens/DiscoveryScreen'
import { ValidationScreen } from '@/components/screens/ValidationScreen'
import { BlueprintScreen } from '@/components/screens/BlueprintScreen'
import { TopNav } from '@/components/layout/TopNav'

export default function WingspanPage() {
  const { state, dispatch } = useWingspan()

  // Skip WelcomeScreen — go directly to footprint
  useEffect(() => {
    if (state.screen === 'welcome') {
      dispatch({ type: 'SET_SCREEN', screen: 'footprint' })
    }
  }, [state.screen, dispatch])

  const screens = {
    welcome: <FootprintScreen />,
    footprint: <FootprintScreen />,
    discovering: <DiscoveryScreen />,
    validating: <ValidationScreen />,
    blueprint: <BlueprintScreen />,
  }

  return (
    <>
      <TopNav />
      {screens[state.screen] ?? <FootprintScreen />}
    </>
  )
}
