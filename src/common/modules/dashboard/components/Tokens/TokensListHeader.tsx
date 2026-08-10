import React from 'react'
import { View } from 'react-native'

import useTheme from '@common/hooks/useTheme'

import TabsAndSearch from '../TabsAndSearch'
import { TabType } from '../TabsAndSearch/Tabs/Tab/Tab'

type Props = {
  openTab: TabType
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  sessionId: string
}

const TokensListHeader = ({ openTab, setOpenTab, sessionId }: Props) => {
  const { theme } = useTheme()

  return (
    <View style={{ backgroundColor: theme.primaryBackground }}>
      <TabsAndSearch
        openTab={openTab}
        setOpenTab={setOpenTab}
        currentTab="tokens"
        sessionId={sessionId}
      />
    </View>
  )
}

export default React.memo(TokensListHeader)
