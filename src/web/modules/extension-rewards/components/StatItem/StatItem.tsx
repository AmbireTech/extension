import React from 'react'
import { View } from 'react-native'

import InfoIcon from '@common/assets/svg/InfoIcon'
import { Icon, Stat } from '@common/components/RewardsStat'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = Stat & {
  isLast?: boolean
}

const StatItem = ({ id, score, label, explanation, value, isLast }: Props) => {
  return (
    <View
      style={{
        ...flexbox.directionRow,
        ...flexbox.alignCenter,
        borderBottomColor: '#6A6F8633',
        borderBottomWidth: isLast ? 0 : 2,
        paddingVertical: 6
      }}
    >
      <View style={{ flex: 0.2 }}>
        <View
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 56,
            width: 'fit-content',
            height: 32,
            backgroundColor: '#101114',
            borderRadius: 20,
            ...spacings.phSm
          }}
        >
          <Text
            weight="semiBold"
            style={{
              fontSize: 16,
              color: 'transparent',
              // @ts-ignore
              background: 'linear-gradient(27.42deg, #00d5ff 19.16%, #a25aff 74.07%)',
              backgroundClip: 'text'
            }}
          >
            {score}
          </Text>
        </View>
      </View>
      <View style={{ flex: 0.6, ...flexbox.directionRow, ...flexbox.alignCenter }}>
        <Icon id={id} />
        <Text color="#fff" fontSize={13} weight="medium" style={{ ...spacings.mhTy }}>
          {label}
        </Text>
        <InfoIcon color="#54597A" data-tooltip-id={`tooltip-${id}`} width={14} height={14} />
        <Tooltip
          id={`tooltip-${id}`}
          content={explanation}
          style={{
            whiteSpace: 'pre-wrap'
          }}
        />
      </View>
      <Text
        color="#fff"
        style={{
          textAlign: 'right',
          flex: 0.2,
          alignItems: 'flex-end'
        }}
        fontSize={13}
      >
        {value}
      </Text>
    </View>
  )
}

export default StatItem
