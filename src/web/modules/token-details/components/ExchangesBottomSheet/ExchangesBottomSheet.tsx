import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import OpenIcon from '@common/assets/svg/OpenIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import ManifestImage from '@web/components/ManifestImage'

type Props = Omit<ReturnType<typeof useModalize>, 'ref'> & {
  sheetRef: any
  exchanges: string[]
}

const ExchangeItem = ({ name, icon, url }: { name: string; icon: string; url: string }) => {
  const { theme } = useTheme()
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.secondaryBackground,
      to: theme.tertiaryBackground
    }
  })

  return (
    <AnimatedPressable
      {...bindAnim}
      style={[
        animStyle,
        {
          height: 56,
          ...flexbox.directionRow,
          ...flexbox.alignCenter,
          ...flexbox.justifySpaceBetween,
          ...spacings.phSm,
          ...spacings.mbTy,
          borderRadius: BORDER_RADIUS_PRIMARY
        }
      ]}
      onPress={() => openInTab({ url })}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <ManifestImage isRound size={20} uri={icon} />
        <Text fontSize={14} appearance="secondaryText" weight="medium" style={spacings.mlTy}>
          {name}
        </Text>
      </View>
      <OpenIcon width={24} height={24} />
    </AnimatedPressable>
  )
}

const ExchangesBottomSheet: FC<Props> = ({ open, close, exchanges, sheetRef }) => {
  const { t } = useTranslation()
  const { state: exchangeData } = useController(
    'PortfolioController',
    (state) => state.exchangeState.exchanges
  )

  const exchangesToRender = useMemo(
    () =>
      exchanges
        .map((exchange) => {
          const exchangeInfo = exchangeData ? exchangeData[exchange] : null

          if (!exchangeInfo) return null

          return {
            name: exchangeInfo.name,
            icon: exchangeInfo.image,
            url: exchangeInfo.url
          }
        })
        .filter(
          (exchange): exchange is { name: string; icon: string; url: string } => exchange !== null
        ),
    [exchangeData, exchanges]
  )

  return (
    <BottomSheet
      sheetRef={sheetRef}
      closeBottomSheet={close}
      id="exchanges-bottom-sheet"
      isScrollEnabled={false}
      // style={flexbox.flex1}
      containerInnerWrapperStyles={flexbox.flex1}
    >
      <ModalHeader handleClose={close} title={t('Supported exchanges')} />
      <ScrollableWrapper
        type={WRAPPER_TYPES.FLAT_LIST}
        data={exchangesToRender}
        style={flexbox.flex1}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => <ExchangeItem {...item} />}
        showsVerticalScrollIndicator={false}
      />
    </BottomSheet>
  )
}

export default ExchangesBottomSheet
