import React, { FC, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { useSearchParams } from 'react-router-dom'

import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import Tabs from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tabs'
import useBanners from '@common/modules/dashboard/hooks/useBanners'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import SelectNetwork from './SelectNetwork'
import getStyles from './styles'

interface Props {
  openTab: TabType
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  currentTab: TabType
  sessionId: string
}

const TABS = ['tokens', 'collectibles', 'defi', 'activity']

const TabsAndSearch: FC<Props> = ({ openTab, setOpenTab, currentTab, sessionId }) => {
  const [, setSearchParams] = useSearchParams()
  const searchRef = useRef<any>(null)
  const searchButtonRef = useRef<any>(null)
  const { styles } = useTheme(getStyles)
  const [controllerBanners] = useBanners()
  const [isSearchVisible, setIsSearchVisible] = useState(false)
  const { maxWidthSize, minWidthSize } = useWindowSize()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Don't close the search if the user clicked on the search button because
      // the button toggles the search visibility.
      const clickedToOpenSearch =
        searchButtonRef.current && searchButtonRef.current.contains(e.target as Node)
      const clickedOnSearch = searchRef.current && searchRef.current.contains(e.target as Node)

      if (!isSearchVisible || clickedToOpenSearch || clickedOnSearch) return

      setIsSearchVisible(false)
    }

    window.addEventListener('mousedown', onClick, { passive: true })

    return () => {
      window.removeEventListener('mousedown', onClick)
    }
  }, [isSearchVisible])

  return (
    <View
      style={[
        styles.container,
        !!controllerBanners.length && spacings.ptTy,
        minWidthSize(480) && spacings.pl
      ]}
    >
      <Tabs
        handleChangeQuery={(tab) => setSearchParams({ tab, sessionId })}
        setOpenTab={setOpenTab}
        openTab={openTab}
      />
      {maxWidthSize(480) && TABS.includes(openTab) && (
        <View style={[flexbox.directionRow, flexbox.justifySpaceBetween, flexbox.alignCenter]}>
          <SelectNetwork currentTab={currentTab} />
        </View>
      )}
    </View>
  )
}

export default React.memo(TabsAndSearch)
