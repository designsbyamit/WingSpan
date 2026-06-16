// context/WingspanContext.tsx
'use client'

import { createContext, useContext, useReducer, ReactNode } from 'react'
import {
  WingspanState,
  WingspanAction,
  DiscoveryProgress,
} from '@/types/wingspan'

const initialProgress: DiscoveryProgress = {
  currentStep: null,
  completedSteps: [],
  observations: [],
  percentage: 0,
}

const initialState: WingspanState = {
  screen: 'welcome',
  files: [],
  urls: {},
  interests: [],
  extractedData: null,
  discoveryProgress: initialProgress,
  validatedData: null,
  blueprint: null,
  error: null,
}

function reducer(state: WingspanState, action: WingspanAction): WingspanState {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.screen, error: null }
    case 'SET_FILES':
      return { ...state, files: action.files }
    case 'SET_URL':
      return { ...state, urls: { ...state.urls, [action.key]: action.value } }
    case 'TOGGLE_INTEREST':
      return {
        ...state,
        interests: state.interests.includes(action.interest)
          ? state.interests.filter((i) => i !== action.interest)
          : state.interests.length < 5
          ? [...state.interests, action.interest]
          : state.interests,
      }
    case 'SET_EXTRACTED_DATA':
      return { ...state, extractedData: action.data }
    case 'SET_DISCOVERY_STEP':
      return {
        ...state,
        discoveryProgress: {
          ...state.discoveryProgress,
          currentStep: action.step,
          percentage: action.percentage,
        },
      }
    case 'ADD_OBSERVATION':
      return {
        ...state,
        discoveryProgress: {
          ...state.discoveryProgress,
          observations: [...state.discoveryProgress.observations, action.text],
        },
      }
    case 'COMPLETE_STEP':
      return {
        ...state,
        discoveryProgress: {
          ...state.discoveryProgress,
          completedSteps: [...state.discoveryProgress.completedSteps, action.step],
        },
      }
    case 'SET_VALIDATED_DATA':
      return { ...state, validatedData: action.data }
    case 'UPDATE_TIMELINE_ENTRY':
      return {
        ...state,
        extractedData: state.extractedData
          ? {
              ...state.extractedData,
              timeline: state.extractedData.timeline.map((e) =>
                e.id === action.entry.id ? action.entry : e
              ),
            }
          : state.extractedData,
      }
    case 'REMOVE_TIMELINE_ENTRY':
      return {
        ...state,
        extractedData: state.extractedData
          ? {
              ...state.extractedData,
              timeline: state.extractedData.timeline.filter((e) => e.id !== action.id),
            }
          : state.extractedData,
      }
    case 'SET_BLUEPRINT':
      return { ...state, blueprint: action.blueprint }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

const WingspanContext = createContext<{
  state: WingspanState
  dispatch: React.Dispatch<WingspanAction>
} | null>(null)

export function WingspanProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <WingspanContext.Provider value={{ state, dispatch }}>
      {children}
    </WingspanContext.Provider>
  )
}

export function useWingspan() {
  const ctx = useContext(WingspanContext)
  if (!ctx) throw new Error('useWingspan must be used within WingspanProvider')
  return ctx
}
