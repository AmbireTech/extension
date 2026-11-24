import React, { FC, ReactNode } from 'react'
import { View, ViewStyle } from 'react-native'
import { SvgProps } from 'react-native-svg'

import { useIsInsideBottomSheet } from '@common/components/BottomSheet/BottomSheetContext'
import SheetHeaderRow from '@common/components/BottomSheet/SheetHeaderRow'
import Button from '@common/components/Button'
import HeaderButton from '@common/components/HeaderButton'
import Text from '@common/components/Text'
import useCompactLayout from '@common/hooks/useCompactLayout'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'

import getStyles from './styles'

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
  const isInSheet = useIsInsideBottomSheet()

  return (
    <View>
      {/* In a sheet the title goes to the sheet's fixed header row, whose X replaces
      the close icon */}
      {!hideHeader && isInSheet && (
        <SheetHeaderRow>
          <Text weight="medium" fontSize={20} style={text.center}>
            {title}
          </Text>
        </SheetHeaderRow>
      )}
      {!hideHeader && !isInSheet && (
        <View style={styles.modalHeader}>
          <Text weight="medium" fontSize={20}>
            {title}
          </Text>
          {!!onCloseIconPress && <HeaderButton type="close" onPress={onCloseIconPress} />}
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
