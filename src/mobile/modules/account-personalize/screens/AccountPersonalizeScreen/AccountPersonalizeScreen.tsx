import React from 'react'
import { View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import EditAccountIcon from '@common/assets/svg/EditAccountIcon'
import Button from '@common/components/Button'
import DotsLoadingAnimation from '@common/components/DotsLoadingAnimation'
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
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

// As tall as the header's back button (28), also while the button is hidden
const HEADER_STYLE = { minHeight: 28 }

const AccountPersonalizeScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()
  const {
    control,
    fields,
    isLoading,
    isAdding,
    handleProceed,
    title,
    noAccountsText,
    addMoreText
  } = useAccountPersonalize()

  return (
    <MobileLayoutContainer
      footer={
        !isLoading && (
          <>
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
                // Adding more accounts is a step forward, even when the picker
                // is the screen this flow arrived from (hardware wallets).
                onPress={() => goToNextRoute(WEB_ROUTES.accountPicker, FORWARD_NAVIGATION_STATE)}
                disabled={isAdding}
                style={{ ...spacings.phMi, ...spacings.mtSm, height: 44 }}
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
        )
      }
    >
      <MobileLayoutWrapperMainContent
        // Only the loading state shows while loading - no way back, no title yet. The header
        // stays, as tall as with the back button, so nothing moves once it is loaded.
        withBackButton={!isLoading}
        headerStyle={HEADER_STYLE}
        onBackButtonPress={goToPrevRoute}
        title={title}
        withScroll
      >
        {isLoading ? (
          <View style={flexbox.alignCenter}>
            <View style={spacings.mbLg}>
              <AccountsLoadingAnimation />
            </View>
            <Text fontSize={20} weight="semiBold" style={[text.center, spacings.mbSm]}>
              {t('Loading accounts')}
            </Text>
            <DotsLoadingAnimation />
          </View>
        ) : (
          <>
            <View testID="personalize-accounts-header" style={[flexbox.alignCenter, spacings.mbXl]}>
              <EditAccountIcon />
            </View>
            {fields.length ? (
              fields.map((field, index) => (
                <AccountPersonalizeCard
                  key={field.id}
                  control={control}
                  index={index}
                  account={field}
                  hasBottomSpacing={index !== fields.length - 1}
                  disableEdit={isAdding}
                />
              ))
            ) : (
              <Text appearance="secondaryText" weight="medium" style={text.center}>
                {noAccountsText}
              </Text>
            )}
          </>
        )}
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(AccountPersonalizeScreen)
