import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View, ViewStyle } from 'react-native'

import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import DappIcon from '@common/modules/dapp-catalog/components/DappIcon'
import ManageApp from '@common/modules/dapp-catalog/components/ManageApp'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const CurrentApp = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { currentDapp, isLoadingCurrentDapp } = useController('DappsController')
  const [isManageAppExpanded, setIsManageAppExpanded] = useState(false)
  const [isNetworkSelectorExpanded, setIsNetworkSelectorExpanded] = useState(false)
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
        isNetworkSelectorExpanded={isNetworkSelectorExpanded}
        setIsNetworkSelectorExpanded={setIsNetworkSelectorExpanded}
      />
      <View style={{ ...spacings.ml, width: 40, height: 40 }} ref={pressableRef}>
        <Pressable
          style={{
            position: 'absolute',
            top: -8,
            left: -8,
            width: 56,
            height: 56,
            borderRadius: 28,
            ...flexbox.center,
            ...(isWeb && !currentDapp.isConnected
              ? ({ cursor: 'default' } as any as ViewStyle)
              : {})
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
          disabled={!currentDapp || !currentDapp.isConnected}
          onPress={() => {
            setIsManageAppExpanded((prev) => !prev)
            setIsNetworkSelectorExpanded(false)
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              backgroundColor: !isBlacklisted ? theme.primaryBackground : theme.errorBackground,
              borderRadius: 20,
              ...flexbox.center
            }}
          >
            <DappIcon dapp={currentDapp} isDashboard />
          </View>
        </Pressable>
      </View>
    </View>
  )
}

export default CurrentApp
