import React, { FC, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { ExchangeInfo } from '@ambire-common/libs/portfolio/interfaces'
import OpenIcon from '@common/assets/svg/OpenIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import ManifestImage from '@web/components/ManifestImage'

type Props = {
  handleClose: ReturnType<typeof useModalize>['close']
  sheetRef: any
  exchangesToRender: ExchangeInfo[]
}

const ExchangeItem = ({ name, image, url }: { name: string; image: string; url: string }) => {
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
        <ManifestImage isRound size={20} uri={image} />
        <Text fontSize={14} appearance="secondaryText" weight="medium" style={spacings.mlTy}>
          {name}
        </Text>
      </View>
      <OpenIcon width={24} height={24} />
    </AnimatedPressable>
  )
}

const ExchangesBottomSheet: FC<Props> = ({ handleClose, exchangesToRender, sheetRef }) => {
  const { t } = useTranslation()

  return (
    <BottomSheet
      sheetRef={sheetRef}
      closeBottomSheet={handleClose}
      id="exchanges-bottom-sheet"
      containerInnerWrapperStyles={flexbox.flex1}
      HeaderComponent={<ModalHeader handleClose={handleClose} title={t('Supported exchanges')} />}
      flatListProps={{
        data: exchangesToRender,
        renderItem: ({ item }) => <ExchangeItem {...item} />,
        keyExtractor: (item) => item.name,
        showsVerticalScrollIndicator: false
      }}
    />
  )
}

export default ExchangesBottomSheet
