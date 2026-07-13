import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import CheckIcon from '@common/assets/svg/CheckIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ChevronDownIcon from '@legends/common/assets/svg/ChevronDownIcon'

interface AccountPreferencesProps {
  dapp: Dapp
  onManageAccountsPress: () => void
  closeMenu?: () => void
}

const AccountPreferences = ({
  dapp,
  onManageAccountsPress,
  closeMenu
}: AccountPreferencesProps) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { theme } = useTheme()
  const {
    state: { account: selectedAccount }
  } = useController('SelectedAccountController')
  const { dispatch: dappDispatch } = useController('DappsController')

  const [manageAccountsBindAnim, manageAccountsAnimStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.secondaryBackground,
      to: theme.primaryBackground
    }
  })

  const [connectBindAnim, connectAnimStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.secondaryBackground,
      to: theme.primaryBackground
    }
  })

  const showConnectCurrentAddress =
    dapp.accountPreferences?.enabled &&
    selectedAccount &&
    !dapp.accountPreferences.accounts.includes(selectedAccount.addr)

  return (
    <>
      <AnimatedPressable
        {...manageAccountsBindAnim}
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.phTy,
          spacings.pvTy,
          manageAccountsAnimStyle,
          { borderRadius: 8 }
        ]}
        onPress={onManageAccountsPress}
      >
        <View style={flexbox.directionRow}>
          <SettingsIcon width={20} height={20} />
          <Text weight="medium" fontSize={14} style={spacings.mlTy}>
            {t('Manage accounts')}
          </Text>
        </View>
        <ChevronDownIcon
          width={16}
          height={16}
          color={theme.iconPrimary}
          style={{
            transform: [{ rotate: '-90deg' }]
          }}
        />
      </AnimatedPressable>

      {showConnectCurrentAddress && (
        <AnimatedPressable
          {...connectBindAnim}
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            spacings.phTy,
            spacings.pvTy,
            connectAnimStyle,
            { borderRadius: 8 }
          ]}
          onPress={() => {
            // Not possible
            if (!dapp.accountPreferences) return

            dappDispatch({
              type: 'method',
              params: {
                method: 'updateDapp',
                args: [
                  dapp.id,
                  {
                    accountPreferences: {
                      ...dapp.accountPreferences,
                      accounts: [...(dapp.accountPreferences.accounts || []), selectedAccount.addr],
                      selectedAccount: selectedAccount.addr
                    }
                  }
                ]
              }
            })

            addToast(t('Current address connected'))

            if (closeMenu) closeMenu()
          }}
        >
          <CheckIcon width={20} height={20} color={theme.iconPrimary} />
          <Text weight="medium" fontSize={14} style={spacings.mlTy}>
            {t('Connect current address')}
          </Text>
        </AnimatedPressable>
      )}
    </>
  )
}

export default React.memo(AccountPreferences)
