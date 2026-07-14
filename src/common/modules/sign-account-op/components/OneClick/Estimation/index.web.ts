import { lazy } from 'react'

// Lazy load on web/extension so webpack code-splits it out of the route bundle
// for instant navigation. On mobile see `index.native.ts` (static import).
export default lazy(() => import('./Estimation'))
