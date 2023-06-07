import React, { useMemo, useState } from 'react'
import { Keyboard, TouchableOpacity, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { isWeb } from '@common/config/env'
import CheckIcon from '@common/assets/svg/CheckIcon'
import DownArrowIcon from '@common/assets/svg/DownArrowIcon'
import BottomSheet from '@common/components/BottomSheet'
import Input from '@common/components/Input'
import NavIconWrapper from '@common/components/NavIconWrapper'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import commonStyles from '@common/styles/utils/common'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import styles from './styles'

interface Props {
  value: string | null
  items: any[]
  setValue?: (value: any) => void
  label?: string
  extraText?: string
  hasArrow?: boolean
}
const Dropdown = ({ options, selectedValue, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const handleOptionSelect = (option) => {
    onSelect(option)
    setIsOpen(false)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.selectedValue} onPress={toggleDropdown} />
      {isOpen && (
        <View style={styles.optionsContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.option}
              onPress={() => handleOptionSelect(option)}
            >
              <Text>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}
const Select = ({ value, setValue, items, label, extraText, hasArrow = true }: Props) => {
  const [searchValue, setSearchValue] = useState('')
  const { t } = useTranslation()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  const item = useMemo(() => items?.find((i) => i.value === value), [value, items])

  const filteredItems = useMemo(
    () =>
      searchValue
        ? items.filter((i: any) => i?.label?.toLowerCase().includes(searchValue.toLowerCase()))
        : items,
    [items, searchValue]
  )

  const renderItem = ({ item: _item }: any) => {
    const onSelect = () => {
      !!setValue && setValue(_item.value)
      closeBottomSheet()
    }

    return (
      <TouchableOpacity
        style={[
          flexboxStyles.directionRow,
          flexboxStyles.alignCenter,
          spacings.phTy,
          spacings.pvMi,
          commonStyles.borderRadiusPrimary,
          { backgroundColor: _item.value === value ? colors.howl : 'transparent' }
        ]}
        activeOpacity={0.6}
        onPress={onSelect}
      >
        {!!_item.icon && _item.icon()}
        <View style={[flexboxStyles.flex1, spacings.phTy]}>
          <Text numberOfLines={1}>{_item.label}</Text>
        </View>
        {_item.value === value && <CheckIcon />}
      </TouchableOpacity>
    )
  }

  return (
    <>
      {!!label && <Text style={spacings.mbMi}>{label}</Text>}
      <TouchableOpacity
        onPress={() => {
          Keyboard.dismiss()
          !isWeb && openBottomSheet()
        }}
      >
        <View pointerEvents="none">
          <Input
            placeholder={label}
            value={item?.label}
            leftIcon={item?.icon}
            containerStyle={spacings.mbSm}
            button={
              hasArrow ? (
                <View pointerEvents="none">
                  {!!extraText && (
                    <View style={styles.extra}>
                      <Text fontSize={12} color={colors.heliotrope}>
                        {extraText}
                      </Text>
                    </View>
                  )}
                  <NavIconWrapper onPress={() => null}>
                    <DownArrowIcon width={34} height={34} />
                  </NavIconWrapper>
                </View>
              ) : (
                <></>
              )
            }
          />
        </View>
      </TouchableOpacity>
      {isWeb && <Dropdown options={items} selectedValue={value} onSelect={setValue} />}
      {!isWeb && (
        <BottomSheet
          id="select-bottom-sheet"
          sheetRef={sheetRef}
          closeBottomSheet={closeBottomSheet}
          displayCancel={false}
          flatListProps={{
            data: filteredItems || [],
            renderItem,
            keyExtractor: (i: any, idx: number) => `${i.value}-${idx}`,
            ListEmptyComponent: (
              <View style={[spacings.ptLg, flexboxStyles.alignCenter]}>
                <Text style={textStyles.center}>{t('No tokens were found.')}</Text>
              </View>
            ),
            ListHeaderComponent: (
              <View style={[spacings.pbSm, { backgroundColor: colors.clay }]}>
                <Input
                  value={searchValue}
                  containerStyle={spacings.mb0}
                  onChangeText={setSearchValue}
                  placeholder={t('Search...')}
                />
              </View>
            ),
            stickyHeaderIndices: [0]
          }}
          // Disable dynamic height, because it breaks when the flat list items change dynamically
          adjustToContentHeight={false}
        />
      )}
    </>
  )
}

export default React.memo(Select)
