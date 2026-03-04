import React, { useCallback } from 'react'
import { View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import AmbireLogoWithBackgroundAndLogotype from '@common/assets/svg/AmbireLogoWithBackgroundAndLogotype'
import ImportAccountIcon from '@common/assets/svg/ImportAccountIcon'
import ViewOnlyIcon from '@common/assets/svg/ViewOnlyIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useGetStarted from '@common/modules/auth/hooks/useGetStarted'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

import getStyles from './styles'

const GetStartedScreen = () => {
  const { theme } = useTheme(getStyles)
  const { t } = useTranslation()
  const { handleAuthButtonPress } = useGetStarted()

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent>
        <View style={[flexbox.justifySpaceBetween, flexbox.flex1]}>
          <View style={[flexbox.justifyCenter, flexbox.alignCenter, flexbox.flex1, spacings.phLg]}>
            <AmbireLogoWithBackgroundAndLogotype />
            <Text style={[spacings.mtLg, text.center]} weight="medium" appearance="secondaryText">
              {t('The Web3 wallet that makes self-custody easy and secure.')}
            </Text>
          </View>
          <Button
            testID="create-new-account-btn"
            type="primary"
            text={t('Create new account')}
            onPress={() => handleAuthButtonPress('create-new-account')}
            childrenPosition="left"
          >
            <AddCircularIcon width={24} height={24} color="#fff" style={spacings.mrMi} />
          </Button>
          <Button
            testID="import-existing-account-btn"
            type="tertiary"
            text={t('Import existing account')}
            onPress={() => handleAuthButtonPress('import-existing-account')}
            childrenPosition="left"
          >
            <ImportAccountIcon
              width={24}
              height={24}
              color={theme.primaryText}
              style={spacings.mrMi}
            />
          </Button>
          <Button
            testID="watch-an-address-button"
            type="outline"
            hasBottomSpacing={false}
            onPress={() => handleAuthButtonPress('view-only')}
            text={t('Watch an address')}
            childrenPosition="left"
          >
            <ViewOnlyIcon color={theme.primaryText} width={24} height={24} style={spacings.mrMi} />
          </Button>
        </View>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(GetStartedScreen)
