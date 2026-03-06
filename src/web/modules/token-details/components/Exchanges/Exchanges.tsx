import React, { FC, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import ExchangesBottomSheet from '../ExchangesBottomSheet'

type Props = {
  exchanges: string[]
}

const Exchanges: FC<Props> = ({ exchanges }) => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { state: exchangeData } = useController(
    'PortfolioController',
    (state) => state.exchangeState.exchanges
  )
  const { ref: sheetRef, open, close } = useModalize()
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.secondaryBackground,
      to: theme.tertiaryBackground
    }
  })

  const exchangesWithData = useMemo(() => {
    return exchanges
      .slice(0, 3)
      .map((exchange) => {
        const exchangeInfo = exchangeData ? exchangeData[exchange] : null

        if (!exchangeInfo) return null

        return {
          name: exchangeInfo.name,
          icon: exchangeInfo.image
        }
      })
      .filter((exchange): exchange is { name: string; icon: string } => exchange !== null)
  }, [exchangeData, exchanges])

  if (exchanges.length === 0) return null

  return (
    <>
      <AnimatedPressable
        {...bindAnim}
        style={[
          {
            ...flexbox.directionRow,
            ...flexbox.alignCenter,
            ...flexbox.justifySpaceBetween,
            ...spacings.phSm,
            height: 56,
            borderRadius: BORDER_RADIUS_PRIMARY
          },
          animStyle
        ]}
        onPress={() => open()}
      >
        <Text fontSize={14} weight="medium" appearance="secondaryText">
          {t('Supported exchanges')}
        </Text>
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          {exchangesWithData.map((exchange) => (
            <View
              key={exchange.name}
              style={{
                ...spacings.mrTy,
                borderRadius: 20,
                width: 20,
                height: 20,
                ...flexbox.center,
                backgroundColor: theme.neutral200
              }}
            >
              <Image
                source={{ uri: exchange.icon }}
                style={{ width: 16, height: 16, borderRadius: 8 }}
              />
            </View>
          ))}
          <RightArrowIcon />
        </View>
      </AnimatedPressable>
      <ExchangesBottomSheet open={open} close={close} exchanges={exchanges} sheetRef={sheetRef} />
    </>
  )
}

export default memo(Exchanges)
