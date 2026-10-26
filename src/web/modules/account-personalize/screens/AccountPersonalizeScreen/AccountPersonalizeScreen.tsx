import React from 'react'
import { ScrollView, View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import EditAccountIcon from '@common/assets/svg/EditAccountIcon'
import Button from '@common/components/Button'
import DotsLoadingAnimation from '@common/components/DotsLoadingAnimation'
import Panel from '@common/components/Panel'
import SuccessAnimation from '@common/components/SuccessAnimation'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import AccountPersonalizeCard from '@common/modules/account-personalize/components/AccountPersonalizeCard'
import AccountsLoadingAnimation from '@common/modules/account-personalize/components/AccountsLoadingAnimation'
import useAccountPersonalize from '@common/modules/account-personalize/hooks/useAccountPersonalize'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { FORWARD_NAVIGATION_STATE, WEB_ROUTES } from '@common/modules/router/constants/common'
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

// As tall as the header's back button (28), also while the button is hidden
const HEADER_STYLE = { minHeight: 28 }

const AccountPersonalizeScreen = () => {
  const { t } = useTranslation()
  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()
  const { theme } = useTheme(getStyles)
  const {
    control,
    fields,
    isLoading,
    hasBackButton,
    isAdding,
    addedAccounts,
    handleSaveAccountName,
    handleProceed,
    title,
    noAccountsText,
    addMoreText
  } = useAccountPersonalize()

  // Added, and the flow went on in the popup - this tab stays up to show them
  if (addedAccounts) {
    return (
      <>
        <PinExtension />
        <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
          <TabLayoutWrapperMainContent>
            <Panel type="onboarding" spacingsSize="small" style={spacings.ptMd}>
              <SuccessAnimation
                style={{ ...spacings.mb2Xl, ...flexbox.alignSelfCenter, ...spacings.mt }}
              />
              <Text
                testID="added-successfully-text"
                weight="medium"
                fontSize={20}
                style={{ alignSelf: 'center', ...spacings.mbXl }}
              >
                {t('Added successfully')}
              </Text>
              <ScrollView style={spacings.mbLg}>
                {addedAccounts.map((account, index) => (
                  <AccountPersonalizeCard
                    key={account.addr}
                    control={control}
                    index={index}
                    account={account}
                    hasBottomSpacing={index !== addedAccounts.length - 1}
                    disableEdit
                    onSaveName={handleSaveAccountName}
                  />
                ))}
              </ScrollView>
              <Text appearance="secondaryText" weight="medium" style={text.center}>
                {t('You can access your accounts from the dashboard via the extension icon.')}
              </Text>
            </Panel>
          </TabLayoutWrapperMainContent>
        </TabLayoutContainer>
      </>
    )
  }

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
      <TabLayoutWrapperMainContent>
        <Panel
          type="onboarding"
          spacingsSize="small"
          // The header stays, as tall as with the back button, so nothing moves once it shows up
          withBackButton={hasBackButton}
          titleContainerStyle={HEADER_STYLE}
          onBackButtonPress={goToPrevRoute}
          title={title}
        >
          {isLoading ? (
            <View style={flexbox.alignCenter}>
              <View style={spacings.mbXl}>
                <AccountsLoadingAnimation />
              </View>
              <Text fontSize={20} weight="semiBold" style={[text.center, spacings.mbSm]}>
                {t('Loading accounts')}
              </Text>
              <DotsLoadingAnimation />
            </View>
          ) : (
            <>
              <View
                testID="personalize-accounts-header"
                style={[flexbox.alignCenter, spacings.mbXl]}
              >
                <EditAccountIcon />
              </View>
              <ScrollView style={spacings.mbLg}>
                {fields.length ? (
                  fields.map((field, index) => (
                    <AccountPersonalizeCard
                      key={field.id}
                      control={control}
                      index={index}
                      account={field}
                      hasBottomSpacing={index !== fields.length - 1}
                      disableEdit={isAdding}
                      onSaveName={handleSaveAccountName}
                    />
                  ))
                ) : (
                  <Text appearance="secondaryText" weight="medium" style={text.center}>
                    {noAccountsText}
                  </Text>
                )}
              </ScrollView>
              <Button
                testID="button-proceed"
                size="large"
                onPress={handleProceed}
                hasBottomSpacing={false}
                text={isAdding ? t('Adding...') : t('Proceed')}
                disabled={!fields.length || isAdding}
              />
              {!!addMoreText && (
                <Button
                  testID="add-more-accounts-btn"
                  type="outline"
                  text={addMoreText}
                  // Adding more accounts is a step forward, even when the picker is the screen
                  // this flow arrived from (hardware wallets)
                  onPress={() => goToNextRoute(WEB_ROUTES.accountPicker, FORWARD_NAVIGATION_STATE)}
                  disabled={isAdding}
                  style={{ ...spacings.phMi, ...spacings.mtSm, height: 40 }}
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
  )
}

export default React.memo(AccountPersonalizeScreen)
