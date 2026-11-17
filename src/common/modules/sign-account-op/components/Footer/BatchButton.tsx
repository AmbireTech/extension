import React from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import BatchIcon from '@common/assets/svg/BatchIcon'
import Button from '@common/components/Button'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

/** The area of `BatchIcon`'s 24x24 canvas its layers take, strokes included */
const BATCH_ICON_GLYPH_VIEW_BOX = '4.25 3.25 15.5 17.5'

/** Narrower than the default button padding, so Reject and Batch fit next to each other */
export const COMPACT_SECONDARY_BUTTON_PADDING = 10

type Props = {
  /** The number on the icon's badge, e.g. the calls already in the batch. 0 hides the badge */
  badgeCount: number
  /** A signed Safe transaction can only be postponed, there is nothing to batch it with */
  isSignLater?: boolean
  /** Explains batching in a tooltip on an info icon next to the label (web only) */
  infoTooltip?: string
  onPress: () => void
  disabled: boolean
  type?: 'secondary' | 'tertiary'
  size?: 'regular' | 'smaller' | 'large'
  style?: ViewStyle
  testID: string
}

/**
 * The batch button of the sign and one-click footers. The label stays short and the number
 * on the badge of the icon replaces the count in the label, so it fits next to another button
 */
const BatchButton = ({
  badgeCount,
  isSignLater,
  infoTooltip,
  onPress,
  disabled,
  type = 'secondary',
  size = 'regular',
  style,
  testID
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const hasBadge = badgeCount > 0 && !isSignLater

  return (
    <Button
      testID={testID}
      type={type}
      size={size}
      text={isSignLater ? t('Sign later') : t('Batch')}
      accessibilityLabel={
        hasBadge ? t('Add to batch ({{batchCount}})', { batchCount: badgeCount }) : undefined
      }
      onPress={onPress}
      disabled={disabled}
      hasBottomSpacing={false}
      childrenPosition="left"
      style={{ flexGrow: 1, paddingHorizontal: COMPACT_SECONDARY_BUTTON_PADDING, ...style }}
      {...(!!infoTooltip &&
        !isSignLater && {
          tooltipDataSet: createGlobalTooltipDataSet({
            id: 'start-batch-info-tooltip',
            content: infoTooltip
          }),
          tooltipIconStyle: flexbox.alignSelfCenter
        })}
    >
      {!isSignLater && (
        <View
          style={[
            flexbox.alignCenter,
            flexbox.justifyCenter,
            spacings.mrTy,
            { width: 18, height: 18 }
          ]}
        >
          <BatchIcon
            width={15}
            height={15}
            // Crops the icon's padding and fills a square, so the layers read wider and flatter
            viewBox={BATCH_ICON_GLYPH_VIEW_BOX}
            preserveAspectRatio="none"
            color={theme.primary}
          />
          {hasBadge && (
            <View
              style={[
                flexbox.alignCenter,
                flexbox.justifyCenter,
                {
                  position: 'absolute',
                  top: -10,
                  right: -7,
                  minWidth: 16,
                  height: 16,
                  paddingHorizontal: 4,
                  borderRadius: 8,
                  backgroundColor: theme.primary
                }
              ]}
            >
              <Text fontSize={10} weight="semiBold" color={theme.primaryBackground}>
                {badgeCount}
              </Text>
            </View>
          )}
        </View>
      )}
    </Button>
  )
}

export default React.memo(BatchButton)
