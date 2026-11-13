import React, { FC, ReactNode } from 'react'
import { Pressable, View, ViewStyle } from 'react-native'
import { SvgProps } from 'react-native-svg'

import CloseIcon from '@common/assets/svg/CloseIcon'
import { useIsInsideBottomSheet } from '@common/components/BottomSheet/BottomSheetContext'
import SheetHeaderRow from '@common/components/BottomSheet/SheetHeaderRow'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import getStyles from './styles'

// The row sits next to the close icon in the header, so it takes the space and adds no margin
const HEADER_ROW_STYLE = [flexbox.flex1, spacings.mb0]

export interface Props {
  title?: string | ReactNode
  description: string | ReactNode
  Icon?: React.FC<SvgProps>
  onPrimaryButtonPress: () => void
  onSecondaryButtonPress?: () => void
  onCloseIconPress?: () => void
  primaryButtonText: string
  secondaryButtonText?: string
  primaryButtonTestID?: string
  secondaryButtonTestID?: string
  buttonsContainerStyle?: ViewStyle
  hideHeader?: boolean
  style?: ViewStyle
  primaryButtonDisabled?: boolean
}

const DualChoiceModal: FC<Props> = ({
  title,
  description,
  Icon,
  onSecondaryButtonPress,
  onPrimaryButtonPress,
  onCloseIconPress,
  primaryButtonText,
  secondaryButtonText,
  secondaryButtonTestID,
  primaryButtonTestID,
  buttonsContainerStyle,
  hideHeader,
  style,
  primaryButtonDisabled
}) => {
  const { styles, theme } = useTheme(getStyles)
  const { isCompactLayout } = useCompactLayout()
  const isInNativeSheet = useIsInsideBottomSheet() && !isWeb

  return (
    <View>
      {!hideHeader && (
        <View style={styles.modalHeader}>
          {/* In a native sheet the row adds the sheet's X, which replaces the close icon */}
          <SheetHeaderRow style={HEADER_ROW_STYLE}>
            <Text weight="medium" fontSize={20} style={isInNativeSheet && text.center}>
              {title}
            </Text>
          </SheetHeaderRow>
          {!!onCloseIconPress && !isInNativeSheet && (
            <Pressable onPress={onCloseIconPress}>
              <CloseIcon />
            </Pressable>
          )}
        </View>
      )}
      <View style={[styles.modalInnerContainer, style]}>
        {!!Icon && (
          <View>
            <Icon style={spacings.mrLg} color={theme.iconPrimary} />
          </View>
        )}
        <Text appearance="secondaryText">{description}</Text>
      </View>
      <View
        style={[
          styles.modalButtonsContainer,
          isCompactLayout && styles.modalButtonsContainerCompact,
          buttonsContainerStyle
        ]}
      >
        {!!secondaryButtonText && !!onSecondaryButtonPress && (
          <Button
            text={secondaryButtonText}
            onPress={onSecondaryButtonPress}
            type="tertiary"
            hasBottomSpacing={false}
            size="large"
            style={[styles.button, isCompactLayout ? styles.buttonCompact : spacings.mr]}
            testID={secondaryButtonTestID}
          />
        )}
        <Button
          text={primaryButtonText}
          onPress={onPrimaryButtonPress}
          hasBottomSpacing={false}
          size="large"
          style={[styles.button, isCompactLayout && styles.buttonCompact]}
          testID={primaryButtonTestID}
          disabled={primaryButtonDisabled}
        />
      </View>
    </View>
  )
}

export default React.memo(DualChoiceModal)
