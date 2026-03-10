import React from 'react'
import { ScrollView, View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import SuccessAnimation from '@common/components/SuccessAnimation'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { Trans, useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import AccountPersonalizeCard from '@common/modules/account-personalize/components/AccountPersonalizeCard'
import AccountsLoadingAnimation from '@common/modules/account-personalize/components/AccountsLoadingAnimation'
import AccountsLoadingDotsAnimation from '@common/modules/account-personalize/components/AccountsLoadingDotsAnimation'
import useAccountPersonalize from '@common/modules/account-personalize/hooks/useAccountPersonalize'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

import getStyles from './styles'

const AccountPersonalizeScreen = () => {
  const { t } = useTranslation()
  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()
  const { theme } = useTheme(getStyles)

  const {
    isLoading,
    fields,
    control,
    accountPickerState,
    accounts,
    accountsToPersonalize,
    handleSave,
    handleComplete,
    handleContactSupport
  } = useAccountPersonalize()

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title={
          accountPickerState.pageError
            ? t('Accounts')
            : !isLoading
              ? accountsToPersonalize.length
                ? t('Added successfully')
                : t('No new accounts added')
              : undefined
        }
        withScroll
        keyboardAwareScrollViewProps={{ bottomOffset: 200 }}
      >
        {isLoading && !accountPickerState.pageError ? (
          <View style={[flexbox.alignCenter]}>
            <View style={spacings.mbLg}>
              <AccountsLoadingAnimation />
            </View>
            <Text fontSize={20} weight="semiBold" style={[text.center, spacings.mbSm]}>
              {t('Loading accounts')}
            </Text>
            <AccountsLoadingDotsAnimation />
          </View>
        ) : accountPickerState.pageError ? (
          <View style={flexbox.alignCenter}>
            <Alert
              type="warning"
              title={accountPickerState.pageError}
              text={
                <Trans>
                  <Alert.Text type="warning">
                    Please go back and start the account-adding process again. If the problem
                    persists, please{' '}
                    <Text
                      appearance="primary"
                      style={text.underline}
                      onPress={handleContactSupport}
                    >
                      contact our support team
                    </Text>
                    .
                  </Alert.Text>
                </Trans>
              }
            />
          </View>
        ) : (
          <>
            <SuccessAnimation style={{ ...spacings.mbXl, ...flexbox.alignSelfCenter }} />
            <View style={[spacings.mbLg, flexbox.flex1]}>
              {accountsToPersonalize.map((acc, index) => (
                <AccountPersonalizeCard
                  key={acc.addr}
                  control={control}
                  index={index}
                  account={acc}
                  hasBottomSpacing={index !== fields.length - 1}
                  onSave={handleSave as any}
                />
              ))}
            </View>

            <Button
              testID="button-save-and-continue"
              size="large"
              onPress={handleComplete}
              hasBottomSpacing={false}
              text={t('Complete')}
              disabled={!accounts.length}
            />

            {['seed', 'hw'].includes(accountPickerState.subType as any) && (
              <Button
                testID="add-more-accounts-btn"
                type="outline"
                text={t('Add more accounts from this {{source}}', {
                  source:
                    accountPickerState.subType === 'hw' ? 'hardware wallet' : 'recovery phrase'
                })}
                onPress={() => {
                  handleSave()
                  goToNextRoute(WEB_ROUTES.accountPicker)
                }}
                style={{
                  ...spacings.phMi,
                  ...spacings.mtSm,
                  height: isWeb ? 40 : 44
                }}
                size="tiny"
                hasBottomSpacing={false}
                childrenPosition="left"
              >
                <AddCircularIcon
                  width={20}
                  height={20}
                  color={theme.primaryText}
                  style={spacings.mrMi}
                />
              </Button>
            )}
          </>
        )}
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(AccountPersonalizeScreen)
