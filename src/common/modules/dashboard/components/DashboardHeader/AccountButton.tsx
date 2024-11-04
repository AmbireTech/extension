import * as Clipboard from 'expo-clipboard'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, View } from 'react-native'

import { isSmartAccount } from '@ambire-common/libs/account/account'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import CopyIcon from '@common/assets/svg/CopyIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import AccountKeyIcons from '@common/components/AccountKeyIcons'
import Avatar from '@common/components/Avatar'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useHover, { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'

import { NEUTRAL_BACKGROUND_HOVERED } from '../../screens/styles'
import getStyles from './styles'

const AccountButton = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { navigate } = useNavigation()
  const { theme, styles } = useTheme(getStyles)
  const { accounts, selectedAccount } = useAccountsControllerState()
  const [bindAddressAnim, addressAnimStyle] = useHover({
    preset: 'opacity'
  })
  const [bindAccountBtnAnim, accountBtnAnimStyle, isAccountBtnHovered] = useCustomHover({
    property: 'left',
    values: {
      from: 0,
      to: 4
    }
  })

  const selectedAccountData = useMemo(
    () => accounts.find((a) => a.addr === selectedAccount),
    [accounts, selectedAccount]
  )

  const handleCopyText = async () => {
    try {
      await Clipboard.setStringAsync(selectedAccount!)
      addToast(t('Copied address to clipboard!') as string, { timeout: 2500 })
    } catch {
      addToast(t('Failed to copy address to clipboard!') as string, {
        timeout: 2500,
        type: 'error'
      })
    }
  }

  if (!selectedAccountData) return null

  const account = useMemo(
    () => accounts.find((a) => a.addr === selectedAccount),
    [accounts, selectedAccount]
  )

  if (!account) return null

  return (
    <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter]}>
      <AnimatedPressable
        testID="account-select-btn"
        style={[
          styles.accountButton,
          {
            backgroundColor: isAccountBtnHovered
              ? NEUTRAL_BACKGROUND_HOVERED
              : NEUTRAL_BACKGROUND_HOVERED
          }
        ]}
        onPress={() => navigate(WEB_ROUTES.accountSelect)}
        {...bindAccountBtnAnim}
      >
        <>
          <View style={styles.accountButtonInfo}>
            <Avatar
              pfp={selectedAccountData.preferences.pfp}
              size={32}
              isSmart={isSmartAccount(account)}
            />
            <Text
              numberOfLines={1}
              weight="semiBold"
              style={[spacings.mlTy, spacings.mrTy]}
              color={theme.primaryBackground}
              fontSize={14}
            >
              {selectedAccountData.preferences.label}
            </Text>

            <AccountKeyIcons isExtended={false} account={account} />
          </View>
          <Animated.View style={accountBtnAnimStyle}>
            <RightArrowIcon
              style={styles.accountButtonRightIcon}
              width={12}
              color={theme.primaryBackground}
            />
          </Animated.View>
        </>
      </AnimatedPressable>
      <AnimatedPressable
        style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, addressAnimStyle]}
        onPress={handleCopyText}
        {...bindAddressAnim}
      >
        <Text color={theme.primaryBackground} style={spacings.mrMi} weight="medium" fontSize={14}>
          ({shortenAddress(selectedAccount!, 13)})
        </Text>
        <CopyIcon width={20} height={20} color={theme.primaryBackground} />
      </AnimatedPressable>
    </View>
  )
}

export default AccountButton
