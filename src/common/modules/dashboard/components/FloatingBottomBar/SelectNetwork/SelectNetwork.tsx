import React, { useCallback } from 'react'
import { Pressable, View } from 'react-native'
import { useSearchParams } from 'react-router-dom'

import NetworksIcon from '@common/assets/svg/NetworksIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import getTokenIconStyles from '@common/components/TokenIcon/styles'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import flexbox from '@common/styles/utils/flexbox'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  /** The dashboard tab the button is shown on. Only names it for the e2e tests. */
  currentTab?: TabType
}

/** Opens the networks page, badged with the network the dashboard is filtered by. */
const selectDashboardNetworkFilter = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.dashboardNetworkFilter

const SelectNetwork = ({ currentTab }: Props) => {
  const { styles: tokenIconStyles } = useTheme(getTokenIconStyles)
  const { state: dashboardNetworkFilter } = useController(
    'SelectedAccountController',
    selectDashboardNetworkFilter
  )
  const { navigate } = useNavigation()
  const { theme } = useTheme()
  const [searchParams] = useSearchParams()

  const handlePress = useCallback(() => {
    const urlParams = new URLSearchParams(searchParams)

    const url = urlParams
      ? `${WEB_ROUTES.networks}?prevSearchParams=${encodeURIComponent(urlParams.toString())}`
      : WEB_ROUTES.networks

    navigate(url)
  }, [searchParams])

  return (
    <Pressable
      testID={`networks-dropdown-${currentTab}`}
      style={{
        width: 40,
        height: 40,
        backgroundColor: theme.primaryBackground,
        borderRadius: 20,
        ...flexbox.center
      }}
      onPress={handlePress}
    >
      <NetworksIcon width={24} height={24} />
      {dashboardNetworkFilter && (
        <View
          style={[
            tokenIconStyles.networkIconWrapper,
            { left: -5, top: -2, borderWidth: 1, borderColor: theme.neutral100 }
          ]}
        >
          <NetworkIcon
            id={dashboardNetworkFilter.toString()}
            size={17}
            style={tokenIconStyles.networkIcon}
          />
        </View>
      )}
    </Pressable>
  )
}

export default React.memo(SelectNetwork)
