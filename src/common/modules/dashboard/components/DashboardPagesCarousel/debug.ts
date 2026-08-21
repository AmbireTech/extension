import { isDev } from '@common/config/env'

// TEMPORARY: diagnostics for the dashboard carousel's scroll carry-over.
// Remove this file and its call sites once the behaviour is settled.
const debugCarousel = (event: string, data?: Record<string, unknown>) => {
  if (!isDev) return

  console.log(`[carousel] ${event}`, data ? JSON.stringify(data) : '')
}

export default debugCarousel
