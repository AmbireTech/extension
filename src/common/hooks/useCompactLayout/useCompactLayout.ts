import { isMobile, isWeb } from '@common/config/env'
import useWindowSize from '@common/hooks/useWindowSize'
import { getUiType } from '@common/utils/uiType'

const { isPopup } = getUiType()

/**
 * Single source of truth for compact vs desktop layout across the app.
 *
 * Compact = mobile, or a web surface narrower than the `s` / 576px breakpoint - the side panel,
 * the request window that is sized to match it, and a narrow tab. The popup is excluded: it is
 * narrower than the breakpoint by definition, but its screens are designed for that width.
 */
const useCompactLayout = () => {
  const { minWidthSize } = useWindowSize()
  const isNarrowWebLayout = isWeb && !isPopup && minWidthSize('s')
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

export default useCompactLayout
