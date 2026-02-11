import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useDappsControllerState from '@web/hooks/useDappsControllerState'
import DappIcon from '@web/modules/dapp-catalog/components/DappIcon'
import ManageApp from '@web/modules/dapp-catalog/components/ManageApp'

const CurrentApp = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { currentDapp, isLoadingCurrentDapp } = useDappsControllerState()
  const [isManageAppExpanded, setIsManageAppExpanded] = useState(false)
  const isBlacklisted = currentDapp?.blacklisted === 'BLACKLISTED'
  const pressableRef = useRef<View>(null)

  if (!currentDapp) return null

  return (
    // Wrap on purpose so ManageApp is outside the pressable
    // The opacity change is done to prevent layout shifting when disconnecting an app
    <View style={{ opacity: isLoadingCurrentDapp ? 0.4 : 1 }}>
      <ManageApp
        dapp={currentDapp}
        isOpen={isManageAppExpanded}
        setIsOpen={setIsManageAppExpanded}
        parentRef={pressableRef}
      />
      <Pressable
        style={{
          width: 40,
          height: 40,
          backgroundColor: !isBlacklisted ? theme.secondaryBackground : theme.errorBackground,
          borderRadius: 20,
          ...spacings.ml,
          ...flexbox.center
        }}
        dataSet={
          isBlacklisted
            ? createGlobalTooltipDataSet({
                id: 'blacklisted-app-tooltip',
                content: t('Blacklisted app!'),
                delayShow: 200,
                border: `1px solid ${theme.errorDecorative as string}`,
                style: {
                  fontSize: 12,
                  backgroundColor: theme.errorBackground as string,
                  padding: SPACING_TY,
                  color: theme.errorDecorative as string
                }
              })
            : {}
        }
        ref={pressableRef}
        disabled={!currentDapp || !currentDapp.isConnected}
        onPress={() => {
          setIsManageAppExpanded((prev) => !prev)
        }}
      >
        <DappIcon dapp={currentDapp} withNetworkIcon />
      </Pressable>
    </View>
  )
}

export default CurrentApp
