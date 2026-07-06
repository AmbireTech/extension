import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'

import TrezorBadgeIcon from '@common/assets/svg/TrezorBadgeIcon'
import Banner from '@common/components/Banner'
import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { isiOS } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

// Unlike Ledger, Trezor has no in-app device connection on mobile: the only
// supported path is deep-linking into the Trezor Suite Lite app, which owns the
// USB/Bluetooth connection and the on-device confirmation. So this screen has no
// device discovery — it just kicks off account retrieval (which deep-links to
// Suite) and advances to account selection once the picker is ready.
const TrezorConnectScreen = () => {
  const { t } = useTranslation()
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { dispatch } = useControllersMiddleware()
  const mainCtrlState = useController('MainController').state
  const { initParams, type } = useController('AccountPickerController').state

  // Set when the user explicitly starts the import on this screen. The deep-link
  // to Suite must only happen on that action, never on mount — otherwise every
  // entry (including navigating back from the account picker) would instantly
  // redirect to Suite and trap the user.
  const [importStarted, setImportStarted] = useState(false)

  // Guards against navigating twice if the picker-ready effect re-fires before
  // this screen unmounts.
  const hasNavigatedRef = useRef(false)

  const startImport = useCallback(() => {
    // Retrieving the accounts triggers a getPublicKey call that deep-links into
    // Trezor Suite Lite; the user approves there and Suite returns the result.
    setImportStarted(true)
    dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_TREZOR' })
  }, [dispatch])

  // Advance to account selection only after the user started the import HERE and
  // the picker became ready. Gating on `importStarted` prevents auto-forwarding
  // when the user navigates back and `initParams` is still set from before.
  useEffect(() => {
    if (importStarted && initParams && type === 'trezor' && !hasNavigatedRef.current) {
      hasNavigatedRef.current = true
      goToNextRoute()
    }
  }, [importStarted, initParams, type, goToNextRoute])

  const isLoading = mainCtrlState.statuses.handleAccountPickerInitTrezor === 'LOADING'

  const footer = isLoading ? undefined : (
    <View>
      <Button text={t('Open Trezor Suite')} onPress={startImport} hasBottomSpacing={false} />
    </View>
  )

  return (
    <MobileLayoutContainer footer={footer}>
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={goToPrevRoute}
        title={t('Connect Trezor')}
        withScroll
      >
        <TrezorBadgeIcon style={{ alignSelf: 'center', marginBottom: 32 }} width={96} height={96} />

        <Text weight="medium" style={spacings.mbSm} fontSize={14}>
          {t('1. Make sure the Trezor Suite Lite app is installed on this phone.')}
        </Text>
        <Text weight="medium" style={spacings.mbSm} fontSize={14}>
          {t('2. Connect your Trezor to the phone and unlock it.')}
        </Text>
        <Text weight="medium" style={spacings.mbXl} fontSize={14}>
          {t('3. Approve the request in Trezor Suite, then return to Ambire.')}
        </Text>

        {isiOS && (
          <Banner
            type="info"
            style={spacings.mbLg}
            title={t('Trezor on iPhone')}
            text={t(
              'On iOS, only the Trezor Safe 7 (which supports Bluetooth) can sign. Other Trezor models are not supported on iPhone — please use Android or the desktop app.'
            )}
          />
        )}

        {isLoading && (
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Spinner style={{ width: 18, height: 18 }} />
            <Text style={spacings.mlSm} fontSize={14} appearance="secondaryText">
              {t('Opening Trezor Suite…')}
            </Text>
          </View>
        )}
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(TrezorConnectScreen)
