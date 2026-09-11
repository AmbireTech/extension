import React, { FC } from 'react'
import { View } from 'react-native'
import { useSearchParams } from 'react-router-dom'

import { isMobile, isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import Tabs from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tabs'
import useBanners from '@common/modules/dashboard/hooks/useBanners'
import spacings from '@common/styles/spacings'

import getStyles from './styles'

interface Props {
  openTab: TabType
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  sessionId: string
}

const TabsAndSearch: FC<Props> = ({ openTab, setOpenTab, sessionId }) => {
  const [, setSearchParams] = useSearchParams()
  const { styles } = useTheme(getStyles)
  const [controllerBanners] = useBanners()
  const { minWidthSize } = useWindowSize()

  return (
    <View
      style={[
        styles.container,
        !!controllerBanners.length && spacings.ptTy,
        isWeb && minWidthSize(480) && spacings.pl,
        isMobile && spacings.ph
      ]}
    >
      <Tabs
        // Only the extension routes on the search params. On mobile the open tab lives
        // in state, and writing it would navigate the dashboard to a location that
        // differs only in its search - which re-renders the whole screen.
        handleChangeQuery={(tab) => !isMobile && setSearchParams({ tab, sessionId })}
        setOpenTab={setOpenTab}
        openTab={openTab}
      />
    </View>
  )
}

export default React.memo(TabsAndSearch)
