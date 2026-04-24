import React, { useMemo } from 'react'

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
  // To address the structural differences between SectionList and FlatList,
  // we wrap non-sectioned list data in a default single section.
  // Memoize so the array reference is stable across renders (as long as `options` is),
  // which in turn keeps `filteredData`, `renderItem` and `flatListProps` stable and
  // prevents an infinite FlatList layout loop inside Modalize (react-native-modalize).
  const data = useMemo(
    () => [{ data: options, title: '', key: 'default' }] as SectionedSelectProps['sections'],
    [options]
  )
  const selectData = useSelectInternal({
    value,
    setValue,
    data,
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

  const flatListProps = useMemo(
    () => ({
      ref: listRef,
      data: filteredData?.[0]?.data || [],
      renderItem: renderItem as any,
      keyExtractor,
      onLayout: handleLayout,
      initialNumToRender: 15,
      windowSize: 10,
      maxToRenderPerBatch: 20,
      removeClippedSubviews: true,
      getItemLayout,
      ListEmptyComponent: <EmptyListPlaceholder placeholderText={emptyListPlaceholderText} />,
      onScroll: handleScroll,
      scrollEventThrottle: 16
    }),
    [
      listRef,
      filteredData,
      renderItem,
      keyExtractor,
      handleLayout,
      getItemLayout,
      handleScroll,
      emptyListPlaceholderText
    ]
  )

  return (
    <SelectContainer
      value={value}
      {...selectData}
      {...props}
      menuProps={{ ...selectData.menuProps, ...(props.menuProps || {}) }}
      id={testID}
      testID={testID}
      listRef={listRef}
      flatListProps={flatListProps}
    />
  )
}

export default React.memo(Select)
