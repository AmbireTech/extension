import React from 'react'
import { Pressable, View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import AmbireLogoWithBackgroundAndLogotype from '@common/assets/svg/AmbireLogoWithBackgroundAndLogotype'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import ImportAccountIcon from '@common/assets/svg/ImportAccountIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import ViewOnlyIcon from '@common/assets/svg/ViewOnlyIcon'
import Button from '@common/components/Button'
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
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

import getStyles from './styles'

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
    <MobileLayoutContainer
      footer={
        <>
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
          <View style={[flexbox.alignSelfCenter, spacings.mtLg, { width: '100%' }]}>
            <Pressable
              onPress={() => setIsMenuOpen((prev) => !prev)}
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                flexbox.justifyCenter,
                spacings.phSm,
                { height: 56 }
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
                    backgroundColor: theme.primaryBackground
                  }
                ]}
              >
                <Pressable
                  onPress={() => handleOptionPress(ROUTES.networksConfiguration)}
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    flexbox.justifyCenter,
                    spacings.phSm,
                    spacings.mbSm,
                    {
                      height: 44,
                      borderRadius: BORDER_RADIUS_PRIMARY,
                      backgroundColor: theme.neutral100
                    }
                  ]}
                >
                  <Text fontSize={14} weight="medium" color={theme.tertiaryText}>
                    {t('Network and RPC configuration')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleOptionPress(ROUTES.privacyOptOutsConfiguration)}
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    flexbox.justifyCenter,
                    spacings.phSm,
                    {
                      height: 44,
                      borderRadius: BORDER_RADIUS_PRIMARY,
                      backgroundColor: theme.neutral100
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
        </>
      }
    >
      <MobileLayoutWrapperMainContent>
        <View style={[flexbox.justifySpaceBetween, flexbox.flex1]}>
          <View style={[flexbox.justifyCenter, flexbox.alignCenter, flexbox.flex1, spacings.phLg]}>
            <AmbireLogoWithBackgroundAndLogotype />
            <Text style={[spacings.mtLg, text.center]} weight="medium" appearance="secondaryText">
              {t('The Web3 wallet that makes self-custody easy and secure.')}
            </Text>
          </View>
        </View>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(GetStartedScreen)
