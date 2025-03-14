import React, { useCallback, useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import CreateWalletIcon from '@common/assets/svg/CreateWalletIcon'
import HWIcon from '@common/assets/svg/HWIcon'
import ViewOnlyIcon from '@common/assets/svg/ViewOnlyIcon'
import Banner, { BannerButton } from '@common/components/Banner'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Panel from '@common/components/Panel'
import getPanelStyles from '@common/components/Panel/styles'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useWindowSize from '@common/hooks/useWindowSize'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import Header from '@common/modules/header/components/Header'
import { ROUTES, WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  TabLayoutContainer,
  TabLayoutWrapperMainContent
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { storage } from '@web/extension-services/background/webapi/storage'
import { openInTab } from '@web/extension-services/background/webapi/tab'
import useAccountAdderControllerState from '@web/hooks/useAccountAdderControllerState'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useWalletStateController from '@web/hooks/useWalletStateController'
import Card from '@web/modules/auth/components/Card'
import Stories from '@web/modules/auth/components/Stories'
import { STORY_CARD_WIDTH } from '@web/modules/auth/components/Stories/styles'
import { TERMS_VERSION } from '@web/modules/terms/screens/Terms'
import { getExtensionInstanceId } from '@web/utils/analytics'

import HotWalletCreateCards from '../../components/HotWalletCreateCards'
import { ONBOARDING_VERSION } from '../../components/Stories/Stories'
import { showEmailVaultInterest } from '../../utils/emailVault'
import getStyles from './styles'

const GetStartedScreen = () => {
  const { theme } = useTheme(getStyles)
  const { styles: panelStyles } = useTheme(getPanelStyles)
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { addToast } = useToast()
  const { isReadyToStoreKeys, keyStoreUid } = useKeystoreControllerState()
  const { accounts } = useAccountsControllerState()
  const accountAdderCtrlState = useAccountAdderControllerState()
  const {
    ref: hotWalletModalRef,
    open: openHotWalletModal,
    close: closeHotWalletModal
  } = useModalize()
  const wrapperRef: any = useRef(null)
  const animation = useRef(new Animated.Value(0)).current
  const { width } = useWindowSize()
  const { authStatus } = useAuth()
  const { dispatch } = useBackgroundService()

  const state = useWalletStateController()

  const resetIsSetupCompleteIfNeeded = useCallback(() => {
    if (authStatus === AUTH_STATUS.NOT_AUTHENTICATED && !state.isPinned && state.isSetupComplete) {
      dispatch({ type: 'SET_IS_SETUP_COMPLETE', params: { isSetupComplete: false } })
    }
  }, [authStatus, dispatch, state.isPinned, state.isSetupComplete])

  useEffect(() => {
    if (authStatus === AUTH_STATUS.AUTHENTICATED) {
      navigate(ROUTES.dashboard)
      return
    }

    resetIsSetupCompleteIfNeeded()
  }, [authStatus, navigate, resetIsSetupCompleteIfNeeded])

  useEffect(() => {
    if (state.onboardingState) {
      Animated.timing(animation, {
        toValue: 1,
        duration: 480,
        useNativeDriver: false
      }).start()
    }
  }, [animation, state.onboardingState])

  // here's the bug for the code below:
  // 1. Go through get started and create a seed
  // 2. Close account adder without adding any new accounts
  // 3. If you open get started, you have loads of options - you should not
  // as you've already created a seed and have to finish that
  useEffect(() => {
    if (
      accountAdderCtrlState.isInitialized &&
      accountAdderCtrlState.type === 'internal' &&
      accountAdderCtrlState.subType === 'seed'
    ) {
      navigate(WEB_ROUTES.accountAdder, { state: { hideBack: true } })
    }
  }, [
    accountAdderCtrlState.isInitialized,
    accountAdderCtrlState.subType,
    accountAdderCtrlState.type,
    navigate
  ])

  const handleAuthButtonPress = useCallback(
    async (
      flow: 'email' | 'hw' | 'import-hot-wallet' | 'create-seed' | 'create-hot-wallet' | 'view-only'
    ) => {
      if (flow === 'create-hot-wallet') {
        openHotWalletModal()
        return
      }
      if (flow === 'view-only') {
        navigate(WEB_ROUTES.viewOnlyAccountAdder)
        return
      }
      if (flow === 'import-hot-wallet') {
        navigate(WEB_ROUTES.importHotWallet)
        return
      }
      if (flow === 'email') {
        await showEmailVaultInterest(getExtensionInstanceId(keyStoreUid), accounts.length, addToast)
        return
      }
      if (!isReadyToStoreKeys && flow !== 'hw') {
        navigate(WEB_ROUTES.keyStoreSetup, { state: { flow } })
        return
      }
      if (flow === 'hw') {
        navigate(WEB_ROUTES.hardwareWalletSelect)
        return
      }
      if (flow === 'create-seed') {
        navigate(WEB_ROUTES.createSeedPhrasePrepare)
      }
    },
    [isReadyToStoreKeys, openHotWalletModal, navigate, keyStoreUid, accounts.length, addToast]
  )

  const handleSetStoriesCompleted = () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    storage
      .set('termsState', {
        version: TERMS_VERSION,
        acceptedAt: Date.now()
      })
      .then(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        dispatch({
          type: 'SET_ONBOARDING_STATE',
          params: { version: ONBOARDING_VERSION, viewedAt: Date.now() }
        })
      })
  }

  const panelWidthInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [`${Math.min((STORY_CARD_WIDTH / (width || 0)) * 100, 100)}%`, '100%'],
    extrapolate: 'clamp'
  })

  const opacityInterpolate = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.3, 1],
    extrapolate: 'clamp'
  })

  return (
    <TabLayoutContainer
      width="lg"
      backgroundColor={theme.secondaryBackground}
      header={
        <Animated.View style={{ opacity: opacityInterpolate }}>
          <Header withAmbireLogo />
        </Animated.View>
      }
    >
      <BottomSheet
        id="hot-wallet-modal"
        autoWidth
        closeBottomSheet={closeHotWalletModal}
        backgroundColor="primaryBackground"
        sheetRef={hotWalletModalRef}
      >
        <ModalHeader
          hideLeftSideContainer
          title={t('Select the recovery option of your new wallet')}
        />
        <HotWalletCreateCards
          handleEmailPress={() => handleAuthButtonPress('email')}
          handleSeedPress={() => handleAuthButtonPress('create-seed')}
        />
      </BottomSheet>
      <TabLayoutWrapperMainContent wrapperRef={wrapperRef} contentContainerStyle={spacings.mbLg}>
        {!state.onboardingState && <Stories onComplete={handleSetStoriesCompleted} />}
        {!!state.onboardingState && (
          <View>
            <Animated.View
              style={[
                panelStyles.container,
                {
                  zIndex: -1,
                  position: 'absolute',
                  alignSelf: 'center',
                  height: '100%',
                  width: panelWidthInterpolate
                }
              ]}
            />
            <Panel
              isAnimated
              title={t('Select an option')}
              style={{
                backgroundColor: 'transparent',
                opacity: opacityInterpolate as any,
                borderWidth: 0
              }}
            >
              <View style={[flexbox.directionRow]}>
                <Card
                  testID="get-started-button-import"
                  title={t('Create or import\nan existing wallet')}
                  style={[flexbox.flex1, spacings.mh, spacings.ml0]}
                  text={t(
                    'Import your account(s) securely with a seed phrase or private key, or create account(s) from a newly-created seed phrase.'
                  )}
                  icon={CreateWalletIcon}
                  iconProps={{
                    width: 60,
                    height: 60,
                    strokeWidth: 1.1
                  }}
                  buttonText={t('Create')}
                  onPress={() => handleAuthButtonPress('import-hot-wallet')}
                />
                <Card
                  testID="get-started-button-connect-hw-wallet"
                  title={t('Connect a\nhardware wallet')}
                  text={t(
                    'Import your account(s) secured by hardware wallets like Trezor, Ledger, or Grid+.'
                  )}
                  style={{ ...flexbox.flex1, ...spacings.mr }}
                  icon={HWIcon}
                  iconProps={{
                    width: 60,
                    height: 60,
                    strokeWidth: 1.25
                  }}
                  buttonText={t('Connect')}
                  onPress={() => handleAuthButtonPress('hw')}
                />
                <Card
                  testID="get-started-button-add"
                  title={t('Watch an\naddress')}
                  text={t(
                    'Add an address in view-only mode to see its balance and simulate transactions.'
                  )}
                  icon={ViewOnlyIcon}
                  style={flexbox.flex1}
                  onPress={() => handleAuthButtonPress('view-only')}
                  buttonText={t('Add')}
                  isSecondary
                />
              </View>
              <View
                style={[flexbox.directionRow, { margin: 'auto', width: '100%' }, spacings.mtXl]}
              >
                <Banner
                  title="Ambire v1 accounts"
                  text={t(
                    'If you are looking to import accounts from the web app (Ambire v1), please read this.'
                  )}
                  type="info"
                  // @ts-ignore
                  style={[spacings.mb0, { width: '100%' }]}
                  renderButtons={
                    <BannerButton
                      onPress={() =>
                        openInTab(
                          'https://help.ambire.com/hc/en-us/articles/15468208978332-How-to-add-your-v1-account-to-Ambire-Wallet-extension',
                          false
                        )
                      }
                      text={t('Read more')}
                      type="secondary"
                    />
                  }
                />
              </View>
            </Panel>
          </View>
        )}
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(GetStartedScreen)
