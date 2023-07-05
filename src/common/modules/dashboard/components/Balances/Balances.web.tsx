import networks, { NetworkId } from 'ambire-common/src/constants/networks'
import { UseAccountsReturnType } from 'ambire-common/src/hooks/useAccounts'
import useCacheBreak from 'ambire-common/src/hooks/useCacheBreak'
import { UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio/types'
import React, { useCallback, useLayoutEffect, useMemo } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { useModalize } from 'react-native-modalize'
import { Pressable } from 'react-native-web-hover'

import ConnectionStatusIcon from '@common/assets/svg/ConnectionStatusIcon'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import PrivacyIcon from '@common/assets/svg/PrivacyIcon'
import ReceiveIcon from '@common/assets/svg/ReceiveIcon'
import SendIcon from '@common/assets/svg/SendIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import NetworkIcon from '@common/components/NetworkIcon'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import CONFIG, { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useAmbireExtension from '@common/hooks/useAmbireExtension'
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
  const { site, disconnectDapp } = useAmbireExtension()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  const { cacheBreak } = useCacheBreak()
  const urlGetBalance = relayerURL
    ? `${relayerURL}/gas-tank/${account}/getBalance?cacheBreak=${cacheBreak}`
    : null

  const { data } = useRelayerData({ url: urlGetBalance })

  const balanceLabel = useMemo(
    () =>
      !data
        ? '0.00'
        : data
            .map(({ balanceInUSD }: any) => balanceInUSD)
            .reduce((a: any, b: any) => a + b, 0)
            .toFixed(2),
    [data]
  )

  const isConnected = site?.isConnected

  const handleConnectedStatusPress = () => {
    if (!isConnected) {
      return openBottomSheet()
    }

    disconnectDapp(site.origin)
  }

  useLayoutEffect(() => {
    triggerLayoutAnimation()
  }, [isLoading])

  useLayoutEffect(() => {
    triggerLayoutAnimation()
  }, [networkId])

  const allPositiveBalances = useMemo(
    () =>
      allBalances
        .filter(({ total }: any) => total.full > 0)
        // Exclude displaying balances for networks we don't support
        .filter(({ network }) => !!networkDetails(network)),
    [allBalances]
  )

  const totalBalance = useMemo(() => {
    let balance = 0
    allPositiveBalances.forEach(({ total }) => {
      balance += Number(total.full)
    })
    balance += Number(balanceLabel)

    return balance
  }, [allPositiveBalances, balanceLabel])

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
        <View style={[flexboxStyles.flex1, flexboxStyles.justifyCenter, spacings.mbTy]}>
          <Pressable onPress={handleConnectedStatusPress}>
            {({ hovered }) => (
              <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.mlSm]}>
                <View style={spacings.mrTy}>
                  <ConnectionStatusIcon isActive={!!isConnected} />
                </View>
                {!!hovered && (
                  <Text fontSize={12} weight="regular">
                    {isConnected ? t('Connected') : t('Disconnected')}
                  </Text>
                )}
              </View>
            )}
          </Pressable>
        </View>
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
            <SendIcon width={12.954} height={9.559} style={styles.buttonIcon} />
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

      {allBalancesLoading && !isWeb ? (
        <View style={spacings.mb}>
          <Spinner />
        </View>
      ) : (
        allPositiveBalances.length > 0 &&
        !isWeb && (
          <View style={spacings.mb}>
            <Text style={[textStyles.center, spacings.mbTy]}>{t('You have')}</Text>
            {allPositiveBalances.map(({ network, total }: any) => {
              const { chainId, name, id }: any = networkDetails(network)

              const onNetworkChange = () => {
                triggerLayoutAnimation()
                setNetwork(network)
              }

              return (
                <TouchableOpacity
                  key={chainId}
                  onPress={onNetworkChange}
                  style={styles.allBalancesContainer}
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
            <TouchableOpacity
              onPress={handleGoToGasTank}
              style={[styles.allBalancesContainer, { borderBottomWidth: 0 }]}
            >
              {!!data && (
                <Text numberOfLines={1} style={flexboxStyles.flex1}>
                  <Text style={textStyles.highlightPrimary}>{'$ '}</Text>
                  {balanceLabel}
                </Text>
              )}
              <GasTankIcon width={22} height={22} />
              <Text numberOfLines={1} style={spacings.plMi}>
                {t('Gas Tank Balance')}
              </Text>
            </TouchableOpacity>
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

      <BottomSheet
        id="dapp-connection-status"
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        cancelText="Close"
      >
        <View
          style={[flexboxStyles.alignCenter, flexboxStyles.justifyCenter, spacings.mb, spacings.mt]}
        >
          {!!site?.name && <Title type="small">{site.name}</Title>}
          <Text>
            {t(
              "Ambire is not connected to the current webpage. To connect, find and click the connect button on the dApp's webpage."
            )}
          </Text>
        </View>
      </BottomSheet>
    </View>
  )
}

export default React.memo(Balances)
