import React from 'react'
import { Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import AmbireLogoWithBackgroundAndLogotype from '@common/assets/svg/AmbireLogoWithBackgroundAndLogotype'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import ImportAccountIcon from '@common/assets/svg/ImportAccountIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useGetStarted from '@common/modules/auth/hooks/useGetStarted'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
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
  const { navigate } = useNavigation()
  const { handleAuthButtonPress, isCreatingNewAccount } = useGetStarted()
  const { goToNextRoute } = useOnboardingNavigation()

  const {
    ref: customizeSheetRef,
    open: openCustomizeSheet,
    close: closeCustomizeSheet
  } = useModalize()

  const handleOptionPress = React.useCallback(
    (route: string) => {
      closeCustomizeSheet()
      navigate(route)
    },
    [closeCustomizeSheet, navigate]
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
            disabled={isCreatingNewAccount}
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
          {/* Set apart from the two buttons above, as this one is for the users who
          already have accounts on the Ambire extension */}
          <Button
            testID="already-an-ambire-user-button"
            type="outline"
            hasBottomSpacing={false}
            style={spacings.mt2Xl}
            onPress={() => goToNextRoute(ROUTES.syncFromExtension)}
            text={t('Already an Ambire user')}
          >
            <RightArrowIcon color={theme.primaryText} style={spacings.mlTy} />
          </Button>
        </>
      }
    >
      <MobileLayoutWrapperMainContent>
        <View style={flexbox.flex1}>
          <Pressable
            onPress={openCustomizeSheet as any}
            style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyEnd, { height: 56 }]}
          >
            <SettingsIcon width={20} height={20} color={theme.neutral600} style={spacings.mrTy} />
            <Text fontSize={14} weight="medium" color={theme.neutral600}>
              {t('Customize')}
            </Text>
          </Pressable>
          <View style={[flexbox.justifyCenter, flexbox.alignCenter, flexbox.flex1, spacings.phLg]}>
            <AmbireLogoWithBackgroundAndLogotype />
            <Text style={[spacings.mtLg, text.center]} weight="medium" appearance="secondaryText">
              {t('The Web3 wallet that makes self-custody easy and secure.')}
            </Text>
          </View>
        </View>
      </MobileLayoutWrapperMainContent>

      <BottomSheet
        id="customize-onboarding"
        sheetRef={customizeSheetRef}
        closeBottomSheet={closeCustomizeSheet}
      >
        <ModalHeader handleClose={closeCustomizeSheet} title={t('Customize')} />
        <Button
          type="secondary"
          text={t('Network and RPC configuration')}
          onPress={() => handleOptionPress(ROUTES.networksConfiguration)}
        />
        <Button
          type="secondary"
          hasBottomSpacing={false}
          text={t('Privacy Opt-outs configuration')}
          onPress={() => handleOptionPress(ROUTES.privacyOptOutsConfiguration)}
        />
      </BottomSheet>
    </MobileLayoutContainer>
  )
}

export default React.memo(GetStartedScreen)
