/**
 * Floating scrollbars, as on iOS. style.css hides the browser's scrollbars, so they take no room,
 * and a thin thumb is drawn over whichever element scrolls, fading out once it stops.
 */

type Axis = 'vertical' | 'horizontal'

type ScrollOffset = { top: number; left: number }

type VisibleRect = { top: number; right: number; bottom: number; left: number }

const THUMB_THICKNESS = 3
const EDGE_INSET = 2
const MIN_THUMB_LENGTH = 36
/** How long the thumb stays after the last scroll before it fades out */
const VISIBLE_AFTER_SCROLL_MS = 700

const AXES: Axis[] = ['vertical', 'horizontal']

const createThumb = (axis: Axis) => {
  const thumb = document.createElement('div')
  thumb.className = 'floating-scrollbar'
  thumb.setAttribute('aria-hidden', 'true')
  if (axis === 'vertical') thumb.style.width = `${THUMB_THICKNESS}px`
  else thumb.style.height = `${THUMB_THICKNESS}px`
  document.body.appendChild(thumb)

  return thumb
}

const getScrolledElement = (target: EventTarget | null) => {
  if (target === document) return document.scrollingElement as HTMLElement | null

  return target instanceof HTMLElement ? target : null
}

/** Firefox has no ::-webkit-scrollbar, so style.css hides its scrollbars with `scrollbar-width` */
const CAN_TELL_HIDDEN_INDICATORS = CSS.supports('selector(::-webkit-scrollbar)')

// `showsVerticalScrollIndicator={false}` sets it. Firefox can't tell, as style.css sets it on all
const isIndicatorHidden = (element: HTMLElement) =>
  CAN_TELL_HIDDEN_INDICATORS && getComputedStyle(element).scrollbarWidth === 'none'

/** The ancestors that clip their content, like a rounded card around a taller list */
const getClippingAncestors = (element: HTMLElement) => {
  const ancestors: HTMLElement[] = []
  for (
    let node = element.parentElement;
    node && node !== document.body;
    node = node.parentElement
  ) {
    const { overflowX, overflowY } = getComputedStyle(node)
    if (overflowX !== 'visible' || overflowY !== 'visible') ancestors.push(node)
  }

  return ancestors
}

/** The part of the element that is on screen, so the thumb never runs past what clips it */
const getVisibleRect = (element: HTMLElement, clippingAncestors: HTMLElement[]): VisibleRect => {
  const { top, right, bottom, left } = element.getBoundingClientRect()
  const visibleRect = { top, right, bottom, left }
  const clipRects = [
    ...clippingAncestors.map((ancestor) => ancestor.getBoundingClientRect()),
    { top: 0, right: window.innerWidth, bottom: window.innerHeight, left: 0 }
  ]
  clipRects.forEach((clipRect) => {
    visibleRect.top = Math.max(visibleRect.top, clipRect.top)
    visibleRect.right = Math.min(visibleRect.right, clipRect.right)
    visibleRect.bottom = Math.min(visibleRect.bottom, clipRect.bottom)
    visibleRect.left = Math.max(visibleRect.left, clipRect.left)
  })

  return visibleRect
}

const placeThumb = (thumb: HTMLElement, axis: Axis, element: HTMLElement, rect: VisibleRect) => {
  const isVertical = axis === 'vertical'
  const viewportLength = isVertical ? element.clientHeight : element.clientWidth
  const contentLength = isVertical ? element.scrollHeight : element.scrollWidth
  const maxOffset = contentLength - viewportLength
  if (maxOffset < 1) return false

  const offset = Math.abs(isVertical ? element.scrollTop : element.scrollLeft)
  const progress = Math.min(1, Math.max(0, offset / maxOffset))
  const trackLength =
    (isVertical ? rect.bottom - rect.top : rect.right - rect.left) - EDGE_INSET * 2
  if (trackLength < MIN_THUMB_LENGTH) return false

  const thumbLength = Math.max(MIN_THUMB_LENGTH, (trackLength * viewportLength) / contentLength)
  const thumbOffset = EDGE_INSET + progress * (trackLength - thumbLength)

  const x = isVertical ? rect.right - EDGE_INSET - THUMB_THICKNESS : rect.left + thumbOffset
  const y = isVertical ? rect.top + thumbOffset : rect.bottom - EDGE_INSET - THUMB_THICKNESS
  thumb.style.transform = `translate(${x}px, ${y}px)`
  if (isVertical) thumb.style.height = `${thumbLength}px`
  else thumb.style.width = `${thumbLength}px`

  return true
}

/** Draws the floating scrollbars for as long as the page lives. Call it once. */
export const installFloatingScrollbar = () => {
  const thumbs = { vertical: createThumb('vertical'), horizontal: createThumb('horizontal') }
  const lastOffsets = new WeakMap<HTMLElement, ScrollOffset>()
  const scrolledAxes = new Set<Axis>()
  let activeElement: HTMLElement | null = null
  let activeClippingAncestors: HTMLElement[] = []
  let isActiveIndicatorHidden = false
  let lastScrollAt = 0
  let frameId: number | null = null

  const hideThumbs = () => {
    AXES.forEach((axis) => delete thumbs[axis].dataset.visible)
  }

  // Follows the element every frame while shown, as a sheet or page can move under it
  const update = () => {
    frameId = null
    const element = activeElement
    const isScrolling = performance.now() - lastScrollAt < VISIBLE_AFTER_SCROLL_MS
    if (!element || !element.isConnected || !isScrolling) {
      activeElement = null
      hideThumbs()
      return
    }

    const rect = getVisibleRect(element, activeClippingAncestors)
    AXES.forEach((axis) => {
      const isShown = scrolledAxes.has(axis) && placeThumb(thumbs[axis], axis, element, rect)
      if (isShown) thumbs[axis].dataset.visible = 'true'
      else delete thumbs[axis].dataset.visible
    })
    frameId = requestAnimationFrame(update)
  }

  const handleScroll = (event: Event) => {
    const element = getScrolledElement(event.target)
    if (!element) return

    if (element !== activeElement) {
      activeElement = element
      isActiveIndicatorHidden = isIndicatorHidden(element)
      activeClippingAncestors = isActiveIndicatorHidden ? [] : getClippingAncestors(element)
      scrolledAxes.clear()
      hideThumbs()
    }
    if (isActiveIndicatorHidden) return

    const lastOffset = lastOffsets.get(element) ?? { top: 0, left: 0 }
    const offset = { top: element.scrollTop, left: element.scrollLeft }
    lastOffsets.set(element, offset)
    if (offset.top !== lastOffset.top) scrolledAxes.add('vertical')
    if (offset.left !== lastOffset.left) scrolledAxes.add('horizontal')

    lastScrollAt = performance.now()
    if (frameId === null) frameId = requestAnimationFrame(update)
  }

  // Scroll events don't bubble, but they do pass the document while it captures
  document.addEventListener('scroll', handleScroll, { capture: true, passive: true })
}
