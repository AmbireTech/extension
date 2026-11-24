import React, { FC, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import CopyIcon from '@common/assets/svg/CopyIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import Avatar from '@common/components/Avatar'
import { getHeaderIconStrokeWidth } from '@common/components/HeaderButton/constants'
import PrivacyPoolsAccountAvatar from '@common/components/PrivacyPoolsAccountAvatar'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useController from '@common/hooks/useController'
import useControllerStore from '@common/hooks/useControllerStore'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import usePrivacyPoolsAccounts from '@common/hooks/usePrivacyPoolsAccounts'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import { parseHexColor } from '@common/utils/recolorLottie'
import { getUiType } from '@common/utils/uiType'

import getStyles from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type Props = {
  onPress?: () => void
  /** A ⌄ at the end, for a button that opens the account list */
  withArrowDownIcon?: boolean
  /** The solid color behind the button, which its translucent background darkens */
  backgroundBehindColor?: string
  /** Overrides the button's default height */
  height?: number
  /** Takes all the width its row leaves, with the name and the address on two rows */
  isExpanded?: boolean
}

/** How much the button's black background covers what is behind it */
const BUTTON_BACKGROUND_OPACITY = 0.64
const MAX_CHANNEL = 255

/** The solid color the button looks on top of `backgroundBehindColor`, for the badge ring */
const getButtonColorOver = (backgroundBehindColor: string) => {
  const channels = parseHexColor(backgroundBehindColor)
  if (!channels) return '#000000'

  const [r, g, b] = channels.map((channel) =>
    Math.round(channel * MAX_CHANNEL * (1 - BUTTON_BACKGROUND_OPACITY))
  )

  return `rgb(${r}, ${g}, ${b})`
}

const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account

const AccountData: FC<Props> = ({
  onPress,
  withArrowDownIcon,
  backgroundBehindColor,
  height,
  isExpanded
}) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { styles, theme } = useTheme(getStyles)
  const { maxWidthSize } = useWindowSize()
  const { isPopup } = getUiType()
  const { isNarrowWebLayout } = useCompactLayout()
  const { isStoreReady } = useControllerStore()

  const { state: account } = useController('SelectedAccountController', selectAccount)
  // Shown in place of a regular account, with no address to copy
  const { selectedAccount: privacyPoolsAccount } = usePrivacyPoolsAccounts()
  const [bindAddressAnim, addressAnimStyle] = useHover({
    preset: 'opacityInverted',
    duration: 50
  })

  const handleCopyText = async () => {
    if (!account) return

    try {
      await setStringAsync(account.addr)
      addToast(t('Copied address to clipboard!') as string, { timeout: 2500 })
    } catch {
      addToast(t('Failed to copy address to clipboard!') as string, {
        timeout: 2500,
        type: 'error'
      })
    }
  }

  const smartAccountType = useMemo(() => {
    if (account?.creation) return 'Ambire'
    if (account?.safeCreation) return 'Safe'
    return undefined
  }, [account])

  const hasTwoRows = isMobile || !!isExpanded

  const formattedAddress = useMemo(() => {
    if (!account) return ''

    // Shortened in the middle, so its start and end always show
    if (hasTwoRows) return shortenAddress(account.addr, 18, 4)

    if (isNarrowWebLayout) return account.addr

    return shortenAddress(account.addr, 13)
  }, [account, hasTwoRows, isNarrowWebLayout])

  // A Privacy Pools account has no address of its own, so its kind stands in for one
  const label = account ? account.preferences.label : privacyPoolsAccount?.label
  const subtitle = account ? `(${formattedAddress})` : `(${t('Privacy Pools')})`
  const canCopyAddress = isWeb && !!account

  if (!account && !privacyPoolsAccount) return null

  return (
    <View
      style={{
        overflow: 'hidden',
        flexShrink: 1,
        ...(isExpanded ? { flex: 1 } : {}),
        borderTopRightRadius: 50,
        borderBottomRightRadius: 50
      }}
    >
      <AnimatedPressable
        testID="account-select-btn"
        style={[
          styles.accountButton,
          {
            backgroundColor: hexToRgba('#000000', BUTTON_BACKGROUND_OPACITY),
            flexShrink: 1,
            ...(height ? { height } : {}),
            // Fills its row, so the row spaces it from its neighbours
            ...(isExpanded ? { marginRight: 0 } : {}),
            ...(isNarrowWebLayout ? { minWidth: 0 } : {}),
            ...(isWeb && !onPress ? { cursor: 'auto' } : {})
          },
          // On web, only the dashboard's button has the border
          (isMobile || isExpanded) && {
            borderWidth: 1,
            borderColor: '#FFFFFF1F'
          }
        ]}
        onPress={onPress}
      >
        <>
          {isStoreReady && account && (
            <Avatar
              pfp={account.preferences.pfp}
              address={account.addr}
              size={32}
              smartAccountType={smartAccountType}
              typeBadgeRingColor={getButtonColorOver(
                backgroundBehindColor ?? String(theme.primaryBackground)
              )}
            />
          )}
          {isStoreReady && !account && (
            <PrivacyPoolsAccountAvatar size={32} style={spacings.mrTy} />
          )}
          {!isStoreReady && (
            <SkeletonLoader width={32} height={32} borderRadius={16} style={spacings.mrTy} />
          )}
          {!hasTwoRows && isNarrowWebLayout && (
            <>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                weight={isMobile ? 'medium' : 'semiBold'}
                style={[
                  spacings.mrMi,
                  // While the address is next to the name, the name keeps its width and the
                  // address shrinks. On a narrow panel the address is hidden, so the name is
                  // the only thing that can give way to a long label.
                  maxWidthSize('s')
                    ? { flexShrink: 0, minWidth: 0, maxWidth: '55%' }
                    : { flexShrink: 1, minWidth: 0 }
                ]}
                color="#FFFFFF"
                fontSize={14}
              >
                {label}
              </Text>
              {maxWidthSize('s') && (
                <View
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    { flexShrink: 1, minWidth: 0 }
                  ]}
                >
                  <Text
                    color="#B9BFC9"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={[{ flexShrink: 1, minWidth: 0 }, isWeb ? spacings.mrTy : undefined]}
                    weight={account ? 'mono_regular' : 'regular'}
                    fontSize={12}
                  >
                    {subtitle}
                  </Text>
                  {canCopyAddress && (
                    <AnimatedPressable
                      style={addressAnimStyle}
                      onPress={handleCopyText}
                      {...bindAddressAnim}
                    >
                      <CopyIcon width={24} height={24} color="#E3E6EB" />
                    </AnimatedPressable>
                  )}
                </View>
              )}
            </>
          )}
          {hasTwoRows && (
            // The name and the address on two rows, both as wide as the button lets them. In an
            // expanded button they take its free width, which pushes the ⌄ to its end.
            <View style={[spacings.mrMi, { flexGrow: 1, flexShrink: 1, minWidth: 0 }]}>
              <Text
                numberOfLines={1}
                weight={isMobile ? 'medium' : 'semiBold'}
                color="#FFFFFF"
                fontSize={14}
                style={{ lineHeight: 18 }}
              >
                {label}
              </Text>
              <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                <Text
                  color="#B9BFC9"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  weight={account ? 'mono_regular' : 'regular'}
                  fontSize={12}
                  style={{ lineHeight: 16, flexShrink: 1, minWidth: 0 }}
                >
                  {account ? formattedAddress : t('Privacy Pools')}
                </Text>
                {canCopyAddress && (
                  <AnimatedPressable
                    style={[spacings.mlMi, { flexShrink: 0 }, addressAnimStyle]}
                    onPress={handleCopyText}
                    {...bindAddressAnim}
                  >
                    <CopyIcon width={16} height={16} color="#E3E6EB" />
                  </AnimatedPressable>
                )}
              </View>
            </View>
          )}
          {!hasTwoRows && !isNarrowWebLayout && (
            <>
              <Text
                numberOfLines={1}
                weight="semiBold"
                style={[
                  spacings.mrMi,
                  // Capped to leave room for the address. A Privacy Pools account has none, so its
                  // name takes the room and gives way only once the header runs out of it.
                  {
                    maxWidth: account ? (isPopup ? 112 : 160) : undefined,
                    flexShrink: 1,
                    minWidth: 0
                  }
                ]}
                color="#FFFFFF"
                fontSize={14}
              >
                {label}
              </Text>
              <>
                <Text
                  color="#B9BFC9"
                  numberOfLines={1}
                  // Keeps its width on one row, so the name next to it is what gives way
                  style={[{ flexShrink: 0 }, isWeb ? spacings.mrTy : undefined]}
                  weight={account ? 'mono_regular' : 'regular'}
                  fontSize={12}
                >
                  {subtitle}
                </Text>
                {canCopyAddress && (
                  <AnimatedPressable
                    style={addressAnimStyle}
                    onPress={handleCopyText}
                    {...bindAddressAnim}
                  >
                    <CopyIcon width={24} height={24} color="#E3E6EB" />
                  </AnimatedPressable>
                )}
              </>
            </>
          )}

          {!!withArrowDownIcon && (
            <DownArrowIcon
              style={[spacings.mlMi, { marginRight: 2, flexShrink: 0 }]}
              width={12}
              height={7}
              strokeWidth={String(getHeaderIconStrokeWidth(14.879, 12))}
              color="#E3E6EB"
            />
          )}
        </>
      </AnimatedPressable>
    </View>
  )
}

export default memo(AccountData)
