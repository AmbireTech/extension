import type { MeasuredLayout } from './types'

/**
 * Measures `node` relative to `relativeTo` right away, so that a layout effect can correct
 * the layout before it is painted. The New Architecture runs the callback synchronously,
 * so null means the layout can't be read right now (e.g. a node that isn't mounted).
 * `relativeTo` must be an ancestor of `node`, otherwise the measuring fails.
 */
const measureLayoutSync = (node: any, relativeTo: any): MeasuredLayout | null => {
  if (!node?.measureLayout || !relativeTo) return null

  let layout: MeasuredLayout | null = null
  node.measureLayout(
    relativeTo,
    (x: number, y: number, width: number, height: number) => {
      layout = { x, y, width, height }
    },
    () => console.warn('measureLayoutSync: failed to measure a node relative to another')
  )

  return layout
}

export default measureLayoutSync
