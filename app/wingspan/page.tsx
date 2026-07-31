'use client'

import { useWingspan } from '@/context/WingspanContext'
import { WelcomeScreen } from '@/components/screens/WelcomeScreen'
import { FootprintScreen } from '@/components/screens/FootprintScreen'
import { DiscoveryScreen } from '@/components/screens/DiscoveryScreen'
import { ValidationScreen } from '@/components/screens/ValidationScreen'
import { BlueprintScreen } from '@/components/screens/BlueprintScreen'

export default function WingspanPage() {
  const { state } = useWingspan()

  const screens = {
    welcome: <WelcomeScreen />,
    footprint: <FootprintScreen />,
    discovering: <DiscoveryScreen />,
    validating: <ValidationScreen />,
    blueprint: <BlueprintScreen />,
  }

  return screens[state.screen] ?? <WelcomeScreen />
}
