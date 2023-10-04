import networks, { NetworkId, NetworkType } from 'ambire-common/src/constants/networks'
import { UseAccountsReturnType } from 'ambire-common/src/hooks/useAccounts'
import useCacheBreak from 'ambire-common/src/hooks/useCacheBreak'
import { Balance, UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio/types'
import React, { useCallback, useMemo } from 'react'
import { TouchableOpacity, View } from 'react-native'

import GasTankIcon from '@common/assets/svg/GasTankIcon'
import ReceiveIcon from '@common/assets/svg/ReceiveIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import CONFIG from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import usePrivateMode from '@common/hooks/usePrivateMode'
import useRelayerData from '@common/hooks/useRelayerData'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import BalanceLoader from './BalanceLoader'
import styles from './styles'

const networkDetails = (network: any) => networks.find(({ id }) => id === network)

interface Props {
  otherBalances: UsePortfolioReturnType['otherBalances']
  networkId?: NetworkId
  networkName?: NetworkType['name']
  account: UseAccountsReturnType['selectedAcc']
  setNetwork: (networkIdentifier: string | number) => void
  isLoading: boolean
  isCurrNetworkBalanceLoading: boolean
  otherBalancesLoading: boolean
}

const relayerURL = CONFIG.RELAYER_URL

const Balances = ({
  otherBalances,
  balance,
  networkId,
  networkName,
  account,
  isLoading,
  isCurrNetworkBalanceLoading,
  otherBalancesLoading,
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

  const gasTankBalanceLabel = !data
    ? '0.00'
    : data
        .map(({ balanceInUSD }: any) => balanceInUSD)
        .reduce((a: any, b: any) => a + b, 0)
        .toFixed(2)
  const hasPositiveGasBalance = gasTankBalanceLabel !== '0.00'

  const allPositiveBalances = [...otherBalances, balance]
    .filter(({ total }: any) => total.full > 0)
    // Exclude displaying balances for networks we don't support
    .filter(({ network }) => !!networkDetails(network))

  const hasPositiveBalanceOnTheCurrentNetwork = allPositiveBalances
    .map(({ network }) => network)
    .includes(networkId)

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

  const shouldDisplayOnSelectedNetworkLabel =
    allPositiveBalances.length > 1 ||
    (allPositiveBalances.length > 0 && !hasPositiveBalanceOnTheCurrentNetwork)

  const content = (
    <>
      {isLoading || isCurrNetworkBalanceLoading || otherBalancesLoading ? (
        <BalanceLoader />
      ) : (
        <Text
          fontSize={42}
          weight="regular"
          style={[spacings.mtTy, spacings.mbMd, { lineHeight: 60 }]}
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
                {Number(totalBalance.toFixed(2).split('.')[0]).toLocaleString('en-US')}
              </Text>
              <Text fontSize={26} weight="regular">
                .{Number(totalBalance.toFixed(2).split('.')[1])}
              </Text>
            </>
          )}
        </Text>
      )}

      <View style={[flexboxStyles.directionRow, spacings.mb]}>
        <TouchableOpacity onPress={handleGoToSend} activeOpacity={0.8} style={styles.button}>
          <Text weight="regular" fontSize={14} style={styles.buttonText}>
            {t('Send')}
          </Text>
          <SendIcon width={12.954} height={9.559} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleGoToReceive} activeOpacity={0.8} style={styles.button}>
          <Text weight="regular" fontSize={14} style={styles.buttonText}>
            {t('Receive')}
          </Text>
          <ReceiveIcon />
        </TouchableOpacity>
      </View>

      {otherBalancesLoading ? (
        <View style={spacings.mb}>
          <Spinner />
        </View>
      ) : (
        (allPositiveBalances.length > 0 || hasPositiveGasBalance) && (
          <>
            <View style={spacings.mb}>
              <Text style={[textStyles.center, spacings.mbTy]}>{t('You have')}</Text>
              {allPositiveBalances.map(({ network, total }: Balance, i: number) => {
                const { chainId, name, id }: any = networkDetails(network)
                const isLast = i === allPositiveBalances.length - 1

                const onNetworkChange = () => {
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
                      {hidePrivateValue(gasTankBalanceLabel)}
                    </Text>
                  )}
                  <GasTankIcon width={22} height={22} />
                  <Text numberOfLines={1} style={spacings.plMi}>
                    {t('Gas Tank Balance')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            {shouldDisplayOnSelectedNetworkLabel && (
              <Text style={[textStyles.center, spacings.mbSm]}>
                {t('On {{networkName}}', { networkName })}
              </Text>
            )}
          </>
        )
      )}
    </>
  )

  return <View style={flexboxStyles.alignCenter}>{content}</View>
}

export default React.memo(Balances)
