import React, { useCallback, useMemo } from 'react'
import { Pressable, View } from 'react-native'
import { useSearchParams } from 'react-router-dom'

import FilterIcon from '@common/assets/svg/FilterIcon'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import getTokenIconStyles from '@common/components/TokenIcon/styles'
import { isMobile, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { AnimatedPressable, DURATIONS, useMultiHover } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

import getStyles from './styles'

const { isPopup } = getUiType()

const maxNetworkNameLengths = {
  popUp: 11,
  tab: 8
} as const

interface Props {
  currentTab?: TabType
}

const SelectNetwork = ({ currentTab }: Props) => {
  const { styles } = useTheme(getStyles)
  const { styles: tokenIconStyles } = useTheme(getTokenIconStyles)
  const { t } = useTranslation()
  const {
    state: { dashboardNetworkFilter }
  } = useController('SelectedAccountController')
  const { navigate } = useNavigation()
  const {
    state: { networks }
  } = useController('NetworksController')
  const { theme } = useTheme()
  const [searchParams] = useSearchParams()

  const [bindNetworkButtonAnim, networkButtonAnimStyle] = useMultiHover({
    values: [
      {
        property: 'backgroundColor',
        from: theme.secondaryBackground,
        to: theme.tertiaryBackground,
        duration: DURATIONS.REGULAR
      }
    ]
  })

  const filterByNetworkName = useMemo(() => {
    if (!dashboardNetworkFilter) return ''
    tokenIconStyles
    const network = networks.find((n) => n.chainId.toString() === dashboardNetworkFilter.toString())

    let networkName = network?.name ?? t('Unknown Network') ?? 'Unknown Network'

    const maxNetworkNameLength = maxNetworkNameLengths[isPopup ? 'popUp' : 'tab']

    if (networkName.length > maxNetworkNameLength) {
      networkName = `${networkName.slice(0, maxNetworkNameLength)}...`
    }

    return networkName
  }, [dashboardNetworkFilter, networks, t])

  const handlePress = useCallback(() => {
    const urlParams = new URLSearchParams(searchParams)

    const url = urlParams
      ? `${WEB_ROUTES.networks}?prevSearchParams=${encodeURIComponent(urlParams.toString())}`
      : WEB_ROUTES.networks

    navigate(url)
  }, [searchParams])

  if (isMobile) {
    return (
      <Pressable
        style={{
          width: 40,
          height: 40,
          backgroundColor: theme.primaryBackground,
          borderRadius: 20,
          ...flexbox.center
        }}
        onPress={handlePress}
      >
        <NetworksIcon width={24} height={24} color={theme.iconPrimary} />
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

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, { width: 168 }]}>
      <AnimatedPressable
        style={[
          styles.container,
          flexbox.directionRow,
          flexbox.justifySpaceBetween,
          flexbox.alignCenter,
          networkButtonAnimStyle,
          spacings.phSm,
          {
            ...(dashboardNetworkFilter && {
              color: theme.primaryText,
              borderColor: theme.neutral400
            })
          }
        ]}
        onPress={handlePress}
        {...bindNetworkButtonAnim}
      >
        {dashboardNetworkFilter ? (
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <FilterIcon color={theme.primaryText} style={spacings.prTy} width={16} height={16} />
            <Text testID={`networks-dropdown-${currentTab}`}>{filterByNetworkName}</Text>
          </View>
        ) : (
          <Text testID={`networks-dropdown-${currentTab}`}>{t('All Networks')}</Text>
        )}
        <RightArrowIcon height={12} color={theme.iconPrimary} />
      </AnimatedPressable>
    </View>
  )
}

export default React.memo(SelectNetwork)
