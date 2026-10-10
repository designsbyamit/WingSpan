'use client'
import { createContext, useContext } from 'react'
import type { BlueprintStep } from '@/types/wingspan'

export interface ShellActions {
  goTo: (section: BlueprintStep) => void
  /** Opens "Save version" (asks a guest to sign in first). */
  openSave: () => void
  openVersions: () => void
  /** Downloads the Notion markdown export (asks a guest to sign in first). */
  exportMarkdown: () => void
  exporting: boolean
  openDeepAnalysis: (() => void) | null
  openSignIn: () => void
  signedIn: boolean
  authLoading: boolean
}

const noop = () => {}

export const ShellContext = createContext<ShellActions>({
  goTo: noop, openSave: noop, openVersions: noop, exportMarkdown: noop, exporting: false,
  openDeepAnalysis: null, openSignIn: noop, signedIn: false, authLoading: true,
})

export const useShell = () => useContext(ShellContext)
