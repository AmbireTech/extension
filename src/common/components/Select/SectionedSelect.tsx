import React, { useCallback, useMemo, useState } from 'react'
import { LayoutChangeEvent } from 'react-native'

import { isWeb } from '@common/config/env'
import { SPACING_MI } from '@common/styles/spacings'

import EmptyListPlaceholder from './components/EmptyListPlaceholder'
import SelectContainer from './components/SelectContainer'
import { DEFAULT_SELECT_SIZE, SELECT_LIST_VIRTUALIZATION, SELECT_SIZE_TO_HEIGHT } from './styles'
import { SectionedSelectProps } from './types'
import useSelectInternal from './useSelectInternal'

// Keeps the rows off the scrollbar on web, like ScrollableWrapper does
const CONTENT_WITH_SCROLLBAR_STYLE = { paddingRight: SPACING_MI / 2 }

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
  onViewableItemsChanged,
  viewabilityConfig,
  getSectionHeaderHeight,
  scrollToSelectedOnOpen,
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
    menuPosition,
    renderOption: props.renderOption,
    closeMenuOnSelect: props.closeMenuOnSelect
  })
  const { listRef, filteredData, renderItem, keyExtractor, handleScroll, handleLayout } = selectData
  const [listHeight, setListHeight] = useState(0)
  const [contentHeight, setContentHeight] = useState(0)
  // The 1px tolerance ignores sub-pixel differences when the content only fills the list
  const hasVerticalScrollbar = isWeb && contentHeight - listHeight > 1

  const handleListLayout = useCallback(
    (event: LayoutChangeEvent) => {
      handleLayout(event)
      if (isWeb) setListHeight(event.nativeEvent.layout.height)
    },
    [handleLayout]
  )

  const handleContentSizeChange = useCallback((_: number, height: number) => {
    if (isWeb) setContentHeight(height)
  }, [])

  const optionHeight = menuOptionHeight || SELECT_SIZE_TO_HEIGHT[props.size || DEFAULT_SELECT_SIZE]

  // A SectionList counts each section's header and (empty) footer as items too, so the
  // offsets must step over them - viewability and scrolling to an index rely on these
  const getItemLayout = useCallback(
    (_: unknown, flatIndex: number) => {
      let offset = 0
      let remaining = flatIndex

      for (const section of filteredData) {
        const sectionHeaderHeight = getSectionHeaderHeight?.(section) ?? headerHeight
        if (remaining === 0) return { length: sectionHeaderHeight, offset, index: flatIndex }
        offset += sectionHeaderHeight
        remaining -= 1

        if (remaining < section.data.length) {
          return {
            length: optionHeight,
            offset: offset + remaining * optionHeight,
            index: flatIndex
          }
        }
        offset += section.data.length * optionHeight
        remaining -= section.data.length

        if (remaining === 0) return { length: 0, offset, index: flatIndex }
        remaining -= 1
      }

      return { length: 0, offset, index: flatIndex }
    },
    [filteredData, headerHeight, getSectionHeaderHeight, optionHeight]
  )

  // Memoized for the same reason `Select` memoizes its `flatListProps`: a new object
  // here defeats `React.memo` on the BottomSheet, so every render of the parent
  // re-renders every mounted row of the list.
  // The list mounts each time the menu opens, and the initial index is read on mount alone.
  // A SectionList counts each section's header and footer as items, so they are stepped over
  const initialScrollIndex = useMemo(() => {
    if (!scrollToSelectedOnOpen || !value) return undefined

    let flatIndex = 0
    for (const section of filteredData) {
      const optionIndex = section.data.findIndex((option) => option.value === value.value)
      if (optionIndex !== -1) {
        // One item earlier, so a sticky header doesn't cover the selected option
        const index = flatIndex + 1 + optionIndex - (stickySectionHeadersEnabled ? 1 : 0)

        return index > 0 ? index : undefined
      }
      flatIndex += section.data.length + 2
    }

    return undefined
  }, [scrollToSelectedOnOpen, value, filteredData, stickySectionHeadersEnabled])

  const sectionListProps = useMemo(
    () => ({
      ref: listRef,
      sections: filteredData as SectionedSelectProps['sections'],
      renderItem: renderItem as any,
      onLayout: handleListLayout,
      onContentSizeChange: handleContentSizeChange,
      contentContainerStyle: hasVerticalScrollbar ? CONTENT_WITH_SCROLLBAR_STYLE : undefined,
      renderSectionHeader,
      keyExtractor,
      ...SELECT_LIST_VIRTUALIZATION,
      SectionSeparatorComponent,
      removeClippedSubviews: true,
      getItemLayout: getItemLayout as any,
      ListEmptyComponent: <EmptyListPlaceholder placeholderText={emptyListPlaceholderText} />,
      stickySectionHeadersEnabled,
      onScroll: handleScroll,
      scrollEventThrottle: 16,
      onViewableItemsChanged,
      viewabilityConfig,
      initialScrollIndex
    }),
    [
      listRef,
      filteredData,
      renderItem,
      handleListLayout,
      handleContentSizeChange,
      hasVerticalScrollbar,
      renderSectionHeader,
      keyExtractor,
      SectionSeparatorComponent,
      getItemLayout,
      emptyListPlaceholderText,
      stickySectionHeadersEnabled,
      handleScroll,
      onViewableItemsChanged,
      viewabilityConfig,
      initialScrollIndex
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
