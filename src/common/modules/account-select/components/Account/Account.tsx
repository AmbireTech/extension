import { setStringAsync } from 'expo-clipboard'
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
import SafeSignerBadges from '@common/components/SafeSignerBadges'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useAccountKeys from '@common/hooks/useAccountKeys'
import useCompactLayout from '@common/hooks/useCompactLayout'
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
   * Called with how much taller than `ACCOUNT_SELECT_ACCOUNT_HEIGHT` the row got because its
   * badges wrapped, so a list that lays its rows out by height can make room for it
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
      from: !inverseInteractionColors ? theme.primaryBackground : theme.secondaryBackground,
      to: !inverseInteractionColors ? theme.secondaryBackground : theme.primaryBackground
    }
  })

  const [bindOpacityAnim, opacityAnimStyle] = useHover({
    preset: 'opacityInverted'
  })

  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 })

  const safesSignedFor = useSafesSignedFor(account)

  /**
   * The badges wrap one by one onto more lines when they do not fit next to each other.
   * The lines past the first one hang below the rest of the row, which grows by them while
   * everything else keeps the place it has in any other row.
   */
  const { isCompactLayout } = useCompactLayout()
  const contentRef = useRef<View>(null)
  const contentHeightRef = useRef<View>(null)
  const labelColumnRef = useRef<View>(null)
  const badgesRef = useRef<View>(null)
  const badgesFirstLineRef = useRef<View>(null)
  const [badgesLayout, setBadgesLayout] = useState<{
    height: number
    firstLineHeight: number
    /** Where the badges end, which is how tall the compact layout needs the row to be */
    bottom: number
    /** The height the row's content has without growing, what any other row has */
    baseContentHeight: number
    /**
     * Whether the badges go below the avatar, the label and the actions, at the full width
     * of the row. Only in the compact layout, and only when they do not fit next to the
     * avatar on one line - otherwise the row looks like any other
     */
    isStacked: boolean
  } | null>(null)
  const isStacked = !!badgesLayout?.isStacked

  const getExtraHeight = () => {
    if (!badgesLayout) return 0
    // Stacked, the badges are below the rest, so the row takes what it needs
    if (isStacked) return badgesLayout.bottom - badgesLayout.baseContentHeight

    return Math.max(badgesLayout.height - badgesLayout.firstLineHeight, 0)
  }
  const extraHeight = getExtraHeight()

  /**
   * Measured in a layout effect rather than on layout, so that the row has its height
   * before it is painted, instead of jumping to it.
   */
  const updateBadgesLayout = useCallback(() => {
    // Relative to the row's content, as the native measuring needs an ancestor
    const badges = measureLayoutSync(badgesRef.current, contentRef.current)
    const badgesFirstLine = measureLayoutSync(badgesFirstLineRef.current, contentRef.current)
    const content = measureLayoutSync(contentHeightRef.current, contentRef.current)
    const labelColumn = measureLayoutSync(labelColumnRef.current, contentRef.current)
    if (!badges || !badgesFirstLine || !content || !labelColumn) return

    const height = Math.round(badges.height)
    const firstLineHeight = Math.round(badgesFirstLine.height)
    // Next to the avatar the badges are as wide as the label, so they don't fit there when
    // they wrap. Stacked, they are only as wide as they need, so they don't fit when that is
    // wider than the label (or when they wrap even at the full width of the row)
    const doBadgesFitNextToAvatar =
      height <= firstLineHeight && Math.round(badges.width) <= Math.round(labelColumn.width)
    const next = {
      height,
      firstLineHeight,
      bottom: Math.round(badges.y + badges.height),
      // Without what the row grew by when it was measured
      baseContentHeight: Math.round(content.height) - extraHeight,
      isStacked: isCompactLayout && !doBadgesFitNextToAvatar
    }
    setBadgesLayout((prev) =>
      prev && (Object.keys(next) as (keyof typeof next)[]).every((key) => prev[key] === next[key])
        ? prev
        : next
    )
  }, [extraHeight, isCompactLayout])

  // On every commit, as whatever the badges show may have changed their width
  useLayoutEffect(updateBadgesLayout)

  // Only once measured, as a list may remount the row when its height changes
  const isMeasured = !!badgesLayout
  useLayoutEffect(() => {
    if (isMeasured) onExtraHeightChange?.(addr, extraHeight)
  }, [addr, extraHeight, isMeasured, onExtraHeightChange])

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

  // The balance, the key icons and the badges share the row below the address, wrapping one
  // by one. Unless stacked, the lines past the first one hang below the content instead of
  // being part of it, so they do not move it up
  const badges = (
    <View
      ref={badgesRef}
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.wrap,
        spacings.mtMi,
        { columnGap: SPACING_TY, rowGap: SPACING_MI },
        // As wide as the badges need, so the width tells whether they fit next to the avatar
        isStacked ? flexbox.alignSelfStart : { marginBottom: -extraHeight }
      ]}
    >
      {/* Stretches to the height of the first line, which is all of them unless they
      wrap. Takes no room, as the negative margin cancels the column gap */}
      <View
        ref={badgesFirstLineRef}
        style={{ alignSelf: 'stretch', width: 0, marginRight: -SPACING_TY }}
      />
      {balance !== null && withBalance && (
        <Text fontSize={14} weight="semiBold" color={theme.secondaryText}>
          {formatDecimals(balance, 'value')}
        </Text>
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
        isSelectable &&
          options.markSelected &&
          addr === selectedAccount?.addr && {
            backgroundColor: !inverseInteractionColors
              ? theme.secondaryBackground
              : theme.primaryBackground
          },
        !!extraHeight && {
          minHeight: ACCOUNT_SELECT_ACCOUNT_HEIGHT + extraHeight,
          maxHeight: ACCOUNT_SELECT_ACCOUNT_HEIGHT + extraHeight
        }
      ]}
    >
      <View
        ref={contentRef}
        style={[
          flexbox.flex1,
          // Leaves the room the row grew by to the badges hanging below, so the rest takes
          // the height of any other row
          !isStacked && { paddingBottom: extraHeight }
        ]}
      >
        {/* As tall as the content, which the row's height is worked out from */}
        <View
          ref={contentHeightRef}
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, bottom: 0, width: 0 }}
        />
        <View
          style={[
            flexbox.directionRow,
            flexbox.justifySpaceBetween,
            // Stacked, the avatar and the actions are centered on the label and the address,
            // with the badges below all of them
            isStacked ? flexbox.alignCenter : flexbox.flex1
          ]}
          // Picks up a change of the row's width, which no commit of its own follows
          onLayout={updateBadgesLayout}
        >
          <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
            {renderLeftChildren && renderLeftChildren()}
            <Avatar
              address={account.addr}
              pfp={account.preferences.pfp}
              smartAccountType={(account.creation && 'Ambire') || (account.safeCreation && 'Safe')}
              showTooltip
            />
            <View style={[flexbox.flex1, flexbox.justifyCenter]} ref={labelColumnRef}>
              {label}
              {address}
              {!isStacked && badges}
            </View>
          </View>
          {actions}
        </View>
        {isStacked && badges}
      </View>
    </AnimatedPressable>
  )
}

export default React.memo(Account)
