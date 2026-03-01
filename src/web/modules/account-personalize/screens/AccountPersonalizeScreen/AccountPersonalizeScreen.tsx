/* eslint-disable prettier/prettier */
import React from 'react'
import { Pressable, ScrollView, View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import SuccessAnimation from '@common/components/SuccessAnimation'
import Text from '@common/components/Text'
import { Trans, useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import AccountPersonalizeCard from '@common/modules/account-personalize/components/AccountPersonalizeCard'
import AccountsLoadingAnimation from '@common/modules/account-personalize/components/AccountsLoadingAnimation'
import AccountsLoadingDotsAnimation from '@common/modules/account-personalize/components/AccountsLoadingDotsAnimation'
import useAccountPersonalize from '@common/modules/account-personalize/hooks/useAccountPersonalize'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import PinExtension from '@web/modules/auth/components/PinExtension'

import getStyles from './styles'

export const CARD_WIDTH = 400

const AccountPersonalizeScreen = () => {
  const { t } = useTranslation()
  const { goToNextRoute, goToPrevRoute, accountsToPersonalize } = useOnboardingNavigation()
  const { theme } = useTheme(getStyles)

  const {
    isLoading,
    completed,
    fields,
    control,
    accountPickerState,
    accounts,
    handleSave,
    handleComplete,
    handleContactSupport
  } = useAccountPersonalize()

  return (
    <>
      {!!completed && !isLoading && <PinExtension />}
      <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
        <TabLayoutWrapperMainContent>
          <Panel
            type="onboarding"
            spacingsSize="small"
            style={!accountPickerState.pageError && spacings.ptMd}
            withBackButton={!!accountPickerState.pageError}
            onBackButtonPress={() => {
              goToPrevRoute()
            }}
            title={accountPickerState.pageError ? t('Accounts') : undefined}
          >
            {isLoading && !accountPickerState.pageError ? (
              <View style={[flexbox.alignCenter]}>
                <View style={spacings.mbXl}>
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
                        <Pressable onPress={handleContactSupport}>
                          <Alert.Text type="warning" style={text.underline}>
                            contact our support team
                          </Alert.Text>
                        </Pressable>
                        .
                      </Alert.Text>
                    </Trans>
                  }
                />
              </View>
            ) : (
              <>
                <SuccessAnimation
                  style={{ ...spacings.mb2Xl, ...flexbox.alignSelfCenter, ...spacings.mt }}
                />
                <Text
                  testID="added-successfully-text"
                  weight="medium"
                  fontSize={20}
                  style={{ alignSelf: 'center', ...spacings.mbXl }}
                >
                  {accountsToPersonalize.length
                    ? t('Added successfully')
                    : t('No new accounts added')}
                </Text>
                <ScrollView style={spacings.mbLg}>
                  {accountsToPersonalize.map((acc, index) => (
                    <AccountPersonalizeCard
                      key={acc.addr + completed}
                      control={control}
                      index={index}
                      account={acc}
                      hasBottomSpacing={index !== fields.length - 1}
                      onSave={handleSave as any}
                      disableEdit={!!completed}
                    />
                  ))}
                </ScrollView>
                {completed ? (
                  <Text appearance="secondaryText" weight="medium" style={[text.center]}>
                    {t('You can access your accounts from the dashboard via the extension icon.')}
                  </Text>
                ) : (
                  <Button
                    testID="button-save-and-continue"
                    size="large"
                    onPress={handleComplete}
                    hasBottomSpacing={false}
                    text={t('Complete')}
                    disabled={!accounts.length}
                  />
                )}
                {!completed && ['seed', 'hw'].includes(accountPickerState.subType as any) && (
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
                      height: 40
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
          </Panel>
        </TabLayoutWrapperMainContent>
      </TabLayoutContainer>
    </>
  )
}

export default React.memo(AccountPersonalizeScreen)
