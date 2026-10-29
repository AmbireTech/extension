import React, { useCallback } from 'react'
import { View } from 'react-native'

import TrezorBadgeIcon from '@common/assets/svg/TrezorBadgeIcon'
import Banner from '@common/components/Banner'
import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { isiOS } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import useAccountPickerHardwareInit from '@common/modules/hardware-wallets/hooks/useAccountPickerHardwareInit'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

// Trezor has no in-app device connection on mobile: the only
// supported path is deep-linking into the Trezor Suite app, which owns the
// USB/Bluetooth connection and the on-device confirmation. So this screen has no
// device discovery — it just kicks off account retrieval (which deep-links to
// Suite) and advances to account selection once the picker is ready.
const TrezorConnectScreen = () => {
  const { t } = useTranslation()
  const { goToPrevRoute } = useOnboardingNavigation()
  const initAccountPicker = useAccountPickerHardwareInit()
  const mainCtrlState = useController('MainController').state

  // The deep-link to Suite happens only on this explicit action, never on mount -
  // otherwise every entry (including a back from the account picker) would instantly
  // redirect to Suite and trap the user.
  const startImport = useCallback(async () => {
    try {
      // Retrieving the accounts triggers an ethereumGetPublicKey call that deep-links into
      // Trezor Suite app; the user approves there and Suite returns the result.
      await initAccountPicker({ type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_TREZOR' })
    } catch (error) {
      // The controller reports its own failures, here the button only becomes usable again
      console.error('Failed to set the account picker up for Trezor', error)
    }
  }, [initAccountPicker])

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
          {t('1. Make sure the Trezor Suite app is installed on this device.')}
        </Text>
        <Text weight="medium" style={spacings.mbSm} fontSize={14}>
          {t('2. Connect your Trezor to the device and unlock it.')}
        </Text>
        <Text weight="medium" style={spacings.mbXl} fontSize={14}>
          {t('3. Approve the request in Trezor Suite, then return to Ambire.')}
        </Text>

        {isiOS && (
          <Banner
            type="info"
            style={spacings.mbLg}
            title={t('On iOS, only Trezor devices with Bluetooth are supported.')}
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
