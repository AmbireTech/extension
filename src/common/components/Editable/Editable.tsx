import React, { FC, ReactNode, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import CheckIcon from '@common/assets/svg/CheckIcon'
import CloseIcon from '@common/assets/svg/CloseIcon'
import EditPenIcon from '@common/assets/svg/EditPenIcon'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import Input from '../Input'
import Text, { Props as TextProps } from '../Text'

interface Props {
  initialValue?: string
  fallbackValue?: string
  onSave?: (value: string) => void
  fontSize?: number
  height?: number
  textProps?: TextProps
  minWidth?: number
  maxLength?: number
  customValue?: string
  setCustomValue?: (value: string) => void
  testID?: string
  children?: ReactNode
  onSetIsEditing?: (isEditing: boolean) => void
  disabled?: boolean
}

const Editable: FC<Props> = ({
  initialValue,
  fallbackValue = 'Not labeled',
  customValue, // needed for react-hook-form
  setCustomValue, // needed for react-hook-form
  onSave,
  fontSize = 16,
  height = 30,
  textProps = {},
  minWidth = 100,
  maxLength = 20,
  testID,
  children,
  onSetIsEditing,
  disabled
}) => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [value, setValue] = useState(initialValue)
  const [isEditing, setIsEditing] = useState(false)
  const [textWidth, setTextWidth] = useState(0)
  const actualValue = typeof customValue === 'string' ? customValue : value
  // TODO: check it
  const iconSize = fontSize - 2

  const handleSave = useCallback(() => {
    setIsEditing(false)
    !!onSetIsEditing && onSetIsEditing(false)
    if (actualValue === initialValue || !actualValue) {
      setValue(initialValue)
      return
    }

    if (onSave) onSave(actualValue)
  }, [actualValue, initialValue, onSave, onSetIsEditing])

  const setValueWrapped = useCallback(
    (newValue: string) => {
      if (setCustomValue) {
        setCustomValue(newValue)
        return
      }

      setValue(newValue)
    },
    [setCustomValue]
  )

  return (
    <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter, { height }]}>
      {isEditing && !disabled ? (
        <Input
          value={actualValue}
          // Prevents the input from being too small
          containerStyle={{ ...spacings.mb0, width: textWidth < minWidth ? minWidth : textWidth }}
          inputWrapperStyle={{
            height,
            backgroundColor: 'transparent'
          }}
          nativeInputStyle={{
            fontSize
          }}
          inputStyle={{
            height,
            ...spacings.ph0
          }}
          maxLength={maxLength}
          onChangeText={setValueWrapped}
          onSubmitEditing={handleSave}
          autoFocus
          borderless
          testID={testID}
        />
      ) : (
        <Text
          fontSize={fontSize}
          appearance={!actualValue ? 'secondaryText' : 'primaryText'}
          numberOfLines={1}
          // onLayout returns rounded numbers in react-native-web so there
          // there will be slight UI jumps when changing the value of isEditing
          // https://github.com/necolas/react-native-web/issues/2424
          onLayout={(e) => {
            setTextWidth(e.nativeEvent.layout.width)
          }}
          {...textProps}
        >
          {actualValue || fallbackValue}
        </Text>
      )}
      {!disabled && (
        <Pressable
          onPress={() => {
            if (isEditing) {
              handleSave()
              return
            }
            setIsEditing(true)
            !!onSetIsEditing && onSetIsEditing(true)
          }}
          style={[spacings.mlTy]}
          testID={`edit-btn-for-${testID}`}
        >
          {({ hovered }: any) => (
            <>
              {!isEditing && (
                <EditPenIcon
                  color={hovered ? theme.primaryText : theme.primary}
                  width={iconSize}
                  height={iconSize}
                />
              )}
              {isEditing && (actualValue === initialValue || !actualValue) && (
                <CloseIcon
                  width={iconSize}
                  height={iconSize}
                  color={hovered ? theme.primaryText : theme.secondaryText}
                />
              )}
              {isEditing && actualValue !== initialValue && !!actualValue && (
                <View
                  style={[
                    flexbox.directionRow,
                    flexbox.alignCenter,
                    { opacity: hovered ? 0.8 : 1 }
                  ]}
                >
                  <CheckIcon width={iconSize} height={iconSize} style={spacings.mrMi} />
                  <Text fontSize={12} weight="medium" color={theme.successText}>
                    {t('Save')}
                  </Text>
                </View>
              )}
            </>
          )}
        </Pressable>
      )}
      {children}
    </View>
  )
}

export default React.memo(Editable)
