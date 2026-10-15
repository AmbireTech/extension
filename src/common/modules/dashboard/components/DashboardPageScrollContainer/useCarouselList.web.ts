import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Animated, FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

import { CarouselList, CarouselListOptions } from './useCarouselList'

const AnimatedFlatList = Animated.FlatList as unknown as typeof FlatList

// How long the scroll has to have stopped for before a partly collapsed overview is settled.
// Web has no finger to let go of, so the scroll stopping stands in for it.
const SETTLE_DELAY = 150

const useCarouselList = ({
  listRef,
  scrollY,
  pageScroll,
  isOpen,
  onScroll
}: CarouselListOptions): CarouselList => {
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current)
    },
    []
  )

  const onCarouselScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      pageScroll?.onScroll(event.nativeEvent.contentOffset.y)
      onScroll?.(event)

      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current)

      settleTimeoutRef.current = setTimeout(() => {
        settleTimeoutRef.current = null

        const settleOffset = pageScroll?.onMomentumEnd() ?? null

        if (settleOffset !== null) {
          listRef.current?.scrollToOffset({ offset: settleOffset, animated: true })
        }
      }, SETTLE_DELAY)
    },
    [listRef, onScroll, pageScroll]
  )

  // Web has no native driver and no UI thread: the scroll drives the carousel's animated
  // nodes from JS, which updates the views directly, and the worklets run as plain JS on the
  // very same events, so the two can't disagree here either
  const handleScroll = useMemo(() => {
    if (!scrollY || !pageScroll || !isOpen) return onScroll

    // The listener reads the settle timeout only when a scroll event arrives
    // eslint-disable-next-line react-hooks/refs
    return Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
      useNativeDriver: false,
      listener: onCarouselScroll
    })
  }, [isOpen, onCarouselScroll, onScroll, pageScroll, scrollY])

  if (!pageScroll) return { ListComponent: FlatList, ref: listRef, onScroll }

  return { ListComponent: AnimatedFlatList, ref: listRef, onScroll: handleScroll }
}

export default useCarouselList
