import React, { useMemo } from 'react'
import { ColorValue, View } from 'react-native'

import {
  defiPositionsOnDisabledNetworksBannerId,
  getCurrentAccountBanners
} from '@ambire-common/libs/banners/banners'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'
import Tab from './Tab'
import { TabType } from './Tab/Tab'

import type { ActivityController } from '@ambire-common/controllers/activity/activity'
import type { SelectedAccountController } from '@ambire-common/controllers/selectedAccount/selectedAccount'

// The tabs row is rendered above the dashboard pages on mobile, so it must not
// re-render on every controller update it isn't reading anything from.
const selectActivityBanners = (state: ActivityController) => state.banners
const selectAccountAddr = (state: SelectedAccountController) => state.account?.addr
const selectSelectedAccountBanners = (state: SelectedAccountController) => state.banners

interface Props {
  openTab: TabType
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  handleChangeQuery: (openTab: string) => void
}

const TABS: {
  type: TabType
  tabLabel: string
  disabled?: boolean
  testID?: string
}[] = [
  {
    testID: 'tab-tokens',
    type: 'tokens',
    tabLabel: 'Tokens'
  },
  {
    testID: 'tab-nft',
    type: 'collectibles',
    tabLabel: 'NFT'
  },
  {
    testID: 'tab-defi',
    type: 'defi',
    tabLabel: 'DeFi'
  },
  {
    testID: 'tab-activity',
    type: 'activity',
    tabLabel: 'Activity'
  }
]

const Tabs: React.FC<Props> = ({ openTab, setOpenTab, handleChangeQuery }) => {
  const { styles, theme } = useTheme(getStyles)
  const { minWidthSize } = useWindowSize()
  const { state: banners } = useController('ActivityController', selectActivityBanners)
  const { state: accountAddr } = useController('SelectedAccountController', selectAccountAddr)
  const { state: defiBanners } = useController(
    'SelectedAccountController',
    selectSelectedAccountBanners
  )

  const currentDefiBanners = useMemo(
    () =>
      getCurrentAccountBanners(defiBanners, accountAddr).filter(
        ({ id }) => id === defiPositionsOnDisabledNetworksBannerId
      ),
    [defiBanners, accountAddr]
  )

  const currentAccountBanners = useMemo(() => {
    return getCurrentAccountBanners(banners, accountAddr)
  }, [banners, accountAddr])

  const pendingBanner = useMemo(() => {
    return currentAccountBanners.find((b) => b.category === 'pending-to-be-confirmed-acc-ops')
  }, [currentAccountBanners])

  const failedBanner = useMemo(() => {
    return currentAccountBanners.find((b) => b.category === 'failed-acc-ops')
  }, [currentAccountBanners])

  return (
    <View
      style={[
        styles.container,
        minWidthSize(480) && { flex: 1 },
        minWidthSize(480) && flexbox.justifySpaceBetween
      ]}
    >
      {TABS.map(({ type, tabLabel, disabled, testID }, tabIndex) => {
        const isActive = openTab === type

        const withBadge =
          (type === 'activity' && !isActive && (!!pendingBanner || !!failedBanner)) ||
          (type === 'defi' && currentDefiBanners.length > 0)
        let badgeText
        let badgeTextAppearance: ColorValue | undefined
        let badgeBorderColor: ColorValue | undefined

        if (type === 'activity') {
          if (failedBanner) {
            badgeBorderColor = theme.errorDecorative
            badgeText = failedBanner.meta!.accountOpsCount
            badgeTextAppearance = theme.errorText
          }

          if (pendingBanner) {
            badgeText = pendingBanner.meta!.accountOpsCount
            badgeTextAppearance = theme.info300
          }
        }

        if (type === 'defi' && currentDefiBanners.length > 0) {
          badgeBorderColor = theme.info300
          badgeTextAppearance = theme.info300
          badgeText = 1
        }

        return (
          <View key={type} style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Tab
              testID={testID}
              openTab={openTab}
              tab={type}
              tabLabel={tabLabel}
              setOpenTab={setOpenTab}
              handleChangeQuery={handleChangeQuery}
              disabled={disabled}
            >
              {!!withBadge && (
                <View
                  style={[
                    flexbox.alignCenter,
                    flexbox.justifyCenter,
                    {
                      // 6 because of the border of the badge
                      marginLeft: 6,
                      width: 18,
                      height: 18
                    }
                  ]}
                >
                  {type === 'activity' && !!pendingBanner ? (
                    <Spinner
                      style={{ width: '100%', height: '100%', position: 'absolute' }}
                      variant="info"
                    />
                  ) : (
                    <View
                      style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        borderRadius: 50,
                        borderWidth: 2,
                        borderColor: badgeBorderColor
                      }}
                    />
                  )}
                  <Text
                    fontSize={10}
                    color={badgeTextAppearance}
                    style={{ marginTop: 2, lineHeight: 12 }}
                  >
                    {badgeText}
                  </Text>
                </View>
              )}
            </Tab>
          </View>
        )
      })}
    </View>
  )
}

export default React.memo(Tabs)
