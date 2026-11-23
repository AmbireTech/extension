import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Control } from 'react-hook-form'
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SectionList,
  SectionListData,
  View,
  ViewStyle
} from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { useTranslation } from '@common/config/localization'
import AccountPersonalizeCard from '@common/modules/account-personalize/components/AccountPersonalizeCard'
import AccountsSectionTitle, {
  ACCOUNTS_SECTION_TITLE_HEIGHT
} from '@common/modules/account-personalize/components/AccountsSectionTitle'
import {
  AccountsRemovalNote,
  AccountToRemove
} from '@common/modules/account-personalize/components/AccountsToRemoveSection'
import { SPACING_TY, SPACING_XL } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const ADDING_SECTION_KEY = 'adding'
const ALREADY_ADDED_SECTION_KEY = 'alreadyAdded'
const REMOVING_SECTION_KEY = 'removing'

// Every row and title is of a fixed height, so the list knows where each one is without
// measuring them - on web, measuring left it unsure whether the removing section showed
const CARD_HEIGHT = 68
// The card lays its content out in a column, the row of an account being removed in a row
const CARD_STYLE: ViewStyle = { height: CARD_HEIGHT, ...flexbox.justifyCenter }
const ROW_STYLE: ViewStyle = { height: CARD_HEIGHT }
// A title under another section is apart from the accounts above it
const LATER_TITLE_HEIGHT = ACCOUNTS_SECTION_TITLE_HEIGHT + SPACING_XL
const LATER_TITLE_STYLE: ViewStyle = { height: LATER_TITLE_HEIGHT, paddingTop: SPACING_XL }
// Over the bottom of the list, with a gap above it from the account under it
const PINNED_TITLE_STYLE: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: ACCOUNTS_SECTION_TITLE_HEIGHT + SPACING_TY,
  paddingTop: SPACING_TY
}

type Field = Account & { id: string }
type Item = { kind: 'adding'; field: Field; index: number } | { kind: 'removing'; account: Account }
type Section = SectionListData<Item, { key: string }>

const keyExtractor = (item: Item) => (item.kind === 'adding' ? item.field.id : item.account.addr)

type Props = {
  fields: Field[]
  /** The fields of accounts the wallet has already, listed apart from the new ones */
  alreadyAddedAddrs: Account['addr'][]
  control: Control<{ accounts: Account[] }>
  accountsToRemove: Account[]
  isAdding: boolean
  onSaveName: (addr: Account['addr'], name: string) => Promise<void>
  removalNote: string
  ListEmptyComponent?: React.ReactElement | null
  /** Scrolls under the accounts, e.g. the details of a Safe being created */
  footer?: React.ReactElement | null
  style?: ViewStyle
}

/**
 * The accounts of the personalize step: the ones being added and the ones the wallet has
 * already, both named here, and the ones being removed. With more than one, each list gets a
 * title that sticks to the top while it scrolls, and the removing title sticks to the bottom
 * until it scrolls into view - a long list of accounts to add would hide that some are removed.
 */
const PersonalizeAccountsList = ({
  fields,
  alreadyAddedAddrs,
  control,
  accountsToRemove,
  isAdding,
  onSaveName,
  removalNote,
  ListEmptyComponent,
  footer,
  style
}: Props) => {
  const { t } = useTranslation()

  const sections = useMemo((): Section[] => {
    const alreadyAdded = new Set(alreadyAddedAddrs)
    // Named through the form, so each keeps the index of its field
    const fieldItems = fields.map((field, index) => ({ kind: 'adding' as const, field, index }))
    const newItems = fieldItems.filter(({ field }) => !alreadyAdded.has(field.addr))
    const alreadyAddedItems = fieldItems.filter(({ field }) => alreadyAdded.has(field.addr))

    const result: Section[] = []
    if (newItems.length) result.push({ key: ADDING_SECTION_KEY, data: newItems })
    if (alreadyAddedItems.length)
      result.push({ key: ALREADY_ADDED_SECTION_KEY, data: alreadyAddedItems })
    if (accountsToRemove.length) {
      result.push({
        key: REMOVING_SECTION_KEY,
        data: accountsToRemove.map((account) => ({ kind: 'removing' as const, account }))
      })
    }

    return result
  }, [fields, alreadyAddedAddrs, accountsToRemove])

  const hasMultipleSections = sections.length > 1

  const getSectionTitleHeight = useCallback(
    (section: Section) => {
      if (section !== sections[0]) return LATER_TITLE_HEIGHT
      // Removing always says so, the rest need a title only next to another section
      if (section.key === REMOVING_SECTION_KEY || hasMultipleSections)
        return ACCOUNTS_SECTION_TITLE_HEIGHT

      return 0
    },
    [sections, hasMultipleSections]
  )

  // A SectionList counts each section's title and (empty) footer as items too, so the
  // offsets step over them - telling which section shows relies on these
  const getItemLayout = useCallback(
    (_: unknown, flatIndex: number) => {
      let offset = 0
      let remaining = flatIndex

      for (const section of sections) {
        const titleHeight = getSectionTitleHeight(section)
        if (remaining === 0) return { length: titleHeight, offset, index: flatIndex }
        offset += titleHeight
        remaining -= 1

        const rowsLength = section.data.length * (CARD_HEIGHT + SPACING_TY) - SPACING_TY
        if (remaining < section.data.length) {
          const isLast = remaining === section.data.length - 1
          return {
            length: isLast ? CARD_HEIGHT : CARD_HEIGHT + SPACING_TY,
            offset: offset + remaining * (CARD_HEIGHT + SPACING_TY),
            index: flatIndex
          }
        }
        offset += rowsLength
        remaining -= section.data.length

        if (remaining === 0) return { length: 0, offset, index: flatIndex }
        remaining -= 1
      }

      return { length: 0, offset, index: flatIndex }
    },
    [sections, getSectionTitleHeight]
  )

  // Where the removing title's text starts in the list, past the gap above it
  const removingTitleOffset = useMemo(() => {
    let offset = 0
    for (const section of sections) {
      if (section.key === REMOVING_SECTION_KEY) break

      offset +=
        getSectionTitleHeight(section) +
        section.data.length * (CARD_HEIGHT + SPACING_TY) -
        SPACING_TY
    }

    return offset + SPACING_XL
  }, [sections, getSectionTitleHeight])
  // Read on every scroll, so they are kept apart from the renders
  const scrollOffsetRef = useRef(0)
  const listHeightRef = useRef(0)
  const [isRemovingTitlePinned, setIsRemovingTitlePinned] = useState(false)

  // Pinned while the title is below the bottom of the list. Worked out from the fixed heights
  // rather than from the rows the list reports in view, which lag behind the scroll on web.
  const updateIsRemovingTitlePinned = useCallback(() => {
    const visibleBottom = scrollOffsetRef.current + listHeightRef.current
    setIsRemovingTitlePinned(
      hasMultipleSections &&
        !!accountsToRemove.length &&
        !!listHeightRef.current &&
        removingTitleOffset + ACCOUNTS_SECTION_TITLE_HEIGHT > visibleBottom
    )
  }, [hasMultipleSections, accountsToRemove.length, removingTitleOffset])

  // The accounts to add can change while the screen is up (e.g. "Add more")
  useEffect(() => {
    updateIsRemovingTitlePinned()
  }, [updateIsRemovingTitlePinned])

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      listHeightRef.current = e.nativeEvent.layout.height
      updateIsRemovingTitlePinned()
    },
    [updateIsRemovingTitlePinned]
  )

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = e.nativeEvent.contentOffset.y
      updateIsRemovingTitlePinned()
    },
    [updateIsRemovingTitlePinned]
  )

  const renderItem = useCallback(
    ({ item, index, section }: { item: Item; index: number; section: Section }) => {
      const hasBottomSpacing = index !== section.data.length - 1
      if (item.kind === 'removing') {
        return (
          <AccountToRemove
            account={item.account}
            hasBottomSpacing={hasBottomSpacing}
            withBadge
            style={ROW_STYLE}
          />
        )
      }

      return (
        <AccountPersonalizeCard
          control={control}
          index={item.index}
          account={item.field}
          hasBottomSpacing={hasBottomSpacing}
          disableEdit={isAdding}
          onSaveName={onSaveName}
          style={CARD_STYLE}
        />
      )
    },
    [control, isAdding, onSaveName]
  )

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => {
      const style = section !== sections[0] ? LATER_TITLE_STYLE : undefined
      if (section.key === REMOVING_SECTION_KEY) {
        return (
          <AccountsSectionTitle
            title={t('Removing')}
            count={accountsToRemove.length}
            type="error"
            style={style}
          />
        )
      }
      // A single list of accounts to add or name needs no title
      if (!hasMultipleSections) return null

      return (
        <AccountsSectionTitle
          title={section.key === ALREADY_ADDED_SECTION_KEY ? t('Already added') : t('Adding')}
          count={section.data.length}
          style={style}
        />
      )
    },
    [sections, accountsToRemove.length, hasMultipleSections, t]
  )

  const listFooter = useMemo(
    () => (
      <>
        {!!accountsToRemove.length && <AccountsRemovalNote text={removalNote} />}
        {footer}
      </>
    ),
    [accountsToRemove.length, removalNote, footer]
  )

  return (
    // Measured here, as the list also reports the layout of its empty component as its own
    <View style={[flexbox.flex1, style]} onLayout={handleLayout}>
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        getItemLayout={getItemLayout as any}
        stickySectionHeadersEnabled={hasMultipleSections}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={listFooter}
        showsVerticalScrollIndicator={false}
        style={flexbox.flex1}
      />
      {isRemovingTitlePinned && (
        <AccountsSectionTitle
          title={t('Removing')}
          count={accountsToRemove.length}
          type="error"
          style={PINNED_TITLE_STYLE}
        />
      )}
    </View>
  )
}

export default React.memo(PersonalizeAccountsList)
