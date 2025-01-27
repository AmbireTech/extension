import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import usePrevious from '@common/hooks/usePrevious'

import { MenuOption } from './components/MenuOption'
import { SectionedSelectProps, SelectProps, SelectValue } from './types'

type Props = {
  listHeight: number
  optionHeight: number
  headerHeight: number
  sections: SectionedSelectProps['sections']
  value: SelectProps['value']
  size: SelectProps['size']
  isMenuOpen: boolean
  stickySectionHeadersEnabled?: boolean
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>
  handleOptionSelect: (item: SelectValue) => void
}

const useSectionedSelectKeyboardControl = ({
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
    let index: [number, number] | null = null

    sections.forEach((section, idx) => {
      ;(section.data as SelectProps['options']).forEach((opt, i) => {
        if (opt.value === value.value && !index) index = [idx, i]
      })
    })

    return index
  }, [value, sections])

  const prevSelectedItemIndex = usePrevious(selectedItemIndex)

  const [highlightedItemIndex, setHighlightedItemIndex] = useState<[number, number] | null>(
    selectedItemIndex
  )

  useEffect(() => {
    if (prevSelectedItemIndex && !selectedItemIndex && highlightedItemIndex) {
      setHighlightedItemIndex([0, 0])
    }
  }, [prevSelectedItemIndex, highlightedItemIndex, selectedItemIndex])

  useEffect(() => {
    if (selectedItemIndex === null) return
    if (!prevIsMenuOpen && isMenuOpen) {
      scrollOffset.current = 0
      setHighlightedItemIndex(
        selectedItemIndex[0] === 0 && selectedItemIndex[1] === 0 ? selectedItemIndex : null
      )
    }
  }, [prevIsMenuOpen, isMenuOpen, selectedItemIndex])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isMenuOpen) return

      try {
        if (e.key === 'ArrowDown') {
          highlightedItemOnMouseMoveEnabled.current = false

          const [sectionIndex = 0, optionIndex = -1] = highlightedItemIndex || [0, -1]
          const optionsLength = sections[sectionIndex]?.data.length || 0

          if (sectionIndex === sections.length - 1 && optionIndex === optionsLength - 1) return

          for (let i = sectionIndex; i < sections.length; i++) {
            const options = sections[i].data
            const startIndex = i === sectionIndex ? optionIndex + 1 : 0

            const nextOption = options.slice(startIndex).find((opt) => !opt.disabled)
            if (nextOption) {
              const nextIndex = [i, startIndex + options.slice(startIndex).indexOf(nextOption)] as [
                number,
                number
              ]
              setHighlightedItemIndex(nextIndex)

              let offset: number = 0
              sections.forEach((section, sectionIdx) => {
                if (sectionIdx < nextIndex[0]) {
                  offset += headerHeight
                  offset += section.data.length * optionHeight
                }

                if (sectionIdx === nextIndex[0]) {
                  offset += headerHeight
                  offset += (nextIndex[1] + 1) * optionHeight
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

          const [sectionIndex, optionIndex] = highlightedItemIndex || [0, 0]

          if (sectionIndex === 0 && optionIndex === 0) {
            setHighlightedItemIndex([0, 0])
            listRef.current?.getScrollResponder()?.scrollTo({ x: 0, y: 0, animated: false })
          }

          for (let i = sectionIndex; i >= 0; i--) {
            const options = sections[i].data
            const startIndex = i === sectionIndex ? optionIndex - 1 : options.length - 1

            for (let j = startIndex; j >= 0; j--) {
              if (!options[j].disabled) {
                const nextIndex = [i, j] as [number, number]
                setHighlightedItemIndex(nextIndex)

                let offset: number = 0
                sections.forEach((section, sectionIdx) => {
                  if (sectionIdx < nextIndex[0]) {
                    offset += headerHeight
                    offset += section.data.length * optionHeight
                  }

                  if (sectionIdx === nextIndex[0]) {
                    offset += headerHeight
                    offset += (nextIndex[1] + 1) * optionHeight
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
          const [sectionIdx, optionIdx] = highlightedItemIndex
          handleOptionSelect(sections[sectionIdx].data[optionIdx])
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

  const handleSetHoverIn = useCallback((index: [number, number]) => {
    if (!highlightedItemOnMouseMoveEnabled.current) return
    setHighlightedItemIndex(index)
  }, [])

  const handleSetHoverOut = useCallback(() => {
    if (!highlightedItemOnMouseMoveEnabled.current) return
    setHighlightedItemIndex(null)
  }, [])

  const renderItem = useCallback(
    ({ item, index, section }: { item: SelectValue; index: number; section: any }) => {
      let onHoverIn = () => {}
      let isHighlighted = false

      try {
        const sectionIndex = sections.findIndex((s) => s.title === (section as any)?.title)
        onHoverIn = () => handleSetHoverIn([sectionIndex, index])

        if (
          highlightedItemIndex &&
          highlightedItemIndex[0] === sectionIndex &&
          highlightedItemIndex[1] === index
        ) {
          isHighlighted = true
        }
      } catch (error) {
        console.log(error)
      }
      return (
        <MenuOption
          index={index}
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

  const handleScroll = (event: any) => {
    scrollOffset.current = event.nativeEvent.contentOffset.y
  }

  return { listRef, renderItem, handleScroll }
}

export default useSectionedSelectKeyboardControl
