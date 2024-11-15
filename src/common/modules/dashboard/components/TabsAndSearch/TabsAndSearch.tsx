import { TFunction } from 'i18next'
import React, { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import SearchIcon from '@common/assets/svg/SearchIcon'
import Search from '@common/components/Search'
import useTheme from '@common/hooks/useTheme'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import Tabs from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tabs'
import useBanners from '@common/modules/dashboard/hooks/useBanners'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { AnimatedPressable, useMultiHover } from '@web/hooks/useHover'
import DURATIONS from '@web/hooks/useHover/durations'
import { getUiType } from '@web/utils/uiType'

import SelectNetwork from './SelectNetwork'
import getStyles from './styles'

const { isPopup } = getUiType()

const getSearchPlaceholder = (openTab: TabType, t: TFunction) => {
  if (isPopup) {
    return t('Search')
  }

  if (openTab === 'tokens') return t('Search for tokens')
  if (openTab === 'collectibles') return t('Search for NFTs')
  if (openTab === 'defi') return t('Search for DeFi positions')

  return t('Search')
}

interface Props {
  openTab: TabType
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  searchControl: any
}

// We want to change the query param without refreshing the page.
const handleChangeQuery = (tab: string) => {
  if (window.location.href.includes('?tab=')) {
    window.history.pushState(null, '', `${window.location.href.split('?')[0]}?tab=${tab}`)
    return
  }

  window.history.pushState(null, '', `${window.location.href}?tab=${tab}`)
}

const TabsAndSearch: FC<Props> = ({ openTab, setOpenTab, searchControl }: Props) => {
  const { styles, theme } = useTheme(getStyles)
  const { t } = useTranslation()
  const allBanners = useBanners()
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const [bindControlPositionAnim, controlPositionStyles] = useMultiHover({
    values: [
      {
        property: 'backgroundColor',
        from: theme.secondaryBackground,
        to: theme.tertiaryBackground,
        duration: DURATIONS.REGULAR
      },
      {
        property: 'borderColor',
        from: theme.secondaryBorder,
        to: theme.tertiaryText,
        duration: DURATIONS.REGULAR
      }
    ]
  })

  return (
    <View style={[styles.container, !!allBanners.length && spacings.ptTy]}>
      <Tabs handleChangeQuery={handleChangeQuery} setOpenTab={setOpenTab} openTab={openTab} />
      {['tokens', 'collectibles', 'defi'].includes(openTab) && (
        <View style={[flexbox.directionRow, flexbox.justifySpaceBetween, flexbox.alignCenter]}>
          <SelectNetwork />
          <AnimatedPressable
            onPress={() => setIsSearchVisible((prev: boolean) => !prev)}
            style={[
              styles.searchIconWrapper,
              controlPositionStyles,
              {
                ...(isSearchVisible && {
                  borderColor: theme.primary,
                  backgroundColor: theme.infoBackground
                })
              }
            ]}
            onHoverIn={bindControlPositionAnim.onHoverIn}
            onHoverOut={bindControlPositionAnim.onHoverOut}
          >
            <SearchIcon color={theme.tertiaryText} width={16} />
          </AnimatedPressable>
          {isSearchVisible && (
            <Search
              containerStyle={[styles.searchContainer]}
              inputWrapperStyle={[styles.searchInputWrapper]}
              control={searchControl}
              height={32}
              placeholder={getSearchPlaceholder(openTab, t)}
              hasLeftIcon={false}
            />
          )}
        </View>
      )}
    </View>
  )
}

export default React.memo(TabsAndSearch)
