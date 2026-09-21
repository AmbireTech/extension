import React, { useMemo } from 'react'

import EmptyListPlaceholder from './components/EmptyListPlaceholder'
import SelectContainer from './components/SelectContainer'
import { SELECT_LIST_VIRTUALIZATION } from './styles'
import { SectionedSelectProps } from './types'
import useSelectInternal from './useSelectInternal'

const SectionedSelect = ({
  setValue,
  value,
  sections,
  menuOptionHeight,
  headerHeight,
  renderSectionHeader,
  SectionSeparatorComponent,
  stickySectionHeadersEnabled,
  emptyListPlaceholderText,
  attemptToFetchMoreOptions,
  onSearch,
  testID,
  menuPosition,
  ...props
}: SectionedSelectProps) => {
  const selectData = useSelectInternal({
    menuOptionHeight,
    setValue,
    value,
    headerHeight,
    stickySectionHeadersEnabled,
    data: sections,
    attemptToFetchMoreOptions,
    onSearch,
    menuPosition
  })
  const {
    listRef,
    filteredData,
    renderItem,
    keyExtractor,
    getItemLayout,
    handleScroll,
    handleLayout
  } = selectData

  // Memoized for the same reason `Select` memoizes its `flatListProps`: a new object
  // here defeats `React.memo` on the BottomSheet, so every render of the parent
  // re-renders every mounted row of the list.
  const sectionListProps = useMemo(
    () => ({
      ref: listRef,
      sections: filteredData as SectionedSelectProps['sections'],
      renderItem: renderItem as any,
      onLayout: handleLayout,
      renderSectionHeader,
      keyExtractor,
      ...SELECT_LIST_VIRTUALIZATION,
      SectionSeparatorComponent,
      removeClippedSubviews: true,
      getItemLayout: getItemLayout as any,
      ListEmptyComponent: <EmptyListPlaceholder placeholderText={emptyListPlaceholderText} />,
      stickySectionHeadersEnabled,
      onScroll: handleScroll,
      scrollEventThrottle: 16
    }),
    [
      listRef,
      filteredData,
      renderItem,
      handleLayout,
      renderSectionHeader,
      keyExtractor,
      SectionSeparatorComponent,
      getItemLayout,
      emptyListPlaceholderText,
      stickySectionHeadersEnabled,
      handleScroll
    ]
  )

  return (
    <SelectContainer
      value={value}
      setValue={setValue}
      {...selectData}
      {...props}
      menuProps={{ ...selectData.menuProps, ...(props.menuProps || {}) }}
      id={testID}
      testID={testID}
      listRef={listRef}
      sectionListProps={sectionListProps}
    />
  )
}

export default React.memo(SectionedSelect)
