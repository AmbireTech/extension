import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import TrophyIcon from '@common/assets/svg/TrophyIcon'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import Background1 from './media/Background1'
import Background2 from './media/Background2'
import Background3 from './media/Background3'

const RewardsAndStats = () => {
  const { t } = useTranslation()
  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter]}>
      <View
        style={{
          ...flexbox.justifyCenter,
          ...flexbox.alignCenter
        }}
      >
        <Background1 width={157} />
        <View style={{ position: 'absolute', ...flexbox.alignCenter, ...flexbox.justifyCenter }}>
          <Text
            fontSize={32}
            weight="semiBold"
            style={{
              color: 'transparent',
              // @ts-ignore
              background: 'linear-gradient(31.59deg, #00D5FF 21.36%, #A25AFF 88.85%)',
              backgroundClip: 'text'
            }}
          >
            617
          </Text>
          <Text fontSize={10} weight="semiBold" color="#E9EBF8">
            Total score
          </Text>
        </View>
      </View>
      <View
        style={{
          ...flexbox.justifyCenter,
          ...flexbox.alignCenter
        }}
      >
        <Background2 width={195} />
        <View style={{ position: 'absolute', ...flexbox.alignCenter, ...flexbox.justifyCenter }}>
          <Text fontSize={10} weight="medium" color="#8D93AC" style={spacings.mb0}>
            $WALLET
          </Text>
          <Text fontSize={20} weight="medium" color="#FFFFFF" style={spacings.mb0}>
            120,845.01
          </Text>
          <Text fontSize={10} weight="semiBold" color="#00D4FF" style={spacings.mbTy}>
            $1,234
          </Text>
          <Text fontSize={10} weight="semiBold" color="#E9EBF8">
            {t('Estimated Rewards')}
          </Text>
        </View>
      </View>
      <View
        style={{
          ...flexbox.justifyCenter,
          ...flexbox.alignCenter
        }}
      >
        <Background3 width={152} />
        <View style={{ position: 'absolute', ...flexbox.alignCenter, ...flexbox.justifyCenter }}>
          <View
            style={{
              height: 24,
              width: 68,
              backgroundColor: '#00000052',
              borderRadius: 50,
              ...flexbox.justifyCenter,
              ...flexbox.alignCenter,
              ...spacings.mbTy
            }}
          >
            <Text weight="medium" color="#B37AFF">
              112
            </Text>
          </View>
          <View
            style={{
              ...flexbox.directionRow,
              ...flexbox.alignCenter
            }}
          >
            <TrophyIcon width={12} height={12} />
            <Text fontSize={10} weight="semiBold" color="#E9EBF8" style={spacings.mlMi}>
              {t('Rank')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default RewardsAndStats
