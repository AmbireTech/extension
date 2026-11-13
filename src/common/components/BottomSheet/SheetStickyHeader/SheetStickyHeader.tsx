import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { Animated, LayoutChangeEvent, View } from 'react-native'
// @ts-expect-error React Native ships no types for its default sticky header
import ScrollViewStickyHeader from 'react-native/Libraries/Components/ScrollView/ScrollViewStickyHeader'

import SheetHeaderBlur from '../SheetHeaderBlur/SheetHeaderBlur'
import { useIsSheetSectionHeaderGlass } from './SheetSectionHeaderGlassContext'

/** Where a sheet's sticky section headers pin and how far their glass reaches. */
type SheetStickyHeaderLayout = {
  /** The height of a sheet header over the list: the headers pin right below it */
  offset: number
  /** How far the list's padding keeps its headers from the sheet's sides */
  sidePadding: number
  /** Receives the list's scroll value, which the headers follow */
  scrollValueRef?: { current: Animated.Value | null }
}

const SheetStickyHeaderLayoutContext = createContext<SheetStickyHeaderLayout>({
  offset: 0,
  sidePadding: 0
})

/** What the ScrollView calls on a sticky header, set by React Native's own one */
type StickyHeaderInstance = { setNextHeaderY?: (y: number | undefined) => void }

type Props = React.ComponentProps<typeof Animated.View> & {
  children: React.ReactElement
  scrollAnimatedValue: Animated.Value
  nextHeaderLayoutY?: number
  onLayout: (e: LayoutChangeEvent) => void
}

const GLASS_SHOWN_STYLE = { opacity: 1 }
const GLASS_HIDDEN_STYLE = { opacity: 0 }

/**
 * React Native's sticky header, pinned lower by the sheet's offset: it sticks once the list
 * scrolls it there, as if the list were scrolled that much further. A pinned glass header
 * frosts the sheet header's area too, edge to edge, so both read as one glass.
 */
const SheetStickyHeader = forwardRef<StickyHeaderInstance, Props>(
  ({ scrollAnimatedValue, children, nextHeaderLayoutY, onLayout, ...rest }, ref) => {
    const { offset, sidePadding, scrollValueRef } = useContext(SheetStickyHeaderLayoutContext)
    const isGlass = useIsSheetSectionHeaderGlass()
    const [layoutY, setLayoutY] = useState<number | null>(null)
    const [isPinned, setIsPinned] = useState(false)
    const headerRef = useRef<StickyHeaderInstance | null>(null)
    // The list opens at its top, and moves only by scrolling
    const scrollYRef = useRef(0)
    const offsetScrollValue = useMemo(
      () => (offset ? Animated.add(scrollAnimatedValue, offset) : scrollAnimatedValue),
      [scrollAnimatedValue, offset]
    )
    const setRefs = useCallback(
      (instance: StickyHeaderInstance | null) => {
        headerRef.current = instance
        if (typeof ref === 'function') ref(instance)
        else if (ref) ref.current = instance
      },
      [ref]
    )
    // React Native reads the next header's position only on mount, so once the section after
    // this one goes (accounts shown or hidden), it kept stopping where that header used to be
    useEffect(() => {
      headerRef.current?.setNextHeaderY?.(nextHeaderLayoutY)
    }, [nextHeaderLayoutY])
    useEffect(() => {
      if (scrollValueRef) scrollValueRef.current = scrollAnimatedValue
    }, [scrollValueRef, scrollAnimatedValue])
    const handleLayout = useCallback(
      (e: LayoutChangeEvent) => {
        setLayoutY(e.nativeEvent.layout.y)
        onLayout(e)
      },
      [onLayout]
    )
    // Glass only while pinned, or it would frost the rows above a header further down. Kept in
    // state, as React re-applies a stale JS value to natively driven styles when it re-renders
    useEffect(() => {
      if (!isGlass || layoutY === null) return undefined
      // Within a point of pinning, as rounding can leave it short
      const updateIsPinned = () => setIsPinned(scrollYRef.current + offset >= layoutY - 1)
      updateIsPinned()
      const listenerId = scrollAnimatedValue.addListener(({ value }) => {
        scrollYRef.current = value
        updateIsPinned()
      })
      return () => scrollAnimatedValue.removeListener(listenerId)
    }, [isGlass, scrollAnimatedValue, offset, layoutY])
    const glassStyle = useMemo(
      () => ({
        position: 'absolute' as const,
        top: -offset,
        bottom: 0,
        left: -sidePadding,
        right: -sidePadding
      }),
      [offset, sidePadding]
    )

    return (
      <ScrollViewStickyHeader
        ref={setRefs}
        {...rest}
        nextHeaderLayoutY={nextHeaderLayoutY}
        onLayout={handleLayout}
        scrollAnimatedValue={offsetScrollValue}
      >
        {isGlass ? (
          <View>
            <View
              pointerEvents="none"
              style={[glassStyle, isPinned ? GLASS_SHOWN_STYLE : GLASS_HIDDEN_STYLE]}
            >
              <SheetHeaderBlur />
            </View>
            {children}
          </View>
        ) : (
          children
        )}
      </ScrollViewStickyHeader>
    )
  }
)

export { SheetStickyHeaderLayoutContext }
export type { SheetStickyHeaderLayout }
export default SheetStickyHeader
