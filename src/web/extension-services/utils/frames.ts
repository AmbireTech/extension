// Used to skip running scripts inside cross-origin iframes like ads, trackers,
// social media embeds, and third-party widgets
export function isCrossOriginFrame(): boolean {
  try {
    const topOrigin = window?.top?.location?.origin
    const currentOrigin = window?.location?.origin
    return !topOrigin || currentOrigin !== topOrigin
  } catch {
    return true
  }
}
// Used to avoid running scripts in deeply nested iframes, since these frames are very unlikely
// to be used for wallet communication and would only add unnecessary load to already heavy pages.
export function isTooDeepFrameInTheFrameHierarchy(maxDepth = 10): boolean {
  let depth = 0
  let win: Window | null = window

  while (win && win !== window.top && depth < maxDepth) {
    win = win.parent
    depth++
  }

  return win !== window.top
}
