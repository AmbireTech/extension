import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Animated, Dimensions, View, ViewStyle } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
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
  const menuRef = useRef<View>(null)
  const [position, setPosition] = useState<{
    top?: number
    bottom?: number
    left: number
    isAbove: boolean
    isAlignedRight: boolean
  }>({
    left: 0,
    isAbove: false,
    isAlignedRight: false
  })
  const [menuSize, setMenuSize] = useState({ width: 0, height: 0 })
  const scaleAnim = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  // Measure menu size once it's rendered
  useLayoutEffect(() => {
    if (menuRef.current && isOpen) {
      menuRef.current.measure((x, y, width, height) => {
        setMenuSize({ width, height })
      })
    }
  }, [isOpen])

  // Calculate position with viewport boundary detection
  useLayoutEffect(() => {
    if (!parentRef.current || !isOpen) return

    parentRef.current.measure((x, y, width, height, pageX, pageY) => {
      const { width: screenWidth, height: screenHeight } = Dimensions.get('window')
      const GAP = 16
      const NETWORK_SELECTOR_MAX_HEIGHT = 320
      const maxMenuHeight = menuSize.height + NETWORK_SELECTOR_MAX_HEIGHT

      const spaceAbove = pageY
      const spaceBelow = screenHeight - (pageY + height)

      // Determine vertical position (prefer above if there's space)
      const hasSpaceAbove = menuSize.height > 0 && spaceAbove >= maxMenuHeight + GAP
      const hasSpaceBelow = spaceBelow >= menuSize.height + GAP
      const positionAbove = hasSpaceAbove || (!hasSpaceBelow && spaceAbove >= spaceBelow)

      const verticalPos = positionAbove
        ? { bottom: screenHeight - pageY + GAP }
        : { top: pageY + height + GAP }

      // Determine horizontal position
      let left = pageX
      let alignedRight = false

      if (menuSize.width > 0 && left + menuSize.width > screenWidth) {
        left = pageX + width - menuSize.width
        alignedRight = true
      }

      left = Math.max(GAP, left)

      setPosition({ ...verticalPos, left, isAbove: positionAbove, isAlignedRight: alignedRight })
    })
  }, [isOpen, parentRef, menuSize])

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 10
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true
        })
      ]).start()
    }
  }, [isOpen, scaleAnim, opacityAnim])

  // Close the menu when clicking outside
  useEffect(() => {
    if (!isWeb) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        // @ts-ignore
        !menuRef.current.contains(event.target as Node) &&
        // @ts-ignore
        (!parentRef || !parentRef.current?.contains(event.target as Node))
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      if (!isWeb) return

      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, parentRef, setIsOpen])

  return (
    <Portal hostName="global">
      <Animated.View
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
          opacity: opacityAnim,
          ...spacings.phTy,
          ...spacings.pvTy,
          backgroundColor: theme.secondaryBackground,
          borderRadius: BORDER_RADIUS_PRIMARY,
          ...style
        }}
        ref={menuRef}
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
