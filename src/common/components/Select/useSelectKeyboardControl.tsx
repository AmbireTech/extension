import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { MenuOption } from '@common/components/Select/components/MenuOption'
import usePrevious from '@common/hooks/usePrevious'

import { SectionedSelectProps, SelectProps, SelectValue } from './types'

type Props = Pick<SelectProps, 'size' | 'value'> &
  Pick<SectionedSelectProps, 'sections'> & {
    listHeight: number
    optionHeight: number
    headerHeight: number
    isMenuOpen: boolean
    stickySectionHeadersEnabled?: boolean
    setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
    handleOptionSelect: (item: SelectValue) => void
  }

const useSelectKeyboardControl = ({
  listHeight = 0,
  optionHeight,
  headerHeight = 0,
  sections,
  value,
  size,
  isMenuOpen,
  stickySectionHeadersEnabled,
  setIsMenuOpen,
  handleOptionSelect
}: Props) => {
  const listRef: any = useRef(null)
  const highlightedItemOnMouseMoveEnabled = useRef(true)
  const scrollOffset = useRef(0)

  const prevIsMenuOpen = usePrevious(isMenuOpen)

  const selectedItemIndex = useMemo(() => {
    let index: { sectionIndex: number; optionIndex: number } | null = null

    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
      const section = sections[sectionIndex]

      for (let optionIndex = 0; optionIndex < section.data.length; optionIndex++) {
        const option = section.data[optionIndex]

        if (option.value === value.value) {
          index = { sectionIndex, optionIndex }
          break
        }
      }

      if (index) break
    }

    return index
  }, [value, sections])

  const prevSelectedItemIndex = usePrevious(selectedItemIndex)

  const [highlightedItemIndex, setHighlightedItemIndex] = useState<{
    sectionIndex: number
    optionIndex: number
  } | null>(selectedItemIndex)

  useEffect(() => {
    if (prevSelectedItemIndex && !selectedItemIndex && highlightedItemIndex) {
      setHighlightedItemIndex({ sectionIndex: 0, optionIndex: 0 })
    }
  }, [prevSelectedItemIndex, highlightedItemIndex, selectedItemIndex])

  useEffect(() => {
    if (selectedItemIndex === null) return
    if (!prevIsMenuOpen && isMenuOpen) {
      scrollOffset.current = 0
      setHighlightedItemIndex(
        selectedItemIndex.sectionIndex === 0 && selectedItemIndex.optionIndex === 0
          ? selectedItemIndex
          : null
      )
    }
  }, [prevIsMenuOpen, isMenuOpen, selectedItemIndex])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMenuOpen) return

      try {
        if (e.key === 'ArrowDown') {
          highlightedItemOnMouseMoveEnabled.current = false

          const { sectionIndex, optionIndex } = highlightedItemIndex || {
            sectionIndex: 0,
            optionIndex: -1
          }
          const optionsLength = sections[sectionIndex]?.data.length || 0

          if (sectionIndex === sections.length - 1 && optionIndex === optionsLength - 1) return

          for (let i = sectionIndex; i < sections.length; i++) {
            const options = sections[i].data
            const startIndex = i === sectionIndex ? optionIndex + 1 : 0

            const nextOption = options.slice(startIndex).find((opt) => !opt.disabled)
            if (nextOption) {
              const nextIndex = {
                sectionIndex: i,
                optionIndex: startIndex + options.slice(startIndex).indexOf(nextOption)
              }
              setHighlightedItemIndex(nextIndex)

              let offset: number = 0
              sections.forEach((section, sectionIdx) => {
                if (sectionIdx < nextIndex.sectionIndex) {
                  offset += headerHeight
                  offset += section.data.length * optionHeight
                }

                if (sectionIdx === nextIndex.sectionIndex) {
                  offset += headerHeight
                  offset += (nextIndex.optionIndex + 1) * optionHeight
                }
              })

              if (scrollOffset.current + listHeight <= offset) {
                listRef.current
                  ?.getScrollResponder()
                  ?.scrollTo({ x: 0, y: offset - listHeight, animated: false })
              }
              if (offset < scrollOffset.current) {
                listRef.current?.getScrollResponder()?.scrollTo({
                  x: 0,
                  y: offset - optionHeight - (stickySectionHeadersEnabled ? headerHeight : 0),
                  animated: false
                })
              }
              if (offset <= optionHeight) {
                listRef.current?.getScrollResponder()?.scrollTo({ x: 0, y: 0, animated: false })
              }

              return
            }
          }
        }

        if (e.key === 'ArrowUp') {
          highlightedItemOnMouseMoveEnabled.current = false

          const { sectionIndex, optionIndex } = highlightedItemIndex || {
            sectionIndex: 0,
            optionIndex: 0
          }

          if (sectionIndex === 0 && optionIndex === 0) {
            setHighlightedItemIndex({ sectionIndex: 0, optionIndex: 0 })
            listRef.current?.getScrollResponder()?.scrollTo({ x: 0, y: 0, animated: false })
          }

          for (let i = sectionIndex; i >= 0; i--) {
            const options = sections[i].data
            const startIndex = i === sectionIndex ? optionIndex - 1 : options.length - 1

            for (let j = startIndex; j >= 0; j--) {
              if (!options[j].disabled) {
                const nextIndex = { sectionIndex: i, optionIndex: j }
                setHighlightedItemIndex(nextIndex)

                let offset: number = 0
                sections.forEach((section, sectionIdx) => {
                  if (sectionIdx < nextIndex.sectionIndex) {
                    offset += headerHeight
                    offset += section.data.length * optionHeight
                  }

                  if (sectionIdx === nextIndex.sectionIndex) {
                    offset += headerHeight
                    offset += (nextIndex.optionIndex + 1) * optionHeight
                  }
                })

                if (scrollOffset.current >= offset - optionHeight) {
                  listRef.current?.getScrollResponder()?.scrollTo({
                    x: 0,
                    y: offset - optionHeight - (stickySectionHeadersEnabled ? headerHeight : 0),
                    animated: false
                  })
                }
                if (offset - optionHeight <= headerHeight) {
                  listRef.current?.getScrollResponder()?.scrollTo({ x: 0, y: 0, animated: false })
                }
                return
              }
            }
          }
        }

        if (e.repeat) return

        if (e.key === 'Enter' && highlightedItemIndex !== null) {
          const { sectionIndex, optionIndex } = highlightedItemIndex
          handleOptionSelect(sections[sectionIndex].data[optionIndex])
        }

        if (e.key === 'Escape') setIsMenuOpen(false)
      } catch (error) {
        console.error(error)
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [
    isMenuOpen,
    highlightedItemIndex,
    sections,
    handleOptionSelect,
    setIsMenuOpen,
    optionHeight,
    listHeight,
    headerHeight,
    stickySectionHeadersEnabled
  ])

  useEffect(() => {
    const handleMouseMove = () => {
      if (!highlightedItemOnMouseMoveEnabled.current)
        highlightedItemOnMouseMoveEnabled.current = true
    }

    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const handleSetHoverIn = useCallback((index: { sectionIndex: number; optionIndex: number }) => {
    if (!highlightedItemOnMouseMoveEnabled.current) return
    setHighlightedItemIndex(index)
  }, [])

  const handleSetHoverOut = useCallback(() => {
    if (!highlightedItemOnMouseMoveEnabled.current) return
    setHighlightedItemIndex(null)
  }, [])

  const renderItem = useCallback(
    ({ item, index: optionIndex, section }: { item: SelectValue; index: number; section: any }) => {
      let onHoverIn = () => {}
      let isHighlighted = false

      try {
        let sectionIndex: number

        if (sections.length === 1 && sections[0].key === 'default') {
          sectionIndex = 0
        } else {
          sectionIndex = sections.findIndex((s) => s.key === (section as any)?.key)
        }
        onHoverIn = () => handleSetHoverIn({ sectionIndex, optionIndex })

        if (
          highlightedItemIndex &&
          highlightedItemIndex.sectionIndex === sectionIndex &&
          highlightedItemIndex.optionIndex === optionIndex
        ) {
          isHighlighted = true
        }
      } catch (error) {
        console.log(error)
      }
      return (
        <MenuOption
          index={optionIndex}
          item={item}
          height={optionHeight}
          isSelected={item.value === value.value}
          isHighlighted={isHighlighted}
          onPress={handleOptionSelect}
          onHoverIn={onHoverIn}
          onHoverOut={handleSetHoverOut}
          disabled={!!item?.disabled}
          size={size}
        />
      )
    },
    [
      optionHeight,
      value.value,
      handleOptionSelect,
      size,
      highlightedItemIndex,
      handleSetHoverIn,
      handleSetHoverOut,
      sections
    ]
  )

  const handleScroll = useCallback((event: any) => {
    scrollOffset.current = event.nativeEvent.contentOffset.y
  }, [])

  return { listRef, renderItem, handleScroll }
}

export default useSelectKeyboardControl
