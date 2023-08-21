import React, { useCallback, useContext, useEffect, useState } from 'react'
import { View } from 'react-native'

import Search from '@common/components/Search'
import Text from '@common/components/Text'
import Wrapper from '@common/components/Wrapper'
import { useTranslation } from '@common/config/localization'
import useRelayerData from '@common/hooks/useRelayerData'
import {
  AssetsToggleContext,
  AssetsToggleProvider
} from '@common/modules/dashboard/contexts/assetsToggleContext'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useMainControllerState from '@web/hooks/useMainControllerState'

import Assets from '../components/Assets'
import Routes from '../components/Routes'
import styles from './styles'

const DashboardScreen = () => {
  const mainCtrl = useMainControllerState()
  const [gasTankAndRewardsState, setGasTankAndRewardsState] = useState({})

  const fetchGasTankAndRewardsData = useCallback(async () => {
    // TODO: sync with to display the tokens in another PR
    const res = await useRelayerData(`/v2/identity/${mainCtrl.selectedAccount}/info`)
    if (res.data) {
      setGasTankAndRewardsState(res.data)
    }
  }, [])

  useEffect(() => {
    fetchGasTankAndRewardsData()
  }, [fetchGasTankAndRewardsData])

  const { type } = useContext(AssetsToggleContext)
  // TODO: Remove this as is hardcoded, for displaying purposes.
  const tokens = [
    {
      address: '0x88800092ff476844f74dc2fc427974bbee2794ae',
      decimals: 18,
      symbol: 'WALLET',
      name: 'Ambire Wallet',
      network: 'ethereum',
      balance: 132366,
      balanceRaw: '132366000000000000000000',
      balanceUSD: 1023.9370479
    },
    {
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
      symbol: 'ETH',
      name: 'Ethereum',
      network: 'ethereum',
      balance: 0.002232367622731011,
      balanceRaw: '2232367622731011',
      balanceUSD: 4.093380891420718
    },
    {
      address: '0x47cd7e91c3cbaaf266369fe8518345fc4fc12935',
      decimals: 18,
      symbol: 'XWALLET',
      network: 'ethereum',
      name: 'Ambire Wallet Staking Token',
      balance: 9585.375931938657,
      balanceRaw: '9585375931938656910241',
      balanceUSD: 1252.044480833632
    }
  ]

  const { t } = useTranslation()
  const totalBalance = 20500.9
  return (
    <Wrapper contentContainerStyle={[spacings.pv0, spacings.ph0]} style={styles.container}>
      <View
        style={[flexbox.directionRow, flexbox.justifySpaceBetween, spacings.phSm, spacings.pvSm]}
      >
        <View>
          <Text color={colors.martinique_65} shouldScale={false} weight="regular" fontSize={16}>
            {t('Balance')}
          </Text>
          <View style={[flexbox.directionRow, flexbox.alignEnd]}>
            <Text fontSize={30} shouldScale={false} style={{ lineHeight: 34 }} weight="regular">
              $ {Number(totalBalance.toFixed(2).split('.')[0]).toLocaleString('en-US')}
            </Text>
            <Text fontSize={20} shouldScale={false} weight="regular">
              .{Number(totalBalance.toFixed(2).split('.')[1])}
            </Text>
          </View>
        </View>
        <Routes />
      </View>
      <View style={[flexbox.flex1]}>
        <View style={[flexbox.directionRow, spacings.ph, flexbox.justifySpaceBetween]}>
          <AssetsToggleProvider />
          <Search />
        </View>

        <Assets tokens={tokens} type={type} />
      </View>
    </Wrapper>
  )
}

export default DashboardScreen
