import type { MeasuredLayout } from './types'

/**
 * Measures `node` relative to `relativeTo` right away, so that a layout effect can correct
 * the layout before it is painted. react-native-web measures asynchronously, so the DOM is
 * read directly instead.
 */
const measureLayoutSync = (
  node: HTMLElement | null,
  relativeTo: HTMLElement | null
): MeasuredLayout | null => {
  if (!node?.getBoundingClientRect || !relativeTo?.getBoundingClientRect) return null

  const rect = node.getBoundingClientRect()
  const relativeRect = relativeTo.getBoundingClientRect()

  return {
    x: rect.left - relativeRect.left,
    y: rect.top - relativeRect.top,
    width: rect.width,
    height: rect.height
  }
}

export default measureLayoutSync
