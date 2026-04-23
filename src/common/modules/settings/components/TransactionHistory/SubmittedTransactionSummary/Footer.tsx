/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { FC, useCallback } from 'react'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import { SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import { BROADCAST_OPTIONS } from '@ambire-common/libs/broadcast/broadcast'
import { getBenzinUrlParams } from '@ambire-common/utils/benzin'
import CopyIcon from '@common/assets/svg/CopyIcon'
import LinkIcon from '@common/assets/svg/LinkIcon'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { sizeMultiplier } from '@common/modules/sign-account-op/components/TransactionSummary'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import { openInTab } from '@common/utils/links'

import FooterActionLink from './FooterActionLink'
import RepeatTransaction from './RepeatTransaction'
import SpeedUpTransaction from './SpeedUpTransaction'
import getStyles from './styles'

type Props = {
  network: Network
  size: 'sm' | 'md' | 'lg'
  rawCalls?: SubmittedAccountOp['calls']
  submittedAccountOp: SubmittedAccountOp
} & Pick<SubmittedAccountOp, 'txnId' | 'identifiedBy' | 'accountAddr' | 'gasFeePayment' | 'status'>

const Footer: FC<Props> = ({
  network,
  txnId,
  rawCalls,
  submittedAccountOp,
  identifiedBy,
  accountAddr,
  gasFeePayment,
  status,
  size
}) => {
  const { styles } = useTheme(getStyles)
  const { addToast } = useToast()
  const {
    state: { account: selectedAccount }
  } = useController('SelectedAccountController')
  const { t } = useTranslation()
  const textSize = 14 * sizeMultiplier[size]
  const iconSize = 24 * sizeMultiplier[size]

  const { chainId } = network
  const isPendingTransaction =
    status === AccountOpStatus.Pending || status === AccountOpStatus.BroadcastedButNotConfirmed
  const shouldShowSpeedUp =
    isPendingTransaction &&
    gasFeePayment?.broadcastOption !== BROADCAST_OPTIONS.byRelayer &&
    gasFeePayment?.broadcastOption !== BROADCAST_OPTIONS.byBundler

  const benzinLink = `https://explorer.ambire.com/${getBenzinUrlParams({
    txnId,
    chainId: Number(chainId),
    identifiedBy
  })}`

  const handleCopyTransaction = useCallback(() => {
    if (!chainId) {
      const message = t(
        "Can't copy the transaction link because the network information is missing."
      )
      addToast(message, { type: 'error' })

      return
    }

    setStringAsync(benzinLink)
    addToast(t('Copied to clipboard!') as string, { timeout: 2500 })
  }, [addToast, benzinLink, chainId, t])

  const handleViewTransaction = useCallback(async () => {
    if (!chainId || !network.explorerUrl || !txnId) {
      const message = t(
        "Can't open the transaction details because the transaction or network information is missing."
      )
      addToast(message, { type: 'error' })

      return
    }

    const explorerUrl = network.explorerUrl.replace(/\/$/, '')
    const link = `${explorerUrl}/tx/${txnId}`

    try {
      await openInTab({ url: link })
    } catch (e: any) {
      addToast(e?.message || 'Error opening explorer', { type: 'error' })
    }
  }, [txnId, addToast, chainId, network.explorerUrl, t])

  return (
    <View style={spacings.phSm}>
      <View style={[styles.footer, flexbox.justifySpaceBetween, flexbox.alignStart]}>
        <View style={flexbox.alignStart}>
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
        <View style={flexbox.alignEnd}>
          <View style={spacings.mbTy}>
            <FooterActionLink
              label={t('Copy link to transaction')}
              onPress={handleCopyTransaction}
              textSize={textSize}
              iconSize={iconSize}
              Icon={CopyIcon}
            />
          </View>
          <FooterActionLink
            testID="view-transaction-link"
            label={t('View transaction')}
            onPress={handleViewTransaction}
            textSize={textSize}
            iconSize={iconSize}
            Icon={LinkIcon}
          />
        </View>
      </View>
    </View>
  )
}

export default Footer
