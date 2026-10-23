import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Trans } from 'react-i18next'
import {
  Keyboard,
  LayoutChangeEvent,
  SectionList,
  SectionListData,
  View,
  ViewToken
} from 'react-native'
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
// Without a trigger there is nothing to lay out, so it stays out of the parent's layout
const SELECT_WITHOUT_TRIGGER_CONTAINER_STYLE = { position: 'absolute' as const }

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectSelectedAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account

// The search keeps the keyboard up on mobile, covering the list. It's dismissed once the list
// scrolls or an action runs, so the same touch still scrolls or presses
const dismissKeyboard = () => {
  if (isMobile) Keyboard.dismiss()
}

const renderNoTrigger = () => null

const toOption = (account: Account): SelectValue => ({
  value: account.addr,
  label: account.preferences.label,
  account
})

type Props = {
  /** Lets the user also choose which accounts the app that is connecting can see */
  dappToConnect?: Pick<Dapp, 'id' | 'name' | 'accountPreferences'>
  /**
   * Lets the user switch accounts and choose which accounts a connected app can see.
   * There is no trigger then, so the bottom sheet is opened with `isOpen`
   */
  dappToManage?: Pick<Dapp, 'id' | 'name' | 'accountPreferences' | 'isConnected'>
  isOpen?: boolean
  setIsOpen?: (isOpen: boolean) => void
}

/**
 * Displays the selected account and lets the user switch to another one from a bottom sheet.
 * Meant to be used as a screen header.
 */
const AccountSelect = ({ dappToConnect, dappToManage, isOpen, setIsOpen }: Props) => {
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
  const dapp = dappToConnect ?? dappToManage
  const access = useAccountSelectAccess({
    accounts,
    walletAccountAddr: selectedAccount?.addr,
    accountPreferences: dapp?.accountPreferences,
    // A connected app gets its own account, while connecting goes with the wallet's
    pinsPickedAccount: !!dappToManage
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
  const listRef = useRef<SectionList<SelectValue>>(null)
  const shouldScrollToTopRef = useRef(false)
  const limitToPickedAccount = useCallback(() => {
    dismissKeyboard()
    limitToPickedAccountAction()
    shouldScrollToTopRef.current = true
  }, [limitToPickedAccountAction])
  // The picked account is the only one left visible, at the top, so it's scrolled into view.
  // Only once the list has re-rendered, as the rows leaving above would stop the scroll midway
  useEffect(() => {
    if (!shouldScrollToTopRef.current) return

    shouldScrollToTopRef.current = false
    listRef.current?.getScrollResponder()?.scrollTo({ x: 0, y: 0, animated: true })
  }, [visibleAccounts])
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
    if (!dapp) return [{ key: DEFAULT_SECTION_KEY, data: accounts.map(toOption) }]

    const visibleSection = { key: VISIBLE_SECTION_KEY, data: visibleAccounts.map(toOption) }
    if (!hiddenAccounts.length) return [visibleSection]

    return [visibleSection, { key: HIDDEN_SECTION_KEY, data: hiddenAccounts.map(toOption) }]
  }, [dapp, accounts, visibleAccounts, hiddenAccounts])

  const value = useMemo(() => {
    const account = accounts.find((acc) => acc.addr === accountAddr)

    return account ? toOption(account) : null
  }, [accounts, accountAddr])

  const handleSetValue = useCallback(
    ({ value: addr }: SelectValue) => {
      const nextAccountAddr = String(addr)
      dismissKeyboard()
      if (dapp) {
        // Also guards keyboard selection - a hidden account has to be shown first
        if (hiddenAddrs.has(nextAccountAddr)) return

        pickAccount(nextAccountAddr)
        return
      }
      if (nextAccountAddr === selectedAccount?.addr) return

      mainDispatch({ type: 'method', params: { method: 'selectAccount', args: [nextAccountAddr] } })
    },
    [dapp, hiddenAddrs, pickAccount, selectedAccount?.addr, mainDispatch]
  )

  const applyChanges = useCallback(() => {
    if (hasAccountChanged) {
      mainDispatch({ type: 'method', params: { method: 'selectAccount', args: [accountAddr] } })
    }
    if (!pendingPreferences) return

    if (dappToManage) {
      dappsDispatch({
        type: 'method',
        params: {
          method: 'updateDapp',
          args: [dappToManage.id, { accountPreferences: pendingPreferences }]
        }
      })
    }
    if (dappToConnect) {
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
    dappToManage,
    dappToConnect,
    pendingPreferences,
    mainDispatch,
    dappsDispatch
  ])

  // A connected app's account is "Connected" until another one is picked, which isn't saved yet
  const isConnectedAccountPicked = !!dappToManage?.isConnected && !hasAccountChanged
  const selectedBadgeText = isConnectedAccountPicked ? t('Connected') : t('Selected')
  // Names the account like its badge does
  const limitActionText = canLimit
    ? isConnectedAccountPicked
      ? t('Limit to connected account only')
      : t('Limit to selected account only')
    : undefined

  const renderOption = useCallback(
    ({ item, isSelected, isLast, onPress }: RenderOptionParams) => {
      const isHidden = hiddenAddrs.has(String(item.value))
      // The selected account is always visible to the app
      const canToggleVisibility = !!dapp && !isSelected

      return (
        <AccountSelectOption
          option={item}
          isSelected={isSelected}
          selectedBadgeText={selectedBadgeText}
          isHidden={isHidden}
          isLast={isLast}
          onPress={onPress}
          onToggleVisibility={
            canToggleVisibility ? (isHidden ? showAccount : hideAccount) : undefined
          }
        />
      )
    },
    [hiddenAddrs, dapp, selectedBadgeText, showAccount, hideAccount]
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
          actionText={limitActionText}
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
      limitActionText,
      isLimitActionOnOwnRow,
      showAllAccounts,
      limitToPickedAccount,
      handleVisibleHeaderLayout,
      t
    ]
  )

  const renderIntro = useCallback(() => {
    if (!dapp) return null

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
          {/* Names the account like its badge does */}
          {dappToManage?.isConnected ? (
            <Trans
              i18nKey="You can change the connected account or limit which accounts <bold>{{appName}}</bold> can see."
              values={{ appName: dapp.name }}
              components={{ bold: <Text fontSize={13} weight="semiBold" /> }}
            />
          ) : (
            <Trans
              i18nKey="You can change the selected account or limit which accounts <bold>{{appName}}</bold> can see."
              values={{ appName: dapp.name }}
              components={{ bold: <Text fontSize={13} weight="semiBold" /> }}
            />
          )}
        </Text>
      </View>
    )
  }, [dapp, dappToManage?.isConnected, theme.secondaryBackground])

  const isHiddenHeaderPinned = !!hiddenAccounts.length && !isHiddenSectionInView

  const renderFooter = useCallback(
    ({ setIsMenuOpen }: RenderSelectedOptionParams) => {
      // Without changes the sheet closes from the backdrop, so the space shows another account
      if (!isDirty && !isHiddenHeaderPinned) return null

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
          {isDirty && (
            <View style={[flexbox.directionRow, spacings.ptMi, { columnGap: SPACING_SM }]}>
              <Button
                type="secondary"
                text={t('Cancel')}
                onPress={closeSheet}
                hasBottomSpacing={false}
                style={flexbox.flex1}
                testID="account-select-cancel"
              />
              <Button
                // Managing saves right away, while connecting only applies on Connect
                text={dappToManage ? t('Save') : t('Done')}
                onPress={() => {
                  applyChanges()
                  closeSheet()
                }}
                hasBottomSpacing={false}
                style={flexbox.flex1}
                testID="account-select-done"
              />
            </View>
          )}
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
      dappToManage,
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
      listRef={listRef}
      value={value}
      setValue={handleSetValue}
      sections={sections}
      mode="bottomSheet"
      isMenuOpen={isOpen}
      setIsMenuOpen={setIsOpen}
      isBottomSheetFullHeight
      withScrollbarPadding
      bottomSheetTitle={dapp ? t('Manage accounts') : t('Select account')}
      withBottomSheetBackButton={false}
      menuOptionHeight={ACCOUNT_SELECT_OPTION_HEIGHT}
      headerHeight={dapp ? visibleHeaderHeight : 0}
      getSectionHeaderHeight={dapp ? getSectionHeaderHeight : undefined}
      renderOption={renderOption}
      renderSectionHeader={dapp ? renderSectionHeader : undefined}
      stickySectionHeadersEnabled={!!dapp}
      scrollToSelectedOnOpen
      closeMenuOnSelect={!dapp}
      renderHeaderChildren={renderIntro}
      renderBottomSheetFooter={dapp ? renderFooter : undefined}
      onBottomSheetClosed={reset}
      onViewableItemsChanged={dapp ? handleViewableItemsChanged : undefined}
      onScrollBeginDrag={dismissKeyboard}
      renderSelectedOption={dappToManage ? renderNoTrigger : renderSelectedOption}
      emptyListPlaceholderText={t('No accounts found')}
      containerStyle={
        dappToManage ? SELECT_WITHOUT_TRIGGER_CONTAINER_STYLE : SELECT_CONTAINER_STYLE
      }
    />
  )
}

export default React.memo(AccountSelect)
