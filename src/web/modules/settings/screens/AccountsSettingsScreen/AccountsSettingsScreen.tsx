import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Account as AccountInterface } from '@ambire-common/interfaces/account'
import AccountKeysBottomSheet from '@common/components/AccountKeysBottomSheet'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import useAccountsList from '@common/hooks/useAccountsList'
import useElementSize from '@common/hooks/useElementSize'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import useBackgroundService from '@web/hooks/useBackgroundService'
import Account from '@web/modules/account-select/components/Account'
import AddAccount from '@web/modules/account-select/components/AddAccount'
import AccountSmartSettingsBottomSheet from '@web/modules/settings/components/Accounts/AccountSmartSettingsBottomSheet'
import SettingsPageHeader from '@web/modules/settings/components/SettingsPageHeader'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'
import { getUiType } from '@web/utils/uiType'

const AccountsSettingsScreen = () => {
  const { addToast } = useToast()
  const { t } = useTranslation()
  const { accounts, control, keyExtractor, getItemLayout } = useAccountsList()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const accountsContainerRef = useRef(null)
  const { minElementWidthSize, maxElementWidthSize } = useElementSize(accountsContainerRef)
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const { dispatch } = useBackgroundService()
  const { themeType } = useTheme()
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

  const onSelectAccount = useCallback(
    (addr: string) => {
      const acc = accounts.find((a) => a.addr === addr)
      addToast(t('Selected account {{label}}', { label: acc?.preferences?.label || addr }))
    },
    [accounts, addToast, t]
  )

  const renderItem = useCallback(
    ({ item: account }: any) => {
      return (
        <Account
          onSelect={onSelectAccount}
          key={account.addr}
          account={account}
          maxAccountAddrLength={shortenAccountAddr()}
          options={{
            withOptionsButton: true,
            setAccountToImportOrExport: setExportImportAccount,
            setSmartSettingsAccount,
            setAccountToRemove
          }}
          isSelectable={false}
        />
      )
    },
    [onSelectAccount, shortenAccountAddr]
  )

  const removeAccount = useCallback(() => {
    if (!accountToRemove) return

    dispatch({
      type: 'MAIN_CONTROLLER_REMOVE_ACCOUNT',
      params: { accountAddr: accountToRemove.addr }
    })
    closeRemoveAccount()
  }, [accountToRemove, dispatch, closeRemoveAccount])

  return (
    <>
      <SettingsPageHeader title="Accounts">
        <Search autoFocus placeholder="Search for account" control={control} />
      </SettingsPageHeader>
      <View style={flexbox.flex1} ref={accountsContainerRef}>
        <ScrollableWrapper
          type={WRAPPER_TYPES.FLAT_LIST}
          style={[spacings.mb]}
          data={accounts}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          keyExtractor={keyExtractor}
          ListEmptyComponent={<Text>{t('No accounts found')}</Text>}
        />
      </View>
      <Button
        type="secondary"
        onPress={openBottomSheet as any}
        text="+ Add account"
        hasBottomSpacing={false}
      />
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
      <BottomSheet
        id="account-settings-add-account"
        sheetRef={sheetRef}
        adjustToContentHeight={!getUiType().isPopup}
        closeBottomSheet={closeBottomSheet}
        scrollViewProps={{ showsVerticalScrollIndicator: false }}
      >
        <AddAccount handleClose={closeBottomSheet as any} />
      </BottomSheet>
    </>
  )
}

export default React.memo(AccountsSettingsScreen)
