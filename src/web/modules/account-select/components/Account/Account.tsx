import React, { useCallback, useMemo, useState } from 'react'
import { View, ViewStyle } from 'react-native'

import { Account as AccountInterface } from '@ambire-common/interfaces/account'
import { canBecomeSmarter } from '@ambire-common/libs/account/account'
import AccountAddress from '@common/components/AccountAddress'
import AccountBadges from '@common/components/AccountBadges'
import AccountKeyIcons from '@common/components/AccountKeyIcons'
import Avatar from '@common/components/Avatar'
import DomainBadge from '@common/components/Avatar/DomainBadge'
import Dropdown from '@common/components/Dropdown'
import Editable from '@common/components/Editable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'

import getStyles from './styles'

const Account = ({
  account,
  onSelect,
  maxAccountAddrLength = 42,
  withSettings = true,
  isSelectable = true,
  withKeyType = true,
  renderRightChildren,
  inverseInteractionColors = false,
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
  inverseInteractionColors?: boolean
  withKeyType?: boolean
  renderRightChildren?: () => React.ReactNode
  options?: {
    withOptionsButton?: boolean
    markSelected?: boolean
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
  const {
    state: { statuses: mainStatuses },
    dispatch: mainDispatch
  } = useController('MainController')
  const {
    state: { account: selectedAccount }
  } = useController('SelectedAccountController')
  const { dispatch: accountsDispatch } = useController('AccountsController')
  const { ens, isLoading } = useReverseLookup({ address: addr })
  const { keys } = useController('KeystoreController').state
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: !inverseInteractionColors ? theme.primaryBackground : theme.secondaryBackground,
      to: !inverseInteractionColors ? theme.secondaryBackground : theme.primaryBackground
    },
    forceHoveredStyle: options.markSelected && addr === selectedAccount?.addr
  })

  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 })

  const selectAccount = useCallback(() => {
    if (options.setAccountToImportOrExport) {
      return
    }

    if (selectedAccount?.addr !== addr) {
      mainDispatch({
        type: 'method',
        params: { method: 'selectAccount', args: [addr] }
      })
    }

    onSelect && onSelect(addr)
  }, [addr, mainDispatch, onSelect, selectedAccount, options.setAccountToImportOrExport])

  const onSave = useCallback(
    (value: string) => {
      if (!addr) return

      accountsDispatch({
        type: 'method',
        params: {
          method: 'updateAccountPreferences',
          args: [[{ addr, preferences: { label: value, pfp: preferences.pfp } }]]
        }
      })
      addToast(t('Account label updated.'))
    },
    [addToast, addr, accountsDispatch, preferences.pfp, t]
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
      { label: account.safeCreation ? 'Manage owners' : 'Manage keys', value: 'keys' },
      { label: 'Remove account', value: 'remove', style: { color: theme.errorDecorative } }
    ],
    [theme.errorDecorative, account.safeCreation]
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
        isSelectable ? animStyle : { cursor: 'default' }
      ]}
    >
      <View style={[flexbox.flex1, flexbox.directionRow]}>
        <Avatar
          address={account.addr}
          pfp={account.preferences.pfp}
          smartAccountType={(account.creation && 'Ambire') || (account.safeCreation && 'Safe')}
          showTooltip
        />
        <View style={flexbox.flex1}>
          <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
            {!withSettings ? (
              <>
                <Text fontSize={withSettings ? 16 : 14} weight="medium" numberOfLines={1}>
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
                fontSize={withSettings ? 16 : 14}
                height={20}
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
              containerStyle={spacings.pb0}
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
            kebabIconProps={{ width: 28, height: 28 }}
          />
        )}
      </View>
    </AnimatedPressable>
  )
}

export default React.memo(Account)
