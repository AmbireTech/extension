import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, View, ViewStyle } from 'react-native'

import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

export type TabType = 'tokens' | 'collectibles' | 'defi' | 'activity'

interface Props {
  openTab: string
  tab: TabType
  tabLabel: string
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  handleChangeQuery: (openTab: TabType) => void
  disabled?: boolean
  testID?: string
  style?: ViewStyle
  children?: ReactNode
}

const Tab = ({
  openTab,
  tab,
  tabLabel,
  setOpenTab,
  handleChangeQuery,
  disabled,
  testID,
  style,
  children
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const isActive = openTab === tab
  const leftSpacing = tab === 'tokens' ? 0 : SPACING_TY
  const rightSpacing = tab === 'activity' ? 0 : SPACING_TY

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        if (disabled) return
        handleChangeQuery(tab)
        setOpenTab(tab)
      }}
      style={[
        {
          paddingLeft: leftSpacing,
          paddingRight: rightSpacing
        }
      ]}
    >
      {({ hovered }: any) => (
        <View
          style={{
            borderBottomColor: isActive ? theme.primaryText : 'transparent',
            borderBottomWidth: 2
          }}
        >
          <View style={[flexbox.directionRow, style]}>
            <Text
              weight="medium"
              color={isActive || hovered ? theme.primaryText : theme.neutral500}
              fontSize={16}
            >
              {t(tabLabel)}
            </Text>
            {children}
          </View>
        </View>
      )}
    </Pressable>
  )
}

export default Tab
