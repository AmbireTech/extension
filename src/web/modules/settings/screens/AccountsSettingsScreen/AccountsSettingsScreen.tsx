import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import isEqual from 'react-fast-compare'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Account as AccountInterface } from '@ambire-common/interfaces/account'
import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import DragIndicatorIcon from '@common/assets/svg/DragIndicatorIcon'
import SyncIcon from '@common/assets/svg/SyncIcon'
import AccountKeysBottomSheet from '@common/components/AccountKeysBottomSheet'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import useAccountsList from '@common/hooks/useAccountsList'
import useController from '@common/hooks/useController'
import useElementSize from '@common/hooks/useElementSize'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import Account from '@common/modules/account-select/components/Account'
import AddAccount from '@common/modules/account-select/components/AddAccount'
import SyncBottomSheet from '@common/modules/accounts-sync/components/SyncBottomSheet'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import AccountSmartSettingsBottomSheet from '@web/modules/settings/components/Accounts/AccountSmartSettingsBottomSheet'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

const AccountsSettingsScreen = () => {
  const { t } = useTranslation()
  const { accounts, control, keyExtractor, getItemLayout } = useAccountsList()
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
    ref: syncSheetRef,
    open: openSyncBottomSheet,
    close: closeSyncBottomSheet
  } = useModalize()
  const {
    ref: sheetRefAccountSmartSettings,
    open: openAccountSmartSettings,
    close: closeAccountSmartSettings
  } = useModalize()

  useEffect(() => {
    setCurrentSettingsPage('accounts')
  }, [setCurrentSettingsPage])

  const [exportImportAccount, setExportImportAccount] = useState<AccountInterface | null>(null)
  const [accountToRemove, setAccountToRemove] = useState<AccountInterface | null>(null)
  const [smartSettingsAccount, setSmartSettingsAccount] = useState<AccountInterface | null>(null)
  const [localAccounts, setLocalAccounts] = useState<AccountInterface[]>([...accounts])

  useEffect(() => {
    setLocalAccounts((prev) => {
      if (!isEqual(prev, accounts)) {
        return accounts
      }
      return prev
    })
  }, [accounts])

  const handleAccDragEnd = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return
      setLocalAccounts((prev) => {
        const updated = [...prev]
        const [moved] = updated.splice(fromIndex, 1)
        updated.splice(toIndex, 0, moved!)
        accountsDispatch({
          type: 'method',
          params: {
            method: 'reorderAccounts',
            args: [{ fromIndex, toIndex }]
          }
        })
        return updated
      })
    },
    [accountsDispatch]
  )

  useEffect(() => {
    if (exportImportAccount) openExportImportKey()
  }, [openExportImportKey, exportImportAccount])

  useEffect(() => {
    if (accountToRemove) openRemoveAccount()
  }, [openRemoveAccount, accountToRemove])

  useEffect(() => {
    if (smartSettingsAccount) openAccountSmartSettings()
  }, [openAccountSmartSettings, smartSettingsAccount])

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
      setSmartSettingsAccount,
      setAccountToRemove
    }),
    [setExportImportAccount, setSmartSettingsAccount, setAccountToRemove]
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
        <View
          style={[
            flexbox.flex1,
            flexbox.directionRow,
            flexbox.alignCenter,
            spacings.mbTy,
            {
              backgroundColor: theme.secondaryBackground,
              borderRadius: BORDER_RADIUS_PRIMARY
            }
          ]}
        >
          <div {...listeners} {...attributes}>
            <Pressable
              style={[
                flexbox.alignCenter,
                flexbox.justifyCenter,
                spacings.pvMi,
                spacings.phSm,
                spacings.mbMi,
                //@ts-ignore
                { cursor: 'grab', touchAction: 'manipulation' }
              ]}
            >
              <DragIndicatorIcon color={isDragging ? theme.primary : theme.iconPrimary} />
            </Pressable>
          </div>
          <View style={flexbox.flex1}>
            <Account
              account={item}
              maxAccountAddrLength={shortenAccountAddr()}
              options={accountOptions}
              inverseInteractionColors
              isSelectable={false}
              containerStyle={{ ...spacings.mb0, ...spacings.pvTy }}
              withReceive
            />
          </View>
        </View>
      )
    },
    [
      theme.secondaryBackground,
      theme.primary,
      theme.iconPrimary,
      shortenAccountAddr,
      accountOptions
    ]
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
        <ScrollableWrapper
          type={WRAPPER_TYPES.DRAGGABLE_FLAT_LIST}
          data={localAccounts}
          keyExtractor={keyExtractor}
          onDragEnd={handleAccDragEnd}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          ListEmptyComponent={<Text>{t('No accounts found')}</Text>}
        />
      </View>
      <AccountSmartSettingsBottomSheet
        sheetRef={sheetRefAccountSmartSettings}
        closeBottomSheet={() => {
          setSmartSettingsAccount(null)
          closeAccountSmartSettings()
        }}
        account={smartSettingsAccount}
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
      <AddAccount sheetRef={sheetRef} closeBottomSheet={closeBottomSheet} />
      <SyncBottomSheet
        sheetRef={syncSheetRef}
        closeBottomSheet={closeSyncBottomSheet}
        onExportPress={() => {
          closeSyncBottomSheet()
          navigate(WEB_ROUTES.exportAccountsToMobile)
        }}
        onImportPress={() => {
          closeSyncBottomSheet()
          navigate(WEB_ROUTES.importAccountsFromMobile)
        }}
      />
    </>
  )
}

export default React.memo(AccountsSettingsScreen)
