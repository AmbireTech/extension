import { lazy } from 'react'

// Keep the message visualization renderer out of the UI's eager bundle.
export default lazy(() => import('./CompactMessagePreview'))
