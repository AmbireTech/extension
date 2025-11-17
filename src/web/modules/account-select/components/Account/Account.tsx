import React, { useCallback, useMemo, useState } from 'react'
import { View, ViewStyle } from 'react-native'

import { Account as AccountInterface } from '@ambire-common/interfaces/account'
import { canBecomeSmarter, isSmartAccount } from '@ambire-common/libs/account/account'
import AccountAddress from '@common/components/AccountAddress'
import AccountBadges from '@common/components/AccountBadges'
import AccountKeyIcons from '@common/components/AccountKeyIcons'
import Avatar from '@common/components/Avatar'
import DomainBadge from '@common/components/Avatar/DomainBadge'
import Dropdown from '@common/components/Dropdown'
import Editable from '@common/components/Editable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

const { isTab } = getUiType()

const Account = ({
  account,
  onSelect,
  maxAccountAddrLength = 42,
  withSettings = true,
  isSelectable = true,
  withKeyType = true,
  renderRightChildren,
  options = {
    withOptionsButton: false
  },
  containerStyle
}: {
  account: AccountInterface
  onSelect?: (addr: string) => void
  maxAccountAddrLength?: number
  withSettings?: boolean
  isSelectable?: boolean
  withKeyType?: boolean
  renderRightChildren?: () => React.ReactNode
  options?: {
    withOptionsButton: boolean
    setAccountToImportOrExport?: React.Dispatch<React.SetStateAction<AccountInterface | null>>
    setSmartSettingsAccount?: React.Dispatch<React.SetStateAction<AccountInterface | null>>
    setAccountToRemove?: React.Dispatch<React.SetStateAction<AccountInterface | null>>
  }
  containerStyle?: ViewStyle
}) => {
  const { addr, preferences } = account
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { addToast } = useToast()
  const { statuses: mainStatuses } = useMainControllerState()
  const { account: selectedAccount } = useSelectedAccountControllerState()
  const { dispatch } = useBackgroundService()
  const { ens, isLoading } = useReverseLookup({ address: addr })
  const { keys } = useKeystoreControllerState()
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.primaryBackground,
      to: !options.setAccountToImportOrExport ? theme.secondaryBackground : theme.primaryBackground
    },
    forceHoveredStyle: !options.setAccountToImportOrExport && addr === selectedAccount?.addr
  })

  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 })

  const selectAccount = useCallback(() => {
    if (options.setAccountToImportOrExport) {
      return
    }

    if (selectedAccount?.addr !== addr) {
      dispatch({
        type: 'MAIN_CONTROLLER_SELECT_ACCOUNT',
        params: { accountAddr: addr }
      })
    }

    onSelect && onSelect(addr)
  }, [addr, dispatch, onSelect, selectedAccount, options.setAccountToImportOrExport])

  const onSave = useCallback(
    (value: string) => {
      dispatch({
        type: 'ACCOUNTS_CONTROLLER_UPDATE_ACCOUNT_PREFERENCES',
        params: [{ addr, preferences: { label: value, pfp: preferences.pfp } }]
      })
      addToast(t('Account label updated.'))
    },
    [addToast, addr, dispatch, preferences.pfp, t]
  )

  const onDropdownSelect = (item: { label: string; value: string }) => {
    if (item.value === 'remove') {
      !!options.setAccountToRemove && options.setAccountToRemove(account)
      return
    }

    if (item.value === 'keys') {
      !!options.setAccountToImportOrExport && options.setAccountToImportOrExport(account)
      return
    }

    if (item.value === 'toSmarter') {
      !!options.setSmartSettingsAccount && options.setSmartSettingsAccount(account)
    }
  }

  const getAccKeys = useCallback(
    (acc: any) => {
      return keys.filter((key) => acc?.associatedKeys.includes(key.addr))
    },
    [keys]
  )

  const add7702option = useMemo(() => {
    return canBecomeSmarter(account, getAccKeys(account))
  }, [account, getAccKeys])

  const submenuOptions = useMemo(
    () => [
      { label: 'Manage keys', value: 'keys' },
      { label: 'Remove account', value: 'remove', style: { color: theme.errorDecorative } }
    ],
    [theme.errorDecorative]
  )

  const submenuOptions7702 = useMemo(() => ({ label: 'Smart settings', value: 'toSmarter' }), [])

  const submenu = useMemo(() => {
    return add7702option ? [submenuOptions7702, ...submenuOptions] : submenuOptions
  }, [add7702option, submenuOptions, submenuOptions7702])

  return (
    <AnimatedPressable
      disabled={mainStatuses.selectAccount !== 'INITIAL'}
      onPress={selectAccount}
      {...(isSelectable ? bindAnim : {})}
      testID="account"
      style={[
        styles.accountContainer,
        containerStyle,
        // @ts-ignore
        options.setAccountToImportOrExport ? { cursor: 'default' } : {},
        isSelectable ? animStyle : {}
      ]}
    >
      <View style={[flexbox.flex1, flexbox.directionRow]}>
        <Avatar pfp={account.preferences.pfp} isSmart={isSmartAccount(account)} showTooltip />
        <View style={flexbox.flex1}>
          <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
            {!withSettings ? (
              <>
                <Text fontSize={isTab ? 16 : 14} weight="medium" numberOfLines={1}>
                  {account.preferences.label}
                </Text>
                {!!withKeyType && (
                  <View style={[spacings.mlMi]}>
                    <AccountKeyIcons isExtended account={account} />
                  </View>
                )}

                <AccountBadges accountData={account} />
              </>
            ) : (
              <Editable
                initialValue={account.preferences.label}
                onSave={onSave}
                fontSize={isTab ? 16 : 14}
                height={24}
                textProps={{
                  weight: 'medium'
                }}
                minWidth={120}
                maxLength={40}
              >
                {!!withKeyType && (
                  <View style={[spacings.mlMi]}>
                    <AccountKeyIcons isExtended account={account} />
                  </View>
                )}

                <AccountBadges accountData={account} />
              </Editable>
            )}
          </View>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <DomainBadge ens={ens} />
            <AccountAddress
              isLoading={isLoading}
              ens={ens}
              address={addr}
              plainAddressMaxLength={maxAccountAddrLength}
            />
          </View>
        </View>
      </View>
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        {renderRightChildren && renderRightChildren()}
        {!!options.withOptionsButton && (
          <Dropdown
            data={submenu}
            externalPosition={dropdownPosition}
            setExternalPosition={setDropdownPosition}
            onSelect={onDropdownSelect}
          />
        )}
      </View>
    </AnimatedPressable>
  )
}

export default React.memo(Account)
