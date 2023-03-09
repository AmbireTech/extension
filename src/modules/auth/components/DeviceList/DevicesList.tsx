import React from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import { useTranslation } from '@config/localization'
import DeviceItem from '@modules/auth/components/DeviceItem'

const DevicesList = ({ onSelectDevice, devices, refreshing }: any) => {
  const { t } = useTranslation()

  return (
    <View>
      {!!devices.length &&
        devices.map((device: any) => (
          <DeviceItem key={device.id} device={device} onSelect={onSelectDevice} />
        ))}
      {!devices.length && !refreshing && (
        <View style={[spacings.mtMd]}>
          <Text fontSize={14} style={spacings.mbSm}>
            {t('No devices found')}
          </Text>
        </View>
      )}
    </View>
  )
}

export default DevicesList
