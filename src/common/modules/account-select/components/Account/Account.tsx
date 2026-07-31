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
import { getUiType } from '@common/utils/uiType'

import getStyles from './styles'

const { isSidePanel } = getUiType()

// The side panel is as narrow as a phone screen, so it reuses the mobile layout, which stacks
// the label, the address and the balance with the key icons and badges on separate rows. Keeping
// them on one row leaves the label with a few visible characters and clips the address suffix.
const withStackedRows = isMobile || isSidePanel

// On the stacked layout the copy and receive buttons sit next to the account instead of inline
// with the address, which gives the address the whole row. The side panel is too narrow for the
// mobile touch target size.
const ACTION_ICON_SIZE = isMobile ? 32 : 24

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
  withReceive = false,
  withCopy = true
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
  withCopy?: boolean
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
    state: { account: selectedAccount, balanceByAccounts }
  } = useController('SelectedAccountController')
  const { dispatch: accountsDispatch } = useController('AccountsController')
  const reverseLookup = useReverseLookup({ address: addr, privacyUpdateMode: 'never' })
  const { keys } = useController('KeystoreController').state
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: !inverseInteractionColors ? theme.primaryBackground : theme.secondaryBackground,
      to: !inverseInteractionColors ? theme.secondaryBackground : theme.primaryBackground
    }
  })
  const balance = balanceByAccounts[account.addr] ?? null

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
      <View style={[flexbox.flex1, flexbox.directionRow, withStackedRows && flexbox.alignCenter]}>
        <Avatar
          address={account.addr}
          pfp={account.preferences.pfp}
          smartAccountType={(account.creation && 'Ambire') || (account.safeCreation && 'Safe')}
          showTooltip
        />
        <View style={[flexbox.flex1, withStackedRows && flexbox.justifyCenter]}>
          <View
            style={[
              !withStackedRows && flexbox.flex1,
              flexbox.directionRow,
              flexbox.alignCenter,
              spacings.mrTy
            ]}
          >
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
                {/* On mobile and in the side panel the key icons and badges move to the balance row below */}
                {!withStackedRows && !!withKeyType && (
                  <View style={[spacings.mlMi]}>
                    <AccountKeyIcons isExtended account={account} />
                  </View>
                )}

                {!withStackedRows && <AccountBadges accountData={account} />}
              </>
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
              >
                {!withStackedRows && !!withKeyType && (
                  <View style={[spacings.mlMi]}>
                    <AccountKeyIcons isExtended account={account} />
                  </View>
                )}

                {!withStackedRows && <AccountBadges accountData={account} />}
              </Editable>
            )}
          </View>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <AccountAddress
              {...reverseLookup}
              containerStyle={spacings.pb0}
              address={addr}
              plainAddressMaxLength={maxAccountAddrLength}
              withCopy={!withStackedRows && withCopy}
              withReceive={!withStackedRows && withReceive}
              withUpdateEnsInTooltip={isSelectable}
            />
          </View>
          {withStackedRows && (
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                spacings.mtMi,
                { columnGap: SPACING_TY }
              ]}
            >
              {balance !== null && (
                <Text fontSize={14} weight="semiBold" color={theme.secondaryText}>
                  {formatDecimals(balance, 'value')}
                </Text>
              )}
              {!!withKeyType && (
                <AccountKeyIcons isExtended account={account} withContainerSpacing={false} />
              )}
              <AccountBadges accountData={account} withSpacing={false} />
            </View>
          )}
        </View>
      </View>
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mlTy]}>
        {balance !== null && !withSettings && !withStackedRows && (
          <Text
            fontSize={14}
            weight="semiBold"
            color={theme.secondaryText}
            style={[
              isMobile || renderRightChildren ? spacings.mrTy : {},
              isMobile || renderRightChildren ? flexbox.alignSelfCenter : flexbox.alignSelfStart,
              { textAlign: 'right' }
            ]}
          >
            {formatDecimals(balance, 'value')}
          </Text>
        )}
        {renderRightChildren && renderRightChildren()}
        {withStackedRows && (
          <>
            {withCopy && (
              <AnimatedPressable onPress={handleCopy} style={opacityAnimStyle} {...bindOpacityAnim}>
                <CopyIcon width={ACTION_ICON_SIZE} height={ACTION_ICON_SIZE} strokeWidth="1" />
              </AnimatedPressable>
            )}
            {withReceive && <ReceiveButton address={addr} fontSize={ACTION_ICON_SIZE - 8} />}
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
