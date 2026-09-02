import { lazy } from 'react'

// Keep the humanizer and its large address dataset out of the UI's eager bundle.
export default lazy(() => import('./CompactHumanizedCalls'))
