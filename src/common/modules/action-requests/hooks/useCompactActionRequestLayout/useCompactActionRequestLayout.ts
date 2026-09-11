import { isMobile, isWeb } from '@common/config/env'
import useWindowSize from '@common/hooks/useWindowSize'

/**
 * Single source of truth for compact vs desktop layout across the app.
 *
 * Compact = mobile, or a web surface narrower than the `s` / 576px breakpoint - the side panel,
 * the request window that is sized to match it, the popup and a narrow tab alike. Wider surfaces
 * keep the desktop / two-column layouts.
 */
const useCompactActionRequestLayout = () => {
  const { minWidthSize } = useWindowSize()
  const isNarrowWebLayout = isWeb && minWidthSize('s')
  const isCompactLayout = isMobile || isNarrowWebLayout
  const isTwoColumnLayout = isWeb && !isCompactLayout
  const isWideFooterLayout = !isNarrowWebLayout

  return {
    isCompactLayout,
    isNarrowWebLayout,
    isTwoColumnLayout,
    isWideFooterLayout
  }
}

export default useCompactActionRequestLayout
