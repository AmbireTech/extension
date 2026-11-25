import React from 'react'
import { useTranslation } from 'react-i18next'

import Button from '@common/components/Button'
import useController from '@common/hooks/useController'
import AmbireSmartAccountsDisabledModal from '@common/modules/account-picker/components/AmbireSmartAccountsDisabledModal'
import AccountsOnPageList from '@common/modules/account-picker/components/AccountsOnPageList'
import ChangeHdPath from '@common/modules/account-picker/components/ChangeHdPath'
import useAccountPicker from '@common/modules/account-picker/hooks/useAccountPicker/useAccountPicker'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
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
    <MobileLayoutContainer
      footer={
        <Button
          testID="button-import-account"
          hasBottomSpacing={false}
          onPress={onImportReady}
          size="large"
          disabled={isImportDisabled}
          text={isLoading ? t('Loading...') : t('Continue')}
        />
      }
    >
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title={setTitle(accountPickerState.type, accountPickerState.subType)}
        rightIcon={!!shouldDisplayChangeHdPath && <ChangeHdPath />}
      >
        <AccountsOnPageList
          state={accountPickerState}
          setPage={setPage}
          subType={accountPickerState.subType}
          isLoading={isLoading}
          lookingForLinkedAccounts={accountPickerState.linkedAccountsLoading}
        />
      </MobileLayoutWrapperMainContent>
      <AmbireSmartAccountsDisabledModal />
    </MobileLayoutContainer>
  )
}

export default React.memo(AccountPickerScreen)
