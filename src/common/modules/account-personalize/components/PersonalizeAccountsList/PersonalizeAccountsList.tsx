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
const REMOVING_SECTION_KEY = 'removing'

// Every row and title is of a fixed height, so the list knows where each one is without
// measuring them - on web, measuring left it unsure whether the removing section showed
const CARD_HEIGHT = 68
// The card lays its content out in a column, the row of an account being removed in a row
const CARD_STYLE: ViewStyle = { height: CARD_HEIGHT, ...flexbox.justifyCenter }
const ROW_STYLE: ViewStyle = { height: CARD_HEIGHT }
// The removing title is apart from the accounts being added above it
const REMOVING_TITLE_HEIGHT = ACCOUNTS_SECTION_TITLE_HEIGHT + SPACING_XL
const REMOVING_TITLE_STYLE: ViewStyle = { height: REMOVING_TITLE_HEIGHT, paddingTop: SPACING_XL }
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
  control: Control<{ accounts: Account[] }>
  accountsToRemove: Account[]
  isAdding: boolean
  onSaveName: (addr: Account['addr'], name: string) => Promise<void>
  removalNote: string
  ListEmptyComponent?: React.ReactElement | null
  style?: ViewStyle
}

/**
 * The accounts of the personalize step: the ones being added, named here, and the ones being
 * removed. With both, each list gets a title that sticks to the top while it scrolls, and
 * the removing title sticks to the bottom until it scrolls into view - a long list of
 * accounts to add would hide that some are removed.
 */
const PersonalizeAccountsList = ({
  fields,
  control,
  accountsToRemove,
  isAdding,
  onSaveName,
  removalNote,
  ListEmptyComponent,
  style
}: Props) => {
  const { t } = useTranslation()
  const hasBothSections = !!fields.length && !!accountsToRemove.length

  const sections = useMemo((): Section[] => {
    const result: Section[] = []
    if (fields.length) {
      result.push({
        key: ADDING_SECTION_KEY,
        data: fields.map((field, index) => ({ kind: 'adding' as const, field, index }))
      })
    }
    if (accountsToRemove.length) {
      result.push({
        key: REMOVING_SECTION_KEY,
        data: accountsToRemove.map((account) => ({ kind: 'removing' as const, account }))
      })
    }

    return result
  }, [fields, accountsToRemove])

  const getSectionTitleHeight = useCallback(
    (section: Section) => {
      if (section.key === REMOVING_SECTION_KEY) {
        return fields.length ? REMOVING_TITLE_HEIGHT : ACCOUNTS_SECTION_TITLE_HEIGHT
      }

      return hasBothSections ? ACCOUNTS_SECTION_TITLE_HEIGHT : 0
    },
    [fields.length, hasBothSections]
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
  const removingTitleOffset =
    ACCOUNTS_SECTION_TITLE_HEIGHT +
    fields.length * (CARD_HEIGHT + SPACING_TY) -
    SPACING_TY +
    SPACING_XL
  // Read on every scroll, so they are kept apart from the renders
  const scrollOffsetRef = useRef(0)
  const listHeightRef = useRef(0)
  const [isRemovingTitlePinned, setIsRemovingTitlePinned] = useState(false)

  // Pinned while the title is below the bottom of the list. Worked out from the fixed heights
  // rather than from the rows the list reports in view, which lag behind the scroll on web.
  const updateIsRemovingTitlePinned = useCallback(() => {
    const visibleBottom = scrollOffsetRef.current + listHeightRef.current
    setIsRemovingTitlePinned(
      hasBothSections &&
        !!listHeightRef.current &&
        removingTitleOffset + ACCOUNTS_SECTION_TITLE_HEIGHT > visibleBottom
    )
  }, [hasBothSections, removingTitleOffset])

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
      if (section.key === REMOVING_SECTION_KEY) {
        return (
          <AccountsSectionTitle
            title={t('Removing')}
            count={accountsToRemove.length}
            type="error"
            style={fields.length ? REMOVING_TITLE_STYLE : undefined}
          />
        )
      }
      // Adding only needs no title
      if (!hasBothSections) return null

      return <AccountsSectionTitle title={t('Adding')} count={fields.length} />
    },
    [accountsToRemove.length, fields.length, hasBothSections, t]
  )

  const listFooter = useMemo(
    () => (accountsToRemove.length ? <AccountsRemovalNote text={removalNote} /> : null),
    [accountsToRemove.length, removalNote]
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
        stickySectionHeadersEnabled={hasBothSections}
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
