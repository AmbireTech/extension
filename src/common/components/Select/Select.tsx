import React, { useMemo, useState } from 'react'
import { Keyboard, TouchableOpacity, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

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
  disabled?: boolean
}

const Select = ({ value, disabled, setValue, items, label, extraText, hasArrow = true }: Props) => {
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
          { backgroundColor: _item.value === value ? colors.howl : 'transparent' },
          { opacity: _item?.disabled ? 0.3 : 1 }
        ]}
        activeOpacity={0.6}
        onPress={onSelect}
        disabled={_item?.disabled}
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
          openBottomSheet()
        }}
        disabled={disabled}
      >
        <View pointerEvents="none">
          <Input
            value={item?.label}
            leftIcon={item?.icon}
            containerStyle={[spacings.mbSm, disabled && { opacity: 0.6 }]}
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
    </>
  )
}

export default React.memo(Select)
