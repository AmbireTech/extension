import React, { ReactNode } from 'react'
import { ColorValue, View, ViewStyle } from 'react-native'

import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import { RenderSelectedOptionParams } from '@common/components/Select/types'
import Text from '@common/components/Text'
import spacings, { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

/** Height of the fee row - the selects and the advanced settings button share it */
const FEE_ROW_HEIGHT = 52
/** Gap between an icon and its text, shared with the fee payer strip so their icons line up */
export const FEE_ICON_GAP = 10

type Props = Pick<RenderSelectedOptionParams, 'toggleMenu' | 'isMenuOpen' | 'selectRef'> & {
  label: string
  /** Sits next to the arrow, e.g. a warning icon with a tooltip */
  labelAccessory?: ReactNode
  value: ReactNode
  icon?: ReactNode
  backgroundColor: ColorValue
  disabled?: boolean
  /** Squares the bottom corners so a strip can be attached below the select */
  isAttachedBelow?: boolean
  style?: ViewStyle
  testID?: string
}

/**
 * The trigger of the fee selects: a small label with the arrow on the first line and the
 * selected value on the second. Keeping the arrow on the label line lets the value use
 * the full width, so long amounts and token names fit
 */
const FeeSelectTrigger = ({
  label,
  labelAccessory,
  value,
  icon,
  backgroundColor,
  disabled,
  isAttachedBelow,
  style,
  toggleMenu,
  isMenuOpen,
  selectRef,
  testID
}: Props) => (
  // The menu takes its width and position from this ref, so it must wrap the whole box
  <View ref={selectRef}>
    <HoverablePressable
      onPress={toggleMenu}
      disabled={disabled}
      testID={testID}
      style={[
        {
          height: FEE_ROW_HEIGHT,
          backgroundColor,
          borderRadius: BORDER_RADIUS_PRIMARY,
          ...spacings.phSm
        },
        isAttachedBelow && { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
        disabled && { opacity: 0.6 },
        style
      ]}
    >
      <View
        style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter, { gap: FEE_ICON_GAP }]}
      >
        {icon}
        <View style={[flexbox.flex1, { minWidth: 0, gap: SPACING_MI / 2 }]}>
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifySpaceBetween,
              { gap: SPACING_TY }
            ]}
          >
            <Text fontSize={12} appearance="secondaryText" numberOfLines={1} style={flexbox.flex1}>
              {label}
            </Text>
            <View style={[flexbox.directionRow, flexbox.alignCenter, { gap: SPACING_MI }]}>
              {labelAccessory}
              {isMenuOpen ? <UpArrowIcon /> : <DownArrowIcon />}
            </View>
          </View>
          {value}
        </View>
      </View>
    </HoverablePressable>
  </View>
)

export default React.memo(FeeSelectTrigger)
