import React from 'react'
import { FlatList } from 'react-native'

import EmptyListPlaceholder from './components/EmptyListPlaceholder'
import SelectContainer from './components/SelectContainer'
import { SelectProps } from './types'
import useSelectInternal from './useSelectInternal'

const Select = ({
  setValue,
  value,
  options,
  testID,
  menuOptionHeight,
  attemptToFetchMoreOptions,
  emptyListPlaceholderText,
  ...props
}: SelectProps) => {
  const selectData = useSelectInternal({
    value,
    setValue,
    data: options,
    isSectionList: false,
    menuOptionHeight,
    attemptToFetchMoreOptions
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
    <SelectContainer value={value} setValue={setValue} {...selectData} {...props} testID={testID}>
      <FlatList
        ref={listRef}
        data={filteredData as SelectProps['options']}
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
