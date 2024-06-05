import React, { FC } from 'react'
import { View } from 'react-native'

import InformationIcon from '@common/assets/svg/InformationIcon'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  rowKey: string
  value: string
  tooltip?: string
  suffix?: string
}

const Row: FC<Props> = ({ rowKey, value, tooltip, suffix }) => {
  const { theme } = useTheme()
  return (
    <View style={[flexbox.directionRow, flexbox.justifySpaceBetween, spacings.mbMi]}>
      <Text fontSize={14}>{rowKey}: </Text>
      <Text
        fontSize={14}
        selectable
        weight="semiBold"
        style={{
          // @ts-ignore missing in the types, but React Native Web supports it
          wordBreak: 'break-all',
          textAlign: 'right'
        }}
      >
        {value}
        {tooltip && (
          <>
            {' '}
            <InformationIcon
              color={theme.infoDecorative}
              width={14}
              height={14}
              dataSet={{ tooltipId: `tooltip-for-${rowKey}`, tooltipContent: tooltip }}
            />
            <Tooltip id={`tooltip-for-${rowKey}`} />
          </>
        )}
        {suffix && (
          <Text selectable fontSize={14} color={theme.infoDecorative} weight="semiBold">
            {suffix}
          </Text>
        )}
      </Text>
    </View>
  )
}

export default Row
