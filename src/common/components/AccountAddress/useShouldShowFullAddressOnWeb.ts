import { isWeb } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useWindowSize from '@common/hooks/useWindowSize'

export const NARROW_LAYOUT_ADDRESS_MAX_LENGTH = 16

/** Minimum row width (px) to fit a full 42-char hex address plus the copy icon. */
export const FULL_ADDRESS_MIN_CONTAINER_WIDTH = 330

const useShouldShowFullAddressOnWeb = (maxLength: number, containerWidth?: number | null) => {
  const { isNarrowWebLayout } = useCompactLayout()
  const { minWidthSize } = useWindowSize()
  // Below `m` a shortened address wastes the room a wrapped full one would use
  const isNarrowSurface = isWeb && minWidthSize('m')
  const hasEnoughContainerSpace =
    containerWidth != null && containerWidth >= FULL_ADDRESS_MIN_CONTAINER_WIDTH

  // Full-address wrap path is for narrow views only. Popup / tab keep v2 shortenAddress behavior.
  const shouldShowFullAddressOnWeb =
    isNarrowSurface &&
    maxLength >= 42 &&
    (containerWidth != null ? hasEnoughContainerSpace : !isNarrowWebLayout)

  const effectiveMaxLength =
    !isNarrowSurface || shouldShowFullAddressOnWeb || !isNarrowWebLayout
      ? maxLength
      : Math.min(maxLength, NARROW_LAYOUT_ADDRESS_MAX_LENGTH)

  return { shouldShowFullAddressOnWeb, isNarrowWebLayout, effectiveMaxLength }
}

export default useShouldShowFullAddressOnWeb
