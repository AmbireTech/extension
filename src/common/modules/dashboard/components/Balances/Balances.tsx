import networks, { NetworkId } from 'ambire-common/src/constants/networks'
import { UseAccountsReturnType } from 'ambire-common/src/hooks/useAccounts'
import useCacheBreak from 'ambire-common/src/hooks/useCacheBreak'
import { Balance, UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio/types'
import React, { useCallback, useLayoutEffect, useMemo } from 'react'
import { TouchableOpacity, View } from 'react-native'

import GasTankIcon from '@common/assets/svg/GasTankIcon'
import PrivacyIcon from '@common/assets/svg/PrivacyIcon'
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

import Rewards from '../Rewards'
import styles from './styles'

const networkDetails = (network: any) => networks.find(({ id }) => id === network)

interface Props {
  balanceTruncated: any
  balanceDecimals: any
  otherBalances: UsePortfolioReturnType['otherBalances']
  networkId?: NetworkId
  account: UseAccountsReturnType['selectedAcc']
  setNetwork: (networkIdentifier: string | number) => void
  isLoading: boolean
  isCurrNetworkBalanceLoading: boolean
  otherBalancesLoading: boolean
}

const relayerURL = CONFIG.RELAYER_URL

const Balances = ({
  balanceTruncated,
  balanceDecimals,
  otherBalances,
  networkId,
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

  const otherPositiveBalances = otherBalances
    .filter(({ network, total }: any) => network !== networkId && total.full > 0)
    // Exclude displaying balances for networks we don't support
    .filter(({ network }) => !!networkDetails(network))

  const handleGoToSend = useCallback(() => navigate(ROUTES.send), [navigate])
  const handleGoToReceive = useCallback(() => navigate(ROUTES.receive), [navigate])
  const handleGoToGasTank = useCallback(() => navigate(ROUTES.gasTank), [navigate])

  const content = (
    <>
      <View style={flexboxStyles.directionRow}>
        <View
          style={[
            flexboxStyles.flex1,
            flexboxStyles.alignEnd,
            flexboxStyles.justifyCenter,
            spacings.mbTy
          ]}
        >
          <TouchableOpacity
            style={spacings.mrSm}
            onPress={togglePrivateMode}
            hitSlop={{ top: 10, bottom: 10, left: 2, right: 2 }}
          >
            <PrivacyIcon isActive={isPrivateMode} />
          </TouchableOpacity>
        </View>
        <Rewards />
        <View style={flexboxStyles.flex1} />
      </View>

      {isCurrNetworkBalanceLoading ? (
        <View style={styles.spinnerWrapper}>
          <Spinner />
        </View>
      ) : (
        <Text fontSize={42} weight="regular" style={spacings.mbTy}>
          <Text fontSize={26} weight="regular" style={[textStyles.highlightPrimary]}>
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
                {balanceTruncated}
              </Text>
              <Text fontSize={26} weight="regular">
                .{balanceDecimals}
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

      {otherBalancesLoading ? (
        <View style={spacings.mb}>
          <Spinner />
        </View>
      ) : (
        (otherPositiveBalances.length > 0 || hasPositiveGasBalance) && (
          <View style={spacings.mb}>
            <Text style={[textStyles.center, spacings.mbTy]}>{t('You also have')}</Text>
            {otherPositiveBalances.map(({ network, total }: Balance, i: number) => {
              const { chainId, name, id }: any = networkDetails(network)
              const isLast = i === otherPositiveBalances.length - 1

              const onNetworkChange = () => {
                triggerLayoutAnimation()
                setNetwork(network)
              }

              return (
                <TouchableOpacity
                  key={chainId}
                  onPress={onNetworkChange}
                  style={[styles.otherBalancesContainer, isLast && { borderBottomWidth: 0 }]}
                >
                  <Text numberOfLines={1} style={flexboxStyles.flex1}>
                    <Text style={textStyles.highlightPrimary}>{'$ '}</Text>
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
                style={[styles.otherBalancesContainer, styles.otherBalancesGasTankContainer]}
              >
                {!!data && (
                  <Text numberOfLines={1} style={flexboxStyles.flex1}>
                    <Text style={textStyles.highlightPrimary}>{'$ '}</Text>
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
