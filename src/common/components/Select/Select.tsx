import React from 'react'

import EmptyListPlaceholder from './components/EmptyListPlaceholder'
import SelectContainer from './components/SelectContainer'
import { SectionedSelectProps, SelectProps } from './types'
import useSelectInternal from './useSelectInternal'

const Select = ({
  setValue,
  value,
  options,
  testID,
  menuOptionHeight,
  attemptToFetchMoreOptions,
  emptyListPlaceholderText,
  onSearch,
  ...props
}: SelectProps) => {
  const selectData = useSelectInternal({
    value,
    setValue,
    // To address the structural differences between SectionList and FlatList,
    // we wrap non-sectioned list data in a default single section
    data: [{ data: options, title: '', key: 'default' }] as SectionedSelectProps['sections'],
    menuOptionHeight,
    attemptToFetchMoreOptions,
    mode: props.mode,
    onSearch
  })
  const {
    listRef,
    filteredData,
    renderItem,
    keyExtractor,
    getItemLayout,
    handleLayout,
    handleScroll
  } = selectData

  return (
    <SelectContainer
      value={value}
      {...selectData}
      {...props}
      menuProps={{ ...selectData.menuProps, ...(props.menuProps || {}) }}
      id={testID}
      testID={testID}
      listRef={listRef}
      flatListProps={{
        ref: listRef,
        data: filteredData?.[0]?.data || [],
        renderItem: renderItem as any,
        keyExtractor: keyExtractor,
        onLayout: handleLayout,
        initialNumToRender: 15,
        windowSize: 10,
        maxToRenderPerBatch: 20,
        removeClippedSubviews: true,
        getItemLayout: getItemLayout,
        ListEmptyComponent: <EmptyListPlaceholder placeholderText={emptyListPlaceholderText} />,
        onScroll: handleScroll,
        scrollEventThrottle: 16
      }}
    />
  )
}

export default React.memo(Select)
