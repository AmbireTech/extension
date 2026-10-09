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

const EMPTY_BADGES_LAYOUT = {
  topRowHeight: 0,
  labelColumnX: 0,
  labelColumnWidth: 0,
  labelColumnBottom: 0,
  keyBadgesWidth: 0,
  signerBadgesWidth: 0,
  signerBadgesHeight: 0
}

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
   * The Safe signer badges sit next to the other badges when they fit there. Otherwise they
   * take a line of their own below the rest of the row, running to its right edge, and the
   * row grows by that line, while the rest keeps the place it has in any other row.
   */
  const contentRef = useRef<View>(null)
  const topRowRef = useRef<View>(null)
  const labelColumnRef = useRef<View>(null)
  const keyBadgesRef = useRef<View>(null)
  const signerBadgesRef = useRef<View>(null)
  const [badgesLayout, setBadgesLayout] = useState(EMPTY_BADGES_LAYOUT)

  // Measured the same way on either line, so moving them does not change the outcome
  const doSignerBadgesFit =
    badgesLayout.keyBadgesWidth + SPACING_TY + badgesLayout.signerBadgesWidth <=
    badgesLayout.labelColumnWidth
  const hasSignerBadgesLine = !!safesSignedFor.length && !doSignerBadgesFit
  // Right below the badges, instead of below the room the centered content leaves free
  const signerBadgesMarginTop =
    SPACING_MI - Math.max(badgesLayout.topRowHeight - badgesLayout.labelColumnBottom, 0)
  const extraHeight = hasSignerBadgesLine
    ? badgesLayout.signerBadgesHeight + signerBadgesMarginTop
    : 0

  /**
   * Measured in a layout effect rather than on layout, so that where the signer badges go
   * is settled before the row is painted, instead of the row jumping between the two.
   */
  const updateBadgesLayout = useCallback(() => {
    if (!safesSignedFor.length) return

    // Relative to what holds both the top row and the signer badges line, as the native
    // measuring needs an ancestor. The top row starts at its top left corner.
    const content = contentRef.current
    const topRowLayout = measureLayoutSync(topRowRef.current, content)
    const labelColumn = measureLayoutSync(labelColumnRef.current, content)
    const keyBadges = measureLayoutSync(keyBadgesRef.current, content)
    const signerBadges = measureLayoutSync(signerBadgesRef.current, content)
    if (!topRowLayout || !labelColumn || !keyBadges || !signerBadges) return

    const next = {
      topRowHeight: Math.round(topRowLayout.height),
      labelColumnX: labelColumn.x,
      labelColumnWidth: Math.floor(labelColumn.width),
      labelColumnBottom: Math.round(labelColumn.y + labelColumn.height),
      keyBadgesWidth: Math.ceil(keyBadges.width),
      signerBadgesWidth: Math.ceil(signerBadges.width),
      signerBadgesHeight: Math.round(signerBadges.height)
    }
    setBadgesLayout((prev) =>
      (Object.keys(next) as (keyof typeof next)[]).every((key) => prev[key] === next[key])
        ? prev
        : next
    )
  }, [safesSignedFor.length])

  // On every commit, as whatever the badges show may have changed their width
  useLayoutEffect(updateBadgesLayout)

  useLayoutEffect(() => {
    onExtraHeightChange?.(addr, extraHeight)
  }, [addr, extraHeight, onExtraHeightChange])

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
      <View ref={contentRef} style={flexbox.flex1}>
        {/* Takes the height of any other row, whatever is below it */}
        <View
          style={[flexbox.flex1, flexbox.directionRow, flexbox.justifySpaceBetween]}
          ref={topRowRef}
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
              {!withSettings ? (
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
              )}
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
                <View
                  ref={keyBadgesRef}
                  style={[flexbox.directionRow, flexbox.alignCenter, { columnGap: SPACING_TY }]}
                >
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
                      withContainerSpacing={false}
                    />
                  )}
                  <AccountBadges
                    accountData={account}
                    accountKeys={accountKeys}
                    withSpacing={false}
                  />
                </View>
                {!!safesSignedFor.length && !hasSignerBadgesLine && (
                  <View
                    ref={signerBadgesRef}
                    style={[flexbox.directionRow, flexbox.alignCenter, { columnGap: SPACING_TY }]}
                  >
                    <SafeSignerBadges safes={safesSignedFor} />
                  </View>
                )}
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
                testID={`account-options-${addr}`}
              />
            )}
          </View>
        </View>
        {hasSignerBadgesLine && (
          <View
            ref={signerBadgesRef}
            style={[
              flexbox.directionRow,
              flexbox.wrap,
              // As wide as the badges, so the width tells whether they fit next to the others
              flexbox.alignSelfStart,
              { columnGap: SPACING_TY, rowGap: SPACING_MI },
              { marginLeft: badgesLayout.labelColumnX, marginTop: signerBadgesMarginTop }
            ]}
          >
            <SafeSignerBadges safes={safesSignedFor} />
          </View>
        )}
      </View>
    </AnimatedPressable>
  )
}

export default React.memo(Account)
