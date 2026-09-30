import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutChangeEvent, View } from 'react-native'
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
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import DashboardSkeleton from '@common/modules/dashboard/components/Skeleton'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

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
/** Used until the footer has been measured */
const FALLBACK_FOOTER_HEIGHT = 88

const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account

const AccountSelectScreen = () => {
  const { styles, theme } = useTheme(getStyles)
  const { isNarrowWebLayout } = useCompactActionRequestLayout()
  const flatlistRef = useRef(null)
  const { search: routeParams } = useRoute()
  const { navigate } = useNavigation()
  const { state: account } = useController('SelectedAccountController', selectAccount)
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const {
    ref: syncSheetRef,
    open: openSyncBottomSheet,
    close: closeSyncBottomSheet
  } = useModalize()
  const { t } = useTranslation()
  const accountsContainerRef = useRef(null)
  const [pendingToBeSetSelectedAccount, setPendingToBeSetSelectedAccount] = useState('')
  // Reserves exactly as much scroll space as the floating footer occupies, so the last
  // account in the list is never covered by it (the footer grows taller on narrow side panels).
  const [footerHeight, setFooterHeight] = useState(0)
  const handleFooterLayout = useCallback((event: LayoutChangeEvent) => {
    setFooterHeight(event.nativeEvent.layout.height)
  }, [])
  const listBottomInset = footerHeight ? footerHeight + SPACING_SM : FALLBACK_FOOTER_HEIGHT
  const {
    accounts,
    control,
    keyExtractor,
    getItemLayout,
    onListContentSizeChange,
    initialScrollIndex,
    shouldDisplayAccounts,
    isReadyToRender
  } = useAccountsList({ flatlistRef })

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

  const addAccountButton = (
    <Button
      testID="button-add-account"
      text={t('Add account')}
      size={isNarrowWebLayout ? 'regular' : 'smaller'}
      hasBottomSpacing={false}
      onPress={openBottomSheet as any}
      childrenPosition="left"
      style={isNarrowWebLayout ? { width: '100%' } : flexbox.flex1}
    >
      <AddCircularIcon width={24} height={24} color="#fff" style={spacings.mrTy} />
    </Button>
  )
  const syncWithMobileButton = (
    <Button
      testID="button-sync-with-mobile"
      type="secondary"
      text={t('Sync with mobile')}
      size={isNarrowWebLayout ? 'regular' : 'smaller'}
      hasBottomSpacing={false}
      onPress={openSyncBottomSheet as any}
      childrenPosition="left"
      // On the wide footer, only as wide as its own label, so it never wraps on two
      // rows. The primary action next to it takes whatever is left.
      style={isNarrowWebLayout ? { width: '100%' } : spacings.mrTy}
    >
      <SyncIcon width={24} height={24} color={theme.primaryText} style={spacings.mrTy} />
    </Button>
  )

  return !pendingToBeSetSelectedAccount ? (
    <LayoutWrapper>
      <HeaderWithTitle>
        <HoverablePressable onPress={() => navigate(WEB_ROUTES.accountsSettings)}>
          <SettingsIcon width={28} height={28} />
        </HoverablePressable>
      </HeaderWithTitle>
      <View style={[spacings.pt, spacings.phSm, flexbox.flex1]} ref={accountsContainerRef}>
        <Search autoFocus control={control} style={styles.searchBar} />
        <View style={flexbox.flex1}>
          {isReadyToRender && (
            <ScrollableWrapper
              type={WRAPPER_TYPES.FLAT_LIST}
              style={[styles.container, { opacity: shouldDisplayAccounts ? 1 : 0 }]}
              contentContainerStyle={{ paddingBottom: listBottomInset }}
              wrapperRef={flatlistRef}
              data={accounts}
              renderItem={renderItem}
              getItemLayout={getItemLayout}
              keyExtractor={keyExtractor}
              onContentSizeChange={onListContentSizeChange}
              initialScrollIndex={initialScrollIndex}
              ListEmptyComponent={<Text>{t('No accounts found')}</Text>}
            />
          )}
        </View>
        <FooterGlassView
          isSimpleBlur={false}
          fullWidth={isNarrowWebLayout}
          onLayout={handleFooterLayout}
        >
          <View
            style={
              isNarrowWebLayout
                ? { width: '100%', gap: SPACING_TY }
                : [flexbox.directionRow, flexbox.alignCenter]
            }
          >
            {/* Mobile stacks "Add account" above "Sync with mobile"; the wide footer
            shows them side by side with the sync action leading instead. */}
            {isNarrowWebLayout ? (
              <>
                {addAccountButton}
                {syncWithMobileButton}
              </>
            ) : (
              <>
                {syncWithMobileButton}
                {addAccountButton}
              </>
            )}
          </View>
        </FooterGlassView>
      </View>
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
    </LayoutWrapper>
  ) : (
    <DashboardSkeleton />
  )
}

export default React.memo(AccountSelectScreen)
