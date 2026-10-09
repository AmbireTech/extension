import { setStringAsync } from 'expo-clipboard'
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'

import { Account as AccountInterface } from '@ambire-common/interfaces/account'
import { canBecomeSmarter } from '@ambire-common/libs/account/account'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import CopyIcon from '@common/assets/svg/CopyIcon'
import WalletIcon from '@common/assets/svg/WalletIcon'
import AccountAddress from '@common/components/AccountAddress'
import { ReceiveButton } from '@common/components/AccountAddress/AccountAddress'
import AccountBadges from '@common/components/AccountBadges'
import AccountKeyIcons from '@common/components/AccountKeyIcons'
import Avatar from '@common/components/Avatar'
import Badge from '@common/components/Badge'
import Dropdown from '@common/components/Dropdown'
import Editable from '@common/components/Editable'
import SafeSignerBadges from '@common/components/SafeSignerBadges'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useAccountKeys from '@common/hooks/useAccountKeys'
import useController from '@common/hooks/useController'
import useHover, { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useSafesSignedFor from '@common/hooks/useSafesSignedFor'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings, { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import measureLayoutSync from '@common/utils/measureLayoutSync'

import getStyles, { ACCOUNT_SELECT_ACCOUNT_HEIGHT } from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const ACTION_ICON_SIZE = isMobile ? 32 : 24
const AVATAR_SIZE = 36

const selectSelectAccountStatus = (state: AllControllersMappingType['MainController']) =>
  state.statuses.selectAccount
const selectSelectedAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account

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
  withBalance = true,
  onExtraHeightChange
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
  /**
   * Called with how much taller than `ACCOUNT_SELECT_ACCOUNT_HEIGHT` the row is (negative when
   * shorter), mostly because its badges wrapped, so a list that lays its rows out by height
   * can make room for it
   */
  onExtraHeightChange?: (addr: string, extraHeight: number) => void
}) => {
  const { addr, preferences } = account
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { addToast } = useToast()
  const { state: selectAccountStatus, dispatch: mainDispatch } = useController(
    'MainController',
    selectSelectAccountStatus
  )
  const { state: selectedAccount } = useController(
    'SelectedAccountController',
    selectSelectedAccount
  )
  const selectBalance = useMemo(
    () => (state: AllControllersMappingType['SelectedAccountController']) =>
      state.balanceByAccounts[addr] ?? null,
    [addr]
  )
  const { state: balance } = useController('SelectedAccountController', selectBalance)
  const { dispatch: accountsDispatch } = useController('AccountsController')
  const reverseLookup = useReverseLookup({ address: addr, privacyUpdateMode: 'never' })
  const accountKeys = useAccountKeys(account)
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      // A card in the secondary background, so its edges show on the primary one
      from: theme.secondaryBackground,
      to: !inverseInteractionColors ? theme.tertiaryBackground : theme.primaryBackground
    }
  })

  const [bindOpacityAnim, opacityAnimStyle] = useHover({
    preset: 'opacityInverted'
  })

  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 })

  const safesSignedFor = useSafesSignedFor(account)

  /**
   * The badges wrap one by one onto more lines when they do not fit next to each other, so
   * the row takes the height its content needs. Lists that lay their rows out by height are
   * told how far that is from `ACCOUNT_SELECT_ACCOUNT_HEIGHT`.
   */
  const contentRef = useRef<View>(null)
  const contentHeightRef = useRef<View>(null)
  const [contentHeight, setContentHeight] = useState<number | null>(null)
  // What the row adds around its content, which its height is worked out from
  const containerVerticalInsets = useMemo(() => {
    const { paddingTop, paddingBottom, paddingVertical, padding, borderWidth } = StyleSheet.flatten(
      [styles.accountContainer, containerStyle]
    )
    const toNumber = (value: unknown) => (typeof value === 'number' ? value : 0)

    return (
      toNumber(paddingTop ?? paddingVertical ?? padding) +
      toNumber(paddingBottom ?? paddingVertical ?? padding) +
      2 * toNumber(borderWidth)
    )
  }, [containerStyle, styles.accountContainer])

  /**
   * Measured in a layout effect rather than on layout, so that a list that positions its
   * rows by height has this one's before it is painted, instead of jumping to it.
   */
  const updateContentHeight = useCallback(() => {
    // Relative to the row's content, as the native measuring needs an ancestor
    const content = measureLayoutSync(contentHeightRef.current, contentRef.current)
    if (!content) return

    const height = Math.round(content.height)
    setContentHeight((prev) => (prev === height ? prev : height))
  }, [])

  // On every commit, as whatever the badges show may have changed how many lines they take
  useLayoutEffect(updateContentHeight)

  // Only once measured, as a list may remount the row when its height changes
  useLayoutEffect(() => {
    if (contentHeight === null) return

    onExtraHeightChange?.(
      addr,
      contentHeight + containerVerticalInsets - ACCOUNT_SELECT_ACCOUNT_HEIGHT
    )
  }, [addr, containerVerticalInsets, contentHeight, onExtraHeightChange])

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

  const submenu = useMemo(() => {
    if (!options.withOptionsButton) return []

    const add7702Option = canBecomeSmarter(account, accountKeys)
    const submenuOptions = [
      { label: account.safeCreation ? 'Manage owners' : 'Manage keys', value: 'keys' },
      { label: 'Remove account', value: 'remove', style: { color: theme.errorDecorative } }
    ]
    const submenuOptions7702 = [{ label: 'Smart settings', value: 'toSmarter' }]

    return add7702Option && isWeb ? [...submenuOptions7702, ...submenuOptions] : submenuOptions
  }, [account, accountKeys, options.withOptionsButton, theme.errorDecorative])

  const handleCopy = async () => {
    try {
      await setStringAsync(addr)
      addToast(t('Address copied to clipboard'))
    } catch {
      addToast(t('Failed to copy address'))
    }
  }

  const label = !withSettings ? (
    // A read-only label needs no row around it, and this screen mounts one of
    // these per account
    <Text fontSize={14} weight="medium" numberOfLines={1} style={styles.label}>
      {account.preferences.label}
    </Text>
  ) : (
    <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mrTy]}>
      <Editable
        initialValue={account.preferences.label}
        onSave={onSave}
        fontSize={16}
        height={isMobile ? 24 : 20}
        textProps={{
          weight: 'medium'
        }}
        minWidth={120}
        maxLength={40}
      />
    </View>
  )

  const address = (
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
  )

  // The balance, the key icons and the badges share the row below the avatar, at the full
  // width of the row, wrapping one by one
  const badges = (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.wrap,
        spacings.mtTy,
        { columnGap: SPACING_MI, rowGap: SPACING_MI }
      ]}
    >
      {balance !== null && withBalance && (
        <Badge
          style={{
            columnGap: SPACING_MI,
            // The icon leads, like the avatar on the Safe signer badges
            paddingLeft: SPACING_MI,
            // The badge leaves room only for a trailing info icon when it has children
            paddingRight: SPACING_TY,
            // Stands out from the card in either theme, as the card is in the secondary one
            backgroundColor: theme.primaryBackground
          }}
        >
          <WalletIcon width={14} height={14} color={theme.secondaryText} />
          <Text fontSize={12} weight="semiBold" color={theme.primaryText}>
            {formatDecimals(balance, 'value')}
          </Text>
        </Badge>
      )}
      {!!withKeyType && (
        <AccountKeyIcons
          isExtended
          account={account}
          accountKeys={accountKeys}
          withContainer={false}
        />
      )}
      <AccountBadges accountData={account} accountKeys={accountKeys} withSpacing={false} />
      <SafeSignerBadges safes={safesSignedFor} />
    </View>
  )

  const actions = (
    <View style={[flexbox.directionRow, flexbox.alignCenter, !isMobile && spacings.mlTy]}>
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
          testID={`account-options-${addr}`}
        />
      )}
    </View>
  )

  const isMarkedSelected = isSelectable && !!options.markSelected && addr === selectedAccount?.addr

  return (
    <AnimatedPressable
      disabled={selectAccountStatus !== 'INITIAL'}
      onPress={selectAccount}
      {...(isSelectable ? bindAnim : {})}
      testID="account"
      style={[
        styles.accountContainer,
        containerStyle,
        // @ts-expect-error: Web style
        isSelectable ? animStyle : { cursor: 'default' },
        isMarkedSelected &&
          (!inverseInteractionColors
            ? { backgroundColor: theme.primaryAccent100, borderColor: theme.primaryAccent }
            : { backgroundColor: theme.primaryBackground })
      ]}
    >
      <View ref={contentRef} onLayout={updateContentHeight}>
        {/* As tall as the content, which the row's height is worked out from */}
        <View
          pointerEvents="none"
          ref={contentHeightRef}
          style={{ position: 'absolute', top: 0, bottom: 0, width: 0 }}
        />
        {/* The avatar and the actions are centered on the label and the address */}
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          {renderLeftChildren && renderLeftChildren()}
          <Avatar
            address={account.addr}
            pfp={account.preferences.pfp}
            smartAccountType={(account.creation && 'Ambire') || (account.safeCreation && 'Safe')}
            size={AVATAR_SIZE}
            showTooltip
          />
          <View style={[flexbox.flex1, flexbox.justifyCenter]}>
            {label}
            {address}
          </View>
          {actions}
        </View>
        {badges}
      </View>
    </AnimatedPressable>
  )
}

export default React.memo(Account)
