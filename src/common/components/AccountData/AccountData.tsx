import React, { FC, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, View } from 'react-native'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import CopyIcon from '@common/assets/svg/CopyIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Avatar from '@common/components/Avatar'
import PrivacyPoolsAccountAvatar from '@common/components/PrivacyPoolsAccountAvatar'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useController from '@common/hooks/useController'
import useControllerStore from '@common/hooks/useControllerStore'
import useHover, { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import usePrivateAccounts from '@common/hooks/usePrivateAccounts'
import { PRIVACY_PROVIDER_NAMES } from '@common/modules/privacy/providers'
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
  /**
   * It would be much nicer to just render children,
   * but then it would be harder to animate them.
   * Consider refactoring in the future, if this is needed
   */
  withArrowRightIcon?: boolean
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

const AccountData: FC<Props> = ({ onPress, withArrowRightIcon, backgroundBehindColor }) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { styles, theme } = useTheme(getStyles)
  const { maxWidthSize } = useWindowSize()
  const { isPopup } = getUiType()
  const { isNarrowWebLayout } = useCompactLayout()
  const { isStoreReady } = useControllerStore()

  const { state: account } = useController('SelectedAccountController', selectAccount)
  // Shown in place of a regular account, with no address to copy
  const { selectedAccount: privateAccount } = usePrivateAccounts()
  const [bindAddressAnim, addressAnimStyle] = useHover({
    preset: 'opacityInverted',
    duration: 50
  })

  const [bindAccountBtnAnim, accountBtnAnimStyle] = useCustomHover({
    property: isWeb ? 'left' : 'opacity',
    values: isWeb ? { from: 0, to: 2 } : { from: 1, to: 1 },
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

  const formattedAddress = useMemo(() => {
    if (!account) return ''

    if (isNarrowWebLayout) return account.addr

    if (isMobile) return shortenAddress(account.addr, 18, 4)

    return shortenAddress(account.addr, 13)
  }, [account, isNarrowWebLayout])

  // A private account has no name or address of its own, so it is named by its kind
  const label = account ? account.preferences.label : t('Private account')
  const subtitle = account
    ? `(${formattedAddress})`
    : PRIVACY_PROVIDER_NAMES[privateAccount?.providerId ?? 'privacyPools']
  const canCopyAddress = isWeb && !!account

  if (!account && !privateAccount) return null

  return (
    <View
      style={{
        overflow: 'hidden',
        flexShrink: 1,
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
          isMobile && {
            borderWidth: 1,
            borderColor: '#FFFFFF1F'
          }
        ]}
        onPress={onPress}
        {...(onPress ? bindAccountBtnAnim : {})}
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
          {isNarrowWebLayout ? (
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
          ) : (
            <>
              <Text
                numberOfLines={1}
                weight={isMobile ? 'medium' : 'semiBold'}
                style={[
                  spacings.mrMi,
                  { maxWidth: isPopup ? 112 : 160, flexShrink: 1, minWidth: 0 }
                ]}
                color="#FFFFFF"
                fontSize={14}
              >
                {label}
              </Text>
              <>
                <Text
                  color="#B9BFC9"
                  style={[isWeb ? spacings.mrTy : undefined]}
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

          {!!withArrowRightIcon && (
            <Animated.View style={accountBtnAnimStyle}>
              <RightArrowIcon
                style={[
                  styles.accountButtonRightIcon,
                  maxWidthSize(480) ? spacings.mlMd : spacings.mlTy
                ]}
                width={12}
                color="#E3E6EB"
              />
            </Animated.View>
          )}
        </>
      </AnimatedPressable>
    </View>
  )
}

export default memo(AccountData)
