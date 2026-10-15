import { useCallback, useEffect, useMemo } from 'react'
import { Animated, FlatList } from 'react-native'
import { scrollTo, useAnimatedRef, useAnimatedScrollHandler } from 'react-native-reanimated'

import { CarouselList, CarouselListOptions } from './useCarouselList'

// The pages of the carousel report their scroll offset natively, so the header
// laid over them can collapse without a round trip through JS.
const AnimatedFlatList = Animated.FlatList as unknown as typeof FlatList

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
  // the views directly and never wait on a React commit
  const handleScroll = useMemo(() => {
    if (!scrollY || !isOpen) return onScroll

    return Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: true,
      listener: onScroll
    })
  }, [isOpen, onScroll, scrollY])

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

  return {
    ListComponent: AnimatedFlatList,
    ref,
    onScroll: handleScroll,
    onMomentumScrollEnd: REPORT_MOMENTUM
  }
}

export default useCarouselList
