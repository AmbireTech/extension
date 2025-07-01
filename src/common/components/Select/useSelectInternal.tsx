import { useCallback, useEffect, useMemo, useState } from 'react'

import usePrevious from '@common/hooks/usePrevious'
import useSelect from '@common/hooks/useSelect'

import { DEFAULT_SELECT_SIZE, SELECT_SIZE_TO_HEIGHT } from './styles'
import { SectionedSelectProps, SelectProps, SelectValue } from './types'
import useSelectKeyboardControl from './useSelectKeyboardControl'

type Props = Pick<
  SelectProps,
  'menuOptionHeight' | 'setValue' | 'size' | 'attemptToFetchMoreOptions' | 'mode' | 'menuPosition'
> & {
  value: SelectProps['value']
  data: SectionedSelectProps['sections']
  stickySectionHeadersEnabled?: boolean
  headerHeight?: number
  onSearch?: (searchTerm: string) => void
}

const useSelectInternal = ({
  menuOptionHeight,
  setValue,
  value,
  size = DEFAULT_SELECT_SIZE,
  data,
  stickySectionHeadersEnabled,
  headerHeight = 0,
  attemptToFetchMoreOptions,
  mode = 'select',
  menuPosition,
  onSearch
}: Props) => {
  const useSelectReturnValue = useSelect({ menuPosition })
  const { search, isMenuOpen, setIsMenuOpen, setSearch } = useSelectReturnValue
  const optionHeight = menuOptionHeight || SELECT_SIZE_TO_HEIGHT[size]

  const [listHeight, setListHeight] = useState(0)

  const handleOptionSelect = useCallback(
    (item: SelectValue) => {
      !!setValue && setValue(item)
      setIsMenuOpen(false)
      setSearch('search', '')
    },
    [setValue, setIsMenuOpen, setSearch]
  )

  const prevSearch = usePrevious(search)
  const prevIsMenuOpen = usePrevious(isMenuOpen)

  const filteredData = useMemo(() => {
    const normalizedSearchTerm = search.trim().toLowerCase()

    const hasNewSearchTerm = onSearch && search !== prevSearch
    if (hasNewSearchTerm) onSearch(search)

    if (!search) return data

    const filterOptions = (options: SelectProps['options']) => {
      // Search term split by spaces to partially match separated terms.
      const searchWords = normalizedSearchTerm.split(/\s+/)

      const { exactMatches, partialMatches } = options.reduce(
        (result, o) => {
          const { value: optionValue, label, extraSearchProps } = o

          const fieldsToBeSearchedInto = [
            optionValue.toString().toLowerCase(),
            // In case the label is string, include it (could be any ReactNode)
            typeof label === 'string' ? label.toLowerCase() : '',
            ...(extraSearchProps
              ? Object.values(extraSearchProps).map((field: unknown) => String(field).toLowerCase())
              : [])
          ]

          // Exact match - if any field fully equals the full search term
          const isExactMatch = fieldsToBeSearchedInto.some((f) => f === normalizedSearchTerm)

          // Partial match - if all search words are found in any field
          // Example: If we search for 'WALLET Ethereum',
          // both search words should be found in any of the fields being searched.
          const isPartialMatch = searchWords.every((word) =>
            fieldsToBeSearchedInto.some((f) => f.includes(word))
          )

          // Prioritize exact matches, partial matches come after
          if (isExactMatch) {
            result.exactMatches.push(o)
          } else if (isPartialMatch) {
            result.partialMatches.push(o)
          }

          return result
        },
        { exactMatches: [] as SelectValue[], partialMatches: [] as SelectValue[] }
      )

      return { exactMatches, partialMatches }
    }

    const sectionsWithFilteredData = data.map((section) => {
      const { exactMatches, partialMatches } = filterOptions(section.data as SelectProps['options'])

      return {
        ...section,
        data: [...exactMatches, ...partialMatches]
      }
    })
    const noMatchesFound = sectionsWithFilteredData.every((section) => section.data.length === 0)
    const isAnotherSearchTerm = search !== prevSearch
    const shouldAttemptToFetchMoreOptions =
      noMatchesFound && isAnotherSearchTerm && !!attemptToFetchMoreOptions
    if (shouldAttemptToFetchMoreOptions) attemptToFetchMoreOptions(search)

    return noMatchesFound ? [] : sectionsWithFilteredData
  }, [search, onSearch, prevSearch, data, attemptToFetchMoreOptions])

  const keyExtractor = useCallback((item: SelectValue) => item.key || item.value, [])

  const getItemLayout = useCallback(
    (d: SelectValue[] | null | undefined, index: number) => {
      return {
        length: optionHeight,
        offset: optionHeight * index,
        index
      }
    },
    [optionHeight]
  )

  const handleLayout = useCallback((event: any) => {
    const { height } = event.nativeEvent.layout
    setListHeight(height)
  }, [])

  // Clear search when menu closes
  useEffect(() => {
    if (prevIsMenuOpen && !isMenuOpen) {
      setSearch('search', '')
    }
  }, [isMenuOpen, prevIsMenuOpen, setSearch])

  const { listRef, renderItem, handleScroll } = useSelectKeyboardControl({
    listHeight,
    optionHeight,
    headerHeight,
    sections: filteredData,
    value,
    size,
    isMenuOpen,
    stickySectionHeadersEnabled,
    setIsMenuOpen,
    handleOptionSelect,
    mode
  })

  return {
    ...useSelectReturnValue,
    filteredData,
    listRef,
    renderItem,
    keyExtractor,
    getItemLayout,
    handleScroll,
    handleLayout
  }
}

export default useSelectInternal
