import { setStringAsync } from 'expo-clipboard'
import React, { useCallback, useMemo, useState } from 'react'
import { View, ViewStyle } from 'react-native'

import { Account as AccountInterface } from '@ambire-common/interfaces/account'
import { canBecomeSmarter } from '@ambire-common/libs/account/account'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
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
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

// The copy and receive buttons sit next to the account instead of inline with the address, which
// gives the address the whole row. Only mobile needs the bigger touch target size.
const ACTION_ICON_SIZE = isMobile ? 32 : 24

const selectMainStatuses = (state: AllControllersMappingType['MainController']) => state.statuses
const selectSelectedAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account
const selectKeys = (state: AllControllersMappingType['KeystoreController']) => state.keys

const Account = ({
  account,
  onSelect,
  maxAccountAddrLength = 42,
  withSettings = true,
  isSelectable = true,
  withKeyType = true,
  renderLeftChildren,
  renderRightChildren,
  inverseInteractionColors = false,
  options = {
    withOptionsButton: false
  },
  containerStyle,
  withReceive = false,
  withCopy = true,
  switchAccountOnPress = true,
  withBalance = true
}: {
  account: AccountInterface
  onSelect?: (addr: string) => void
  maxAccountAddrLength?: number
  withSettings?: boolean
  isSelectable?: boolean
  inverseInteractionColors?: boolean
  withKeyType?: boolean
  /** Rendered before the avatar, e.g. a checkbox when the row is pickable */
  renderLeftChildren?: () => React.ReactNode
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
  withCopy?: boolean
  /** Set to false when pressing the row means something else than switching to it */
  switchAccountOnPress?: boolean
  withBalance?: boolean
}) => {
  const { addr, preferences } = account
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { addToast } = useToast()
  const { state: mainStatuses, dispatch: mainDispatch } = useController(
    'MainController',
    selectMainStatuses
  )
  const { state: selectedAccount } = useController(
    'SelectedAccountController',
    selectSelectedAccount
  )
  const selectBalance = useCallback(
    (state: AllControllersMappingType['SelectedAccountController']) =>
      state.balanceByAccounts[addr] ?? null,
    [addr]
  )
  const { state: balance } = useController('SelectedAccountController', selectBalance)
  const { dispatch: accountsDispatch } = useController('AccountsController')
  const reverseLookup = useReverseLookup({ address: addr, privacyUpdateMode: 'never' })
  const { state: keys } = useController('KeystoreController', selectKeys)
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

    if (switchAccountOnPress && selectedAccount?.addr !== addr) {
      mainDispatch({
        type: 'method',
        params: { method: 'selectAccount', args: [addr] }
      })
    }

    onSelect && onSelect(addr)
  }, [
    addr,
    mainDispatch,
    onSelect,
    selectedAccount,
    switchAccountOnPress,
    options.setAccountToImportOrExport
  ])

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

    return add7702Option && isWeb ? [...submenuOptions7702, ...submenuOptions] : submenuOptions
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
        // @ts-expect-error: Web style
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
      <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
        {renderLeftChildren && renderLeftChildren()}
        <Avatar
          address={account.addr}
          pfp={account.preferences.pfp}
          smartAccountType={(account.creation && 'Ambire') || (account.safeCreation && 'Safe')}
          showTooltip
        />
        <View style={[flexbox.flex1, flexbox.justifyCenter]}>
          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mrTy]}>
            {!withSettings ? (
              <Text
                fontSize={withSettings ? 16 : 14}
                weight="medium"
                numberOfLines={1}
                style={{ flexShrink: 1 }}
              >
                {account.preferences.label}
              </Text>
            ) : (
              <Editable
                initialValue={account.preferences.label}
                onSave={onSave}
                fontSize={withSettings ? 16 : 14}
                height={isMobile ? 24 : 20}
                textProps={{
                  weight: 'medium'
                }}
                minWidth={120}
                maxLength={40}
              />
            )}
          </View>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <AccountAddress
              {...reverseLookup}
              containerStyle={spacings.pb0}
              address={addr}
              plainAddressMaxLength={maxAccountAddrLength}
              // On web the copy button fits next to the address, unlike on mobile, where it
              // sits next to the account to keep the touch targets apart
              withCopy={isWeb && withCopy}
              withReceive={false}
              withUpdateEnsInTooltip={isSelectable}
            />
          </View>
          {/* The balance, the key icons and the badges share the row below the address */}
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              spacings.mtMi,
              { columnGap: SPACING_TY }
            ]}
          >
            {balance !== null && withBalance && (
              <Text fontSize={14} weight="semiBold" color={theme.secondaryText}>
                {formatDecimals(balance, 'value')}
              </Text>
            )}
            {!!withKeyType && (
              <AccountKeyIcons isExtended account={account} withContainerSpacing={false} />
            )}
            <AccountBadges accountData={account} withSpacing={false} />
          </View>
        </View>
      </View>
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mlTy]}>
        {renderRightChildren && renderRightChildren()}
        {!isWeb && withCopy && (
          <AnimatedPressable onPress={handleCopy} style={opacityAnimStyle} {...bindOpacityAnim}>
            <CopyIcon width={ACTION_ICON_SIZE} height={ACTION_ICON_SIZE} strokeWidth="1" />
          </AnimatedPressable>
        )}
        {withReceive && <ReceiveButton address={addr} fontSize={ACTION_ICON_SIZE - 8} />}
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
