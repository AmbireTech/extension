import useWindowSize from '@common/hooks/useWindowSize'

/** Up to this window width the left part of a footer row gets 55%, above it - half */
const NARROWEST_LAYOUT_MAX_WIDTH = 400
const NARROWEST_LAYOUT_SPLIT = { leftFlex: 11, rightFlex: 9 }
const EVEN_SPLIT = { leftFlex: 1, rightFlex: 1 }

/**
 * How the compact sign footer buttons split between their left part (Reject + Batch) and the
 * right one (Sign)
 */
const useFooterRowSplit = (isEvenSplit?: boolean) => {
  const { maxWidthSize } = useWindowSize()
  const isNarrowestLayout = !isEvenSplit && !maxWidthSize(NARROWEST_LAYOUT_MAX_WIDTH + 1)

  return isNarrowestLayout ? NARROWEST_LAYOUT_SPLIT : EVEN_SPLIT
}

export default useFooterRowSplit
