import { lazy } from 'react'

// Single import closure reused for both the lazy component and the preloader, so warming
// the chunk hits the exact same webpack chunk instead of producing a duplicate.
const importSummaryPreview = () => import('./SummaryPreview')

// Kicks off the humanizer-carrying chunk before the rows mount (e.g. while the activity
// list is still fetching its data), so the full-row skeleton is skipped in the common case.
export const preloadSummaryPreview = importSummaryPreview

export default lazy(importSummaryPreview)
