import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Account as AccountInterface } from '@ambire-common/interfaces/account'
import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import DragIndicatorIcon from '@common/assets/svg/DragIndicatorIcon'
import SyncIcon from '@common/assets/svg/SyncIcon'
import AccountKeysBottomSheet from '@common/components/AccountKeysBottomSheet'
import AccountsTabs, { AccountsTab } from '@common/components/AccountsTabs'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import { isPrivacyPoolsEnabled } from '@common/config/env'
import useAccountsList from '@common/hooks/useAccountsList'
import useController from '@common/hooks/useController'
import useElementSize from '@common/hooks/useElementSize'
import useNavigation from '@common/hooks/useNavigation'
import usePrivacyPoolsAccounts, {
  filterPrivacyPoolsAccountsBySearch,
  PrivacyPoolsAccountDisplay
} from '@common/hooks/usePrivacyPoolsAccounts'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import Account from '@common/modules/account-select/components/Account'
import AddAccount from '@common/modules/account-select/components/AddAccount'
import SyncBottomSheet from '@common/modules/app-data-sync/components/SyncBottomSheet'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import AccountDeploySettingsBottomSheet from '@common/modules/settings/components/AccountDeploySettingsBottomSheet'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import PrivacyPoolsAccountRow from '@web/modules/privacy-pools/components/PrivacyPoolsAccountRow'
import AccountSmartSettingsBottomSheet from '@web/modules/settings/components/Accounts/AccountSmartSettingsBottomSheet'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const privacyPoolsAccountKeyExtractor = (account: PrivacyPoolsAccountDisplay) => account.seedId
const selectPrivacyPoolsAccountId = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.privacyPoolsAccountId

const DRAG_ICON_WIDTH = 12.5
// Its padding on both sides plus the icon
const DRAG_HANDLE_WIDTH = SPACING_SM * 2 + DRAG_ICON_WIDTH

/** The handle a row of the draggable list is dragged by */
const DragHandle = React.memo(
  ({
    isDragging,
    listeners,
    attributes
  }: {
    isDragging: boolean
    listeners: any
    attributes: any
  }) => {
    const { theme } = useTheme()

    return (
      <div {...listeners} {...attributes}>
        <Pressable
          style={[
            flexbox.alignCenter,
            flexbox.justifyCenter,
            spacings.pvMi,
            spacings.phSm,
            spacings.mbMi,
            // @ts-expect-error: Web style
            { cursor: 'grab', touchAction: 'manipulation' }
          ]}
        >
          <DragIndicatorIcon
            color={isDragging ? theme.primary : theme.iconPrimary}
            width={DRAG_ICON_WIDTH}
          />
        </Pressable>
      </div>
    )
  }
)

const AccountsSettingsScreen = () => {
  const { t } = useTranslation()
  const {
    accounts,
    control,
    search,
    isFiltered,
    keyExtractor,
    getItemLayout,
    onAccountExtraHeightChange
  } = useAccountsList()
  const { accounts: privacyPoolsAccounts } = usePrivacyPoolsAccounts()
  const { state: privacyPoolsAccountId } = useController(
    'SelectedAccountController',
    selectPrivacyPoolsAccountId
  )
  const { dispatch: privacyPoolsDispatch } = useController('PrivacyPoolsController')
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const accountsContainerRef = useRef(null)
  const { minElementWidthSize, maxElementWidthSize } = useElementSize(accountsContainerRef)
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const { navigate } = useNavigation()
  const { dispatch: accountsDispatch } = useController('AccountsController')
  const { dispatch: mainDispatch } = useController('MainController')
  const { theme } = useTheme()
  const {
    ref: sheetRefExportImportKey,
    open: openExportImportKey,
    close: closeExportImportKey
  } = useModalize()
  const {
    ref: sheetRefRemoveAccount,
    open: openRemoveAccount,
    close: closeRemoveAccount
  } = useModalize()
  const {
    ref: sheetRefRemovePrivacyPoolsAccount,
    open: openRemovePrivacyPoolsAccount,
    close: closeRemovePrivacyPoolsAccount
  } = useModalize()
  const {
    ref: syncSheetRef,
    open: openSyncBottomSheet,
    close: closeSyncBottomSheet
  } = useModalize()
  const {
    ref: sheetRefAccountSmartSettings,
    open: openAccountSmartSettings,
    close: closeAccountSmartSettings
  } = useModalize()
  const {
    ref: sheetRefAccountDeploySettings,
    open: openAccountDeploySettings,
    close: closeAccountDeploySettings
  } = useModalize()

  useEffect(() => {
    setCurrentSettingsPage('accounts')
  }, [setCurrentSettingsPage])

  const [exportImportAccount, setExportImportAccount] = useState<AccountInterface | null>(null)
  const [accountToRemove, setAccountToRemove] = useState<AccountInterface | null>(null)
  const [accountSettingsAccount, setAccountSettingsAccount] = useState<AccountInterface | null>(
    null
  )
  const [privacyPoolsAccountToRemove, setPrivacyPoolsAccountToRemove] =
    useState<PrivacyPoolsAccountDisplay | null>(null)
  // The search stays when switching tabs, so it filters the newly opened tab too. Opens on the
  // tab of the selected account.
  const [activeTab, setActiveTab] = useState<AccountsTab>(
    privacyPoolsAccountId ? 'private' : 'public'
  )
  // The order a drag left the list in, shown until the controller sends the reordered accounts
  const [draggedOrder, setDraggedOrder] = useState<{
    from: AccountInterface[]
    order: AccountInterface[]
  } | null>(null)
  // The same for the Privacy Pools accounts
  const [draggedPrivacyPoolsOrder, setDraggedPrivacyPoolsOrder] = useState<{
    from: PrivacyPoolsAccountDisplay[]
    order: PrivacyPoolsAccountDisplay[]
  } | null>(null)
  const clearAccountSettingsAccount = useCallback(() => setAccountSettingsAccount(null), [])

  // Any newer list from the controller already carries the drag, or replaces it
  const displayedAccounts = draggedOrder?.from === accounts ? draggedOrder.order : accounts

  const handleAccDragEnd = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return

      const updated = [...displayedAccounts]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved!)
      setDraggedOrder({ from: accounts, order: updated })

      accountsDispatch({
        type: 'method',
        params: { method: 'reorderAccounts', args: [{ fromIndex, toIndex }] }
      })
    },
    [accounts, accountsDispatch, displayedAccounts]
  )

  useEffect(() => {
    if (exportImportAccount) openExportImportKey()
  }, [openExportImportKey, exportImportAccount])

  useEffect(() => {
    if (accountToRemove) openRemoveAccount()
  }, [openRemoveAccount, accountToRemove])

  useEffect(() => {
    if (!accountSettingsAccount) return

    if (accountSettingsAccount.safeCreation) {
      openAccountDeploySettings()
      return
    }

    openAccountSmartSettings()
  }, [accountSettingsAccount, openAccountDeploySettings, openAccountSmartSettings])

  useEffect(() => {
    if (privacyPoolsAccountToRemove) openRemovePrivacyPoolsAccount()
  }, [openRemovePrivacyPoolsAccount, privacyPoolsAccountToRemove])

  const shortenAccountAddr = useCallback(() => {
    if (maxElementWidthSize(800)) return undefined
    if (maxElementWidthSize(700) && minElementWidthSize(800)) return 32
    if (maxElementWidthSize(600) && minElementWidthSize(700)) return 24
    if (maxElementWidthSize(500) && minElementWidthSize(600)) return 16
    return 10
  }, [maxElementWidthSize, minElementWidthSize])

  const accountOptions = useMemo(
    () => ({
      withOptionsButton: true,
      setAccountToImportOrExport: setExportImportAccount,
      setAccountSettingsAccount,
      setAccountToRemove
    }),
    [setExportImportAccount, setAccountSettingsAccount, setAccountToRemove]
  )

  const removeAccount = useCallback(() => {
    if (!accountToRemove) return

    mainDispatch({
      type: 'method',
      params: {
        method: 'removeAccount',
        args: [accountToRemove.addr]
      }
    })
    closeRemoveAccount()
  }, [accountToRemove, mainDispatch, closeRemoveAccount])

  const cancelRemovePrivacyPoolsAccount = useCallback(() => {
    setPrivacyPoolsAccountToRemove(null)
    closeRemovePrivacyPoolsAccount()
  }, [closeRemovePrivacyPoolsAccount])

  const removePrivacyPoolsAccount = useCallback(() => {
    if (!privacyPoolsAccountToRemove) return

    privacyPoolsDispatch({
      type: 'method',
      params: { method: 'removeAccount', args: [privacyPoolsAccountToRemove.seedId] }
    })
    cancelRemovePrivacyPoolsAccount()
  }, [cancelRemovePrivacyPoolsAccount, privacyPoolsAccountToRemove, privacyPoolsDispatch])

  // Any newer list from the controller already carries the drag, or replaces it
  const displayedPrivacyPoolsAccounts =
    draggedPrivacyPoolsOrder?.from === privacyPoolsAccounts
      ? draggedPrivacyPoolsOrder.order
      : privacyPoolsAccounts
  // Filtered by the search as typed, unlike the regular ones, so this follows the same value
  const isPrivacyPoolsFiltered = !!search.trim()
  const filteredPrivacyPoolsAccounts = useMemo(
    () =>
      filterPrivacyPoolsAccountsBySearch(displayedPrivacyPoolsAccounts, search, t('Privacy Pools')),
    [displayedPrivacyPoolsAccounts, search, t]
  )

  const handlePrivacyPoolsAccountDragEnd = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return

      const updated = [...displayedPrivacyPoolsAccounts]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved!)
      setDraggedPrivacyPoolsOrder({ from: privacyPoolsAccounts, order: updated })

      privacyPoolsDispatch({
        type: 'method',
        params: { method: 'reorderAccounts', args: [{ fromIndex, toIndex }] }
      })
    },
    [displayedPrivacyPoolsAccounts, privacyPoolsAccounts, privacyPoolsDispatch]
  )

  const renderPrivacyPoolsAccount = useCallback(
    (
      privacyPoolsAccount: PrivacyPoolsAccountDisplay,
      index: number,
      isDragging: boolean,
      listeners: any,
      attributes: any
    ) => (
      <View
        style={[
          flexbox.flex1,
          flexbox.directionRow,
          flexbox.alignCenter,
          spacings.mbTy,
          // As wide as the hidden drag handle, so the content stays in place
          isPrivacyPoolsFiltered && { paddingLeft: DRAG_HANDLE_WIDTH },
          { backgroundColor: theme.secondaryBackground, borderRadius: BORDER_RADIUS_PRIMARY }
        ]}
      >
        {!isPrivacyPoolsFiltered && (
          <DragHandle isDragging={isDragging} listeners={listeners} attributes={attributes} />
        )}
        <View style={flexbox.flex1}>
          <PrivacyPoolsAccountRow
            account={privacyPoolsAccount}
            onRemove={setPrivacyPoolsAccountToRemove}
            withRename
            containerStyle={{ ...spacings.mb0, ...spacings.pvTy }}
          />
        </View>
      </View>
    ),
    [isPrivacyPoolsFiltered, theme.secondaryBackground]
  )
  // Adapts the draggable row renderer to the plain list shown while searching
  const renderPrivacyPoolsSearchResult = useCallback(
    ({ item, index }: { item: PrivacyPoolsAccountDisplay; index: number }) =>
      renderPrivacyPoolsAccount(item, index, false, undefined, undefined),
    [renderPrivacyPoolsAccount]
  )

  const renderItem = useCallback(
    (
      item: AccountInterface,
      index: number,
      isDragging: boolean,
      listeners: any,
      attributes: any
    ) => {
      return (
        <View
          style={[
            flexbox.flex1,
            flexbox.directionRow,
            flexbox.alignCenter,
            spacings.mbTy,
            // As wide as the hidden drag handle, so the content stays in place
            isFiltered && { paddingLeft: DRAG_HANDLE_WIDTH },
            {
              backgroundColor: theme.secondaryBackground,
              borderRadius: BORDER_RADIUS_PRIMARY
            }
          ]}
        >
          {!isFiltered && (
            <DragHandle isDragging={isDragging} listeners={listeners} attributes={attributes} />
          )}
          <View style={flexbox.flex1}>
            <Account
              account={item}
              maxAccountAddrLength={shortenAccountAddr()}
              options={accountOptions}
              inverseInteractionColors
              isSelectable={false}
              containerStyle={{ ...spacings.mb0, ...spacings.pvTy }}
              withReceive
              onExtraHeightChange={onAccountExtraHeightChange}
            />
          </View>
        </View>
      )
    },
    [
      theme.secondaryBackground,
      shortenAccountAddr,
      accountOptions,
      onAccountExtraHeightChange,
      isFiltered
    ]
  )
  // Adapts the draggable row renderer to the plain list shown while searching
  const renderSearchResult = useCallback(
    ({ item, index }: { item: AccountInterface; index: number }) =>
      renderItem(item, index, false, undefined, undefined),
    [renderItem]
  )
  const { maxWidthSize } = useWindowSize()
  const isWidthS = maxWidthSize('s')
  // The title, the search and the two actions only fit on one row above this width.
  // Below it the header stacks: the search takes a row of its own and the actions share the next one
  const isHeaderRow = maxWidthSize(1100)

  return (
    <>
      <SettingsPageHeader
        title="Accounts"
        // The shared header switches to a row earlier than this content fits in one
        style={isHeaderRow ? undefined : { flexDirection: 'column' }}
      >
        <>
          <Search
            autoFocus
            control={control}
            containerStyle={
              isHeaderRow
                ? { width: isWidthS ? 320 : 200, ...spacings.mlSm, ...spacings.mrSm }
                : { width: '100%', ...spacings.mbTy }
            }
          />
          {/* Kept in their own row, so the two actions stay side by side even when the
              header itself wraps into a column on narrow widths */}
          <View
            style={[flexbox.directionRow, flexbox.alignCenter, !isHeaderRow && { width: '100%' }]}
          >
            <Button
              testID="button-sync-with-mobile"
              text={t('Sync with mobile')}
              type="tertiary"
              size="smaller"
              textStyle={{ fontSize: 12 }}
              style={[spacings.phSm, spacings.mrSm, { height: 40 }, !isHeaderRow && flexbox.flex1]}
              hasBottomSpacing={false}
              onPress={openSyncBottomSheet as any}
              submitOnEnter={false}
              childrenPosition="left"
            >
              <SyncIcon color={theme.primaryText} width={20} height={20} style={spacings.mrMi} />
            </Button>
            <Button
              testID="add-account-modal"
              text={t('Add account')}
              type="primary"
              size="smaller"
              textStyle={{ fontSize: 12 }}
              style={[spacings.phSm, { height: 40 }, !isHeaderRow && flexbox.flex1]}
              hasBottomSpacing={false}
              onPress={openBottomSheet as any}
              submitOnEnter={false}
              childrenPosition="left"
            >
              <AddCircularIcon color="#fff" width={20} height={20} style={spacings.mrMi} />
            </Button>
          </View>
        </>
      </SettingsPageHeader>
      <View style={[flexbox.flex1]} ref={accountsContainerRef}>
        {isPrivacyPoolsEnabled && <AccountsTabs activeTab={activeTab} onTabChange={setActiveTab} />}
        {isPrivacyPoolsEnabled && activeTab === 'private' ? (
          <ScrollableWrapper
            // Search results are ordered by relevance, so there is no order to rearrange in them
            type={
              isPrivacyPoolsFiltered ? WRAPPER_TYPES.FLAT_LIST : WRAPPER_TYPES.DRAGGABLE_FLAT_LIST
            }
            data={filteredPrivacyPoolsAccounts}
            keyExtractor={privacyPoolsAccountKeyExtractor}
            onDragEnd={handlePrivacyPoolsAccountDragEnd}
            renderItem={renderPrivacyPoolsSearchResult}
            renderDraggableItem={renderPrivacyPoolsAccount}
            ListEmptyComponent={<Text>{t('No accounts found')}</Text>}
          />
        ) : (
          <ScrollableWrapper
            // Search results are ordered by relevance, so there is no order to rearrange in them
            type={isFiltered ? WRAPPER_TYPES.FLAT_LIST : WRAPPER_TYPES.DRAGGABLE_FLAT_LIST}
            data={displayedAccounts}
            keyExtractor={keyExtractor}
            onDragEnd={handleAccDragEnd}
            renderItem={renderSearchResult}
            renderDraggableItem={renderItem}
            getItemLayout={getItemLayout}
            ListEmptyComponent={<Text>{t('No accounts found')}</Text>}
          />
        )}
      </View>
      <AccountDeploySettingsBottomSheet
        sheetRef={sheetRefAccountDeploySettings}
        closeBottomSheet={closeAccountDeploySettings}
        onClosed={clearAccountSettingsAccount}
        account={accountSettingsAccount?.safeCreation ? accountSettingsAccount : null}
      />
      <AccountSmartSettingsBottomSheet
        sheetRef={sheetRefAccountSmartSettings}
        closeBottomSheet={closeAccountSmartSettings}
        onClosed={clearAccountSettingsAccount}
        account={accountSettingsAccount?.safeCreation ? null : accountSettingsAccount}
      />
      <AccountKeysBottomSheet
        sheetRef={sheetRefExportImportKey}
        account={exportImportAccount}
        closeBottomSheet={() => {
          setExportImportAccount(null)
          closeExportImportKey()
        }}
        openAddAccountBottomSheet={openBottomSheet}
        showExportImport
      />
      <BottomSheet
        id="remove-account-seed-sheet"
        type="modal"
        sheetRef={sheetRefRemoveAccount}
        closeBottomSheet={() => {
          setAccountToRemove(null)
          closeRemoveAccount()
        }}
        onBackdropPress={() => {
          setAccountToRemove(null)
          closeRemoveAccount()
        }}
        scrollViewProps={{ contentContainerStyle: { flex: 1 } }}
        containerInnerWrapperStyles={{ flex: 1 }}
        style={{ maxWidth: 432, minHeight: 432, ...spacings.pvLg }}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
          <PanelBackButton
            onPress={() => {
              setAccountToRemove(null)
              closeRemoveAccount()
            }}
            style={spacings.mrSm}
          />
          <PanelTitle
            title={t('Remove {{ label }}', {
              label: accountToRemove?.preferences?.label || 'account'
            })}
            style={text.left}
          />
        </View>
        <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
          <Text fontSize={16} weight="medium" style={{ ...spacings.mb, textAlign: 'center' }}>
            {t('Are you sure you want to remove this account?')}
          </Text>
        </View>
        <View style={flexbox.alignCenter}>
          <Button
            testID="confirm-remove-account-button"
            type="danger"
            style={spacings.mtTy}
            text={t('Remove account')}
            onPress={removeAccount}
          />
        </View>
      </BottomSheet>
      <BottomSheet
        id="remove-privacy-pools-account-sheet"
        type="modal"
        sheetRef={sheetRefRemovePrivacyPoolsAccount}
        closeBottomSheet={cancelRemovePrivacyPoolsAccount}
        onBackdropPress={cancelRemovePrivacyPoolsAccount}
        scrollViewProps={{ contentContainerStyle: { flex: 1 } }}
        containerInnerWrapperStyles={{ flex: 1 }}
        style={{ maxWidth: 432, minHeight: 432, ...spacings.pvLg }}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
          <PanelBackButton onPress={cancelRemovePrivacyPoolsAccount} style={spacings.mrSm} />
          <PanelTitle
            title={t('Remove {{ label }}', {
              label: privacyPoolsAccountToRemove?.name || t('account')
            })}
            style={text.left}
          />
        </View>
        <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
          <Text fontSize={16} weight="medium" style={{ ...spacings.mbSm, textAlign: 'center' }}>
            {t('Are you sure you want to remove the Private account from {{seedLabel}}?', {
              seedLabel: privacyPoolsAccountToRemove?.sourceLabel
            })}
          </Text>
          <Text fontSize={14} appearance="secondaryText" style={{ textAlign: 'center' }}>
            {t(
              'Its funds stay in Privacy Pools, tied to its recovery phrase. Adding the account again from the same phrase brings them back.'
            )}
          </Text>
        </View>
        <View style={flexbox.alignCenter}>
          <Button
            testID="confirm-remove-privacy-pools-account-button"
            type="danger"
            style={spacings.mtTy}
            text={t('Remove account')}
            onPress={removePrivacyPoolsAccount}
          />
        </View>
      </BottomSheet>
      <AddAccount sheetRef={sheetRef} closeBottomSheet={closeBottomSheet} />
      <SyncBottomSheet
        sheetRef={syncSheetRef}
        closeBottomSheet={closeSyncBottomSheet}
        onExportPress={() => {
          closeSyncBottomSheet()
          navigate(WEB_ROUTES.exportToMobile)
        }}
        onImportPress={() => {
          closeSyncBottomSheet()
          navigate(WEB_ROUTES.importFromMobile)
        }}
      />
    </>
  )
}

export default React.memo(AccountsSettingsScreen)
