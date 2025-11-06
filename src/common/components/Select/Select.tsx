import React from 'react'
import { FlatList } from 'react-native'

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
    >
      <FlatList
        ref={listRef}
        // get the data (the options) from the default section
        data={filteredData?.[0]?.data || []}
        renderItem={renderItem as any}
        keyExtractor={keyExtractor}
        onLayout={handleLayout}
        initialNumToRender={15}
        windowSize={10}
        maxToRenderPerBatch={20}
        removeClippedSubviews
        getItemLayout={getItemLayout}
        ListEmptyComponent={<EmptyListPlaceholder placeholderText={emptyListPlaceholderText} />}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
    </SelectContainer>
  )
}

export default React.memo(Select)
