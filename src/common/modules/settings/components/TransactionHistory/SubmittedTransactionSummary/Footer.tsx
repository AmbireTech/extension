/* eslint-disable @typescript-eslint/no-floating-promises */
import { formatUnits, ZeroAddress } from 'ethers'
import React, { FC, useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'

import gasTankFeeTokens from '@ambire-common/consts/gasTankFeeTokens'
import { Network } from '@ambire-common/interfaces/network'
import { BROADCAST_OPTIONS } from '@ambire-common/libs/broadcast/broadcast'
import { SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import { resolveAssetInfo } from '@ambire-common/services/assetInfo'
import { getBenzinUrlParams } from '@ambire-common/utils/benzin'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import LinkIcon from '@common/assets/svg/LinkIcon'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { sizeMultiplier } from '@common/modules/sign-account-op/components/TransactionSummary'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'

import RepeatTransaction from './RepeatTransaction'
import SpeedUpTransaction from './SpeedUpTransaction'
import FooterActionLink from './FooterActionLink'
import getStyles from './styles'
import SubmittedOn from './SubmittedOn'

type Props = {
  network: Network
  size: 'sm' | 'md' | 'lg'
  rawCalls?: SubmittedAccountOp['calls']
  submittedAccountOp: SubmittedAccountOp
} & Pick<
  SubmittedAccountOp,
  'txnId' | 'identifiedBy' | 'accountAddr' | 'gasFeePayment' | 'status' | 'timestamp'
>

const Footer: FC<Props> = ({
  network,
  txnId,
  rawCalls,
  submittedAccountOp,
  identifiedBy,
  accountAddr,
  gasFeePayment,
  status,
  size,
  timestamp
}) => {
  const { styles } = useTheme(getStyles)
  const { addToast } = useToast()
  const { networks } = useController('NetworksController').state
  const {
    state: { account: selectedAccount }
  } = useController('SelectedAccountController')
  const { t } = useTranslation()
  const textSize = 14 * sizeMultiplier[size]
  const iconSize = 24 * sizeMultiplier[size]

  const canViewFee =
    status !== AccountOpStatus.Rejected &&
    status !== AccountOpStatus.BroadcastButStuck &&
    status !== AccountOpStatus.UnknownButPastNonce &&
    status !== AccountOpStatus.BroadcastedButNotConfirmed

  const { chainId } = network

  const [feeFormattedValue, setFeeFormattedValue] = useState<string>()
  const isPendingTransaction =
    status === AccountOpStatus.Pending || status === AccountOpStatus.BroadcastedButNotConfirmed
  const shouldShowSpeedUp =
    isPendingTransaction &&
    gasFeePayment?.broadcastOption !== BROADCAST_OPTIONS.byRelayer &&
    gasFeePayment?.broadcastOption !== BROADCAST_OPTIONS.byBundler

  const handleViewTransaction = useCallback(async () => {
    if (!chainId) {
      const message = t(
        "Can't open the transaction details because the network information is missing."
      )
      addToast(message, { type: 'error' })

      return
    }

    const link = `https://explorer.ambire.com/${getBenzinUrlParams({
      txnId,
      chainId: Number(chainId),
      identifiedBy
    })}`

    try {
      await openInTab({ url: link })
    } catch (e: any) {
      addToast(e?.message || 'Error opening explorer', { type: 'error' })
    }
  }, [txnId, identifiedBy, addToast, chainId, t])

  useEffect((): void => {
    const feeTokenAddress = gasFeePayment?.inToken
    const nChainId =
      gasFeePayment?.feeTokenChainId ||
      // the rest is support for legacy data (no chainId recorded for the fee)
      (feeTokenAddress === ZeroAddress && chainId) ||
      gasTankFeeTokens.find((constFeeToken: any) => constFeeToken.address === feeTokenAddress)
        ?.chainId ||
      chainId

    // did is used to avoid tokenNetwork being Network | undefined
    // the assumption is that we cant pay the fee with token on network that is not present
    const tokenNetwork = networks.filter((n: Network) => n.chainId === nChainId)[0]

    const feeTokenAmount = gasFeePayment?.amount
    if (!feeTokenAddress || !tokenNetwork || !feeTokenAmount) return

    resolveAssetInfo(feeTokenAddress, tokenNetwork, ({ tokenInfo }) => {
      if (!tokenInfo || !gasFeePayment?.amount) return

      const fee = parseFloat(formatUnits(feeTokenAmount, tokenInfo.decimals))

      setFeeFormattedValue(`${formatDecimals(fee)} ${tokenInfo.symbol}`)
    }).catch((e) => {
      console.error(e)
      setFeeFormattedValue('Unknown. Please check the explorer.')
    })
  }, [
    networks,
    chainId,
    gasFeePayment?.feeTokenChainId,
    gasFeePayment?.amount,
    gasFeePayment?.inToken,
    addToast
  ])

  return (
    <View style={spacings.phSm}>
      <View style={styles.footer}>
        {canViewFee && (
          <View style={[flexbox.flex1, spacings.mrSm]}>
            <Text
              fontSize={textSize}
              appearance="secondaryText"
              weight="semiBold"
              style={{ ...spacings.mbMi }}
            >
              {t('Fee')}
            </Text>

            {gasFeePayment?.isSponsored ? (
              <Text fontSize={12} appearance="successText" weight="semiBold">
                {t('Sponsored')}
              </Text>
            ) : (
              <Text fontSize={textSize} appearance="secondaryText">
                {feeFormattedValue || <SkeletonLoader width={80} height={21} />}
              </Text>
            )}
          </View>
        )}
        <SubmittedOn
          fontSize={textSize}
          iconSize={iconSize}
          chainId={network.chainId}
          timestamp={timestamp}
          numberOfLines={2}
        />
        <View style={[flexbox.alignEnd]}>
          <FooterActionLink
            testID="view-transaction-link"
            label={t('View transaction')}
            onPress={handleViewTransaction}
            textSize={textSize}
            iconSize={iconSize}
            Icon={LinkIcon}
          />
          {rawCalls?.length && selectedAccount?.addr === accountAddr ? (
            shouldShowSpeedUp ? (
              <SpeedUpTransaction
                submittedAccountOp={submittedAccountOp}
                textSize={textSize}
                iconSize={iconSize}
              />
            ) : (
              <RepeatTransaction
                accountAddr={accountAddr}
                chainId={network.chainId}
                rawCalls={rawCalls}
                textSize={textSize}
                iconSize={iconSize}
              />
            )
          ) : (
            <View />
          )}
        </View>
      </View>
    </View>
  )
}

export default Footer
