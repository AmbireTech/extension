import React, { forwardRef, useCallback, useImperativeHandle } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

export type DisconnectAllBottomSheetHandle = {
  open: () => void
  close: () => void
}

const DisconnectAllBottomSheet = forwardRef<DisconnectAllBottomSheetHandle>((_, ref) => {
  const { t } = useTranslation()
  const { ref: sheetRef, open, close } = useModalize()
  const { dispatch } = useControllersMiddleware()

  useImperativeHandle(ref, () => ({ open, close }), [open, close])

  const handleDisconnect = useCallback(() => {
    // On web only the injected (in-app browser) channel exists, so we tear that one down.
    // On mobile we omit the source to disconnect every channel (WalletConnect + injected).
    dispatch({
      type: 'DAPPS_CONTROLLER_DISCONNECT_ALL_DAPPS',
      params: { source: isWeb ? 'injected' : undefined }
    })
    close()
  }, [dispatch, close])

  const handleCancel = useCallback(() => close(), [close])

  return (
    <BottomSheet id="disconnect-all" sheetRef={sheetRef} closeBottomSheet={close} type="modal">
      <Text weight="semiBold" fontSize={18} style={spacings.mbSm}>
        {t('Disconnect all apps?')}
      </Text>
      <Text appearance="secondaryText" fontSize={14} style={spacings.mb}>
        {t('This disconnects every connected app. You can reconnect them at any time.')}
      </Text>
      <View
        style={[
          flexbox.directionRow,
          flexbox.justifySpaceBetween,
          spacings.ptLg,
          { columnGap: SPACING_SM }
        ]}
      >
        <Button
          type="secondary"
          text={t('Cancel')}
          onPress={handleCancel}
          hasBottomSpacing={false}
          style={{ flex: 1 }}
        />
        <Button
          type="danger"
          text={t('Disconnect')}
          onPress={handleDisconnect}
          hasBottomSpacing={false}
          style={{ flex: 1 }}
        />
      </View>
    </BottomSheet>
  )
})

DisconnectAllBottomSheet.displayName = 'DisconnectAllBottomSheet'

export default DisconnectAllBottomSheet
