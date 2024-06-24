import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Account as AccountType } from '@ambire-common/interfaces/account'
import AddIcon from '@common/assets/svg/AddIcon'
import BackButton from '@common/components/BackButton'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import CopyText from '@common/components/CopyText'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import useAccounts from '@common/hooks/useAccounts'
import useElementSize from '@common/hooks/useElementSize'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import DashboardSkeleton from '@common/modules/dashboard/screens/Skeleton'
import Header from '@common/modules/header/components/Header'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutContainer } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import Account from '@web/modules/account-select/components/Account'
import AddAccount from '@web/modules/account-select/components/AddAccount'

import getStyles from './styles'

const AccountSelectScreen = () => {
  const { styles, theme } = useTheme(getStyles)
  const { accounts, control } = useAccounts()
  const { navigate } = useNavigation()
  const { selectedAccount } = useAccountsControllerState()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { t } = useTranslation()
  const accountsContainerRef = useRef(null)
  const { minElementWidthSize, maxElementWidthSize } = useElementSize(accountsContainerRef)
  const [pendingToBeSetSelectedAccount, setPendingToBeSetSelectedAccount] = useState('')

  const shortenAccountAddr = () => {
    if (maxElementWidthSize(800)) return undefined
    if (maxElementWidthSize(700) && minElementWidthSize(800)) return 32
    if (maxElementWidthSize(600) && minElementWidthSize(700)) return 24
    if (maxElementWidthSize(500) && minElementWidthSize(600)) return 18

    return 10
  }

  const onAccountSelect = useCallback(
    (addr: AccountType['addr']) => setPendingToBeSetSelectedAccount(addr),
    []
  )

  useEffect(() => {
    // Navigate to the dashboard after the account is selected to avoid showing the dashboard
    // of the previously selected account.
    if (!selectedAccount || !pendingToBeSetSelectedAccount) return

    if (selectedAccount === pendingToBeSetSelectedAccount) {
      navigate(ROUTES.dashboard)
    }
  }, [selectedAccount, navigate, pendingToBeSetSelectedAccount])

  return !pendingToBeSetSelectedAccount ? (
    <TabLayoutContainer
      header={<Header withPopupBackButton withAmbireLogo />}
      footer={<BackButton />}
      width="lg"
      hideFooterInPopup
    >
      <View style={[flexbox.flex1, spacings.pv]} ref={accountsContainerRef}>
        <Search control={control} placeholder="Search for account" style={styles.searchBar} />
        <ScrollableWrapper style={styles.container}>
          {accounts.length ? (
            accounts.map((account) => (
              <Account
                onSelect={onAccountSelect}
                key={account.addr}
                account={account}
                maxAccountAddrLength={shortenAccountAddr()}
                withSettings={false}
                renderRightChildren={() => (
                  <CopyText
                    text={account.addr}
                    iconColor={theme.secondaryText}
                    iconWidth={20}
                    iconHeight={20}
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: 'transparent'
                    }}
                  />
                )}
              />
            ))
          ) : (
            // @TODO: add a proper label
            <Text>{t('No accounts found')}</Text>
          )}
        </ScrollableWrapper>
        <View style={[spacings.ptSm, { width: '100%' }]}>
          <Button
            testID="button-add-account"
            text={t('Add Account')}
            type="secondary"
            hasBottomSpacing={false}
            onPress={openBottomSheet as any}
            childrenPosition="left"
            style={{ ...flexbox.alignSelfCenter, width: '100%' }}
          >
            <AddIcon color={theme.primary} style={spacings.mrTy} />
          </Button>
        </View>
      </View>
      <BottomSheet
        id="account-select-add-account"
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
      >
        <AddAccount />
      </BottomSheet>
    </TabLayoutContainer>
  ) : (
    <DashboardSkeleton />
  )
}

export default React.memo(AccountSelectScreen)
