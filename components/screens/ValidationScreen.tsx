'use client'
// Processed-data screen (screen: 'validating', also used for the legacy 'discovering' value).
// Leads with what we read from the resume; the background analysis reports through a compact
// status line and a live activity drawer, and offers the Blueprint the moment it is ready.
import { useCallback, useMemo, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { useWingspan } from '@/context/WingspanContext'
import { runCareerPipeline } from '@/lib/pipeline'
import { experienceFacts } from '@/lib/experience'
import { ActivityDrawer } from '@/components/onboarding/ActivityDrawer'
import { AnalysisStatus } from '@/components/onboarding/AnalysisStatus'
import {
  CareerTimeline, EducationList, FocusList, IdentityHeader, KpiStrip, ProjectsList, SkillsList,
} from '@/components/onboarding/ProfileSections'
import { primaryButton } from '@/components/onboarding/ui'

export function ValidationScreen() {
  const { state, dispatch } = useWingspan()
  const { extractedData } = state
  const [drawerOpen, setDrawerOpen] = useState(false)

  const facts = useMemo(() => experienceFacts(extractedData?.timeline ?? []), [extractedData?.timeline])

  const openBlueprint = () => {
    if (extractedData) dispatch({ type: 'SET_VALIDATED_DATA', data: { ...extractedData, interests: state.interests } })
    dispatch({ type: 'SET_SCREEN', screen: 'blueprint' })
  }

  const retry = () => {
    if (!extractedData) return
    void runCareerPipeline(extractedData, state.interests, dispatch)
  }

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  if (!extractedData) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 pt-20">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sora)' }}>
            Your resume hasn&apos;t been read yet
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Upload your resume to start the analysis.</p>
          <button type="button" className={`${primaryButton} mt-6`} onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'footprint' })}>
            Upload your resume
          </button>
        </div>
      </main>
    )
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="mx-auto w-full max-w-5xl px-4 pb-40 pt-24 sm:px-6 md:pb-20 md:pt-28">
        <div className="flex flex-col gap-6">
          <IdentityHeader facts={facts} />
          <AnalysisStatus
            onOpenDetails={() => setDrawerOpen(true)}
            onOpenBlueprint={openBlueprint}
            onRetry={retry}
          />
          <KpiStrip data={extractedData} years={facts.years} />
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-14">
          <div className="flex flex-col gap-12">
            <CareerTimeline entries={extractedData.timeline ?? []} />
            <ProjectsList projects={extractedData.projects ?? []} />
          </div>
          <aside className="flex flex-col gap-10" aria-label="Skills, education and focus">
            <SkillsList skills={extractedData.skills ?? []} />
            <EducationList education={extractedData.education ?? []} />
            <FocusList interests={state.interests} />
          </aside>
        </div>
      </main>

      <ActivityDrawer open={drawerOpen} onClose={closeDrawer} />
    </MotionConfig>
  )
}
