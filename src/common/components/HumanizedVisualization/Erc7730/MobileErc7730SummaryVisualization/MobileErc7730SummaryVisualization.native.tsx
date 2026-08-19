import React, { memo, useCallback, useMemo } from 'react'
import { Image, View } from 'react-native'
import { SvgUri } from 'react-native-svg'

import { shouldShowErc7730SummaryRowLabel } from '@common/components/HumanizedVisualization/Erc7730/helpers'
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
          <View key={value.id} style={[{ minWidth: 0, flexShrink: 1 }, index > 0 && spacings.mlTy]}>
            {renderValue(value, overrideTextSize)}
          </View>
        ))}
      </View>
    ),
    [renderValue]
  )
  // Same reasoning as the desktop Erc7730StructuredVisualization: prefer the
  // structured `titleParts` (rendered via the shared `renderValue`, so a
  // `type: 'token'` part gets a live decimals/symbol lookup) over the plain
  // `title` string, which is only a best-effort fallback for tokens that
  // aren't statically known.
  const renderTitleParts = useCallback(
    (overrideTextSize?: number) =>
      item.titleParts?.length ? (
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            flexbox.wrap,
            { minWidth: 0, flexShrink: 1 }
          ]}
        >
          {item.titleParts.map((part) => renderValue(part, overrideTextSize))}
        </View>
      ) : null,
    [item.titleParts, renderValue]
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
            {item.titleParts?.length
              ? renderTitleParts(textSize + 2)
              : !!item.title && (
                  <Text fontSize={textSize + 2} color={theme.secondaryAccent400}>
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
          <View style={[flexbox.directionRow, flexbox.alignCenter, { flexShrink: 0 }]}>
            <Text
              fontSize={subtitleTextSize}
              appearance="secondaryText"
              numberOfLines={1}
              style={[spacings.mrTy, { flexShrink: 0 }]}
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
          {shouldShowErc7730SummaryRowLabel(item, row) && (
            <Text
              fontSize={Math.max(textSize - 4, 10)}
              appearance="secondaryText"
              numberOfLines={1}
              style={[spacings.mrTy, { flexShrink: 0 }]}
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
