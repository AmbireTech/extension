import { isMobile, isWeb } from '@common/config/env'
import useWindowSize from '@common/hooks/useWindowSize'
import { getUiType } from '@common/utils/uiType'

const { isSidePanel } = getUiType()

/**
 * Single source of truth for compact vs desktop layout across the app.
 *
 * Compact = mobile, or a narrow side panel (below the `m` / 768px breakpoint).
 * Wide side panel and other web surfaces keep desktop / two-column layouts.
 */
const useCompactActionRequestLayout = () => {
  const { maxWidthSize } = useWindowSize()
  const isNarrowSidePanel = isSidePanel && !maxWidthSize('m')
  const isCompactLayout = isMobile || isNarrowSidePanel
  const isCompactSidePanelLayout = isNarrowSidePanel
  const isTwoColumnLayout = isWeb && !isCompactLayout
  const isWideFooterLayout = !isSidePanel || maxWidthSize('m')

  return {
    isCompactLayout,
    isCompactSidePanelLayout,
    isNarrowSidePanel,
    isTwoColumnLayout,
    isWideFooterLayout
  }
}

export default useCompactActionRequestLayout
