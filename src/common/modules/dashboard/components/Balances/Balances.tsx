import networks, { NetworkId } from 'ambire-common/src/constants/networks'
import { UseAccountsReturnType } from 'ambire-common/src/hooks/useAccounts'
import useCacheBreak from 'ambire-common/src/hooks/useCacheBreak'
import { Balance, UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio/types'
import React, { useCallback, useLayoutEffect, useMemo } from 'react'
import { TouchableOpacity, View } from 'react-native'

import GasTankIcon from '@common/assets/svg/GasTankIcon'
import ReceiveIcon from '@common/assets/svg/ReceiveIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import Button from '@common/components/Button'
import NetworkIcon from '@common/components/NetworkIcon'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import CONFIG from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import usePrivateMode from '@common/hooks/usePrivateMode'
import useRelayerData from '@common/hooks/useRelayerData'
import { ROUTES } from '@common/modules/router/constants/common'
import { triggerLayoutAnimation } from '@common/services/layoutAnimation'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import styles from './styles'

const networkDetails = (network: any) => networks.find(({ id }) => id === network)

interface Props {
  balanceTruncated: any
  balanceDecimals: any
  allBalances: UsePortfolioReturnType['allBalances']
  networkId?: NetworkId
  account: UseAccountsReturnType['selectedAcc']
  setNetwork: (networkIdentifier: string | number) => void
  isLoading: boolean
  isCurrNetworkBalanceLoading: boolean
  allBalancesLoading: boolean
}

const relayerURL = CONFIG.RELAYER_URL

const Balances = ({
  allBalances,
  networkId,
  account,
  isLoading,
  isCurrNetworkBalanceLoading,
  allBalancesLoading,
  setNetwork
}: Props) => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { isPrivateMode, togglePrivateMode, hidePrivateValue } = usePrivateMode()
  const { cacheBreak } = useCacheBreak()
  const urlGetBalance = relayerURL
    ? `${relayerURL}/gas-tank/${account}/getBalance?cacheBreak=${cacheBreak}`
    : null

  const { data } = useRelayerData({ url: urlGetBalance })

  useLayoutEffect(() => {
    triggerLayoutAnimation()
  }, [isLoading])

  useLayoutEffect(() => {
    triggerLayoutAnimation()
  }, [networkId])

  const gasTankBalanceLabel = !data
    ? '0.00'
    : data
        .map(({ balanceInUSD }: any) => balanceInUSD)
        .reduce((a: any, b: any) => a + b, 0)
        .toFixed(2)
  const hasPositiveGasBalance = gasTankBalanceLabel !== '0.00'

  const allPositiveBalances = allBalances
    .filter(({ total }: any) => total.full > 0)
    // Exclude displaying balances for networks we don't support
    .filter(({ network }) => !!networkDetails(network))

  const totalBalance = useMemo(() => {
    let balance = 0
    allPositiveBalances.forEach(({ total }) => {
      balance += Number(total.full)
    })
    balance += Number(gasTankBalanceLabel)
    return balance
  }, [allPositiveBalances, gasTankBalanceLabel])

  const handleGoToSend = useCallback(() => navigate(ROUTES.send), [navigate])
  const handleGoToReceive = useCallback(() => navigate(ROUTES.receive), [navigate])
  const handleGoToGasTank = useCallback(() => navigate(ROUTES.gasTank), [navigate])

  const content = (
    <>
      {isCurrNetworkBalanceLoading ? (
        <View style={styles.spinnerWrapper}>
          <Spinner />
        </View>
      ) : (
        <Text
          fontSize={42}
          weight="regular"
          style={[spacings.mtTy, spacings.mbMd]}
          onPress={togglePrivateMode}
        >
          <Text fontSize={26} weight="regular">
            ${' '}
          </Text>
          {isPrivateMode ? (
            <>
              <Text fontSize={42} weight="regular">
                **
              </Text>
              <Text fontSize={26} weight="regular">
                .**
              </Text>
            </>
          ) : (
            <>
              <Text fontSize={42} weight="regular">
                {Number(totalBalance.toFixed(2).split('.')[0])}
              </Text>
              <Text fontSize={26} weight="regular">
                .{Number(totalBalance.toFixed(2).split('.')[1])}
              </Text>
            </>
          )}
        </Text>
      )}

      <View style={[flexboxStyles.directionRow, spacings.mb]}>
        <Button
          style={styles.button}
          textStyle={[{ color: colors.titan }, flexboxStyles.alignSelfCenter]}
          type="secondary"
          hasBottomSpacing={false}
          onPress={handleGoToSend}
        >
          <View style={[flexboxStyles.directionRow, flexboxStyles.center]}>
            <Text
              style={[textStyles.center, flexboxStyles.flex1, flexboxStyles.center, spacings.mlTy]}
            >
              {t('Send')}
            </Text>
            <SendIcon width={22} height={22} style={styles.buttonIcon} />
          </View>
        </Button>
        <Button
          style={styles.button}
          textStyle={[{ color: colors.titan }, flexboxStyles.alignSelfCenter]}
          type="secondary"
          hasBottomSpacing={false}
          onPress={handleGoToReceive}
        >
          <View style={[flexboxStyles.directionRow, flexboxStyles.center]}>
            <Text
              style={[textStyles.center, flexboxStyles.flex1, flexboxStyles.center, spacings.mlMi]}
            >
              {t('Receive')}
            </Text>
            <ReceiveIcon width={22} height={22} style={styles.buttonIcon} />
          </View>
        </Button>
      </View>

      {allBalancesLoading ? (
        <View style={spacings.mb}>
          <Spinner />
        </View>
      ) : (
        (allPositiveBalances.length > 0 || hasPositiveGasBalance) && (
          <View style={spacings.mb}>
            <Text style={[textStyles.center, spacings.mbTy]}>{t('You have')}</Text>
            {allPositiveBalances.map(({ network, total }: Balance, i: number) => {
              const { chainId, name, id }: any = networkDetails(network)
              const isLast = i === allPositiveBalances.length - 1

              const onNetworkChange = () => {
                triggerLayoutAnimation()
                setNetwork(network)
              }

              return (
                <TouchableOpacity
                  key={chainId}
                  onPress={onNetworkChange}
                  style={[styles.allBalancesContainer, isLast && { borderBottomWidth: 0 }]}
                >
                  <Text numberOfLines={1} style={flexboxStyles.flex1}>
                    <Text>{'$ '}</Text>
                    {hidePrivateValue(`${total.truncated}.${total.decimals}`)}
                  </Text>
                  <Text>{` ${t('on')} `}</Text>
                  <NetworkIcon name={id} width={24} height={24} />
                  <Text numberOfLines={1}>{` ${name}`}</Text>
                </TouchableOpacity>
              )
            })}
            {hasPositiveGasBalance && (
              <TouchableOpacity
                onPress={handleGoToGasTank}
                style={[styles.allBalancesContainer, styles.allBalancesGasTankContainer]}
              >
                {!!data && (
                  <Text numberOfLines={1} style={flexboxStyles.flex1}>
                    <Text>{'$ '}</Text>
                    {gasTankBalanceLabel}
                  </Text>
                )}
                <GasTankIcon width={22} height={22} />
                <Text numberOfLines={1} style={spacings.plMi}>
                  {t('Gas Tank Balance')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )
      )}
    </>
  )

  return (
    <View style={flexboxStyles.alignCenter}>
      {isLoading ? (
        <View style={[styles.loadingContainer, flexboxStyles.center]}>
          <Spinner />
        </View>
      ) : (
        content
      )}
    </View>
  )
}

export default React.memo(Balances)
