import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import ImportAccountIcon from '@common/assets/svg/ImportAccountIcon'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import { PanelBackButton, PanelTitle } from '@common/components/Panel/Panel'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import AccountsOnPageList from '@common/modules/account-picker/components/AccountsOnPageList'
import ChangeHdPath from '@common/modules/account-picker/components/ChangeHdPath'
import useAccountPicker from '@common/modules/account-picker/hooks/useAccountPicker/useAccountPicker'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'

const AccountPickerScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const accountPickerState = useController('AccountPickerController').state

  const {
    onImportReady,
    setPage,
    isLoading,
    isImportDisabled,
    shouldDisplayChangeHdPath,
    setTitle
  } = useAccountPicker()

  const { goToPrevRoute } = useOnboardingNavigation()

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground} width="lg">
      <TabLayoutWrapperMainContent contentContainerStyle={spacings.pb2Xl}>
        <Panel
          type="onboarding"
          spacingsSize="small"
          panelWidth={800}
          innerStyle={{ ...spacings.phSm }}
          style={{ maxHeight: 900, height: '100%' }}
        >
          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbMd]}>
            <PanelBackButton onPress={goToPrevRoute} style={spacings.mr} />
            <PanelTitle
              title={setTitle(accountPickerState.type, accountPickerState.subType)}
              style={{ textAlign: 'left', flex: 1 }}
            />
            {!!shouldDisplayChangeHdPath && (
              <ChangeHdPath
                disabled={accountPickerState.accountsLoading || !!isLoading}
                setPage={setPage}
              />
            )}
          </View>

          <AccountsOnPageList
            state={accountPickerState}
            setPage={setPage}
            subType={accountPickerState.subType}
            isLoading={isLoading}
            lookingForLinkedAccounts={accountPickerState.linkedAccountsLoading}
          >
            <Button
              testID="button-import-account"
              hasBottomSpacing={false}
              onPress={onImportReady}
              size="large"
              disabled={isImportDisabled}
              style={flexbox.alignSelfCenter}
              text={
                isLoading
                  ? t('Importing...')
                  : !accountPickerState.selectedAccounts.length
                    ? t('Continue')
                    : t('Import accounts')
              }
              childrenPosition="left"
            >
              {!!accountPickerState.selectedAccounts.length && (
                <ImportAccountIcon width={24} height={24} color="#fff" style={spacings.mrMi} />
              )}
            </Button>
          </AccountsOnPageList>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(AccountPickerScreen)
