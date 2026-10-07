import React, { ReactNode } from 'react'
import { ColorValue, View, ViewStyle } from 'react-native'

import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import UpArrowIcon from '@common/assets/svg/UpArrowIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import { DEFAULT_SELECT_SIZE, SELECT_SIZE_TO_HEIGHT } from '@common/components/Select/styles'
import { RenderSelectedOptionParams } from '@common/components/Select/types'
import Text from '@common/components/Text'
import spacings, { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

/** Height of the fee row - the selects and the advanced settings button share it */
const FEE_ROW_HEIGHT = SELECT_SIZE_TO_HEIGHT[DEFAULT_SELECT_SIZE]
/** Gap between an icon and its text */
const FEE_ICON_GAP = 10

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
  /** Where there is room, the arrow sits centered at the end instead of on the label line */
  isArrowCentered?: boolean
  style?: ViewStyle
  testID?: string
}

/**
 * The trigger of the fee selects: a small label on the first line and the selected value on the
 * second. On narrow screens the arrow stays on the label line, so the value uses the full width
 * and long amounts and token names fit
 */
const FeeSelectTrigger = ({
  label,
  labelAccessory,
  value,
  icon,
  backgroundColor,
  disabled,
  isAttachedBelow,
  isArrowCentered,
  style,
  toggleMenu,
  isMenuOpen,
  selectRef,
  testID
}: Props) => {
  const arrow = isMenuOpen ? <UpArrowIcon /> : <DownArrowIcon />

  return (
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
              <Text
                fontSize={12}
                appearance="secondaryText"
                numberOfLines={1}
                style={flexbox.flex1}
              >
                {label}
              </Text>
              <View style={[flexbox.directionRow, flexbox.alignCenter, { gap: SPACING_MI }]}>
                {labelAccessory}
                {!isArrowCentered && arrow}
              </View>
            </View>
            {value}
          </View>
          {isArrowCentered && arrow}
        </View>
      </HoverablePressable>
    </View>
  )
}

export default React.memo(FeeSelectTrigger)
