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
import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import { parseHexColor } from '@common/utils/recolorLottie'

import getStyles from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type Props = {
  onPress?: () => void
  /** A ⌄ at the end, for a button that opens the account list */
  withArrowDownIcon?: boolean
  /** The solid color behind the button, which its translucent background darkens */
  backgroundBehindColor?: string
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

const AccountData: FC<Props> = ({ onPress, withArrowDownIcon, backgroundBehindColor }) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { styles, theme } = useTheme(getStyles)
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

  // Shortened in the middle, so its start and end always show
  const formattedAddress = useMemo(
    () => (account ? shortenAddress(account.addr, 18, 4) : ''),
    [account]
  )

  // A Privacy Pools account has no address of its own, so its kind stands in for one
  const label = account ? account.preferences.label : privacyPoolsAccount?.label
  const canCopyAddress = isWeb && !!account

  if (!account && !privacyPoolsAccount) return null

  return (
    <View
      style={{
        overflow: 'hidden',
        // Takes all the width its row leaves
        flex: 1,
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
            ...(isNarrowWebLayout ? { minWidth: 0 } : {}),
            ...(isWeb && !onPress ? { cursor: 'auto' } : {})
          },
          {
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
          {/* The name and the address on two rows. They take the button's free width, which pushes
            the ⌄ to its end. */}
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
