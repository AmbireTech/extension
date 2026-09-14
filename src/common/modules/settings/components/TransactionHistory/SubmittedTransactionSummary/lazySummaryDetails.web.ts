import { lazy } from 'react'

// Lazy so the humanizer (pulled in via SummaryDetails) stays out of the main bundle.
export default lazy(() => import('./SummaryDetails'))
