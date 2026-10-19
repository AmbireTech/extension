import React from 'react'
import { View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import EditAccountIcon from '@common/assets/svg/EditAccountIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import AccountPersonalizeCard from '@common/modules/account-personalize/components/AccountPersonalizeCard'
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

const AccountPersonalizeScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()
  const { control, fields, isAdding, handleProceed, addMoreSource } = useAccountPersonalize()

  return (
    <MobileLayoutContainer
      footer={
        <>
          <Button
            testID="button-proceed"
            size="large"
            onPress={handleProceed}
            hasBottomSpacing={false}
            text={isAdding ? t('Adding...') : t('Proceed')}
            disabled={!fields.length || isAdding}
          />
          {!!addMoreSource && (
            <Button
              testID="add-more-accounts-btn"
              type="outline"
              text={
                addMoreSource === 'hw'
                  ? t('Add more accounts from this hardware wallet')
                  : t('Add more accounts from this recovery phrase')
              }
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
      }
    >
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title={fields.length > 1 ? t('Personalize accounts') : t('Personalize account')}
        withScroll
      >
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
          // The prepared accounts are gone (e.g. the app was restarted), so there is
          // nothing to add - only to go back from
          <Text appearance="secondaryText" weight="medium" style={text.center}>
            {t('There are no accounts to add. Please go back and start again.')}
          </Text>
        )}
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(AccountPersonalizeScreen)
