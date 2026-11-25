import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { Account as AccountInterface } from '@ambire-common/interfaces/account'
import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import DragIndicatorIcon from '@common/assets/svg/DragIndicatorIcon'
import SyncIcon from '@common/assets/svg/SyncIcon'
import AccountKeysBottomSheet from '@common/components/AccountKeysBottomSheet'
import BottomSheet from '@common/components/BottomSheet'
import SheetHeaderRow from '@common/components/BottomSheet/SheetHeaderRow'
import useSheetRef from '@common/components/BottomSheet/useSheetRef'
import Button from '@common/components/Button'
import { PanelTitle } from '@common/components/Panel/Panel'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import SafeActivationBottomSheet from '@common/components/SafeActivationBottomSheet'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import { isMobile, isWeb } from '@common/config/env'
import useAccountsList from '@common/hooks/useAccountsList'
import useController from '@common/hooks/useController'
import useElementSize from '@common/hooks/useElementSize'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import Account from '@common/modules/account-select/components/Account'
import AddAccount from '@common/modules/account-select/components/AddAccount'
import SyncBottomSheet from '@common/modules/app-data-sync/components/SyncBottomSheet'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING_MI, SPACING_SM } from '@common/styles/spacings'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import ExportToExtensionSheet from '@mobile/modules/app-data-sync/components/ExportToExtensionSheet'
import { SMART_SETTINGS_ACCOUNT_PARAM } from '@mobile/modules/settings/screens/AccountSmartSettingsScreen'

const DRAG_ICON_WIDTH = 10
// Its horizontal padding plus the icon
const DRAG_HANDLE_WIDTH = SPACING_SM + SPACING_MI + DRAG_ICON_WIDTH
// A constant, so the memoized rows skip the re-renders of the list
const ACCOUNT_CONTAINER_STYLE = { ...spacings.mb0, ...spacings.pvTy }
// About the rows that fit on a phone screen. A row is costly to mount and all of the first
// batch is mounted before anything on the screen shows, so the rest come in the next batches.
const INITIAL_ROWS_TO_RENDER = 6

/**
 * Whether a frame has passed since the screen mounted, so the list mounts after the
 * header and the search are on screen, instead of holding them back until it is done
 */
const useIsAfterFirstFrame = () => {
  const [isAfterFirstFrame, setIsAfterFirstFrame] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsAfterFirstFrame(true))

    return () => cancelAnimationFrame(frame)
  }, [])

  return isAfterFirstFrame
}

const AccountsSettingsScreen = () => {
  const { t } = useTranslation()
  const { accounts, control, isFiltered, keyExtractor } = useAccountsList()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useSheetRef()
  const accountsContainerRef = useRef(null)
  const { minElementWidthSize, maxElementWidthSize } = useElementSize(accountsContainerRef)
  const { navigate } = useNavigation()
  const { dispatch: accountsDispatch } = useController('AccountsController')
  const { dispatch: mainDispatch } = useController('MainController')
  const { theme } = useTheme()
  const isListMounted = useIsAfterFirstFrame()
  const {
    ref: sheetRefExportImportKey,
    open: openExportImportKey,
    close: closeExportImportKey
  } = useSheetRef()
  const {
    ref: sheetRefRemoveAccount,
    open: openRemoveAccount,
    close: closeRemoveAccount
  } = useSheetRef()
  const {
    ref: syncSheetRef,
    open: openSyncBottomSheet,
    close: closeSyncBottomSheet
  } = useSheetRef()
  const { ref: exportSheetRef, open: openExportSheet, close: closeExportSheet } = useSheetRef()
  const {
    ref: sheetRefAccountDeploySettings,
    open: openAccountDeploySettings,
    close: closeAccountDeploySettings
  } = useSheetRef()

  const [exportImportAccount, setExportImportAccount] = useState<AccountInterface | null>(null)
  const [accountToRemove, setAccountToRemove] = useState<AccountInterface | null>(null)
  const [accountSettingsAccount, setAccountSettingsAccount] = useState<AccountInterface | null>(
    null
  )
  // The order a drag left the list in, shown until the controller sends the reordered accounts
  const [draggedOrder, setDraggedOrder] = useState<{
    from: AccountInterface[]
    order: AccountInterface[]
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

      // Not inside a setState updater: React may call those twice
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
    if (accountSettingsAccount?.safeCreation) openAccountDeploySettings()
  }, [accountSettingsAccount, openAccountDeploySettings])

  // Smart settings is a screen of its own, while activation settings is a sheet
  const openAccountSettings = useCallback(
    (account: AccountInterface) => {
      if (account.safeCreation) {
        setAccountSettingsAccount(account)
        return
      }

      navigate(`${ROUTES.accountSmartSettings}?${SMART_SETTINGS_ACCOUNT_PARAM}=${account.addr}`)
    },
    [navigate]
  )

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
      setAccountSettingsAccount: openAccountSettings,
      setAccountToRemove
    }),
    [setExportImportAccount, openAccountSettings, setAccountToRemove]
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

  const renderItem = useCallback(
    (
      item: AccountInterface,
      index: number,
      isDragging: boolean,
      listeners: any,
      attributes: any
    ) => {
      return (
        // Transparent outer wrapper: the list moves rows by their measured height, so the gap
        // between them is padding here, part of the row
        <View style={spacings.pbTy}>
          <View
            style={[
              flexbox.flex1,
              flexbox.directionRow,
              flexbox.alignCenter,
              // As wide as the hidden drag handle, so the content stays in place
              isFiltered && { paddingLeft: DRAG_HANDLE_WIDTH },
              {
                backgroundColor: theme.secondaryBackground,
                borderRadius: BORDER_RADIUS_PRIMARY
              }
            ]}
          >
            {!isFiltered && (
              <Pressable
                style={[
                  flexbox.alignCenter,
                  flexbox.justifyCenter,
                  spacings.pvMi,
                  spacings.plSm,
                  spacings.prMi
                ]}
                {...listeners}
                {...attributes}
              >
                <DragIndicatorIcon
                  color={isDragging ? theme.primary : theme.iconPrimary}
                  width={DRAG_ICON_WIDTH}
                />
              </Pressable>
            )}
            <View style={flexbox.flex1}>
              <Account
                account={item}
                maxAccountAddrLength={shortenAccountAddr()}
                options={accountOptions}
                inverseInteractionColors
                isSelectable={false}
                containerStyle={ACCOUNT_CONTAINER_STYLE}
                withReceive={!isMobile}
                withCopy={!isMobile}
              />
            </View>
          </View>
        </View>
      )
    },
    [
      theme.secondaryBackground,
      theme.primary,
      theme.iconPrimary,
      shortenAccountAddr,
      accountOptions,
      isFiltered
    ]
  )

  return (
    <MobileLayoutContainer
      footer={
        <>
          <Button
            testID="button-add-account"
            text={t('Add account')}
            size="regular"
            onPress={openBottomSheet as any}
            childrenPosition="left"
            style={{ ...flexbox.alignSelfCenter, width: '100%' }}
          >
            <AddCircularIcon width={24} height={24} color="#fff" style={spacings.mrTy} />
          </Button>
          <Button
            testID="button-sync-with-extension"
            type="secondary"
            text={t('Sync with extension')}
            size="regular"
            onPress={openSyncBottomSheet as any}
            hasBottomSpacing={false}
            childrenPosition="left"
            style={{ ...flexbox.alignSelfCenter, width: '100%' }}
          >
            <SyncIcon width={24} height={24} color={theme.primaryText} style={spacings.mrTy} />
          </Button>
        </>
      }
    >
      <MobileLayoutWrapperMainContent withBackButton title="Accounts">
        <Search control={control} containerStyle={spacings.mbLg} />
        <View style={[flexbox.flex1]} ref={accountsContainerRef}>
          {isListMounted && (
            <ScrollableWrapper
              type={WRAPPER_TYPES.DRAGGABLE_FLAT_LIST}
              // Search results are ordered by relevance, so there is no order to rearrange in them.
              // The same list stays mounted, so searching doesn't rebuild every row
              dragEnabled={!isFiltered}
              data={displayedAccounts}
              keyExtractor={keyExtractor}
              onDragEnd={handleAccDragEnd}
              renderDraggableItem={renderItem}
              keyboardDismissMode="on-drag"
              initialNumToRender={INITIAL_ROWS_TO_RENDER}
              ListEmptyComponent={<Text>{t('No accounts found')}</Text>}
            />
          )}
        </View>

        <SafeActivationBottomSheet
          sheetRef={sheetRefAccountDeploySettings}
          closeBottomSheet={closeAccountDeploySettings}
          onClosed={clearAccountSettingsAccount}
          account={accountSettingsAccount?.safeCreation ? accountSettingsAccount : null}
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
          removableKeys="all"
        />
        <BottomSheet
          id="remove-account-seed-sheet"
          type={isWeb ? 'modal' : 'bottom-sheet'}
          sheetRef={sheetRefRemoveAccount}
          closeBottomSheet={() => {
            setAccountToRemove(null)
            closeRemoveAccount()
          }}
          onBackdropPress={() => {
            setAccountToRemove(null)
            closeRemoveAccount()
          }}
          scrollViewProps={isWeb ? { contentContainerStyle: { flex: 1 } } : undefined}
          containerInnerWrapperStyles={{ flex: 1 }}
          style={isWeb ? { maxWidth: 432, minHeight: 432, ...spacings.pvLg } : undefined}
        >
          <SheetHeaderRow style={spacings.mbLg}>
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                common.fullWidth,
                isWeb && spacings.mbLg
              ]}
            >
              <PanelTitle
                title={t('Remove {{ label }}', {
                  label: accountToRemove?.preferences?.label || 'account'
                })}
                style={isMobile ? text.center : text.left}
              />
            </View>
          </SheetHeaderRow>
          <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
            <Text fontSize={16} weight="medium" style={{ ...spacings.mb, textAlign: 'center' }}>
              {t('Are you sure you want to remove this account?')}
            </Text>
          </View>
          <View style={isWeb ? flexbox.alignCenter : {}}>
            <Button
              testID="confirm-remove-account-button"
              type="danger"
              style={spacings.mtTy}
              hasBottomSpacing={false}
              text={t('Remove account')}
              onPress={removeAccount}
            />
          </View>
        </BottomSheet>
        <AddAccount sheetRef={sheetRef} closeBottomSheet={closeBottomSheet} />
        <SyncBottomSheet
          sheetRef={syncSheetRef}
          closeBottomSheet={closeSyncBottomSheet}
          onExportPress={() => {
            closeSyncBottomSheet()
            openExportSheet()
          }}
          onImportPress={() => {
            closeSyncBottomSheet()
            navigate(ROUTES.importFromExtension)
          }}
        />
        <ExportToExtensionSheet sheetRef={exportSheetRef} closeBottomSheet={closeExportSheet} />
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(AccountsSettingsScreen)
