import React from 'react'
import { View } from 'react-native'

import HumidityIcon from '@common/assets/svg/HumidityIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import LockIcon2 from '@common/assets/svg/LockIcon2'
import SwapIcon from '@common/assets/svg/SwapIcon/SwapIcon'
import WalletIcon2 from '@common/assets/svg/WalletIcon2'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

export type Stat = {
  id: 'balance' | 'liquidity' | 'staked' | 'swap-volume' // TODO: Add all
  score: number
  label: string
  explanation: string
  value: string
}

type Props = Stat & {
  isLast?: boolean
}

const Icon = ({ id }: { id: Stat['id'] }) => {
  switch (id) {
    case 'balance':
      return <WalletIcon2 />
    case 'liquidity':
      return <HumidityIcon />
    case 'staked':
      return <LockIcon2 />
    case 'swap-volume':
      return <SwapIcon />
    default:
      return null
  }
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
            width: 56,
            height: 32,
            backgroundColor: '#101114',
            borderRadius: 20
          }}
        >
          <Text
            style={{
              fontWeight: '600',
              fontSize: 16,
              letterSpacing: 0,
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
        <InfoIcon data-tooltip-id={`tooltip-${id}`} width={14} height={14} />
        <Tooltip id={`tooltip-${id}`} content={explanation} />
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
