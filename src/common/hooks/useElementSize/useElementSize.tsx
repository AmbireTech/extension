import { MutableRefObject } from 'react'

import { ElementSizeProps } from './types'

// Stable no-op helpers hoisted to module scope so that consumers of this hook
// receive the same reference across renders. This is crucial because returning
// new function instances on every call causes downstream `useCallback`/memoized
// components (e.g. `toggleMenu`, `Select`, `BottomSheet`) to re-create their
// refs on every render, which then re-triggers nested `@gorhom/portal`
// dispatches and produces an infinite-update loop when a Select is nested
// inside an already-open BottomSheet.
const noopFalse = (_size: number) => false
const noopVoid = () => {}

const STABLE_ELEMENT_SIZE: ElementSizeProps = {
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  maxElementWidthSize: noopFalse,
  minElementWidthSize: noopFalse,
  forceUpdate: noopVoid
}

// TODO: impl for mobile
const useElementSize = (_ref: MutableRefObject<HTMLElement | null>): ElementSizeProps => {
  return STABLE_ELEMENT_SIZE
}

export default useElementSize
