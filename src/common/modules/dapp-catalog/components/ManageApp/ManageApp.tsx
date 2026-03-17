import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, View, ViewStyle } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import usePrevious from '@common/hooks/usePrevious'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { Portal } from '@gorhom/portal'

import DappIcon from '../DappIcon'
import DisconnectButton from './DisconnectButton'
import NetworkSelector from './NetworkSelector'

const AppData = ({ dapp }: { dapp: Dapp }) => {
  let hostname = ''
  try {
    hostname = new URL(dapp.url).hostname.replace('www.', '')
  } catch (e) {
    console.error('Error parsing dapp URL:', e, 'URL:', dapp.url, 'Dapp id:', dapp.id)
  }

  return (
    <View
      style={{
        ...flexbox.directionRow,
        ...flexbox.alignCenter,
        ...spacings.phTy
      }}
    >
      <DappIcon dapp={dapp} />
      <View style={[flexbox.flex1, spacings.mlSm]}>
        <Text weight="medium" numberOfLines={1} fontSize={14}>
          {dapp.name}
        </Text>
        <Text fontSize={12} appearance="tertiaryText">
          {hostname}
        </Text>
      </View>
    </View>
  )
}

const ManageApp = ({
  dapp,
  style = {},
  isOpen,
  setIsOpen,
  parentRef,
  isNetworkSelectorExpanded,
  setIsNetworkSelectorExpanded
}: {
  dapp: Dapp
  parentRef: React.RefObject<View | null>
  style?: ViewStyle
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  isNetworkSelectorExpanded: boolean
  setIsNetworkSelectorExpanded: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const { theme } = useTheme()
  // menuEl holds the portal node. A callback ref is used instead of useRef
  // because @gorhom/portal renders into a separate React tree — the node is
  // attached in a later render cycle, so a state update is needed to re-run
  // the positioning effect once the element actually exists in the DOM.
  const [menuEl, setMenuEl] = useState<View | null>(null)
  const [position, setPosition] = useState<{
    top?: number
    bottom?: number
    left: number
    isAbove: boolean
    isAlignedRight: boolean
  }>({ left: 0, isAbove: false, isAlignedRight: false })
  const [isPositioned, setIsPositioned] = useState(false)
  const scaleAnim = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const prevIsOpen = usePrevious(isOpen)
  const [isVisible, setIsVisible] = useState(isOpen)

  const applyPosition = useCallback(
    (
      pageX: number,
      pageY: number,
      width: number,
      height: number,
      menuWidth: number,
      menuHeight: number
    ) => {
      const screenWidth = isWeb ? window.innerWidth : Dimensions.get('window').width
      const screenHeight = isWeb ? window.innerHeight : Dimensions.get('window').height
      const GAP = 16
      const NETWORK_SELECTOR_MAX_HEIGHT = 320

      const spaceAbove = pageY
      const spaceBelow = screenHeight - (pageY + height)
      const hasSpaceAbove =
        menuHeight > 0 && spaceAbove >= menuHeight + NETWORK_SELECTOR_MAX_HEIGHT + GAP
      const hasSpaceBelow = spaceBelow >= menuHeight + GAP
      const positionAbove = hasSpaceAbove || (!hasSpaceBelow && spaceAbove >= spaceBelow)

      const verticalPos = positionAbove
        ? { bottom: screenHeight - pageY + GAP }
        : { top: pageY + height + GAP }

      let left = pageX
      let alignedRight = false
      if (menuWidth > 0 && left + menuWidth > screenWidth) {
        left = pageX + width - menuWidth
        alignedRight = true
      }

      setPosition({
        ...verticalPos,
        left: Math.max(GAP, left),
        isAbove: positionAbove,
        isAlignedRight: alignedRight
      })
      setIsPositioned(true)
    },
    []
  )

  // Runs after the portal node is confirmed mounted (menuEl is set).
  useEffect(() => {
    if (!menuEl || !parentRef.current) return

    if (isWeb) {
      const parentRect = (parentRef.current as unknown as HTMLElement).getBoundingClientRect()
      const el = menuEl as unknown as HTMLElement
      // offsetWidth/offsetHeight ignore CSS transforms — correct even at scale(0).
      applyPosition(
        parentRect.left,
        parentRect.top,
        parentRect.width,
        parentRect.height,
        el.offsetWidth,
        el.offsetHeight
      )
    } else {
      parentRef.current.measure((x, y, width, height, pageX, pageY) => {
        ;(menuEl as View).measure((_mx, _my, menuWidth, menuHeight) => {
          applyPosition(pageX, pageY, width, height, menuWidth, menuHeight)
        })
      })
    }
  }, [menuEl, parentRef, applyPosition])

  // Start open animation only after position is known.
  useEffect(() => {
    if (!isPositioned) return
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 10 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start()
  }, [isPositioned, scaleAnim, opacityAnim])

  // Close when clicking outside
  useEffect(() => {
    if (!isWeb) return
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuEl &&
        // @ts-ignore
        !menuEl.contains(event.target as Node) &&
        // @ts-ignore
        !parentRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuEl, parentRef, setIsOpen])

  // Drive the mount/unmount lifecycle with animated open and close transitions.
  useEffect(() => {
    if (isOpen && !prevIsOpen) {
      // Reset both animations before mounting so every open plays from scratch.
      scaleAnim.setValue(0)
      opacityAnim.setValue(0)
      setIsPositioned(false)
      setIsVisible(true)
    } else if (!isOpen && prevIsOpen) {
      // Animate out, then unmount.
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0, duration: 150, useNativeDriver: !isWeb }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: !isWeb })
      ]).start(({ finished }) => {
        if (finished) setIsVisible(false)
      })
    }
  }, [isOpen, scaleAnim, opacityAnim, prevIsOpen])

  if (!isVisible) return null

  return (
    <Portal hostName="global">
      <Animated.View
        ref={setMenuEl as any}
        style={{
          position: 'absolute',
          top: position.top,
          bottom: position.bottom,
          left: position.left,
          zIndex: 999,
          transform: [
            {
              translateY: scaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [position.isAbove ? 20 : -20, 0]
              })
            },
            { scale: scaleAnim },
            {
              translateX: scaleAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [position.isAlignedRight ? 20 : -20, 0]
              })
            }
          ],
          transformOrigin: `${position.isAbove ? 'bottom' : 'top'} ${position.isAlignedRight ? 'right' : 'left'}`,
          minWidth: 216,
          // Hide until positioned to avoid a flash at {left: 0}.
          opacity: isPositioned ? opacityAnim : 0,
          ...spacings.phTy,
          ...spacings.pvTy,
          backgroundColor: theme.secondaryBackground,
          borderRadius: BORDER_RADIUS_PRIMARY,
          ...style
        }}
      >
        <NetworkSelector
          dapp={dapp}
          isAbove={position.isAbove}
          isExpanded={isNetworkSelectorExpanded}
          setIsExpanded={setIsNetworkSelectorExpanded}
        />
        <DisconnectButton dapp={dapp} setIsOpen={setIsOpen} />
        <AppData dapp={dapp} />
      </Animated.View>
    </Portal>
  )
}

export default React.memo(ManageApp)
