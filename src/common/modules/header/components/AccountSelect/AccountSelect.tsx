import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import AccountDataDetailed from '@common/components/AccountDataDetailed'
import Avatar from '@common/components/Avatar'
import HoverablePressable from '@common/components/HoverablePressable'
import Select from '@common/components/Select'
import { RenderSelectedOptionParams, SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const MENU_OPTION_HEIGHT = 56

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectSelectedAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account

const AccountOption = React.memo(({ account }: { account: Account }) => (
  <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1, { minWidth: 0 }]}>
    <Avatar address={account.addr} pfp={account.preferences.pfp} size={32} />
    <View style={[flexbox.flex1, { minWidth: 0 }]}>
      <Text fontSize={14} weight="semiBold" numberOfLines={1}>
        {account.preferences.label}
      </Text>
      <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
        {shortenAddress(account.addr, 23)}
      </Text>
    </View>
  </View>
))

const toOption = (account: Account): SelectValue => ({
  value: account.addr,
  label: <AccountOption account={account} />,
  extraSearchProps: { label: account.preferences.label }
})

/**
 * Displays the selected account and lets the user switch to another one from a dropdown
 * (or a bottom sheet on mobile and narrow web layouts). Meant to be used as a screen header.
 */
const AccountSelect = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { isNarrowWebLayout } = useCompactLayout()
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: selectedAccount } = useController(
    'SelectedAccountController',
    selectSelectedAccount
  )
  const { dispatch: mainDispatch } = useController('MainController')

  const options = useMemo(() => accounts.map(toOption), [accounts])
  const value = useMemo(
    () => options.find((option) => option.value === selectedAccount?.addr) || null,
    [options, selectedAccount?.addr]
  )

  const handleSelect = useCallback(
    ({ value: addr }: SelectValue) => {
      if (addr === selectedAccount?.addr) return

      mainDispatch({ type: 'method', params: { method: 'selectAccount', args: [String(addr)] } })
    },
    [mainDispatch, selectedAccount?.addr]
  )

  const renderSelectedOption = useCallback(
    ({ toggleMenu, isMenuOpen, selectRef }: RenderSelectedOptionParams) => {
      const ArrowIcon = isMenuOpen ? UpArrowIcon : DownArrowIcon

      return (
        <View ref={selectRef} style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
          <AccountDataDetailed />
          {accounts.length > 1 && (
            <HoverablePressable
              onPress={toggleMenu}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={t('Switch account')}
              testID="account-select-toggle"
            >
              <View
                style={[
                  flexbox.center,
                  spacings.mlTy,
                  {
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: theme.primaryBackground
                  }
                ]}
              >
                <ArrowIcon />
              </View>
            </HoverablePressable>
          )}
        </View>
      )
    },
    [accounts.length, t, theme.primaryBackground]
  )

  return (
    <Select
      testID="account-select"
      value={value}
      setValue={handleSelect}
      options={options}
      mode={isNarrowWebLayout ? 'bottomSheet' : undefined}
      menuOptionHeight={MENU_OPTION_HEIGHT}
      menuPosition="bottom"
      bottomSheetTitle={t('Select account')}
      searchPlaceholder={t('Search accounts')}
      withSearch={accounts.length > 5}
      renderSelectedOption={renderSelectedOption}
      containerStyle={{ ...flexbox.flex1, ...spacings.mb0 }}
    />
  )
}

export default React.memo(AccountSelect)
