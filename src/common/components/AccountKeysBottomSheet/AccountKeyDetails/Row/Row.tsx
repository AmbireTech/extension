import React, { FC } from 'react'
import { View } from 'react-native'

import InformationIcon from '@common/assets/svg/InformationIcon'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import styles from './styles'

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
              style={styles.icon}
              dataSet={createGlobalTooltipDataSet({
                id: `tooltip-for-${rowKey}`,
                content: tooltip
              })}
            />
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
