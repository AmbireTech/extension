import React from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import DeviceItem from '@common/modules/auth/components/DeviceItem'
import spacings from '@common/styles/spacings'

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
