import React, { useCallback, useMemo, useRef, useState } from 'react'
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
  onScrollBeginDrag,
  getSectionHeaderHeight,
  scrollToSelectedOnOpen,
  isMenuOpen,
  setIsMenuOpen,
  withScrollbarPadding,
  listRef: externalListRef,
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
    closeMenuOnSelect: props.closeMenuOnSelect,
    isMenuOpen,
    setIsMenuOpen,
    listRef: externalListRef
  })
  const { listRef, filteredData, renderItem, keyExtractor, handleScroll, handleLayout } = selectData
  const isScrollbarPaddingEnabled = isWeb && !!withScrollbarPadding
  // Refs, so a size change re-renders the list only when the scrollbar appears or disappears
  const listHeightRef = useRef(0)
  const contentHeightRef = useRef(0)
  const [hasVerticalScrollbar, setHasVerticalScrollbar] = useState(false)

  const updateHasVerticalScrollbar = useCallback(() => {
    // The 1px tolerance ignores sub-pixel differences when the content only fills the list
    setHasVerticalScrollbar(contentHeightRef.current - listHeightRef.current > 1)
  }, [])

  const handleListLayout = useCallback(
    (event: LayoutChangeEvent) => {
      handleLayout(event)
      if (!isScrollbarPaddingEnabled) return

      listHeightRef.current = event.nativeEvent.layout.height
      updateHasVerticalScrollbar()
    },
    [handleLayout, isScrollbarPaddingEnabled, updateHasVerticalScrollbar]
  )

  const handleContentSizeChange = useCallback(
    (_: number, height: number) => {
      contentHeightRef.current = height
      updateHasVerticalScrollbar()
    },
    [updateHasVerticalScrollbar]
  )

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
        let index = flatIndex + 1 + optionIndex
        if (stickySectionHeadersEnabled) {
          // Earlier by as many items as the sticky header is tall, so it doesn't cover the option
          const stickyHeaderHeight = getSectionHeaderHeight?.(section) ?? headerHeight
          const visibleFromOffset = getItemLayout(null, index).offset - stickyHeaderHeight
          while (index > 0 && getItemLayout(null, index).offset > visibleFromOffset) index -= 1
        }

        return index > 0 ? index : undefined
      }
      flatIndex += section.data.length + 2
    }

    return undefined
  }, [
    scrollToSelectedOnOpen,
    value,
    filteredData,
    stickySectionHeadersEnabled,
    getSectionHeaderHeight,
    headerHeight,
    getItemLayout
  ])

  const sectionListProps = useMemo(
    () => ({
      ref: listRef,
      sections: filteredData as SectionedSelectProps['sections'],
      renderItem: renderItem as any,
      onLayout: handleListLayout,
      onContentSizeChange: isScrollbarPaddingEnabled ? handleContentSizeChange : undefined,
      // Left out unless needed, as an undefined one would wipe the bottom sheet's own padding
      ...(hasVerticalScrollbar && { contentContainerStyle: CONTENT_WITH_SCROLLBAR_STYLE }),
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
      onScrollBeginDrag,
      initialScrollIndex
    }),
    [
      listRef,
      filteredData,
      renderItem,
      handleListLayout,
      isScrollbarPaddingEnabled,
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
      onScrollBeginDrag,
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
