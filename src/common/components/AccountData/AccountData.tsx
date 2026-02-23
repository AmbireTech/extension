import { get } from 'lodash'
import React, { FC, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated } from 'react-native'

import { isSmartAccount } from '@ambire-common/libs/account/account'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import CopyIcon from '@common/assets/svg/CopyIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Avatar from '@common/components/Avatar'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import { setStringAsync } from '@common/utils/clipboard'
import useHover, { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'
import { getUiType } from '@web/utils/uiType'

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
  const { isPopup } = getUiType()
  const { account } = useController('SelectedAccountController').state
  const [bindAddressAnim, addressAnimStyle] = useHover({
    preset: 'opacityInverted'
  })
  const [bindAccountBtnAnim, accountBtnAnimStyle] = useCustomHover({
    property: 'left',
    values: {
      from: 0,
      to: 2
    }
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
          isSmart={isSmartAccount(account)}
        />
        <Text
          numberOfLines={1}
          weight="semiBold"
          style={[spacings.mlTy, spacings.mrTy, { maxWidth: isPopup ? 112 : 160 }]}
          color="#FFFFFF"
          fontSize={14}
        >
          {account.preferences.label}
        </Text>
        <Text color="#E3E6EB" style={spacings.mrMi} weight="mono_regular" fontSize={14}>
          ({shortenAddress(account.addr, 13)})
        </Text>
        <AnimatedPressable style={addressAnimStyle} onPress={handleCopyText} {...bindAddressAnim}>
          <CopyIcon width={24} height={24} color="#E3E6EB" />
        </AnimatedPressable>
        {!!withArrowRightIcon && (
          <Animated.View style={accountBtnAnimStyle}>
            <RightArrowIcon style={styles.accountButtonRightIcon} width={12} color="#E3E6EB" />
          </Animated.View>
        )}
      </>
    </AnimatedPressable>
  )
}

export default memo(AccountData)
