import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import DashboardIcon from '@assets/svg/DashboardIcon'
import EarnIcon from '@assets/svg/EarnIcon'
import GasTankIcon from '@assets/svg/GasTankIcon'
import SendIcon from '@assets/svg/SendIcon'
import TransferIcon from '@assets/svg/TransferIcon'
import Text from '@modules/common/components/Text'
import { TAB_BAR_HEIGHT } from '@modules/common/constants/router'
import useNavigation from '@modules/common/hooks/useNavigation'
import useRoute from '@modules/common/hooks/useRoute'
import colors from '@modules/common/styles/colors'
import { IS_SCREEN_SIZE_L } from '@modules/common/styles/spacings'
import flexbox from '@modules/common/styles/utils/flexbox'

import { ROUTES } from '../routesConfig'
import styles from '../styles'

const tabsIconSize = IS_SCREEN_SIZE_L ? 44 : 24

interface ItemProps {
  Icon: React.FC<any>
  title: string
  name: ROUTES
  isActive: boolean
}

let Item: React.FC<ItemProps> = ({ Icon, title, name, isActive }) => {
  const { navigate } = useNavigation()

  const handleOnPress = () => navigate(name)

  return (
    <TouchableOpacity
      style={[
        {
          height: TAB_BAR_HEIGHT,
          flex: 1,
          alignItems: 'center',
          paddingVertical: 15
        },
        isActive && { backgroundColor: colors.howl_65 }
      ]}
      onPress={handleOnPress}
    >
      <View
        style={{
          marginBottom: 5
        }}
      >
        <Icon
          width={tabsIconSize}
          height={tabsIconSize}
          color={isActive ? colors.heliotrope : colors.titan}
        />
      </View>
      <Text fontSize={10}>{title}</Text>
    </TouchableOpacity>
  )
}

Item = React.memo(Item)

const BottomNav = () => {
  const route = useRoute()
  const { pathname } = route

  return (
    <View style={[styles.tabBarContainerWeb]}>
      <View style={[styles.backdropBlurWrapper]}>
        <View style={flexbox.directionRow}>
          <Item
            name={ROUTES.dashboard}
            isActive={pathname === `/${ROUTES.dashboard}`}
            Icon={DashboardIcon}
            title="Dashboard"
          />
          <Item
            name={ROUTES.earn}
            isActive={pathname === `/${ROUTES.earn}`}
            Icon={EarnIcon}
            title="Earn"
          />
          <Item
            name={ROUTES.send}
            isActive={pathname === `/${ROUTES.send}`}
            Icon={SendIcon}
            title="Send"
          />
          <Item
            name={ROUTES.transactions}
            isActive={pathname === `/${ROUTES.transactions}`}
            Icon={TransferIcon}
            title="Transactions"
          />

          <Item
            name={ROUTES.gasTank}
            isActive={pathname === `/${ROUTES.gasTank}`}
            Icon={GasTankIcon}
            title="Gas Tank"
          />
        </View>
      </View>
    </View>
  )
}

export default React.memo(BottomNav)
