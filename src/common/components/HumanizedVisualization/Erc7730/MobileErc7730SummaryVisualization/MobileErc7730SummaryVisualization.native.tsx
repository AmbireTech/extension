import React, { memo } from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'

import { Props } from './MobileErc7730SummaryVisualization'

const MobileErc7730SummaryVisualization = ({
  item,
  summaryRows,
  spenderRow,
  sizeMultiplierSize,
  textSize,
  renderValue
}: Props) => {
  const { theme } = useTheme()
  const subtitleTextSize = Math.max(textSize - 3, 11)

  return (
    <View style={{ width: '100%', minWidth: 0 }}>
      <View style={[flexbox.directionRow, flexbox.alignStart, { width: '100%', minWidth: 0 }]}>
        {!!item.dapp?.icon && (
          <ManifestImage
            uri={item.dapp.icon}
            containerStyle={spacings.mrTy}
            size={24 * sizeMultiplierSize}
            skeletonAppearance="secondaryBackground"
            imageStyle={{ borderRadius: 12 * sizeMultiplierSize, backgroundColor: 'transparent' }}
          />
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          {!!item.title && (
            <Text fontSize={textSize + 2} weight="semiBold" color={theme.secondaryAccent400}>
              {item.title}
            </Text>
          )}
        </View>
      </View>
      {spenderRow && (
        <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.wrap, spacings.mtMi]}>
          <Text
            fontSize={subtitleTextSize}
            weight="semiBold"
            appearance="secondaryText"
            style={spacings.mrTy}
          >
            {spenderRow.label}
          </Text>
          {spenderRow.value.map((value) => (
            <View key={value.id} style={spacings.mrTy}>
              {renderValue(value, subtitleTextSize)}
            </View>
          ))}
        </View>
      )}
      {summaryRows.map((row) => {
        const shouldShowLabel =
          summaryRows.length > 1 || !row.value.some((value) => value.type === 'token')

        return (
          <View
            key={`${item.id}-mobile-summary-${row.label}-${row.value
              .map((value) => value.id)
              .join('-')}`}
            style={[{ width: '100%', minWidth: 0 }, spacings.mtTy]}
          >
            {shouldShowLabel && (
              <Text
                fontSize={Math.max(textSize - 4, 10)}
                weight="semiBold"
                appearance="secondaryText"
                style={spacings.mbMi}
              >
                {row.label}
              </Text>
            )}
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                flexbox.justifyStart,
                flexbox.wrap
              ]}
            >
              {row.value.map((value) => (
                <View key={value.id} style={spacings.mrTy}>
                  {renderValue(value)}
                </View>
              ))}
            </View>
          </View>
        )
      })}
    </View>
  )
}

export default memo(MobileErc7730SummaryVisualization)
