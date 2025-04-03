import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, TouchableOpacity, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import AmbireLogo from '@common/assets/svg/AmbireLogo'
import BottomSheet from '@common/components/BottomSheet'
import Checkbox from '@common/components/Checkbox'
import DualChoiceModal from '@common/components/DualChoiceModal'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { Trans, useTranslation } from '@common/config/localization'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import Header from '@common/modules/header/components/Header'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import KeyStoreSetupForm from '@web/modules/keystore/components/KeyStoreSetupForm'
import TermsComponent from '@web/modules/terms/components'

const KeyStoreSetupScreen = () => {
  const { params } = useRoute()
  const hideBack = useMemo(() => params?.state?.hideBack || [], [params])
  const { t } = useTranslation()

  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()
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
    <TabLayoutContainer
      backgroundColor={theme.secondaryBackground}
      header={<Header withAmbireLogo />}
    >
      <TabLayoutWrapperMainContent>
        <Panel
          title={t('Set a Device Password')}
          spacingsSize="small"
          withBackButton={!hideBack}
          onBackButtonPress={goToPrevRoute}
          style={[spacings.ph0, spacings.pv0]}
          step={2}
          totalSteps={2}
        >
          <View style={[spacings.phLg, spacings.pvLg, spacings.pt]}>
            <Text style={[spacings.mbXl, spacings.phSm, { textAlign: 'center' }]}>
              {t('Used to access your wallet and encrypt your data.')}
            </Text>
            <KeyStoreSetupForm onContinue={() => goToNextRoute()}>
              <Checkbox
                value={agreedWithTerms}
                onValueChange={setAgreedWithTerms}
                uncheckedBorderColor={theme.primaryText}
                style={[spacings.mlSm, spacings.pt2Xl]}
                label={
                  <Trans>
                    <Text fontSize={14}>I agree to the </Text>
                    <TouchableOpacity onPress={() => openTermsModal()}>
                      <Text fontSize={14} underline color={theme.infoDecorative}>
                        Terms of Service
                      </Text>
                    </TouchableOpacity>
                    .
                  </Trans>
                }
              />
            </KeyStoreSetupForm>
          </View>
        </Panel>
      </TabLayoutWrapperMainContent>
      <BottomSheet
        id="terms-modal"
        style={{ maxWidth: 800 }}
        closeBottomSheet={closeTermsModal}
        backgroundColor="primaryBackground"
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
        />
      </BottomSheet>
    </TabLayoutContainer>
  )
}

export default KeyStoreSetupScreen
