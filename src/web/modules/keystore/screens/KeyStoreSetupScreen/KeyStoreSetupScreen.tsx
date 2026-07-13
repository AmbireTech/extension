import React, { useEffect, useRef, useState } from 'react'
import { Animated, TouchableOpacity, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import AmbireLogo from '@common/assets/svg/AmbireLogo'
import BottomSheet from '@common/components/BottomSheet'
import Checkbox from '@common/components/Checkbox'
import DualChoiceModal from '@common/components/DualChoiceModal'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { Trans, useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import KeyStoreSetupForm from '@common/modules/keystore/components/KeyStoreSetupForm'
import TermsComponent from '@common/modules/terms/components'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'

const KeyStoreSetupScreen = () => {
  const { t } = useTranslation()

  const { goToPrevRoute } = useOnboardingNavigation()
  const { theme } = useTheme()
  const [agreedWithTerms, setAgreedWithTerms] = useState(true)
  const { ref: termsModalRef, open: openTermsModal, close: closeTermsModal } = useModalize()
  const animation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 480,
      useNativeDriver: false
    }).start()
  }, [animation])

  return (
    <TabLayoutContainer backgroundColor={theme.secondaryBackground}>
      <TabLayoutWrapperMainContent withScroll={false}>
        <Panel
          type="onboarding"
          title={t('Set extension password')}
          spacingsSize="small"
          withBackButton
          onBackButtonPress={goToPrevRoute}
          step={2}
          totalSteps={2}
        >
          <Text weight="medium" appearance="secondaryText" style={spacings.mbXl}>
            {t('Used to access your local wallet and encrypt your data.')}
          </Text>

          <KeyStoreSetupForm agreedWithTerms={agreedWithTerms}>
            <Checkbox
              testID="keystore-setup-checkbox"
              value={agreedWithTerms}
              onValueChange={setAgreedWithTerms}
              style={[spacings.ptXl, spacings.mbTy]}
              label={
                <Trans>
                  <Text fontSize={12} appearance="secondaryText">
                    I agree to the{' '}
                  </Text>
                  <TouchableOpacity testID="terms-of-service-btn" onPress={() => openTermsModal()}>
                    <Text fontSize={12} color={theme.linkText}>
                      Terms of Service
                    </Text>
                  </TouchableOpacity>
                  .
                </Trans>
              }
            />
          </KeyStoreSetupForm>
        </Panel>
      </TabLayoutWrapperMainContent>
      <BottomSheet
        id="terms-modal"
        style={{ maxWidth: 800 }}
        closeBottomSheet={closeTermsModal}
        sheetRef={termsModalRef}
      >
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
    </TabLayoutContainer>
  )
}

export default KeyStoreSetupScreen
