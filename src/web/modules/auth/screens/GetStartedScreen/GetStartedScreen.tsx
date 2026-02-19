import React, { useCallback, useEffect } from 'react'
import { TouchableOpacity, View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import AmbireLogo from '@common/assets/svg/AmbireLogo'
import AmbireLogoWithBackgroundAndLogotype from '@common/assets/svg/AmbireLogoWithBackgroundAndLogotype'
import ImportAccountIcon from '@common/assets/svg/ImportAccountIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import ViewModeIcon from '@common/assets/svg/ViewModeIcon'
import ViewOnlyIcon from '@common/assets/svg/ViewOnlyIcon'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { HeaderWithLogoOnly } from '@common/modules/header/components/Header/Header'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'

import getStyles from './styles'

export const CARD_WIDTH = 400

const GetStartedScreen = () => {
  const { theme } = useTheme(getStyles)
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { goToNextRoute } = useOnboardingNavigation()

  const { authStatus } = useAuth()

  const { state, dispatch: walletStateDispatch } = useController('WalletStateController')

  const resetIsSetupCompleteIfNeeded = useCallback(() => {
    if (authStatus === AUTH_STATUS.NOT_AUTHENTICATED && !state.isPinned && state.isSetupComplete) {
      walletStateDispatch({
        type: 'method',
        params: {
          method: 'setIsSetupComplete',
          args: [false]
        }
      })
    }
  }, [authStatus, walletStateDispatch, state.isPinned, state.isSetupComplete])

  useEffect(() => {
    if (authStatus === AUTH_STATUS.AUTHENTICATED) {
      navigate(ROUTES.dashboard)
      return
    }

    resetIsSetupCompleteIfNeeded()
  }, [authStatus, navigate, resetIsSetupCompleteIfNeeded])

  const handleAuthButtonPress = useCallback(
    async (flow: 'create-new-account' | 'import-existing-account' | 'view-only') => {
      if (flow === 'create-new-account') {
        goToNextRoute(WEB_ROUTES.createSeedPhrasePrepare)
        return
      }
      if (flow === 'import-existing-account') {
        goToNextRoute(WEB_ROUTES.importExistingAccount)
        return
      }
      if (flow === 'view-only') {
        goToNextRoute(WEB_ROUTES.viewOnlyAccountAdder)
      }
    },
    [goToNextRoute]
  )

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
      <TabLayoutWrapperMainContent>
        <Panel spacingsSize="small" type="onboarding" innerStyle={spacings.pt3Xl}>
          <View style={[flexbox.justifySpaceBetween, flexbox.flex1]}>
            <View
              style={[flexbox.justifyCenter, flexbox.alignCenter, flexbox.flex1, spacings.mb3Xl]}
            >
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
              <ViewOnlyIcon
                color={theme.primaryText}
                width={24}
                height={24}
                style={spacings.mrMi}
              />
            </Button>
          </View>
          <View style={[flexbox.directionRow, flexbox.alignSelfCenter, spacings.mt]}>
            <TouchableOpacity
              onPress={() => navigate(ROUTES.networksConfiguration)}
              style={[flexbox.directionRow, flexbox.alignCenter]}
            >
              <SettingsIcon width={20} height={20} style={spacings.mrTy} />
              <Text
                onPress={() => navigate(ROUTES.networksConfiguration)}
                fontSize={14}
                weight="medium"
                color={theme.tertiaryText}
              >
                {t('Network Configuration')}
              </Text>
            </TouchableOpacity>
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(GetStartedScreen)
