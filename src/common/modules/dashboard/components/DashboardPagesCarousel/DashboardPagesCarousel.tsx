import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  Easing,
  InteractionManager,
  LayoutChangeEvent,
  GestureResponderEvent,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Reanimated, {
  DerivedValue,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Spinner from '@common/components/Spinner'
import { isiOS, isWeb } from '@common/config/env'
import { useIsScreenFocused } from '@common/contexts/screenFocusContext'
import useTheme from '@common/hooks/useTheme'
import DashboardBanners from '@common/modules/dashboard/components/DashboardBanners'
import OverviewCollapseCover from '@common/modules/dashboard/components/DashboardOverview/OverviewCollapseCover'
import FloatingBottomBar from '@common/modules/dashboard/components/FloatingBottomBar'
import TabsAndSearch from '@common/modules/dashboard/components/TabsAndSearch'
import {
  getNextReturnDistance,
  getOverviewCollapsed,
  getSettleOffset,
  OVERVIEW_RETURN_DISTANCE
} from '@common/modules/dashboard/helpers/overviewCollapse'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import spacings, { SPACING } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import CarouselPage from './CarouselPage'
import DashboardCarouselContext, {
  DashboardFloatingBarProps,
  DashboardPageHandle,
  DashboardPageScroll
} from './context'
import getStyles, { WEB_MOVING_LAYER } from './styles'
import useWebCarouselStyles from './useWebCarouselStyles'

// The order must match the order the pages are rendered in, because the page
// index is what maps a swipe to a tab.
const TABS: TabType[] = ['tokens', 'defi', 'collectibles', 'activity']

// Every page is rendered, but one at a time and only once the open one is done
// filling its own render window, so none of it lands during a gesture.
const PAGE_RENDER_DELAY = 400
const PAGE_RENDER_STEP = 200

// How far a touch on the header has to travel before it is taken to be a scroll and
// not a tap on a banner or a tab.
const HEADER_PAN_THRESHOLD = 5

// How far the finger has to travel past the top to refresh, whether it pulls the header
// or a page. Deliberately long: refreshing everything is not something to walk into by
// brushing the screen, and the platform controls trigger at less than half of this.
const PULL_TO_REFRESH_DISTANCE = 140

// How far a touch has to travel before it is taken to be a pull rather than a tap
const PULL_ACTIVATION_THRESHOLD = 12

// The pages follow the finger at half its pace, so the pull reads as something being
// resisted rather than dragged, and the distance stays a deliberate one.
const PULL_RESISTANCE = 0.5

// The gap the pages are held open by while the refresh runs, sized to the spinner
const PULL_SPINNER_HEIGHT = 56

// Matches the pager's animated scroll to a pressed tab, so the overview expands in step with
// it: UIKit's ~300ms ease-in-out, and Android's 250ms accelerate-decelerate
const OVERVIEW_EXPAND_TIMING = {
  duration: isiOS ? 300 : 250,
  easing: Easing.inOut(Easing.sin)
}

// Web has no native driver: the same nodes are run by JS there, which updates the views
// directly, without a render
const USE_NATIVE_DRIVER = !isWeb

// How long a swipe between the pages has to have stopped for to be over on web, which
// reports it only as scroll events, with no drag start or momentum end
const WEB_PAGER_IDLE_DELAY = 150

// How many pixels a line of a wheel scrolled by lines stands for, as Firefox reports it
const WHEEL_LINE_HEIGHT = 16

// How far the floating bar moves from its place above the safe area to below the screen
// edge, on top of twice the safe area inset
const FLOATING_BAR_HIDE_DISTANCE = 60 + SPACING

/**
 * The work the carousel may only do while the dashboard is the screen the user is on.
 * Its own component, and one that renders nothing, because focus is read through a
 * context that re-renders whoever reads it - and a render of the carousel re-attaches
 * its pull gesture. Losing focus is the commit that starts the transition to the screen
 * the user asked for, so it has to stay as small as it can be.
 */
const WhileFocused = ({
  openTabIndex,
  renderTabs,
  initAllTabs
}: {
  openTabIndex: number
  renderTabs: (tabs: (TabType | undefined)[]) => void
  initAllTabs: () => void
}) => {
  const isScreenFocused = useIsScreenFocused()

  // Every page ends up rendered, so no swipe can outrun them: closest first and one at
  // a time, never during a gesture or in the same frame as another. Only while this is
  // the screen the user is on, or the rest would be built over the screen it was left for.
  useEffect(() => {
    if (!isScreenFocused) return undefined

    let isCancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const byDistanceToOpenTab = TABS.map((tab, index) => ({
      tab,
      distance: Math.abs(index - openTabIndex)
    }))
      .sort((a, b) => a.distance - b.distance)
      .map(({ tab }) => tab)

    const renderFrom = (index: number) => {
      if (isCancelled || index >= byDistanceToOpenTab.length) return

      renderTabs([byDistanceToOpenTab[index]])

      timeoutId = setTimeout(() => renderFrom(index + 1), PAGE_RENDER_STEP)
    }

    const interaction = InteractionManager.runAfterInteractions(() => {
      timeoutId = setTimeout(() => renderFrom(0), PAGE_RENDER_DELAY)
    })

    return () => {
      isCancelled = true
      interaction.cancel()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isScreenFocused, openTabIndex, renderTabs])

  // Deferred until the interactions are over, and a navigation away is one of them,
  // so this has to ask whether the dashboard is still the screen it was deferred on.
  useEffect(() => {
    if (!isScreenFocused) return undefined

    const interaction = InteractionManager.runAfterInteractions(initAllTabs)

    return () => interaction.cancel()
  }, [initAllTabs, isScreenFocused])

  return null
}

/**
 * How far the overview is collapsed, from 0 to its height: the native animated value the pager
 * is moved by on mobile, and the Reanimated value it is moved by on web.
 */
export type OverviewCollapse = Animated.AnimatedInterpolation<number> | DerivedValue<number>

export interface DashboardPagesCarouselProps {
  openTab: TabType
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  sessionId: string
  /**
   * Called once on mount, so the pages the user hasn't opened yet are populated before
   * they are swiped into view.
   */
  initAllTabs: () => void
  /** Pulling the header down past the top refreshes, as pulling a page down does. Mobile only. */
  onRefresh?: () => void
  /** Holds the pages open on the spinner for as long as the refresh runs. */
  refreshing?: boolean
  /**
   * How far the open overview pushes the pager down. The pager slides over the collapsing
   * part of the overview while the open page is scrolled down.
   */
  overviewHeight?: number
  /**
   * Hands out how far the overview is collapsed, from 0 to `overviewHeight`, as the animated
   * value the pager is moved by, so the overview can move its background in step.
   */
  onOverviewCollapseChange?: (collapse: OverviewCollapse) => void
  children: ReactNode
}

const DashboardPagesCarousel: React.FC<DashboardPagesCarouselProps> = ({
  openTab,
  setOpenTab,
  sessionId,
  initAllTabs,
  onRefresh,
  refreshing,
  overviewHeight = 0,
  onOverviewCollapseChange,
  children
}) => {
  const { styles } = useTheme(getStyles)
  const scrollRef = useRef<ScrollView>(null)
  // The pages are explicitly sized because a page taller than the pager would
  // make the pager scroll vertically instead of the list inside it.
  const [pageSize, setPageSize] = useState({ width: Dimensions.get('window').width, height: 0 })
  const [bannersHeight, setBannersHeight] = useState(0)
  const [tabsHeight, setTabsHeight] = useState(0)

  // Scroll offset of the page the user is on, mapped natively from its scroll events. Draws
  // the banners and the overview through native animated nodes, which update the views
  // directly: Reanimated's updates wait out every React commit, and the list commits rows
  // as it scrolls, which made the tabs row stutter.
  const scrollY = useMemo(() => new Animated.Value(0), [])
  // Eases the overview open when a tab switch takes the pages to the top, which the
  // offset alone would snap it open by
  const overviewSettle = useMemo(() => new Animated.Value(0), [])

  // The same scroll, kept on the UI thread from the same events, to settle a drag by and to
  // hide the floating bar. JS only gets the events coalesced, so a copy kept there missed the
  // turns of a fling and left the overview stuck halfway.
  const scrollOffset = useSharedValue(0)
  // How far the open page has been scrolled down, less how far back up. Mirrors the
  // `diffClamp` below. See `getNextReturnDistance`
  const returnDistance = useSharedValue(0)
  // Android ends a settle cut short by a new drag with a momentum end, which must not settle
  // again under the finger: the scroll would fight the drag, and every cut short one restart it
  const isDragging = useSharedValue(false)
  // Which way the open page was last scrolled: 1 down, -1 up, 0 not since it was opened. A
  // partly collapsed overview is settled on that way, so a collapse or an expand once started
  // always completes instead of turning back
  const scrollDirection = useSharedValue(0)

  // Only recreated with the overview's height, as a new node starts over from the offset
  const returnDistanceNode = useMemo(
    () => Animated.diffClamp(scrollY, 0, OVERVIEW_RETURN_DISTANCE + overviewHeight),
    [overviewHeight, scrollY]
  )

  // A new node starts from the offset, so the copy has to as well
  useEffect(() => {
    returnDistance.set(
      Math.min(Math.max(scrollOffset.get(), 0), OVERVIEW_RETURN_DISTANCE + overviewHeight)
    )
  }, [overviewHeight, returnDistance, returnDistanceNode, scrollOffset])

  // The overview collapses once the banners are scrolled away, following the open page's
  // offset natively, so it tracks the finger both ways for as long as it is down. Mid-page,
  // a scroll up longer than OVERVIEW_RETURN_DISTANCE expands it with the finger too.
  // `getOverviewCollapsed` works out the same on the UI thread.
  const overviewCollapse = useMemo(() => {
    const overviewRange = Math.max(overviewHeight, 1)
    const collapsedByOffset = scrollY.interpolate({
      inputRange: [bannersHeight, bannersHeight + overviewRange],
      outputRange: [0, overviewHeight],
      extrapolate: 'clamp'
    })
    const collapsedByReturn = returnDistanceNode.interpolate({
      inputRange: [0, overviewRange],
      outputRange: [0, overviewHeight],
      extrapolate: 'clamp'
    })
    // The smaller of the two, as Animated has no min: a - max(a - b, 0)
    const collapsedByReturnExcess = Animated.subtract(
      collapsedByOffset,
      collapsedByReturn
    ).interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolateLeft: 'clamp',
      extrapolateRight: 'extend'
    })

    return Animated.add(
      Animated.subtract(collapsedByOffset, collapsedByReturnExcess),
      overviewSettle
    )
  }, [bannersHeight, overviewHeight, overviewSettle, returnDistanceNode, scrollY])

  // The open overview pushes the pages down, by a transform so nothing is laid out again
  const overviewPush = useMemo(
    () =>
      overviewCollapse.interpolate({
        inputRange: [0, Math.max(overviewHeight, 1)],
        outputRange: [overviewHeight, 0],
        extrapolate: 'clamp'
      }),
    [overviewCollapse, overviewHeight]
  )

  // Undoes the push for the lists, so their content moves with the finger alone instead of
  // with the finger and the push. They start where the collapsed overview ends and are padded
  // by the open one, while the part above the pages is clipped away.
  const pagerLiftOffsetStyle = useMemo(
    () => ({ ...WEB_MOVING_LAYER, marginTop: -overviewHeight, marginBottom: overviewHeight }),
    [overviewHeight]
  )
  const pagerLiftStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: overviewCollapse.interpolate({
            inputRange: [0, Math.max(overviewHeight, 1)],
            outputRange: [0, overviewHeight],
            extrapolate: 'clamp'
          })
        }
      ]
    }),
    [overviewCollapse, overviewHeight]
  )

  // The floating bar hides with the overview, drawn by the same native nodes so it moves in
  // step with it, scroll for scroll. While the keyboard is open it stays where it is, so the
  // search being typed into stays on screen: `floatingBarFollow` is 0 then.
  const { bottom: safeBottom } = useSafeAreaInsets()
  const floatingBarFollow = useMemo(() => new Animated.Value(1), [])

  useEffect(() => {
    const followOverview = (toValue: number) => () =>
      Animated.timing(floatingBarFollow, {
        toValue,
        ...OVERVIEW_EXPAND_TIMING,
        useNativeDriver: USE_NATIVE_DRIVER
      }).start()

    const showSubscription = Keyboard.addListener(
      isiOS ? 'keyboardWillShow' : 'keyboardDidShow',
      followOverview(0)
    )
    const hideSubscription = Keyboard.addListener(
      isiOS ? 'keyboardWillHide' : 'keyboardDidHide',
      followOverview(1)
    )

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [floatingBarFollow])

  const floatingBarHideStyle = useMemo(
    () => ({
      transform: [
        {
          translateY: Animated.multiply(
            overviewCollapse.interpolate({
              inputRange: [0, Math.max(overviewHeight, 1)],
              outputRange: [0, FLOATING_BAR_HIDE_DISTANCE + safeBottom * 2],
              extrapolate: 'clamp'
            }),
            floatingBarFollow
          )
        }
      ]
    }),
    [floatingBarFollow, overviewCollapse, overviewHeight, safeBottom]
  )

  // Web draws all of the above by Reanimated instead: see `useWebCarouselStyles`
  const webStyles = useWebCarouselStyles({
    scrollOffset,
    bannersHeight,
    overviewHeight,
    floatingBarHideDistance: FLOATING_BAR_HIDE_DISTANCE + safeBottom * 2,
    duration: OVERVIEW_EXPAND_TIMING.duration
  })
  const webCollapse = webStyles?.collapse

  useEffect(() => {
    onOverviewCollapseChange?.(
      webCollapse ||
        overviewCollapse.interpolate({
          inputRange: [0, Math.max(overviewHeight, 1)],
          outputRange: [0, overviewHeight],
          extrapolate: 'clamp'
        })
    )
  }, [onOverviewCollapseChange, overviewCollapse, overviewHeight, webCollapse])

  const [renderedTabs, setRenderedTabs] = useState<Partial<Record<TabType, boolean>>>(() => ({
    [openTab]: true
  }))
  const openTabIndex = Math.max(TABS.indexOf(openTab), 0)
  const pageHandles = useRef<Partial<Record<TabType, DashboardPageHandle>>>({})
  const [floatingBars, setFloatingBars] = useState<
    Partial<Record<TabType, DashboardFloatingBarProps>>
  >({})

  const registerFloatingBar = useCallback((tab: TabType, bar: DashboardFloatingBarProps | null) => {
    setFloatingBars((prev) => {
      if (prev[tab] === (bar || undefined)) return prev

      const next = { ...prev }

      if (bar) {
        next[tab] = bar
      } else {
        delete next[tab]
      }

      return next
    })
  }, [])

  // Whether the open page has anything above it. Reported by the page as it scrolls
  // rather than asked for when a touch lands: asking is a round trip to the native side
  // that answers after the drag has already been judged, and it answers with the header
  // collapse the carousel keeps, which a page too short to take it never matches.
  // Pages start at their top, which is what makes this the value to start from.
  const canPull = useSharedValue(true)

  // Where to scroll the open page to, to settle a partly collapsed overview, if anywhere
  const getOverviewSettleOffset = useCallback(() => {
    'worklet'

    const offsetY = scrollOffset.get()
    const collapsed = getOverviewCollapsed(
      offsetY,
      returnDistance.get(),
      bannersHeight,
      overviewHeight
    )

    return getSettleOffset(offsetY, collapsed, overviewHeight, scrollDirection.get())
  }, [bannersHeight, overviewHeight, returnDistance, scrollDirection, scrollOffset])

  // Called by the open page's scroll handler on the UI thread. Kept stable apart from the
  // layout, because the pages read it off the context and a new one would re-render all four
  const pageScroll = useMemo<DashboardPageScroll>(
    () => ({
      onScroll: (offsetY) => {
        'worklet'

        const scrolledBy = offsetY - scrollOffset.get()
        const nextReturnDistance = getNextReturnDistance(
          returnDistance.get(),
          scrolledBy,
          overviewHeight
        )

        returnDistance.set(nextReturnDistance)
        scrollOffset.set(offsetY)
        canPull.set(offsetY <= 0)

        // Less than a pixel is rounding, or the finger resting, not a way the page is going
        if (Math.abs(scrolledBy) >= 1) scrollDirection.set(Math.sign(scrolledBy))
      },
      onBeginDrag: () => {
        'worklet'

        isDragging.set(true)
      },
      onEndDrag: (velocityY) => {
        'worklet'

        isDragging.set(false)

        // A drag let go of at any speed is carried on by momentum, which would take back over
        // a scroll started now and leave it to be settled twice: it is settled once the
        // momentum ends instead. Android reports a momentum end even when there is none
        if (!isiOS || velocityY !== 0) return null

        return getOverviewSettleOffset()
      },
      onMomentumEnd: () => {
        'worklet'

        if (isDragging.get()) return null

        return getOverviewSettleOffset()
      }
    }),
    [
      canPull,
      getOverviewSettleOffset,
      isDragging,
      overviewHeight,
      returnDistance,
      scrollDirection,
      scrollOffset
    ]
  )

  // How far the banners are collapsed, which every page shares. A page whose items
  // start right below the tabs row sits at this offset, not at zero.
  const collapsedBy = useRef(0)

  // Held in state rather than alongside the handles, because the pull gesture is built
  // during render and has to be given the lists it takes a drag away from.
  const [pageListGestures, setPageListGestures] = useState<
    Partial<Record<TabType, DashboardPageHandle['listGesture']>>
  >({})

  const registerPage = useCallback((tab: TabType, handle: DashboardPageHandle | null) => {
    setPageListGestures((prev) => {
      if (prev[tab] === handle?.listGesture) return prev

      const next = { ...prev }

      if (handle) {
        next[tab] = handle.listGesture
      } else {
        delete next[tab]
      }

      return next
    })

    if (!handle) {
      delete pageHandles.current[tab]
      return
    }

    pageHandles.current[tab] = handle
    // A page rendered while the banners are already collapsed would start below them
    if (collapsedBy.current) handle.scrollToOffset(collapsedBy.current)
  }, [])

  // Opening a tab takes its page to the top but leaves the banners as collapsed as they
  // were: they belong to the dashboard, not to the page. The offset is read from the UI
  // thread, which the pages report their scroll to.
  // The overview is expanded by that, eased from how collapsed it was.
  const takePagesToTop = useCallback(() => {
    const offsetY = scrollOffset.get()
    const carried = Math.min(Math.max(offsetY, 0), bannersHeight)
    const wasCollapsed = getOverviewCollapsed(
      offsetY,
      returnDistance.get(),
      bannersHeight,
      overviewHeight
    )

    // A swipe cancels the page's drag without ending it
    isDragging.set(false)
    // The page is taken to the top, not scrolled there
    scrollDirection.set(0)
    collapsedBy.current = carried
    // Jumped to like the `diffClamp` is, which takes the jump as a scroll
    returnDistance.set(
      getNextReturnDistance(returnDistance.get(), carried - offsetY, overviewHeight)
    )
    scrollOffset.set(carried)
    scrollY.setValue(carried)
    canPull.set(carried <= 0)
    TABS.forEach((tab) => pageHandles.current[tab]?.scrollToOffset(carried))

    if (webStyles) {
      webStyles.expandOverview()
      return
    }

    overviewSettle.setValue(wasCollapsed)
    Animated.timing(overviewSettle, {
      toValue: 0,
      ...OVERVIEW_EXPAND_TIMING,
      useNativeDriver: USE_NATIVE_DRIVER
    }).start()
  }, [
    bannersHeight,
    canPull,
    isDragging,
    overviewHeight,
    overviewSettle,
    returnDistance,
    scrollDirection,
    scrollOffset,
    scrollY,
    webStyles
  ])

  const renderTabs = useCallback((tabs: (TabType | undefined)[]) => {
    setRenderedTabs((prev) => {
      const missing = tabs.filter((tab): tab is TabType => !!tab && !prev[tab])

      if (!missing.length) return prev

      const next = { ...prev }

      missing.forEach((tab) => {
        next[tab] = true
      })

      return next
    })
  }, [])

  const onLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setPageSize((prev) =>
      prev.width === layout.width && prev.height === layout.height
        ? prev
        : { width: layout.width, height: layout.height }
    )
  }, [])

  const onBannersLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setBannersHeight(layout.height)
  }, [])

  const onTabsLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setTabsHeight(layout.height)
  }, [])

  // Follows the tab that was selected by pressing a tab. Aligning after a resize or
  // on mount (a deep link may open another tab) must not animate.
  const alignedTabIndexRef = useRef(openTabIndex)
  const isPagerDrivenRef = useRef(false)
  // Web only: where the pager was last reported at, and whether it is being scrolled to a
  // pressed tab rather than swiped, which it can only tell apart by the scroll events
  const pagerOffsetXRef = useRef(0)
  const isScrollingToTabRef = useRef(false)

  useEffect(() => {
    const previousTabIndex = alignedTabIndexRef.current
    const hasTabChanged = previousTabIndex !== openTabIndex
    alignedTabIndexRef.current = openTabIndex

    // A swipe already put the pager where the open tab followed it to, and took the
    // pages to the top when it started
    if (isPagerDrivenRef.current) return

    if (hasTabChanged) takePagesToTop()

    const offsetX = openTabIndex * pageSize.width

    if (isWeb && Math.abs(offsetX - pagerOffsetXRef.current) > 1) isScrollingToTabRef.current = true

    scrollRef.current?.scrollTo({ x: offsetX, animated: hasTabChanged })
  }, [openTab, openTabIndex, pageSize.width, takePagesToTop])

  // Only the banners scroll out of view; the tabs row stays. With no banners it maps to a
  // constant 0; never a static 0, or the native view keeps the last banner collapse.
  const headerTranslateY = useMemo(
    () =>
      scrollY.interpolate({
        // A zero range would shift the tabs row on the first pixel
        inputRange: [0, Math.max(bannersHeight, 1)],
        outputRange: [0, -bannersHeight],
        extrapolate: 'clamp'
      }),
    [bannersHeight, scrollY]
  )

  // The header is shared, so it would have to jump to match the page a swipe lands on:
  // taking every page to the top mid-swipe keeps that in line with pressing a tab. The
  // pages a swipe can reach are rendered here too, in case it beats the ordered build.
  const onScrollBeginDrag = useCallback(() => {
    isPagerDrivenRef.current = true
    takePagesToTop()
    renderTabs([TABS[openTabIndex - 1], TABS[openTabIndex + 1]])
  }, [openTabIndex, renderTabs, takePagesToTop])

  // The open tab follows the pager past the halfway point, so the tabs row does not wait
  // for the swipe to settle. Only under a gesture: scrolling to a pressed tab reports
  // every page it passes, and those are not the selection.
  const onPagerScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isPagerDrivenRef.current) return

      const tab = TABS[Math.round(event.nativeEvent.contentOffset.x / pageSize.width)]

      if (!tab || tab === openTab) return

      setOpenTab(tab)
    },
    [openTab, pageSize.width, setOpenTab]
  )

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isPagerDrivenRef.current = false

      const tab = TABS[Math.round(event.nativeEvent.contentOffset.x / pageSize.width)]

      if (!tab) return

      if (tab !== openTab) setOpenTab(tab)
    },
    [openTab, pageSize.width, setOpenTab]
  )

  // Web reports a swipe only as scroll events: the first one that isn't a scroll to a
  // pressed tab starts it, and it is over once they have stopped coming
  const pagerIdleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (pagerIdleTimeoutRef.current) clearTimeout(pagerIdleTimeoutRef.current)
    },
    []
  )

  const onWebPagerScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      pagerOffsetXRef.current = event.nativeEvent.contentOffset.x

      if (!isPagerDrivenRef.current && !isScrollingToTabRef.current) onScrollBeginDrag()

      if (pagerIdleTimeoutRef.current) clearTimeout(pagerIdleTimeoutRef.current)

      pagerIdleTimeoutRef.current = setTimeout(() => {
        pagerIdleTimeoutRef.current = null
        isScrollingToTabRef.current = false

        if (isPagerDrivenRef.current) onMomentumScrollEnd(event)
      }, WEB_PAGER_IDLE_DELAY)

      onPagerScroll(event)
    },
    [onMomentumScrollEnd, onPagerScroll, onScrollBeginDrag]
  )

  const carousel = useMemo(
    () => ({
      scrollY,
      pageScroll,
      headerHeight: bannersHeight + tabsHeight,
      collapsibleHeight: bannersHeight,
      overviewHeight,
      pageHeight: pageSize.height,
      registerPage,
      registerFloatingBar
    }),
    [
      bannersHeight,
      overviewHeight,
      pageScroll,
      pageSize.height,
      registerFloatingBar,
      registerPage,
      scrollY,
      tabsHeight
    ]
  )

  const pullStartX = useSharedValue(0)
  const pullStartY = useSharedValue(0)
  const pulled = useSharedValue(0)
  const spinnerGap = useSharedValue(0)
  const [isPulling, setIsPulling] = useState(false)

  // A drag on the header past the top opens the pages the same way a pull on one of
  // them does, so the two report themselves identically. Tracked in a ref as well, so
  // that following the finger costs no render.
  const isHeaderPullingRef = useRef(false)

  // Plain functions: a shared value may not be listed as a dependency of a hook and
  // then written to, and following the finger is exactly writing to one.
  const startHeaderPull = () => {
    if (isHeaderPullingRef.current) return

    isHeaderPullingRef.current = true
    setIsPulling(true)
  }

  const endHeaderPull = () => {
    if (!isHeaderPullingRef.current) return

    isHeaderPullingRef.current = false
    setIsPulling(false)
    pulled.value = withTiming(0, { duration: 200 })
  }

  // Enough banners cover a page whole, and the header is laid over it, so without
  // dragging the open page by the header there would be nothing left to drag it by.
  const touchStartY = useRef(0)
  const touchStartOffset = useRef(0)
  const hasPulledToRefresh = useRef(false)
  // Whether `isDragging` was set by the header, so a drag sets it only once
  const isHeaderDraggingRef = useRef(false)

  // Taps belong to the banners and the tabs, so this only records where the touch began
  // and where the open page is
  const onHeaderTouchStart = useCallback(
    ({ nativeEvent }: GestureResponderEvent) => {
      touchStartY.current = nativeEvent.pageY
      hasPulledToRefresh.current = false
      touchStartOffset.current = Math.max(scrollOffset.get(), 0)

      return false
    },
    [scrollOffset]
  )

  // Captured, so a drag that started on a banner is taken away from it the way a
  // scroll view takes over from a button inside it
  const onHeaderTouchMove = useCallback(
    ({ nativeEvent }: GestureResponderEvent) =>
      Math.abs(nativeEvent.pageY - touchStartY.current) > HEADER_PAN_THRESHOLD,
    []
  )

  const onHeaderDrag = ({ nativeEvent }: GestureResponderEvent) => {
    if (!isHeaderDraggingRef.current) {
      isHeaderDraggingRef.current = true
      isDragging.set(true)
    }

    const dragged = nativeEvent.pageY - touchStartY.current
    const offset = touchStartOffset.current - dragged

    pageHandles.current[openTab]?.scrollToOffset(Math.max(offset, 0))

    // Past the top, which the open page cannot be scrolled to. The pages are pulled
    // open instead, exactly as a pull on one of them does it, so a drag on a banner is
    // answered the same way as a drag on the list under it.
    if (offset >= 0) {
      endHeaderPull()

      return
    }

    startHeaderPull()
    pulled.value = -offset

    if (offset <= -PULL_TO_REFRESH_DISTANCE) {
      if (hasPulledToRefresh.current || !onRefresh) return

      hasPulledToRefresh.current = true
      onRefresh()
    }
  }

  // Web only: the header is laid over the open page, so the wheel turned over it is handed
  // to the page, which would otherwise not scroll under the banners and the tabs
  const onHeaderWheel = ({ deltaY, deltaMode }: { deltaY: number; deltaMode: number }) => {
    // Firefox reports a mouse wheel in lines rather than pixels
    pageHandles.current[openTab]?.scrollBy?.(deltaMode === 1 ? deltaY * WHEEL_LINE_HEIGHT : deltaY)
  }

  const endHeaderDrag = () => {
    isHeaderDraggingRef.current = false
    isDragging.set(false)
    endHeaderPull()
  }

  // The header scrolls the page from JS, so its drag is settled from JS too. Read just after
  // the page's last scroll event, it can be a frame behind, which the settle's own momentum
  // end then makes up for
  const onHeaderRelease = () => {
    endHeaderDrag()

    // Web's overview is never left partly collapsed, see `useWebCarouselStyles`
    if (webStyles) return

    const settleOffset = getOverviewSettleOffset()

    if (settleOffset !== null) {
      pageHandles.current[openTab]?.scrollToOffset(settleOffset, true)
    }
  }

  const requestRefresh = useCallback(() => {
    if (!onRefresh) return

    onRefresh()
  }, [onRefresh])

  // Held open for as long as the refresh runs, however it was asked for, so a pull on
  // the header and a pull on a page report themselves the same way.
  useEffect(() => {
    spinnerGap.value = withTiming(refreshing ? PULL_SPINNER_HEIGHT : 0, { duration: 200 })
  }, [refreshing, spinnerGap])

  // A page that can be scrolled claims the drag before the pull can judge it, so the
  // pages' scrolling is told to wait for the pull to fail. Without it the pull only ever
  // worked on a page short enough not to scroll - which, with banners above it, none is.
  const pageLists = useMemo(() => Object.values(pageListGestures), [pageListGestures])

  // Activated by hand, because whether a downward drag is a pull or the page being
  // scrolled back up is only answerable once the open page's offset is known. Failing
  // rather than activating leaves the touch to the pager and the list, untouched.
  const pullGesture = Gesture.Pan()
    .enabled(!!onRefresh)
    .manualActivation(true)
    .blocksExternalGesture(...pageLists)
    .onTouchesDown((event) => {
      const touch = event.allTouches[0]

      if (!touch) return

      pullStartX.value = touch.absoluteX
      pullStartY.value = touch.absoluteY
    })
    .onTouchesMove((event, manager) => {
      const touch = event.allTouches[0]

      if (!touch) return

      const draggedX = touch.absoluteX - pullStartX.value
      const draggedY = touch.absoluteY - pullStartY.value

      // A swipe between tabs, or the page being scrolled - neither of them is a pull
      if (Math.abs(draggedX) > Math.abs(draggedY) || draggedY < 0 || !canPull.value) {
        manager.fail()

        return
      }

      if (draggedY > PULL_ACTIVATION_THRESHOLD) manager.activate()
    })
    .onStart(() => {
      runOnJS(setIsPulling)(true)
    })
    .onUpdate(({ translationY }) => {
      pulled.value = Math.max(translationY, 0)
    })
    .onEnd(({ translationY }) => {
      if (translationY >= PULL_TO_REFRESH_DISTANCE) runOnJS(requestRefresh)()
    })
    .onFinalize(() => {
      pulled.value = withTiming(0, { duration: 200 })
      runOnJS(setIsPulling)(false)
    })

  // Transformed rather than laid out again, so a pull costs the pages no re-render
  const pagerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(pulled.value * PULL_RESISTANCE, spinnerGap.value) }]
  }))

  // Clipped to the gap the pages have opened, so the spinner is revealed by the pull
  // instead of being drawn over the page under it
  const spinnerStyle = useAnimatedStyle(() => {
    const gap = Math.max(pulled.value * PULL_RESISTANCE, spinnerGap.value)

    return { height: gap, opacity: Math.min(gap / PULL_SPINNER_HEIGHT, 1) }
  })

  const openTabFloatingBar = floatingBars[openTab]

  // Web only, where nothing hands the wheel over the header to the page under it
  const webHeaderProps = isWeb ? { onWheel: onHeaderWheel } : undefined

  const pages = useMemo(
    () =>
      React.Children.map(children, (child, index) => {
        const tab = TABS[index]

        return (
          <CarouselPage
            style={pageSize}
            rendered={!!tab && (tab === openTab || !!renderedTabs[tab])}
          >
            {child}
          </CarouselPage>
        )
      }),
    [children, openTab, pageSize, renderedTabs]
  )

  // Animated draws the moving views on mobile, Reanimated on web: see `useWebCarouselStyles`
  const MovingView = (webStyles ? Reanimated.View : Animated.View) as typeof Animated.View

  const pager = (
    <Reanimated.View style={[flexbox.flex1, pagerStyle]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        directionalLockEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={isWeb ? onWebPagerScroll : onPagerScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onMomentumScrollEnd={onMomentumScrollEnd}
      >
        {pages}
      </ScrollView>
    </Reanimated.View>
  )

  return (
    // Lets a touch through to the overview where the pages have slid away from it
    <View style={styles.container} pointerEvents="box-none">
      <WhileFocused openTabIndex={openTabIndex} renderTabs={renderTabs} initAllTabs={initAllTabs} />
      {/* Opaque, as it slides over the part of the overview that collapses */}
      <MovingView
        style={[styles.slider, webStyles?.push ?? { transform: [{ translateY: overviewPush }] }]}
      >
        <View style={flexbox.flex1} onLayout={onLayout}>
          <DashboardCarouselContext.Provider value={carousel}>
            {(isPulling || !!refreshing) && (
              <Reanimated.View
                pointerEvents="none"
                style={[styles.pullSpinner, { top: bannersHeight + tabsHeight }, spinnerStyle]}
              >
                <Spinner style={styles.pullSpinnerIcon} />
              </Reanimated.View>
            )}
            {/* Web moves the lists with the pager rather than holding them in place */}
            <MovingView
              style={[
                flexbox.flex1,
                !webStyles && pagerLiftOffsetStyle,
                !webStyles && pagerLiftStyle
              ]}
            >
              {/* Web has no pull to refresh, and the gesture would only stand in the way of the wheel */}
              {isWeb ? pager : <GestureDetector gesture={pullGesture}>{pager}</GestureDetector>}
            </MovingView>
          </DashboardCarouselContext.Provider>
        </View>
        {/* The banners and the tabs row are account wide, so they are laid over the
      pager instead of moving with it. Rendered after it, because zIndex alone is
      not enough to keep them on top on Android. The pages used to render them
      inside a list that adds this padding on top of the one the tabs row has */}
        <MovingView
          onStartShouldSetResponderCapture={onHeaderTouchStart}
          onMoveShouldSetResponderCapture={onHeaderTouchMove}
          onResponderMove={onHeaderDrag}
          onResponderRelease={onHeaderRelease}
          onResponderTerminate={endHeaderDrag}
          {...webHeaderProps}
          style={[
            styles.header,
            spacings.phSm,
            webStyles?.header ?? { transform: [{ translateY: headerTranslateY }] }
          ]}
        >
          <View onLayout={onBannersLayout}>
            <DashboardBanners />
          </View>
          <View onLayout={onTabsLayout}>
            <TabsAndSearch openTab={openTab} setOpenTab={setOpenTab} sessionId={sessionId} />
          </View>
        </MovingView>
      </MovingView>
      {!!overviewHeight && (
        <MovingView
          pointerEvents="none"
          style={[
            styles.collapseCover,
            webStyles?.push ?? { transform: [{ translateY: overviewPush }] }
          ]}
        >
          <OverviewCollapseCover />
        </MovingView>
      )}
      {/* Outside the pager, so a swipe doesn't carry it along, and only what the open
      tab put in it changes. Hidden together with the overview */}
      {!!openTabFloatingBar && (
        <MovingView
          pointerEvents="box-none"
          style={[styles.floatingBar, webStyles?.floatingBar ?? floatingBarHideStyle]}
        >
          <FloatingBottomBar {...openTabFloatingBar} />
        </MovingView>
      )}
    </View>
  )
}

export default React.memo(DashboardPagesCarousel)
