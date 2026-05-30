import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import DappIcon from '@common/modules/explore/components/DappIcon'
import { ManageCurrentlyConnectedApp } from '@common/modules/explore/components/ManageApp'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const CurrentApp = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const { currentDapp, isLoadingCurrentDapp } = useController('DappsController')
  const isBlacklisted = currentDapp?.blacklisted === 'BLACKLISTED'

  if (!currentDapp) return null

  return (
    // The opacity change is done to prevent layout shifting when disconnecting an app
    <View style={{ opacity: isLoadingCurrentDapp ? 0.4 : 1 }}>
      <ManageCurrentlyConnectedApp
        dapp={currentDapp}
        buttonProps={{
          style: {
            width: 40,
            height: 40,
            backgroundColor: !isBlacklisted ? theme.primaryBackground : theme.errorBackground,
            borderRadius: 20,
            ...spacings.ml,
            ...flexbox.center,
            ...(isWeb && !currentDapp.isConnected ? ({ cursor: 'default' } as any) : {})
          },
          dataSet: isBlacklisted
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
        }}
      >
        <DappIcon dapp={currentDapp} isDashboard />
      </ManageCurrentlyConnectedApp>
    </View>
  )
}

export default CurrentApp
