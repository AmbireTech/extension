import React, { useEffect, useRef, useState } from 'react'
import { Animated, Keyboard, TouchableOpacity, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import AmbireLogo from '@common/assets/svg/AmbireLogo'
import BottomSheet from '@common/components/BottomSheet'
import Checkbox from '@common/components/Checkbox'
import DualChoiceModal from '@common/components/DualChoiceModal'
import FatToggle from '@common/components/FatToggle'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useBiometrics from '@common/hooks/useBiometrics'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import KeyStoreSetupForm from '@common/modules/keystore/components/KeyStoreSetupForm'
import TermsComponent from '@common/modules/terms/components'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper/MobileLayoutWrapper'

const KeyStoreSetupScreen = () => {
  const { t } = useTranslation()

  const { goToPrevRoute } = useOnboardingNavigation()
  const { theme } = useTheme()
  const [agreedWithTerms, setAgreedWithTerms] = useState(true)
  const { ref: termsModalRef, open: openTermsModal, close: closeTermsModal } = useModalize()
  const animation = useRef(new Animated.Value(0)).current

  const { isEnrolled, isLoading, saveBiometricsSecret } = useBiometrics()
  const [biometricsEnabled, setBiometricsEnabled] = useState(false)

  useEffect(() => {
    if (!isLoading && isEnrolled) setBiometricsEnabled(true)
  }, [isLoading, isEnrolled])

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 480,
      useNativeDriver: false
    }).start()
  }, [animation])

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title={t('Set app password')}
        step={2}
        totalSteps={2}
        withScroll
        keyboardAwareScrollViewProps={{ bottomOffset: 220 }}
      >
        <Text weight="medium" appearance="secondaryText" style={spacings.mbXl}>
          {t('Used to access your local wallet and encrypt your data.')}
        </Text>

        <KeyStoreSetupForm
          agreedWithTerms={agreedWithTerms}
          onBeforeKeystoreSetup={async (password) => {
            Keyboard.dismiss()
            // On iOS: setItemAsync with requireAuthentication: true is silent on first write
            // (per expo docs, iOS only prompts on read/update, not on initial save).
            // On Android: setItemAsync prompts for biometrics itself.
            // Either way, the unlock flow will always prompt via getItemAsync.
            if (biometricsEnabled) {
              const success = await saveBiometricsSecret(password)
              if (!success) return false
            }
            return true
          }}
        >
          {isEnrolled && (
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                flexbox.justifySpaceBetween,
                spacings.mvSm
              ]}
            >
              <Text appearance="secondaryText">{t('Enable biometrics')}</Text>
              <FatToggle
                isOn={biometricsEnabled}
                onToggle={() => setBiometricsEnabled(!biometricsEnabled)}
                width={44}
                height={22}
                style={spacings.mr0}
              />
            </View>
          )}
          <View style={[spacings.ptSm, flexbox.flex1, flexbox.justifyEnd]}>
            <Checkbox
              testID="keystore-setup-checkbox"
              value={agreedWithTerms}
              onValueChange={setAgreedWithTerms}
              label={
                <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                  <Text fontSize={12} appearance="secondaryText">
                    I agree to the{' '}
                  </Text>
                  <TouchableOpacity testID="terms-of-service-btn" onPress={() => openTermsModal()}>
                    <Text fontSize={12} color={theme.linkText}>
                      Terms of Service
                    </Text>
                  </TouchableOpacity>
                  <Text>.</Text>
                </View>
              }
            />
          </View>
        </KeyStoreSetupForm>
      </MobileLayoutWrapperMainContent>
      <BottomSheet id="terms-modal" closeBottomSheet={closeTermsModal} sheetRef={termsModalRef}>
        <View style={[flexbox.alignCenter, flexbox.justifyCenter]}>
          <AmbireLogo style={[spacings.mbLg, flexbox.alignCenter]} width={185} height={92} />
          <Text fontSize={32} weight="regular" style={[{ textAlign: 'center' }, spacings.mbXl]}>
            {t('Terms Of Service')}
          </Text>
        </View>
        <DualChoiceModal
          hideHeader
          description={<TermsComponent />}
          primaryButtonText={t('Ok')}
          onPrimaryButtonPress={closeTermsModal}
          primaryButtonTestID="terms-accept-btn"
          style={common.borderRadiusPrimary}
        />
      </BottomSheet>
    </MobileLayoutContainer>
  )
}

export default KeyStoreSetupScreen
