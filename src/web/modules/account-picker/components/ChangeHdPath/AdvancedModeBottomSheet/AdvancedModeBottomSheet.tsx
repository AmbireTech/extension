import React, { FC, useCallback, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { DerivationOption } from '@ambire-common/consts/derivation'
import CloseIcon from '@common/assets/svg/CloseIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import NumberInput from '@common/components/NumberInput'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type FormData = {
  startIndex: string
  selectedOption: SelectValue
}

type Props = {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
  onConfirm: (hdPath: SelectValue, startIndex: number) => void
  disabled?: boolean
  page?: number
  options: DerivationOption[]
  value: SelectValue
}

const CustomHDPathBottomSheet: FC<Props> = ({
  sheetRef,
  closeBottomSheet,
  onConfirm,
  disabled,
  page,
  options,
  value
}) => {
  const { theme, themeType } = useTheme()
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
    <BottomSheet
      type="modal"
      id="custom-hd-path"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheetWrapped}
      backgroundColor={themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'}
      style={{ ...spacings.ph0, ...spacings.pv0, width: 672 }}
    >
      <View
        style={[
          flexbox.justifySpaceBetween,
          flexbox.directionRow,
          flexbox.alignCenter,
          spacings.phMd,
          spacings.pvMd,
          {
            backgroundColor: theme.secondaryBackground,
            borderTopEndRadius: 6,
            borderTopStartRadius: 6
          }
        ]}
      >
        <Text fontSize={20} weight="medium">
          {t('Custom address HD path')}
        </Text>
        <Pressable onPress={closeBottomSheetWrapped} style={[flexbox.center, spacings.pvTy]}>
          {({ hovered }: any) => (
            <View style={[hovered && { backgroundColor: theme.secondaryBackground }]}>
              <CloseIcon />
            </View>
          )}
        </Pressable>
      </View>
      <View style={[spacings.phMd, spacings.pt2Xl, spacings.pbMd]}>
        <Text fontSize={16} weight="medium" style={[spacings.mbTy]}>
          {t('Select HD path')}:
        </Text>
        <View
          style={[
            flexbox.directionRow,
            flexbox.wrap,
            flexbox.flex1,
            flexbox.justifySpaceBetween,
            spacings.mbTy
          ]}
        >
          {options.map((option) => {
            const isActive = selectedOption.value === option.value
            return (
              <Pressable
                testID={`hd-path-option-${option.label.toLocaleLowerCase().split(' ').join('-')}`}
                key={option.value}
                onPress={() => handleOptionPress(option)}
                disabled={disabled}
                style={({ hovered }: any) => [
                  flexbox.center,
                  flexbox.directionRow,
                  common.borderRadiusPrimary,
                  { width: 200, height: 56 },
                  {
                    borderWidth: 1,
                    borderColor: 'transparent',
                    backgroundColor: isActive
                      ? `${String(theme.primary)}14`
                      : themeType === THEME_TYPES.DARK
                      ? theme.tertiaryBackground
                      : theme.secondaryBackground
                  },
                  !!hovered &&
                    !isActive && {
                      borderColor:
                        themeType === THEME_TYPES.DARK ? theme.primaryLight80 : theme.primary
                    }
                ]}
              >
                <Text
                  fontSize={16}
                  weight="medium"
                  color={isActive ? theme.primary : theme.secondaryText}
                >
                  {option.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {!!options.find((o) => o.value === selectedOption.value)?.description && (
          <Text fontSize={14} appearance="secondaryText" style={[spacings.mb2Xl]}>
            {options.find((o) => o.value === selectedOption.value)?.description}
          </Text>
        )}
        <View style={[spacings.mb2Xl]}>
          <Text fontSize={16} weight="medium" style={[spacings.mbSm]}>
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
                error={errors.startIndex && errors.startIndex.message}
              />
            )}
          />
        </View>
        <View style={[flexbox.directionRow, flexbox.center]}>
          <Button
            testID="hd-path-confirm-btn"
            style={{ width: '50%' }}
            text={t('Confirm')}
            onPress={handleSubmit(onSubmit)}
          />
        </View>
      </View>
    </BottomSheet>
  )
}

export default React.memo(CustomHDPathBottomSheet)
