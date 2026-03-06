import React, { FC, useCallback, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import CloseIcon from '@common/assets/svg/CloseIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import NumberInput from '@common/components/NumberInput'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import getStyles from './styles'
import { FormData, Props } from './types'

const CustomHDPathBottomSheet: FC<Props> = ({
  sheetRef,
  closeBottomSheet,
  onConfirm,
  disabled,
  page,
  options,
  value
}) => {
  const { theme, styles } = useTheme(getStyles)
  const { t } = useTranslation()
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    mode: 'onSubmit',
    defaultValues: {
      startIndex: String(page || 1),
      selectedOption: value
    }
  })

  const selectedOption = (watch('selectedOption') as SelectValue) || value

  useEffect(() => {
    setValue('startIndex', String(page || 1))
  }, [page, setValue])

  const closeBottomSheetWrapped = useCallback(() => {
    closeBottomSheet()
  }, [closeBottomSheet])

  const onSubmit = useCallback(
    (data: FormData) => {
      const parsed = parseInt(data.startIndex, 10)
      onConfirm(selectedOption, parsed)
      closeBottomSheetWrapped()
    },
    [closeBottomSheetWrapped, onConfirm, selectedOption]
  )

  const handleOptionPress = useCallback(
    (option: SelectValue) => {
      setValue('selectedOption', option)
    },
    [setValue]
  )

  return (
    <BottomSheet id="custom-hd-path" sheetRef={sheetRef} closeBottomSheet={closeBottomSheetWrapped}>
      <Text fontSize={20} weight="medium" style={[text.center, spacings.mbXl]}>
        {t('Custom address HD path')}
      </Text>

      <Text fontSize={16} weight="medium" style={spacings.mbSm}>
        {t('Select HD path')}
      </Text>

      {options.map((option) => {
        const isActive = selectedOption.value === option.value
        return (
          <Pressable
            testID={`hd-path-option-${option.label.toLocaleLowerCase().split(' ').join('-')}`}
            key={option.value}
            onPress={() => handleOptionPress(option)}
            disabled={disabled}
            style={({ hovered }: any) => [
              flexbox.alignCenter,
              flexbox.directionRow,
              common.borderRadiusPrimary,
              spacings.phMd,
              spacings.mbTy,
              { width: '100%', height: 56 },
              {
                borderWidth: 1,
                borderColor: theme.primaryBorder,
                backgroundColor: 'transparent'
              },
              (!!hovered || isActive) && {
                backgroundColor: theme.tertiaryBackground,
                borderColor: theme.neutral400
              }
            ]}
          >
            <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
              <View style={[styles.radioInner, isActive && styles.radioInnerActive]} />
            </View>
            <Text fontSize={14} weight="medium">
              {option.label}
            </Text>
          </Pressable>
        )
      })}

      <View style={[spacings.mtTy, spacings.mbXl, { height: 40 }]}>
        {!!options.find((o) => o.value === selectedOption.value)?.description && (
          <Text fontSize={14} appearance="secondaryText">
            {options.find((o) => o.value === selectedOption.value)?.description}
          </Text>
        )}
      </View>
      <View style={[spacings.mbXl]}>
        <Text fontSize={16} weight="medium" style={[spacings.mbTy]}>
          {t('Enter a page number to jump to')}:
        </Text>

        <Controller
          control={control}
          name="startIndex"
          rules={{
            required: true,
            validate: (v) => {
              const parsed = parseInt(v, 10)
              return (parsed >= 1 && parsed <= 1000) || 'Must be between 1 and 1000'
            }
          }}
          render={({ field: { value, onChange } }) => (
            <NumberInput
              testID="hd-path-start-index-input"
              value={value}
              onChangeText={onChange}
              backgroundColor={theme.secondaryBackground}
              error={errors.startIndex && errors.startIndex.message}
            />
          )}
        />
      </View>
      <View style={[flexbox.directionRow, flexbox.center]}>
        <Button
          testID="hd-path-confirm-btn"
          style={{ width: 200 }}
          text={t('Confirm')}
          onPress={handleSubmit(onSubmit)}
        />
      </View>
    </BottomSheet>
  )
}

export default React.memo(CustomHDPathBottomSheet)
