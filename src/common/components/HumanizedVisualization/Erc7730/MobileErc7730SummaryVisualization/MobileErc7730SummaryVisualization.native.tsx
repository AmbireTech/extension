import React, { memo, useCallback, useMemo } from 'react'
import { Image, View } from 'react-native'
import { SvgUri } from 'react-native-svg'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import { Props } from './MobileErc7730SummaryVisualization'

const MobileErc7730SummaryVisualization = ({
  item,
  summaryRows,
  spenderRow,
  sizeMultiplierSize,
  textSize,
  renderValue,
  hideTitle
}: Props) => {
  const { theme } = useTheme()
  const subtitleTextSize = Math.max(textSize - 3, 11)
  const dappIconUri = item.dapp?.icon
  const dappIconSize = 24 * sizeMultiplierSize
  const dappIconStyle = useMemo(
    () => ({
      width: dappIconSize,
      height: dappIconSize,
      borderRadius: dappIconSize / 2
    }),
    [dappIconSize]
  )
  const dappIconSource = useMemo(() => ({ uri: dappIconUri || '' }), [dappIconUri])
  const isDappIconSvg = useMemo(() => {
    const icon = dappIconUri?.toLowerCase()

    return icon?.endsWith('.svg') || icon?.includes('.svg?')
  }, [dappIconUri])
  const renderValues = useCallback(
    (values: Props['summaryRows'][number]['value'], overrideTextSize?: number) => (
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifyEnd,
          flexbox.wrap,
          { minWidth: 0, flexShrink: 1 }
        ]}
      >
        {values.map((value, index) => (
          <View key={value.id} style={index > 0 && spacings.mlTy}>
            {renderValue(value, overrideTextSize)}
          </View>
        ))}
      </View>
    ),
    [renderValue]
  )

  return (
    <View style={{ width: '100%', minWidth: 0 }}>
      {!hideTitle && (
        <View style={[flexbox.directionRow, flexbox.alignStart, { width: '100%', minWidth: 0 }]}>
          {!!dappIconUri && (
            <View style={[spacings.mrTy, dappIconStyle, common.hidden]}>
              {isDappIconSvg ? (
                <SvgUri uri={dappIconUri} width={dappIconSize} height={dappIconSize} />
              ) : (
                <Image source={dappIconSource} style={dappIconStyle} resizeMode="contain" />
              )}
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            {!!item.title && (
              <Text fontSize={textSize + 2} weight="semiBold" color={theme.secondaryAccent400}>
                {item.title}
              </Text>
            )}
          </View>
        </View>
      )}
      {spenderRow && (
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.justifySpaceBetween,
            spacings.mtMi,
            { width: '100%', minWidth: 0 }
          ]}
        >
          <View style={[flexbox.directionRow, flexbox.alignCenter, { minWidth: 0, flexShrink: 1 }]}>
            <Text
              fontSize={subtitleTextSize}
              weight="semiBold"
              appearance="secondaryText"
              style={spacings.mrTy}
            >
              {spenderRow.label}
            </Text>
          </View>
          {renderValues(spenderRow.value, subtitleTextSize)}
        </View>
      )}
      {summaryRows.map((row) => (
        <View
          key={`${item.id}-mobile-summary-${row.label}-${row.value
            .map((value) => value.id)
            .join('-')}`}
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.justifySpaceBetween,
            { width: '100%', minWidth: 0 },
            spacings.mtTy
          ]}
        >
          {!!row.label.trim() && (
            <Text
              fontSize={Math.max(textSize - 4, 10)}
              weight="semiBold"
              appearance="secondaryText"
              style={spacings.mrTy}
            >
              {row.label}
            </Text>
          )}
          {renderValues(row.value)}
        </View>
      ))}
    </View>
  )
}

export default memo(MobileErc7730SummaryVisualization)
