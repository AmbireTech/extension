import React from 'react'
import { Pressable, View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import AmbireLogoWithBackgroundAndLogotype from '@common/assets/svg/AmbireLogoWithBackgroundAndLogotype'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import ImportAccountIcon from '@common/assets/svg/ImportAccountIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import ViewOnlyIcon from '@common/assets/svg/ViewOnlyIcon'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useGetStarted from '@common/modules/auth/hooks/useGetStarted'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
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
  const { handleAuthButtonPress } = useGetStarted()

  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  const handleOptionPress = React.useCallback(
    (route: string) => {
      setIsMenuOpen(false)
      navigate(route)
    },
    [navigate]
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
            <View style={[flexbox.alignSelfCenter, spacings.mt, { width: '100%' }]}>
              <Pressable
                onPress={() => setIsMenuOpen(!isMenuOpen)}
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.justifyCenter,
                  flexbox.flex1,
                  spacings.phSm,
                  spacings.pvTy,
                  {
                    borderRadius: 8
                  }
                ]}
              >
                {({ hovered }: any) => (
                  <>
                    <SettingsIcon
                      width={20}
                      height={20}
                      color={theme.neutral600}
                      style={spacings.mrTy}
                    />
                    <Text
                      fontSize={14}
                      weight="medium"
                      color={theme.neutral600}
                      style={spacings.mrTy}
                    >
                      {t('Customize')}
                    </Text>
                    <View
                      style={[
                        flexbox.alignCenter,
                        flexbox.justifyCenter,
                        {
                          borderRadius: 6,
                          width: 24,
                          height: 24,
                          backgroundColor: hovered ? theme.tertiaryBackground : 'transparent'
                        }
                      ]}
                    >
                      <View style={{ transform: [{ rotate: isMenuOpen ? '180deg' : '0deg' }] }}>
                        <DownArrowIcon color={theme.neutral600} />
                      </View>
                    </View>
                  </>
                )}
              </Pressable>
              {isMenuOpen && (
                <View
                  style={[
                    {
                      backgroundColor: theme.primaryBackground,
                      marginTop: 8
                    }
                  ]}
                >
                  <Pressable
                    onPress={() => handleOptionPress(ROUTES.networksConfiguration)}
                    style={({ hovered }: any) => [
                      flexbox.directionRow,
                      flexbox.alignCenter,
                      flexbox.justifyCenter,
                      {
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        borderRadius: BORDER_RADIUS_PRIMARY,
                        backgroundColor: hovered ? theme.secondaryBackground : 'transparent'
                      }
                    ]}
                  >
                    <Text fontSize={14} weight="medium" color={theme.tertiaryText}>
                      {t('Network and RPC configuration')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleOptionPress(ROUTES.privacyOptOutsConfiguration)}
                    style={({ hovered }: any) => [
                      flexbox.directionRow,
                      flexbox.alignCenter,
                      flexbox.justifyCenter,
                      {
                        paddingHorizontal: 12,
                        paddingVertical: 12,
                        borderRadius: BORDER_RADIUS_PRIMARY,
                        backgroundColor: hovered ? theme.secondaryBackground : 'transparent'
                      }
                    ]}
                  >
                    <Text fontSize={14} weight="medium" color={theme.tertiaryText}>
                      {t('Privacy Opt-outs configuration')}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(GetStartedScreen)
