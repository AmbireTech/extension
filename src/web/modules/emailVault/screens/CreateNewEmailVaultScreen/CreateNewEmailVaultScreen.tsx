import React, { useEffect, useState } from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useRoute from '@common/hooks/useRoute'
import EmailLoginForm from '@common/modules/auth/components/EmailLoginForm'
import useStepper from '@common/modules/auth/hooks/useStepper'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'
import styles from '@web/components/TabLayoutWrapper/styles'
import {
  TabLayoutWrapperMainContent,
  TabLayoutWrapperSideContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'

const CreateNewEmailVaultScreen = () => {
  const { params } = useRoute()
  const { t } = useTranslation()
  const { stepperState, updateStepperState } = useStepper()
  const { hideStepper, hideFormTitle } = params
  const [isPasswordConfirmStep, setIsPasswordConfirmStep] = useState(false)
  // TODO: v2
  const requiresEmailConfFor = false
  const pendingLoginAccount = false

  useEffect(() => {
    // If we are showing email confirmation the step should be email-confirmation
    if (!isPasswordConfirmStep) {
      updateStepperState(WEB_ROUTES.createEmailVault, 'email')
    } else {
      updateStepperState('email-confirmation', 'email')
    }
  }, [updateStepperState, stepperState?.currentFlow, isPasswordConfirmStep])

  return (
    <>
      <TabLayoutWrapperMainContent
        pageTitle={
          !isPasswordConfirmStep ? 'Create Or Enter Email Vault' : 'Email Confirmation Required'
        }
        hideStepper={hideStepper || isPasswordConfirmStep}
      >
        <View style={[styles.mainContentWrapper, hideFormTitle && { ...spacings.mt }]}>
          {!isPasswordConfirmStep && !hideFormTitle && (
            <Text
              weight="medium"
              fontSize={16}
              color={colors.martinique}
              style={[spacings.mbLg, text.center]}
            >
              {t('Create Or Enter Email Vault')}
            </Text>
          )}
          <EmailLoginForm
            setIsPasswordConfirmStep={setIsPasswordConfirmStep}
            isPasswordConfirmStep={isPasswordConfirmStep}
            currentFlow={stepperState?.currentFlow}
          />
        </View>
      </TabLayoutWrapperMainContent>
      {!isPasswordConfirmStep && (
        <TabLayoutWrapperSideContent backgroundType="beta">
          <Text weight="medium" style={spacings.mb} color={colors.zircon} fontSize={16}>
            {t('Email Vaults')}
          </Text>
          <Text
            shouldScale={false}
            weight="regular"
            style={spacings.mbTy}
            color={colors.zircon}
            fontSize={14}
          >
            {t(
              "Email vaults are stored in the cloud, on Ambire's infrastructure and they are used for recovery of smart accounts, recovery of your extension passphrase, as well as optionally backing up your keys."
            )}
          </Text>
        </TabLayoutWrapperSideContent>
      )}
    </>
  )
}

export default CreateNewEmailVaultScreen
