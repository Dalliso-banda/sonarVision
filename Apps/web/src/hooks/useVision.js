import { useSyncExternalStore } from 'react'
import { getSnapshot, subscribe } from '../services/vision'

export const useVision = () => useSyncExternalStore(subscribe, getSnapshot)
