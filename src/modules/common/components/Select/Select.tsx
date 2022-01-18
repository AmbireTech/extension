import React, { useState } from 'react'
import DropDownPicker from 'react-native-dropdown-picker'

import i18n from '@config/localization/localization'

import styles from './styles'

DropDownPicker.addTranslation('EN', {
  PLACEHOLDER: i18n.t('Please select'),
  SEARCH_PLACEHOLDER: i18n.t('Search...'),
  SELECTED_ITEMS_COUNT_TEXT: i18n.t('{count} item(s) have been selected'),
  NOTHING_TO_SHOW: i18n.t('Nothing found.')
})

interface Props {
  value: string | null
  items: any[]
  setValue?: (value: any) => void
  setItems?: (items: any) => void
  searchable?: boolean
  onChangeValue?: (value: any) => void
}

const Select = ({ value, setValue, items, setItems, searchable = true, onChangeValue }: Props) => {
  const [open, setOpen] = useState(false)

  return (
    <DropDownPicker
      open={open}
      value={value}
      items={items}
      setOpen={setOpen}
      // @ts-ignore
      setValue={setValue}
      onChangeValue={onChangeValue}
      setItems={setItems}
      searchable={searchable}
      theme="DARK"
      language="EN"
      style={styles.dropdown}
      labelStyle={styles.labelStyle}
      dropDownContainerStyle={styles.dropDownContainerStyle}
      listItemContainerStyle={styles.listItemContainerStyle}
      listItemLabelStyle={styles.listItemLabelStyle}
      searchContainerStyle={styles.searchContainerStyle}
      searchTextInputStyle={styles.searchTextInputStyle}
      disabledItemLabelStyle={{
        opacity: 0.5
      }}
      // So it displays 4 and a half items (indicating there is a scroll)
      maxHeight={290}
      // Using FlatList as `listMode` is causing a warning:
      // "VirtualizedLists should never be nested inside plain ScrollViews
      // with the same orientation because it can break windowing and other
      // functionality - use another VirtualizedList-backed container instead."
      // Therefore, because the main Wrapper of the screens is ScrollView,
      // we must use ScrollView for this component too.
      // {@link https://github.com/hossein-zare/react-native-dropdown-picker/issues/56#issuecomment-841399365}
      listMode="SCROLLVIEW"
    />
  )
}

export default Select
