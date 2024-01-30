import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import AddIcon from '@common/assets/svg/AddIcon'
import BackButton from '@common/components/BackButton'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import Wrapper from '@common/components/Wrapper'
import useAccounts from '@common/hooks/useAccounts'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  TabLayoutContainer,
  tabLayoutWidths
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import Account from '@web/modules/account-select/components/Account'
import AddAccount from '@web/modules/account-select/components/AddAccount'

import getStyles from './styles'

const AccountSelectScreen = () => {
  const { styles, theme } = useTheme(getStyles)
  const { accounts, control } = useAccounts()
  const { goBack } = useNavigation()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { t } = useTranslation()
  return (
    <TabLayoutContainer
      header={<Header withPopupBackButton withAmbireLogo />}
      footer={<BackButton />}
      hideFooterInPopup
    >
      <View style={[flexbox.flex1, spacings.pv]}>
        <View style={styles.container}>
          <Search control={control} placeholder="Search for account" style={styles.searchBar} />
        </View>

        <Wrapper contentContainerStyle={styles.container}>
          {accounts.length ? (
            accounts.map((account) => (
              <Account onSelect={goBack} key={account.addr} account={account} />
            ))
          ) : (
            // @TODO: add a proper label
            <Text>{t('No accounts found')}</Text>
          )}
        </Wrapper>
        <View style={[spacings.ptSm, { width: '100%' }]}>
          <Button
            text={t('Add Account')}
            type="secondary"
            hasBottomSpacing={false}
            onPress={openBottomSheet as any}
            childrenPosition="left"
            style={{ maxWidth: tabLayoutWidths.lg, ...flexbox.alignSelfCenter, width: '100%' }}
          >
            <AddIcon color={theme.primary} style={spacings.mrTy} />
          </Button>
        </View>
      </View>
      <BottomSheet sheetRef={sheetRef} closeBottomSheet={closeBottomSheet}>
        <AddAccount />
      </BottomSheet>
    </TabLayoutContainer>
  )
}

export default React.memo(AccountSelectScreen)
