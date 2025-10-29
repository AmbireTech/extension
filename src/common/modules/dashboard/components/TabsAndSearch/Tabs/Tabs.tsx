import React, { useMemo } from 'react'
import { View } from 'react-native'

import { getCurrentAccountBanners } from '@ambire-common/libs/banners/banners'
import Spinner from '@common/components/Spinner'
import Text, { TextAppearance } from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useActivityControllerState from '@web/hooks/useActivityControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

import getStyles from './styles'
import Tab from './Tab'
import { TabType } from './Tab/Tab'

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

  const { banners } = useActivityControllerState()
  const { account } = useSelectedAccountControllerState()

  const currentAccountBanners = useMemo(() => {
    return getCurrentAccountBanners(banners, account?.addr)
  }, [banners, account])

  const pendingBanner = useMemo(() => {
    return currentAccountBanners.find((b) => b.category === 'pending-to-be-confirmed-acc-ops')
  }, [currentAccountBanners])

  const failedBanner = useMemo(() => {
    return currentAccountBanners.find((b) => b.category === 'failed-acc-ops')
  }, [currentAccountBanners])

  return (
    <View style={[styles.container]}>
      {TABS.map(({ type, tabLabel, disabled, testID }, tabIndex) => {
        const openTabIndex = TABS.findIndex((t) => t.type === openTab)
        const indexDiff = tabIndex - openTabIndex

        const isActive = openTab === type

        let customColors: [string, string] | undefined
        const withBadge = type === 'activity' && !isActive && (!!pendingBanner || !!failedBanner)
        let badge
        let badgeText
        let badgeTextAppearance: TextAppearance

        if (failedBanner) {
          badge = (
            <View
              style={{
                width: 18,
                height: 18,
                borderWidth: 2,
                borderRadius: 50,
                borderColor: theme.errorDecorative
              }}
            />
          )
          badgeText = failedBanner.meta!.accountOpsCount
          badgeTextAppearance = 'errorText'
        }

        if (pendingBanner) {
          badge = <Spinner style={{ width: 18, height: 18 }} variant="info2" />
          badgeText = pendingBanner.meta!.accountOpsCount
          badgeTextAppearance = 'info2Text'
        }

        if (type === 'activity' && !isActive && failedBanner) {
          customColors = [`${theme.errorDecorative as any}45`, `${theme.errorDecorative as any}07`]
        }

        if (type === 'activity' && !isActive && pendingBanner) {
          customColors = [`${theme.info2Decorative as any}45`, `${theme.info2Decorative as any}07`]
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
              customColors={customColors}
              style={type === 'activity' ? { width: 100 } : undefined}
            >
              {!!withBadge && (
                <View style={[spacings.mlTy, flexbox.alignCenter, flexbox.justifyCenter]}>
                  {badge}
                  <Text
                    fontSize={10}
                    weight="medium"
                    style={{ position: 'absolute' }}
                    appearance={badgeTextAppearance}
                  >
                    {badgeText}
                  </Text>
                </View>
              )}
            </Tab>
            {tabIndex !== TABS.length - 1 && (
              <View
                style={{
                  borderRightWidth: 1,
                  height: 24,
                  borderRightColor:
                    TABS[tabIndex + 1]?.type === 'activity' && (!!pendingBanner || !!failedBanner)
                      ? 'transparent'
                      : indexDiff >= 1 || indexDiff < -1
                      ? theme.secondaryBorder
                      : 'transparent'
                }}
              />
            )}
          </View>
        )
      })}
    </View>
  )
}

export default React.memo(Tabs)
