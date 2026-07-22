import { isWeb } from '@common/config/env'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import { getUiType } from '@common/utils/uiType'

const { isSidePanel } = getUiType()

export const NARROW_SIDE_PANEL_ADDRESS_MAX_LENGTH = 16

/** Minimum row width (px) to fit a full 42-char hex address plus the copy icon. */
export const FULL_ADDRESS_MIN_CONTAINER_WIDTH = 330

const useShouldShowFullAddressOnWeb = (maxLength: number, containerWidth?: number | null) => {
  const { isNarrowSidePanel } = useCompactActionRequestLayout()
  const hasEnoughContainerSpace =
    containerWidth != null && containerWidth >= FULL_ADDRESS_MIN_CONTAINER_WIDTH

  const shouldShowFullAddressOnWeb = isSidePanel
    ? isWeb &&
      maxLength >= 42 &&
      (containerWidth != null ? hasEnoughContainerSpace : !isNarrowSidePanel)
    : isWeb && maxLength >= 42

  const effectiveMaxLength =
    !isSidePanel || shouldShowFullAddressOnWeb || !isNarrowSidePanel
      ? maxLength
      : Math.min(maxLength, NARROW_SIDE_PANEL_ADDRESS_MAX_LENGTH)

  return { shouldShowFullAddressOnWeb, isNarrowSidePanel, effectiveMaxLength }
}

export default useShouldShowFullAddressOnWeb
