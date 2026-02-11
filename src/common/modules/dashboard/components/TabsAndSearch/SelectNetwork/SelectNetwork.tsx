import React, { useMemo } from 'react'
import { View } from 'react-native'
import { useSearchParams } from 'react-router-dom'

import FilterIcon from '@common/assets/svg/FilterIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { AnimatedPressable, DURATIONS, useMultiHover } from '@web/hooks/useHover'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

const { isPopup } = getUiType()

const maxNetworkNameLengths = {
  popUp: 11,
  tab: 8
} as const

interface Props {
  currentTab: TabType
}

const SelectNetwork = ({ currentTab }: Props) => {
  const { styles } = useTheme(getStyles)
  const { t } = useTranslation()
  const { dashboardNetworkFilter } = useSelectedAccountControllerState()
  const { navigate } = useNavigation()
  const {
    state: { networks }
  } = useController('NetworksController')
  const { theme } = useTheme()
  const [searchParams] = useSearchParams()

  const [bindNetworkButtonAnim, networkButtonAnimStyle, isHovered] = useMultiHover({
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

  const filterByNetworkName = useMemo(() => {
    if (!dashboardNetworkFilter) return ''

    if (dashboardNetworkFilter === 'rewards') return t('Ambire Rewards Portfolio')
    if (dashboardNetworkFilter === 'gasTank') return t('Gas Tank Portfolio')

    const network = networks.find((n) => n.chainId.toString() === dashboardNetworkFilter.toString())

    let networkName = network?.name ?? t('Unknown Network') ?? 'Unknown Network'

    const maxNetworkNameLength = maxNetworkNameLengths[isPopup ? 'popUp' : 'tab']

    if (networkName.length > maxNetworkNameLength) {
      networkName = `${networkName.slice(0, maxNetworkNameLength)}...`
    }

    networkName = `${networkName} ${!isPopup ? t('Portfolio') : ''}`

    return networkName
  }, [dashboardNetworkFilter, networks, t])

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        {
          width: 168
        }
      ]}
    >
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
              borderColor: theme.primary,
              backgroundColor: theme.infoBackground
            })
          }
        ]}
        onPress={() => {
          const urlParams = new URLSearchParams(searchParams)

          const url = urlParams
            ? `${WEB_ROUTES.networks}?prevSearchParams=${encodeURIComponent(urlParams.toString())}`
            : WEB_ROUTES.networks

          navigate(url)
        }}
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
