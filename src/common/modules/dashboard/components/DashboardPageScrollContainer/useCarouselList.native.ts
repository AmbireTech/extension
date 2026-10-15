import { useCallback, useEffect } from 'react'
import { Animated, FlatList } from 'react-native'
import { scrollTo, useAnimatedRef, useAnimatedScrollHandler } from 'react-native-reanimated'

import { CarouselList, CarouselListOptions } from './useCarouselList'

/**
 * What Animated maps a native event by onto a view it doesn't render, as ScrollView does for
 * its sticky headers. Not in Animated's typings.
 */
const { attachNativeEvent } = Animated as unknown as {
  attachNativeEvent: (
    viewRef: unknown,
    eventName: string,
    argMapping: ReadonlyArray<{ nativeEvent: unknown }>
  ) => { detach: () => void }
}

// Android reports momentum events only to a list that listens for them as a prop, and the
// carousel listens for them natively instead
const REPORT_MOMENTUM = () => {}

/**
 * What Reanimated's own `useScrollOffset` registers a scroll handler on a view by, which lets
 * the handler listen alongside the `onScroll` the list already has.
 */
interface RegistrableScrollHandler {
  workletEventHandler: {
    registerForEvents: (viewTag: number) => void
    unregisterFromEvents: (viewTag: number) => void
  }
}

const useCarouselList = ({
  listRef,
  scrollY,
  pageScroll,
  isOpen,
  onScroll
}: CarouselListOptions): CarouselList => {
  const animatedRef = useAnimatedRef<FlatList>()

  const ref = useCallback(
    (list: FlatList | null) => {
      listRef.current = list
      animatedRef(list)
    },
    [animatedRef, listRef]
  )

  // Draws: the open page's offset drives the carousel's native animated nodes, which update
  // the views directly and never wait on a React commit. Mapped onto the list from here rather
  // than through its props, as an Animated list would detach and attach the mapping again on
  // every render its data changes in, and miss the scroll in between
  useEffect(() => {
    if (!scrollY || !isOpen) return undefined

    const scrollNode = listRef.current?.getNativeScrollRef()

    if (!scrollNode) return undefined

    const { detach } = attachNativeEvent(scrollNode, 'onScroll', [
      { nativeEvent: { contentOffset: { y: scrollY } } }
    ])

    return detach
  }, [isOpen, listRef, scrollY])

  // Decides: the same scroll events, on the UI thread, settle a drag let go of halfway
  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        if (!pageScroll || !isOpen) return

        pageScroll.onScroll(event.contentOffset.y)
      },
      onBeginDrag: () => {
        if (!pageScroll || !isOpen) return

        pageScroll.onBeginDrag()
      },
      onEndDrag: (event) => {
        if (!pageScroll || !isOpen) return

        const settleOffset = pageScroll.onEndDrag(event.velocity?.y || 0)

        if (settleOffset !== null) scrollTo(animatedRef, 0, settleOffset, true)
      },
      onMomentumEnd: () => {
        if (!pageScroll || !isOpen) return

        const settleOffset = pageScroll.onMomentumEnd()

        if (settleOffset !== null) scrollTo(animatedRef, 0, settleOffset, true)
      }
    },
    [isOpen, pageScroll]
  ) as unknown as RegistrableScrollHandler

  useEffect(() => {
    if (!pageScroll) return undefined

    return animatedRef.observe((tag) => {
      if (!tag) return undefined

      scrollHandler.workletEventHandler.registerForEvents(tag)

      return () => scrollHandler.workletEventHandler.unregisterFromEvents(tag)
    })
  }, [animatedRef, pageScroll, scrollHandler])

  if (!pageScroll) return { ListComponent: FlatList, ref: listRef, onScroll }

  return { ListComponent: FlatList, ref, onScroll, onMomentumScrollEnd: REPORT_MOMENTUM }
}

export default useCarouselList
