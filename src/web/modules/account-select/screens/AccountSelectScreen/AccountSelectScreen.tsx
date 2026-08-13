import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Account as AccountType } from '@ambire-common/interfaces/account'
import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import SyncIcon from '@common/assets/svg/SyncIcon'
import Button from '@common/components/Button'
import FooterGlassView from '@common/components/FooterGlassView'
import HoverablePressable from '@common/components/HoverablePressable'
import LayoutWrapper from '@common/components/LayoutWrapper'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import useAccountsList from '@common/hooks/useAccountsList'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import Account from '@common/modules/account-select/components/Account'
import AddAccount from '@common/modules/account-select/components/AddAccount'
import SyncBottomSheet from '@common/modules/accounts-sync/components/SyncBottomSheet'
import DashboardSkeleton from '@common/modules/dashboard/components/Skeleton'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

const extractTriggerAddAccountSheetParam = (search: string | undefined): boolean | null => {
  if (!search) return null

  const params = new URLSearchParams(search)
  const addAccount = params.get('triggerAddAccountBottomSheet')

  // Remove the addAccount parameter
  if (addAccount) {
    params.delete('triggerAddAccountBottomSheet')
    const updatedSearch = params.toString()

    // Updated URL back into the app, handle it here.
    window.history.replaceState(null, '', `?${updatedSearch}`)

    return addAccount === 'true'
  }

  return null
}

const ACCOUNT_OPTIONS = { markSelected: true }

const AccountSelectScreen = () => {
  const { styles, theme } = useTheme(getStyles)
  const flatlistRef = useRef(null)
  const {
    accounts,
    control,
    keyExtractor,
    getItemLayout,
    selectedAccountIndex,
    shouldDisplayAccounts
  } = useAccountsList({ flatlistRef })
  const { search: routeParams } = useRoute()
  const { navigate } = useNavigation()
  const {
    state: { account }
  } = useController('SelectedAccountController')
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const {
    ref: syncSheetRef,
    open: openSyncBottomSheet,
    close: closeSyncBottomSheet
  } = useModalize()
  const { t } = useTranslation()
  const accountsContainerRef = useRef(null)
  const [pendingToBeSetSelectedAccount, setPendingToBeSetSelectedAccount] = useState('')

  const shouldTriggerAddAccountSheetFromSearch = useMemo(
    () => extractTriggerAddAccountSheetParam(routeParams),
    [routeParams]
  )

  useEffect(() => {
    if (!shouldTriggerAddAccountSheetFromSearch) return

    // Added a 100ms in order to open the bottom sheet.
    const timeoutId = setTimeout(() => openBottomSheet(), 100)

    return () => clearTimeout(timeoutId)
  }, [openBottomSheet, shouldTriggerAddAccountSheetFromSearch])

  const onAccountSelect = useCallback(
    (addr: AccountType['addr']) => setPendingToBeSetSelectedAccount(addr),
    []
  )

  const renderItem = useCallback(
    ({ item: acc }: { item: AccountType }) => {
      return (
        <Account
          onSelect={onAccountSelect}
          account={acc}
          withSettings={false}
          options={ACCOUNT_OPTIONS}
          maxAccountAddrLength={32}
          withReceive
        />
      )
    },
    [onAccountSelect]
  )

  useEffect(() => {
    // Navigate to the dashboard after the account is selected to avoid showing the dashboard
    // of the previously selected account.
    if (!account || !pendingToBeSetSelectedAccount) return

    if (account.addr === pendingToBeSetSelectedAccount) {
      navigate(ROUTES.dashboard)
    }
  }, [account, navigate, pendingToBeSetSelectedAccount])

  return !pendingToBeSetSelectedAccount ? (
    <LayoutWrapper>
      <HeaderWithTitle>
        <HoverablePressable onPress={() => navigate(WEB_ROUTES.accountsSettings)}>
          <SettingsIcon width={28} height={28} />
        </HoverablePressable>
      </HeaderWithTitle>
      <View style={[spacings.pt, spacings.phSm, flexbox.flex1]} ref={accountsContainerRef}>
        <Search autoFocus control={control} style={styles.searchBar} />
        <ScrollableWrapper
          type={WRAPPER_TYPES.FLAT_LIST}
          style={[
            styles.container,
            {
              opacity: shouldDisplayAccounts ? 1 : 0
            }
          ]}
          contentContainerStyle={{ paddingBottom: 88 }}
          wrapperRef={flatlistRef}
          data={accounts}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          keyExtractor={keyExtractor}
          ListEmptyComponent={<Text>{t('No accounts found')}</Text>}
        />
        <FooterGlassView isSimpleBlur={false}>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Button
              testID="button-sync-with-mobile"
              type="secondary"
              text={t('Sync with mobile')}
              size="smaller"
              hasBottomSpacing={false}
              onPress={openSyncBottomSheet as any}
              childrenPosition="left"
              style={[flexbox.flex1, spacings.mrTy]}
            >
              <SyncIcon width={24} height={24} color={theme.primaryText} style={spacings.mrTy} />
            </Button>
            <Button
              testID="button-add-account"
              text={t('Add account')}
              size="smaller"
              hasBottomSpacing={false}
              onPress={openBottomSheet as any}
              childrenPosition="left"
              style={flexbox.flex1}
            >
              <AddCircularIcon width={24} height={24} color="#fff" style={spacings.mrTy} />
            </Button>
          </View>
        </FooterGlassView>
      </View>
      <AddAccount sheetRef={sheetRef} closeBottomSheet={closeBottomSheet} />
      <SyncBottomSheet
        sheetRef={syncSheetRef}
        closeBottomSheet={closeSyncBottomSheet}
        onExportPress={() => {
          closeSyncBottomSheet()
          navigate(WEB_ROUTES.syncWithMobile)
        }}
        onImportPress={() => {
          closeSyncBottomSheet()
          navigate(WEB_ROUTES.syncFromMobile)
        }}
      />
    </LayoutWrapper>
  ) : (
    <DashboardSkeleton />
  )
}

export default React.memo(AccountSelectScreen)
