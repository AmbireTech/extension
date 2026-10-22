import { useCallback, useRef } from 'react'
import { FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

import { CarouselList, CarouselListOptions } from './useCarouselList'

const useCarouselList = ({
  listRef,
  pageScroll,
  isOpen,
  onScroll
}: CarouselListOptions): CarouselList => {
  const lastOffsetYRef = useRef<number | null>(null)

  // Web has no UI thread: the worklets run as plain JS on every scroll event, and the
  // carousel animates the overview from the offset they keep, see `useWebCarouselStyles`
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      onScroll?.(event)

      if (!isOpen) return

      const offsetY = event.nativeEvent.contentOffset.y

      // React Native Web repeats the last scroll event once the scroll has stopped
      if (offsetY === lastOffsetYRef.current) return

      lastOffsetYRef.current = offsetY
      pageScroll.onScroll(offsetY)
    },
    [isOpen, onScroll, pageScroll]
  )

  return { ListComponent: FlatList, ref: listRef, onScroll: handleScroll }
}

export default useCarouselList
