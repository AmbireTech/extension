import React, { FC, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated } from 'react-native'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import CopyIcon from '@common/assets/svg/CopyIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Avatar from '@common/components/Avatar'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useHover, { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import { setStringAsync } from '@common/utils/clipboard'
import { getUiType } from '@common/utils/uiType'

import getStyles from './styles'

type Props = {
  onPress?: () => void
  /**
   * It would be much nicer to just render children,
   * but then it would be harder to animate them.
   * Consider refactoring in the future, if this is needed
   */
  withArrowRightIcon?: boolean
}

const AccountData: FC<Props> = ({ onPress, withArrowRightIcon }) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { styles } = useTheme(getStyles)
  const { maxWidthSize } = useWindowSize()
  const { isPopup } = getUiType()
  const { account } = useController('SelectedAccountController').state
  const [bindAddressAnim, addressAnimStyle] = useHover({
    preset: 'opacityInverted',
    duration: 50
  })
  const [bindAccountBtnAnim, accountBtnAnimStyle] = useCustomHover({
    property: 'left',
    values: {
      from: 0,
      to: 2
    },
    duration: 50
  })

  if (!account) return null

  const handleCopyText = async () => {
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

  return (
    <AnimatedPressable
      testID="account-select-btn"
      style={[
        styles.accountButton,
        {
          backgroundColor: '#000000A3',
          // @ts-ignore
          ...(isWeb && !onPress ? { cursor: 'auto' } : {})
        }
      ]}
      onPress={onPress}
      {...(onPress ? bindAccountBtnAnim : {})}
    >
      <>
        <Avatar
          pfp={account.preferences.pfp}
          address={account.addr}
          size={32}
          smartAccountType={smartAccountType}
        />
        <Text
          numberOfLines={1}
          weight="semiBold"
          style={[spacings.mrMi, { maxWidth: isPopup ? 112 : 160 }]}
          color="#FFFFFF"
          fontSize={14}
        >
          {account.preferences.label}
        </Text>
        {maxWidthSize(480) && (
          <>
            <Text color="#B9BFC9" style={spacings.mrTy} weight="mono_regular" fontSize={12}>
              ({shortenAddress(account.addr, 13)})
            </Text>
            <AnimatedPressable
              style={addressAnimStyle}
              onPress={handleCopyText}
              {...bindAddressAnim}
            >
              <CopyIcon width={24} height={24} color="#E3E6EB" />
            </AnimatedPressable>
          </>
        )}
        {!!withArrowRightIcon && (
          <Animated.View style={accountBtnAnimStyle}>
            <RightArrowIcon
              style={[
                styles.accountButtonRightIcon,
                maxWidthSize(480) ? spacings.mlMd : spacings.mlSm
              ]}
              width={12}
              color="#E3E6EB"
            />
          </Animated.View>
        )}
      </>
    </AnimatedPressable>
  )
}

export default memo(AccountData)
