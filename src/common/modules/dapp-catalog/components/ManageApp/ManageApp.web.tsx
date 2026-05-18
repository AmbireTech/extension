import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, Pressable, View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Dapp } from '@ambire-common/interfaces/dapp'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import Avatar from '@common/components/Avatar'
import { BOTTOM_SHEET_Z_INDEX } from '@common/components/BottomSheet/styles'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { AnimatedPressable } from '@common/hooks/useHover'
import usePrevious from '@common/hooks/usePrevious'
import useTheme from '@common/hooks/useTheme'
import AccountPreferences from '@common/modules/dapp-catalog/components/ManageApp/AccountPreferences'
import AccountPreferencesBottomSheet from '@common/modules/dapp-catalog/components/ManageApp/AccountPreferencesBottomSheet'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { Portal } from '@gorhom/portal'

import useManageApp from '../../hooks/useManageApp'
import DappIcon from '../DappIcon'
import DisconnectButton from './DisconnectButton'
import NetworkSelector from './NetworkSelector'

interface ManageAppProps {
  dapp: Dapp
  children: React.ReactNode
  withCurrentAccount?: boolean
  isParentHovered?: boolean
  buttonProps?: Omit<React.ComponentProps<typeof Pressable>, 'onPress' | 'ref'>
  style?: ViewStyle
  onClosed?: () => void
}

const MAX_APP_NAME_LENGTH = 20

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
        <Text
          weight="medium"
          numberOfLines={1}
          fontSize={14}
          dataSet={
            dapp.name.length <= MAX_APP_NAME_LENGTH
              ? undefined
              : createGlobalTooltipDataSet({
                  id: 'dapp-name-tooltip',
                  content: dapp.name
                })
          }
        >
          {dapp.name.length > MAX_APP_NAME_LENGTH
            ? `${dapp.name.slice(0, MAX_APP_NAME_LENGTH)}...`
            : dapp.name}
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
  children,
  withCurrentAccount = false,
  isParentHovered,
  buttonProps,
  style = {}
}: ManageAppProps) => {
  const { theme } = useTheme()
  const { account } = useManageApp(dapp)
  const [isOpen, setIsOpen] = useState(false)
  const [isNetworkSelectorExpanded, setIsNetworkSelectorExpanded] = useState(false)
  const [isSelfHovered, setIsSelfHovered] = useState(false)
  const parentRef = useRef<View>(null)
  const {
    ref: accountPreferencesRef,
    open: openAccountPreferences,
    close: closeAccountPreferences
  } = useModalize()

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

  useEffect(() => {
    if (!menuEl || !parentRef.current) return

    if (isWeb) {
      const parentRect = (parentRef.current as unknown as HTMLElement).getBoundingClientRect()
      const el = menuEl as unknown as HTMLElement
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
  }, [menuEl, applyPosition])

  useEffect(() => {
    if (!isPositioned) return
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 10 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start()
  }, [isPositioned, scaleAnim, opacityAnim])

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
  }, [menuEl])

  useEffect(() => {
    if (isOpen && !prevIsOpen) {
      scaleAnim.setValue(0)
      opacityAnim.setValue(0)
      setIsPositioned(false)
      setIsNetworkSelectorExpanded(false)
      setIsVisible(true)
    } else if (!isOpen && prevIsOpen) {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0, duration: 150, useNativeDriver: !isWeb }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: !isWeb })
      ]).start(({ finished }) => {
        if (finished) setIsVisible(false)
      })
    }
  }, [isOpen, scaleAnim, opacityAnim, prevIsOpen])

  const handlePress = useCallback(() => {
    if (!dapp.isConnected) return
    setIsOpen((prev) => !prev)
  }, [dapp.isConnected])

  const showChildren = isParentHovered === undefined || isParentHovered || isSelfHovered

  return (
    <View style={{ zIndex: BOTTOM_SHEET_Z_INDEX - 1 }}>
      <AnimatedPressable
        ref={parentRef}
        {...(buttonProps as any)}
        onPress={handlePress}
        // @ts-ignore - web-only hover events
        onMouseEnter={() => setIsSelfHovered(true)}
        onMouseLeave={() => setIsSelfHovered(false)}
      >
        {showChildren ? children : null}
      </AnimatedPressable>

      <AccountPreferencesBottomSheet
        dapp={dapp}
        sheetRef={accountPreferencesRef}
        closeBottomSheet={closeAccountPreferences}
      />

      {isVisible && (
        <Portal hostName="global">
          <Animated.View
            ref={setMenuEl as any}
            style={{
              position: 'absolute',
              top: position.top,
              bottom: position.bottom,
              left: position.left,
              zIndex: BOTTOM_SHEET_Z_INDEX - 1,
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
            {!!withCurrentAccount && !!account && (
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.justifySpaceBetween,
                  spacings.phTy,
                  spacings.pvTy,
                  { borderRadius: 8 }
                ]}
              >
                <Text fontSize={14} weight="medium" appearance="tertiaryText">
                  Connect Wallet
                </Text>
                <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                  <Avatar
                    pfp={account.preferences.pfp}
                    address={account.addr}
                    size={20}
                    style={spacings.mr0}
                  />
                  <Text fontSize={12} weight="medium" style={spacings.mlTy}>
                    {shortenAddress(account.addr, 13)}
                  </Text>
                </View>
              </View>
            )}
            <AccountPreferences
              dapp={dapp}
              onManageAccountsPress={openAccountPreferences}
              closeMenu={() => setIsOpen(false)}
            />
            {!!dapp.isConnected && <DisconnectButton dapp={dapp} setIsOpen={setIsOpen} />}
            <AppData dapp={dapp} />
          </Animated.View>
        </Portal>
      )}
    </View>
  )
}

export default React.memo(ManageApp)
