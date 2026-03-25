import { setStringAsync } from 'expo-clipboard'
import React, { useCallback, useMemo, useState } from 'react'
import { View, ViewStyle } from 'react-native'

import { Account as AccountInterface } from '@ambire-common/interfaces/account'
import { canBecomeSmarter } from '@ambire-common/libs/account/account'
import CopyIcon from '@common/assets/svg/CopyIcon'
import AccountAddress from '@common/components/AccountAddress'
import { ReceiveButton } from '@common/components/AccountAddress/AccountAddress'
import AccountBadges from '@common/components/AccountBadges'
import AccountKeyIcons from '@common/components/AccountKeyIcons'
import Avatar from '@common/components/Avatar'
import Dropdown from '@common/components/Dropdown'
import Editable from '@common/components/Editable'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useHover, { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

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
  containerStyle,
  withReceive = false
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
  withReceive?: boolean
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
    }
  })

  const [bindOpacityAnim, opacityAnimStyle] = useHover({
    preset: 'opacityInverted'
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

  const submenu = useMemo(() => {
    if (!options.withOptionsButton) return []

    const add7702Option = canBecomeSmarter(account, getAccKeys(account))
    const submenuOptions = [
      { label: account.safeCreation ? 'Manage owners' : 'Manage keys', value: 'keys' },
      { label: 'Remove account', value: 'remove', style: { color: theme.errorDecorative } }
    ]
    const submenuOptions7702 = [{ label: 'Smart settings', value: 'toSmarter' }]

    return add7702Option ? [...submenuOptions7702, ...submenuOptions] : submenuOptions
  }, [account, getAccKeys, options.withOptionsButton, theme.errorDecorative])

  const handleCopy = async () => {
    try {
      await setStringAsync(addr)
      addToast(t('Address copied to clipboard'))
    } catch {
      addToast(t('Failed to copy address'))
    }
  }

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
        isSelectable ? animStyle : { cursor: 'default' },
        isSelectable &&
          options.markSelected &&
          addr === selectedAccount?.addr && {
            backgroundColor: !inverseInteractionColors
              ? theme.secondaryBackground
              : theme.primaryBackground
          }
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
          <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter, spacings.mrTy]}>
            {!withSettings ? (
              <>
                <Text
                  fontSize={withSettings ? 16 : 14}
                  weight="medium"
                  numberOfLines={1}
                  style={{ flexShrink: 1 }}
                >
                  {account.preferences.label}
                </Text>
                {!!withKeyType && (
                  <View style={[isWeb && spacings.mlMi]}>
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
            <AccountAddress
              containerStyle={spacings.pb0}
              isLoading={isLoading}
              ens={ens}
              address={addr}
              plainAddressMaxLength={maxAccountAddrLength}
              withCopy={isWeb}
              withReceive={isWeb ? withReceive : false}
            />
          </View>
        </View>
      </View>
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        {renderRightChildren && renderRightChildren()}
        {isMobile && (
          <>
            <AnimatedPressable onPress={handleCopy} style={opacityAnimStyle} {...bindOpacityAnim}>
              <CopyIcon width={32} height={32} strokeWidth="1" />
            </AnimatedPressable>
            {withReceive && <ReceiveButton address={addr} fontSize={24} />}
          </>
        )}
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
