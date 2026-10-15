import { FlatList } from 'react-native'

import { CarouselList, CarouselListOptions } from './useCarouselList'

// Web has no carousel, so every page is a plain list
const useCarouselList = ({ listRef, onScroll }: CarouselListOptions): CarouselList => ({
  ListComponent: FlatList,
  ref: listRef,
  onScroll
})

export default useCarouselList
