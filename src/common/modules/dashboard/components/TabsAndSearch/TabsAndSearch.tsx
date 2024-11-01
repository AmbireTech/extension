import { TFunction } from 'i18next'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Search from '@common/components/Search'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import Tabs from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tabs'
import useBanners from '@common/modules/dashboard/hooks/useBanners'
import spacings from '@common/styles/spacings'
import { getUiType } from '@web/utils/uiType'

import styles from './styles'

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

const TabsAndSearch: FC<Props> = ({ openTab, setOpenTab, searchControl }) => {
  const { t } = useTranslation()
  const allBanners = useBanners()

  return (
    <View style={[styles.container, !!allBanners.length && spacings.ptTy]}>
      <Tabs handleChangeQuery={handleChangeQuery} setOpenTab={setOpenTab} openTab={openTab} />
      {['tokens', 'collectibles', 'defi'].includes(openTab) && (
        <View style={{ margin: -2 }}>
          <Search
            containerStyle={{ flex: 1, maxWidth: isPopup ? 184 : 212 }}
            control={searchControl}
            height={32}
            placeholder={getSearchPlaceholder(openTab, t)}
          />
        </View>
      )}
    </View>
  )
}

export default React.memo(TabsAndSearch)
