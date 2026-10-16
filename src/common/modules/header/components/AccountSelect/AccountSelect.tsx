import React, { useCallback, useMemo, useState } from 'react'
import { Trans } from 'react-i18next'
import { Keyboard, LayoutChangeEvent, SectionListData, View, ViewToken } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Account } from '@ambire-common/interfaces/account'
import { Dapp } from '@ambire-common/interfaces/dapp'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import AccountDataDetailed from '@common/components/AccountDataDetailed'
import Button from '@common/components/Button'
import HoverablePressable from '@common/components/HoverablePressable'
import { SectionedSelect } from '@common/components/Select'
import {
  RenderOptionParams,
  RenderSelectedOptionParams,
  SelectValue
} from '@common/components/Select/types'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import AccountSelectOption, { ACCOUNT_SELECT_OPTION_HEIGHT } from './AccountSelectOption'
import AccountSelectSectionHeader, {
  ACCOUNT_SELECT_HIDDEN_HEADER_HEIGHT,
  ACCOUNT_SELECT_MIN_WIDTH_FOR_INLINE_ACTION,
  ACCOUNT_SELECT_VISIBLE_HEADER_HEIGHT,
  ACCOUNT_SELECT_VISIBLE_HEADER_WITH_ACTION_ROW_HEIGHT
} from './AccountSelectSectionHeader'
import useAccountSelectAccess from './useAccountSelectAccess'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const DEFAULT_SECTION_KEY = 'default'
const VISIBLE_SECTION_KEY = 'visible'
const HIDDEN_SECTION_KEY = 'hidden'
const SELECT_CONTAINER_STYLE = { ...flexbox.flex1, ...spacings.mb0 }

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectSelectedAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account

// The search keeps the keyboard up on mobile, covering the list. It's dismissed once the list
// scrolls or an action runs, so the same touch still scrolls or presses
const dismissKeyboard = () => {
  if (isMobile) Keyboard.dismiss()
}

const toOption = (account: Account): SelectValue => ({
  value: account.addr,
  label: account.preferences.label,
  account
})

type Props = {
  /** Lets the user also choose which accounts the app that is connecting can see */
  dappToConnect?: Pick<Dapp, 'id' | 'name' | 'accountPreferences'>
}

/**
 * Displays the selected account and lets the user switch to another one from a bottom sheet.
 * Meant to be used as a screen header.
 */
const AccountSelect = ({ dappToConnect }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { bottom } = useSafeAreaInsets()
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: selectedAccount } = useController(
    'SelectedAccountController',
    selectSelectedAccount
  )
  const { dispatch: mainDispatch } = useController('MainController')
  const { dispatch: dappsDispatch } = useController('DappsController')
  const access = useAccountSelectAccess({
    accounts,
    selectedAccountAddr: selectedAccount?.addr,
    accountPreferences: dappToConnect?.accountPreferences
  })
  const {
    accountAddr,
    isLimited,
    visibleAccounts,
    hiddenAccounts,
    pendingPreferences,
    hasAccountChanged,
    isDirty,
    pickAccount,
    hideAccount: hideAccountAction,
    showAccount: showAccountAction,
    showAllAccounts: showAllAccountsAction,
    limitToPickedAccount: limitToPickedAccountAction,
    reset
  } = access
  const hideAccount = useCallback(
    (addr: string) => {
      dismissKeyboard()
      hideAccountAction(addr)
    },
    [hideAccountAction]
  )
  const showAccount = useCallback(
    (addr: string) => {
      dismissKeyboard()
      showAccountAction(addr)
    },
    [showAccountAction]
  )
  const showAllAccounts = useCallback(() => {
    dismissKeyboard()
    showAllAccountsAction()
  }, [showAllAccountsAction])
  const limitToPickedAccount = useCallback(() => {
    dismissKeyboard()
    limitToPickedAccountAction()
  }, [limitToPickedAccountAction])
  const [isHiddenSectionInView, setIsHiddenSectionInView] = useState(true)
  // Until it's measured, the button goes on its own row, as the sheet is usually narrow
  const [visibleHeaderWidth, setVisibleHeaderWidth] = useState(0)
  const canLimit = visibleAccounts.length > 1
  const isLimitActionOnOwnRow = visibleHeaderWidth < ACCOUNT_SELECT_MIN_WIDTH_FOR_INLINE_ACTION
  const visibleHeaderHeight =
    canLimit && isLimitActionOnOwnRow
      ? ACCOUNT_SELECT_VISIBLE_HEADER_WITH_ACTION_ROW_HEIGHT
      : ACCOUNT_SELECT_VISIBLE_HEADER_HEIGHT
  // The list doesn't support changing this handler once mounted, so it must stay the same
  const [handleViewableItemsChanged] = useState(
    () =>
      ({ viewableItems }: { viewableItems: ViewToken[] }) =>
        setIsHiddenSectionInView(
          viewableItems.some((token) => token.section?.key === HIDDEN_SECTION_KEY)
        )
  )

  const handleVisibleHeaderLayout = useCallback((e: LayoutChangeEvent) => {
    setVisibleHeaderWidth(e.nativeEvent.layout.width)
  }, [])

  const getSectionHeaderHeight = useCallback(
    (section: SectionListData<SelectValue>) =>
      section.key === HIDDEN_SECTION_KEY
        ? ACCOUNT_SELECT_HIDDEN_HEADER_HEIGHT
        : visibleHeaderHeight,
    [visibleHeaderHeight]
  )

  const hiddenAddrs = useMemo(
    () => new Set(hiddenAccounts.map((acc) => acc.addr)),
    [hiddenAccounts]
  )

  const sections = useMemo((): SectionListData<SelectValue>[] => {
    if (!dappToConnect) return [{ key: DEFAULT_SECTION_KEY, data: accounts.map(toOption) }]

    const visibleSection = { key: VISIBLE_SECTION_KEY, data: visibleAccounts.map(toOption) }
    if (!hiddenAccounts.length) return [visibleSection]

    return [visibleSection, { key: HIDDEN_SECTION_KEY, data: hiddenAccounts.map(toOption) }]
  }, [dappToConnect, accounts, visibleAccounts, hiddenAccounts])

  const value = useMemo(() => {
    const account = accounts.find((acc) => acc.addr === accountAddr)

    return account ? toOption(account) : null
  }, [accounts, accountAddr])

  const handleSetValue = useCallback(
    ({ value: addr }: SelectValue) => {
      const nextAccountAddr = String(addr)
      dismissKeyboard()
      if (dappToConnect) {
        // Also guards keyboard selection - a hidden account has to be shown first
        if (hiddenAddrs.has(nextAccountAddr)) return

        pickAccount(nextAccountAddr)
        return
      }
      if (nextAccountAddr === selectedAccount?.addr) return

      mainDispatch({ type: 'method', params: { method: 'selectAccount', args: [nextAccountAddr] } })
    },
    [dappToConnect, hiddenAddrs, pickAccount, selectedAccount?.addr, mainDispatch]
  )

  const applyChanges = useCallback(() => {
    if (hasAccountChanged) {
      mainDispatch({ type: 'method', params: { method: 'selectAccount', args: [accountAddr] } })
    }
    if (dappToConnect && pendingPreferences) {
      dappsDispatch({
        type: 'method',
        params: {
          method: 'updateDappToConnect',
          args: [dappToConnect.id, { accountPreferences: pendingPreferences }]
        }
      })
    }
  }, [
    hasAccountChanged,
    accountAddr,
    dappToConnect,
    pendingPreferences,
    mainDispatch,
    dappsDispatch
  ])

  const renderOption = useCallback(
    ({ item, isSelected, isLast, onPress }: RenderOptionParams) => {
      const isHidden = hiddenAddrs.has(String(item.value))
      // The selected account is always visible to the app
      const canToggleVisibility = !!dappToConnect && !isSelected

      return (
        <AccountSelectOption
          account={item.account}
          isSelected={isSelected}
          isHidden={isHidden}
          isLast={isLast}
          onPress={() => onPress(item)}
          onToggleVisibility={
            canToggleVisibility ? (isHidden ? showAccount : hideAccount) : undefined
          }
        />
      )
    },
    [hiddenAddrs, dappToConnect, showAccount, hideAccount]
  )

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<SelectValue> }) => {
      if (section.key === HIDDEN_SECTION_KEY) {
        return (
          <AccountSelectSectionHeader
            type="hidden"
            count={hiddenAccounts.length}
            actionText={t('Show all')}
            onAction={showAllAccounts}
          />
        )
      }

      return (
        <AccountSelectSectionHeader
          type="visible"
          count={visibleAccounts.length}
          isAll={!isLimited}
          actionText={canLimit ? t('Limit to selected account only') : undefined}
          onAction={limitToPickedAccount}
          isActionOnOwnRow={isLimitActionOnOwnRow}
          onLayout={handleVisibleHeaderLayout}
        />
      )
    },
    [
      hiddenAccounts.length,
      visibleAccounts.length,
      isLimited,
      canLimit,
      isLimitActionOnOwnRow,
      showAllAccounts,
      limitToPickedAccount,
      handleVisibleHeaderLayout,
      t
    ]
  )

  const renderIntro = useCallback(() => {
    if (!dappToConnect) return null

    return (
      <View
        style={[
          spacings.phSm,
          spacings.pvSm,
          spacings.mbSm,
          {
            // Pulled up a bit towards the sheet title, which has a large gap below it
            marginTop: -SPACING_TY,
            borderRadius: BORDER_RADIUS_PRIMARY,
            backgroundColor: theme.secondaryBackground
          }
        ]}
      >
        <Text fontSize={13} appearance="secondaryText" style={{ lineHeight: 20 }}>
          <Trans
            i18nKey="You can change the selected account or limit which accounts <bold>{{appName}}</bold> can see."
            values={{ appName: dappToConnect.name }}
            components={{ bold: <Text fontSize={13} weight="semiBold" /> }}
          />
        </Text>
      </View>
    )
  }, [dappToConnect, theme.secondaryBackground])

  const isHiddenHeaderPinned = !!hiddenAccounts.length && !isHiddenSectionInView

  const renderFooter = useCallback(
    ({ setIsMenuOpen }: RenderSelectedOptionParams) => {
      const closeSheet = () => {
        dismissKeyboard()
        setIsMenuOpen(false)
      }

      return (
        <View
          style={[
            spacings.ptTy,
            {
              // Matches the screen footers, which keep clear of the home indicator on mobile
              paddingBottom: isWeb ? 0 : bottom || SPACING_SM,
              backgroundColor: theme.primaryBackground
            }
          ]}
        >
          {isHiddenHeaderPinned && (
            <AccountSelectSectionHeader
              type="hidden"
              count={hiddenAccounts.length}
              actionText={t('Show all')}
              onAction={showAllAccounts}
            />
          )}
          {/* With the 8 above it, from the footer or the pinned header, the gap is 12 like other footers */}
          <View style={[flexbox.directionRow, spacings.ptMi, { columnGap: SPACING_SM }]}>
            {isDirty ? (
              <>
                <Button
                  type="secondary"
                  text={t('Cancel')}
                  onPress={closeSheet}
                  hasBottomSpacing={false}
                  style={flexbox.flex1}
                  testID="account-select-cancel"
                />
                <Button
                  text={t('Done')}
                  onPress={() => {
                    applyChanges()
                    closeSheet()
                  }}
                  hasBottomSpacing={false}
                  style={flexbox.flex1}
                  testID="account-select-done"
                />
              </>
            ) : (
              <Button
                type="secondary"
                text={t('Close')}
                onPress={closeSheet}
                hasBottomSpacing={false}
                style={flexbox.flex1}
                testID="account-select-close"
              />
            )}
          </View>
        </View>
      )
    },
    [
      theme.primaryBackground,
      bottom,
      isHiddenHeaderPinned,
      hiddenAccounts.length,
      showAllAccounts,
      isDirty,
      applyChanges,
      t
    ]
  )

  const renderSelectedOption = useCallback(
    ({ toggleMenu, isMenuOpen, selectRef }: RenderSelectedOptionParams) => {
      const ArrowIcon = isMenuOpen ? UpArrowIcon : DownArrowIcon

      return (
        <HoverablePressable
          onPress={toggleMenu}
          disabled={accounts.length < 2}
          accessibilityRole="button"
          accessibilityLabel={t('Select account')}
          testID="account-select-toggle"
        >
          <View ref={selectRef} style={[flexbox.directionRow, flexbox.alignCenter]}>
            <AccountDataDetailed />
            {accounts.length > 1 && (
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
            )}
          </View>
        </HoverablePressable>
      )
    },
    [accounts.length, t, theme.primaryBackground]
  )

  return (
    <SectionedSelect
      testID="account-select"
      value={value}
      setValue={handleSetValue}
      sections={sections}
      mode="bottomSheet"
      isBottomSheetFullHeight
      bottomSheetTitle={t('Select account')}
      withBottomSheetBackButton={false}
      menuOptionHeight={ACCOUNT_SELECT_OPTION_HEIGHT}
      headerHeight={dappToConnect ? visibleHeaderHeight : 0}
      getSectionHeaderHeight={dappToConnect ? getSectionHeaderHeight : undefined}
      renderOption={renderOption}
      renderSectionHeader={dappToConnect ? renderSectionHeader : undefined}
      stickySectionHeadersEnabled={!!dappToConnect}
      scrollToSelectedOnOpen
      closeMenuOnSelect={!dappToConnect}
      renderHeaderChildren={renderIntro}
      renderBottomSheetFooter={dappToConnect ? renderFooter : undefined}
      onBottomSheetClosed={reset}
      onViewableItemsChanged={dappToConnect ? handleViewableItemsChanged : undefined}
      onScrollBeginDrag={dismissKeyboard}
      renderSelectedOption={renderSelectedOption}
      emptyListPlaceholderText={t('No accounts found')}
      containerStyle={SELECT_CONTAINER_STYLE}
    />
  )
}

export default React.memo(AccountSelect)
