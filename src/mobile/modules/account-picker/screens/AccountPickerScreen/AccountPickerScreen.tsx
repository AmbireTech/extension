import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import ImportAccountIcon from '@common/assets/svg/ImportAccountIcon'
import Button from '@common/components/Button'
import useController from '@common/hooks/useController'
import AccountsOnPageList from '@common/modules/account-picker/components/AccountsOnPageList'
import ChangeHdPath from '@common/modules/account-picker/components/ChangeHdPath'
import useAccountPicker from '@common/modules/account-picker/hooks/useAccountPicker/useAccountPicker'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const AccountPickerScreen = () => {
  const { t } = useTranslation()

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
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title={setTitle(accountPickerState.type, accountPickerState.subType)}
        rightIcon={
          !!shouldDisplayChangeHdPath && (
            <ChangeHdPath
              disabled={accountPickerState.accountsLoading || !!isLoading}
              setPage={setPage}
            />
          )
        }
      >
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
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(AccountPickerScreen)
