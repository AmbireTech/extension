import React from 'react'
import { Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import AmbireLogoWithBackgroundAndLogotype from '@common/assets/svg/AmbireLogoWithBackgroundAndLogotype'
import ImportAccountIcon from '@common/assets/svg/ImportAccountIcon'
import SettingsIcon from '@common/assets/svg/SettingsIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useGetStarted from '@common/modules/auth/hooks/useGetStarted'
import { ROUTES } from '@common/modules/router/constants/common'
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
  const { handleAuthButtonPress, isCreatingNewAccount } = useGetStarted()

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
    <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
      <TabLayoutWrapperMainContent>
        <Panel spacingsSize="small" type="onboarding">
          <View style={[flexbox.flex1]}>
            <View style={[flexbox.directionRow, flexbox.justifyEnd, spacings.mbMd]}>
              <Pressable
                onPress={openCustomizeSheet as any}
                style={[flexbox.directionRow, flexbox.alignCenter, spacings.pvTy]}
              >
                <SettingsIcon
                  width={20}
                  height={20}
                  color={theme.neutral600}
                  style={spacings.mrTy}
                />
                <Text fontSize={14} weight="medium" color={theme.neutral600}>
                  {t('Customize')}
                </Text>
              </Pressable>
            </View>
            {/* The space below the header is split evenly between the logo and the buttons,
            each centered in its half */}
            <View style={[flexbox.flex1, flexbox.justifyCenter, flexbox.alignCenter]}>
              <AmbireLogoWithBackgroundAndLogotype />
              <Text style={[spacings.mtLg, text.center]} weight="medium" appearance="secondaryText">
                {t('The Web3 wallet that makes self-custody easy and secure.')}
              </Text>
            </View>
            <View style={[flexbox.flex1, flexbox.justifyCenter]}>
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
                disabled={isCreatingNewAccount}
                childrenPosition="left"
                hasBottomSpacing={false}
              >
                <ImportAccountIcon
                  width={24}
                  height={24}
                  color={theme.primaryText}
                  style={spacings.mrMi}
                />
              </Button>
            </View>
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>

      <BottomSheet
        id="customize-onboarding"
        sheetRef={customizeSheetRef}
        closeBottomSheet={closeCustomizeSheet}
        style={{ maxWidth: CARD_WIDTH }}
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
    </TabLayoutContainer>
  )
}

export default React.memo(GetStartedScreen)
