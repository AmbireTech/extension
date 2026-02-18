import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import isEqual from 'react-fast-compare'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Account as AccountInterface } from '@ambire-common/interfaces/account'
import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import DragIndicatorIcon from '@common/assets/svg/DragIndicatorIcon'
import AccountKeysBottomSheet from '@common/components/AccountKeysBottomSheet'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import useAccountsList from '@common/hooks/useAccountsList'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useElementSize from '@common/hooks/useElementSize'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import Account from '@web/modules/account-select/components/Account'
import AddAccount from '@web/modules/account-select/components/AddAccount'
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
  const { dispatch } = useControllersMiddleware()
  const { themeType, theme } = useTheme()
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
        dispatch({
          type: 'ACCOUNTS_CONTROLLER_REORDER_ACCOUNTS',
          params: { fromIndex, toIndex }
        })
        return updated
      })
    },
    [dispatch]
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
    dispatch({
      type: 'MAIN_CONTROLLER_REMOVE_ACCOUNT',
      params: { accountAddr: accountToRemove.addr }
    })
    closeRemoveAccount()
  }, [accountToRemove, dispatch, closeRemoveAccount])

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
              containerStyle={{ ...spacings.mb0, ...spacings.pvSm }}
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

  return (
    <>
      <SettingsPageHeader title="Accounts">
        <>
          <Search autoFocus control={control} containerStyle={{ width: isWidthS ? 320 : 200 }} />
          <Button
            testID="add-account-modal"
            text={t('Add account')}
            type="primary"
            size="smaller"
            textStyle={{ fontSize: 12 }}
            style={[spacings.phSm, { height: 40 }]}
            hasBottomSpacing={false}
            onPress={openBottomSheet as any}
            submitOnEnter={false}
            childrenPosition="left"
          >
            <AddCircularIcon color="#fff" width={20} height={20} style={spacings.mrMi} />
          </Button>
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
        backgroundColor={
          themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'
        }
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
            type="danger"
            style={spacings.mtTy}
            text={t('Remove account')}
            onPress={removeAccount}
          />
        </View>
      </BottomSheet>
      <AddAccount sheetRef={sheetRef} closeBottomSheet={closeBottomSheet} />
    </>
  )
}

export default React.memo(AccountsSettingsScreen)
