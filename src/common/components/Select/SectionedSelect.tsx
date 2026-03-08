/* eslint-disable react/prop-types */
import React from 'react'

import EmptyListPlaceholder from './components/EmptyListPlaceholder'
import SelectContainer from './components/SelectContainer'
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
      sectionListProps={{
        ref: listRef,
        sections: filteredData as SectionedSelectProps['sections'],
        renderItem: renderItem as any,
        onLayout: handleLayout,
        renderSectionHeader: renderSectionHeader,
        keyExtractor: keyExtractor,
        initialNumToRender: 15,
        windowSize: 10,
        maxToRenderPerBatch: 20,
        SectionSeparatorComponent: SectionSeparatorComponent,
        removeClippedSubviews: true,
        getItemLayout: getItemLayout as any,
        ListEmptyComponent: <EmptyListPlaceholder placeholderText={emptyListPlaceholderText} />,
        stickySectionHeadersEnabled: stickySectionHeadersEnabled,
        onScroll: handleScroll,
        scrollEventThrottle: 16
      }}
    />
  )
}

export default React.memo(SectionedSelect)
