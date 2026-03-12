import React, { useEffect, useState } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'

import QrScanner from './QrScanner'

const QrConnectScreen = () => {
  const { t } = useTranslation()
  const { dispatch } = useControllersMiddleware()
  const { addToast } = useToast()
  const { goToNextRoute, goToPrevRoute } = useOnboardingNavigation()
  const { initParams, type } = useController('AccountPickerController').state
  const mainCtrlState = useController('MainController').state
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onQrComplete = async (payload: string | Uint8Array) => {
    try {
      setIsSubmitting(true)

      dispatch({
        type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_QR_WALLET',
        params: { payload }
      })
    } catch (error: any) {
      addToast(error?.message || t('Failed to import QR wallet.'), { type: 'error' })
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (initParams && type === 'qr') {
      goToNextRoute()
    }
  }, [initParams, type, goToNextRoute])

  useEffect(() => {
    if (mainCtrlState.statuses.handleAccountPickerInitQr === 'ERROR') {
      setIsSubmitting(false)
    }
  }, [mainCtrlState.statuses.handleAccountPickerInitQr])

  return (
    <Panel
      type="onboarding"
      withBackButton
      onBackButtonPress={goToPrevRoute}
      title={t('Connect QR Wallet')}
    >
      <Text>{t('Scan the QR code exported by your hardware wallet.')}</Text>
      <View style={{ marginTop: 16 }}>
        <QrScanner onComplete={onQrComplete} disabled={isSubmitting} />
      </View>
    </Panel>
  )
}

export default React.memo(QrConnectScreen)
