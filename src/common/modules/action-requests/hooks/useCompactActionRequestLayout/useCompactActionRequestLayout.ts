import { isMobile, isWeb } from '@common/config/env'
import useWindowSize from '@common/hooks/useWindowSize'
import { getUiType } from '@common/utils/uiType'

const { isSidePanel } = getUiType()

/**
 * Mirrors the mobile action-request layout on a narrow side panel.
 * Wide side panel and other web surfaces keep the desktop two-column / glass-footer layouts.
 */
const useCompactActionRequestLayout = () => {
  const { maxWidthSize } = useWindowSize()
  const isCompactLayout = isMobile || (isSidePanel && !maxWidthSize('m'))
  const isTwoColumnLayout = isWeb && !isCompactLayout
  const isWideFooterLayout = !isSidePanel || maxWidthSize('m')

  return { isCompactLayout, isTwoColumnLayout, isWideFooterLayout }
}

export default useCompactActionRequestLayout
