import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { Pressable } from 'react-native'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import { DASHBOARD_OVERVIEW_BACKGROUND } from '@common/modules/dashboard/screens/styles'
import spacings from '@common/styles/spacings'
import { getAvatarColors } from '@common/utils/avatars'
import mixHexColors from '@common/utils/mixHexColors'
import useMainControllerState from '@web/hooks/useMainControllerState'

import getStyles from './styles'

export type TabType = 'tokens' | 'collectibles' | 'defi' | 'activity'

interface Props {
  openTab: string
  tab: TabType
  tabLabel: string
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  handleChangeQuery: (openTab: TabType) => void
  disabled?: boolean
  testID?: string
}

const Tab = ({
  openTab,
  tab,
  tabLabel,
  setOpenTab,
  handleChangeQuery,
  disabled,
  testID
}: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { selectedAccount } = useMainControllerState()
  const avatarColors = getAvatarColors(selectedAccount || '')

  const isActive = openTab === tab

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        if (disabled) return
        handleChangeQuery(tab)
        setOpenTab(tab)
      }}
    >
      <LinearGradient
        colors={
          isActive
            ? [
                DASHBOARD_OVERVIEW_BACKGROUND,
                mixHexColors(DASHBOARD_OVERVIEW_BACKGROUND, avatarColors[1], 0.8)
              ]
            : ['transparent', 'transparent']
        }
        start={{
          x: 0.0,
          y: 0
        }}
        end={{
          x: 1.0,
          y: 0.0
        }}
        locations={[0.7, 1]}
        style={[
          styles.toggleItem,
          spacings.phLg,
          {
            opacity: disabled ? 0.4 : 1,
            // @ts-ignore cursor is web only
            cursor: disabled ? 'not-allowed' : 'pointer'
          }
        ]}
      >
        <Text
          weight={isActive ? 'medium' : 'regular'}
          color={isActive ? theme.primaryBackground : theme.secondaryText}
          fontSize={16}
        >
          {t(tabLabel)}
        </Text>
      </LinearGradient>
    </Pressable>
  )
}

export default Tab
