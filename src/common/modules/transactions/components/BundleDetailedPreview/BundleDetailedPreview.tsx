import networks from 'ambire-common/src/constants/networks'
import { getAddedGas } from 'ambire-common/src/helpers/sendTxnHelpers'
import { formatFloatTokenAmount } from 'ambire-common/src/services/formatter'
import { getTransactionSummary } from 'ambire-common/src/services/humanReadableTransactions/transactionSummary'
import { formatUnits } from 'ethers/lib/utils'
import React from 'react'
import isEqual from 'react-fast-compare'
import { Trans, useTranslation } from 'react-i18next'
import { Linking, View } from 'react-native'

import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import TxnPreview from '@common/components/TxnPreview'
import useConstants from '@common/hooks/useConstants'
import isGasTankCommitment from '@common/services/isGasTankCommitment'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

const TO_GAS_TANK = 'to Gas Tank'

const BundleDetailedPreview = ({ bundle = {}, mined = false, feeAssets }: any) => {
  const { constants } = useConstants()
  const network: any = networks?.find((x) => x.id === bundle?.network)
  const { t } = useTranslation()

  if (!Array.isArray(bundle?.txns)) {
    return (
      <Panel type="filled">
        <Text appearance="danger">{t('Bundle has no transactions (should never happen)')}</Text>
      </Panel>
    )
  }

  // eslint-disable-next-line no-unsafe-optional-chaining
  const lastTxn = bundle?.txns[bundle?.txns?.length - 1]
  // terribly hacky; @TODO fix
  // all of the values are prob checksummed so we may not need toLowerCase
  const lastTxnSummary = getTransactionSummary(
    constants!.humanizerInfo,
    lastTxn,
    bundle.network,
    bundle.identity
  )

  const lastTxnExtendedSummary = getTransactionSummary(
    constants!.humanizerInfo,
    lastTxn,
    bundle.network,
    bundle.identity,
    {
      extended: true
    }
  )

  const hasFeeMatch = bundle.txns.length > 1 && lastTxnSummary.match(new RegExp(TO_GAS_TANK, 'i'))
  const txns = (hasFeeMatch && !bundle.gasTankFee) || (hasFeeMatch && !bundle.gasTankFee.value && bundle.gasTankFee.cashback) || isGasTankCommitment(lastTxn) ? bundle.txns.slice(0, -1) : bundle.txns
  const toLocaleDateTime = (date: any) =>
    `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`

  const feeToken =
  (bundle.feeToken && bundle.feeToken.symbol && bundle.feeToken.symbol.toLowerCase()) ||
    bundle.feeToken ||
    (hasFeeMatch &&
      bundle.gasTankFee &&
      lastTxnExtendedSummary.flat()[1] &&
      lastTxnExtendedSummary.flat()[1].symbol.toLowerCase()) ||
    null
  const feeTokenDetails = feeAssets
    ? feeAssets.find((i: any) => i.symbol === feeToken)
    : null
  const savedGas = feeTokenDetails ? getAddedGas(feeTokenDetails) : null
  const splittedLastTxnSummary = lastTxnSummary.split(' ')
  const fee: string | [] = splittedLastTxnSummary.length
    ? `${splittedLastTxnSummary[1]} ${splittedLastTxnSummary[2]}`
    : []
  const cashback =
    bundle.gasTankFee && bundle.gasTankFee?.cashback && feeTokenDetails
      ? formatUnits(
          bundle?.gasTankFee?.cashback?.toString(),
          feeTokenDetails?.decimals
        ).toString() * feeTokenDetails?.price
      : 0
  const totalSaved = savedGas && bundle.feeInUSDPerGas * savedGas + cashback

  return (
    <>
      <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.pbTy]}>
        <Text fontSize={12} style={spacings.mrSm}>
          {t('Transactions: {{totalNumTxns}} out of {{totalNumTxns}}', {
            totalNumTxns: txns.length
          })}
        </Text>
      </View>
      {txns.map((txn: any, i: number) => (
        <TxnPreview
          // eslint-disable-next-line react/no-array-index-key
          key={i} // safe to do this, individual TxnPreviews won't change within a specific bundle
          txn={txn}
          network={bundle.network}
          account={bundle.identity}
          mined={mined}
          addressLabel={!!bundle.meta && bundle?.meta?.addressLabel}
          meta={!!bundle.meta && bundle.meta}
        />
      ))}
      {!!bundle.executed && !bundle.executed?.success && (
        <View style={[spacings.phSm, spacings.ptMi]}>
          <Trans>
            <Text appearance="danger" fontSize={12}>
              {'Error: '} {bundle.executed?.errorMsg || 'unknown error'}
            </Text>
          </Trans>
        </View>
      )}
      <View style={spacings.ptSm}>
        {!!hasFeeMatch && !bundle.gasTankFee ? (
          <View style={[flexboxStyles.directionRow, spacings.mbTy, flexboxStyles.alignCenter]}>
            <Text style={flexboxStyles.flex1} weight="medium" fontSize={12}>
              {t('Fee')}
            </Text>
            <Text fontSize={12}>
              {(fee as string)
                .split(' ')
                .map((x, i) => (i === 0 ? formatFloatTokenAmount(x, true, 8) : x))
                .join(' ')}
            </Text>
          </View>
        ) : null}
        {!!bundle.gasTankFee && !!cashback && !bundle.gasTankFee.cashback.value && hasFeeMatch && feeTokenDetails !== null && !!mined && (
          <>
            {(
              <View style={[flexboxStyles.directionRow, spacings.mbTy, flexboxStyles.alignCenter]}>
                <Text style={flexboxStyles.flex1} weight="medium" fontSize={12}>
                  {t('Fee')}
                </Text>
                <Text fontSize={12}>${formatFloatTokenAmount(bundle.feeInUSDPerGas * bundle.gasLimit - cashback, true, 6)}</Text>
              </View>
            )}
          </>
        )}
        {!!bundle.gasTankFee && bundle.gasTankFee?.value && feeTokenDetails !== null && !!mined && (
          <>
            {!!savedGas && (
              <View style={[flexboxStyles.directionRow, spacings.mbTy, flexboxStyles.alignCenter]}>
                <Text style={flexboxStyles.flex1} weight="medium" fontSize={12}>
                  {t('Fee (Paid with Gas Tank)')}
                </Text>
                <Text fontSize={12}>
                  $
                  {formatFloatTokenAmount(
                    bundle.feeInUSDPerGas * bundle.gasLimit - cashback,
                    true,
                    6
                  )}
                </Text>
              </View>
            )}
            {!!savedGas && (
              <View style={[flexboxStyles.directionRow, spacings.mbTy, flexboxStyles.alignCenter]}>
                <Text style={flexboxStyles.flex1} weight="medium" fontSize={12}>
                  {t('Total Saved')}
                </Text>
                <Text fontSize={12}>${formatFloatTokenAmount(totalSaved, true, 6)}</Text>
              </View>
            )}
          </>
        )}
        <View style={[flexboxStyles.directionRow, spacings.mbTy, flexboxStyles.alignCenter]}>
          <Text style={flexboxStyles.flex1} fontSize={12} weight="medium">
            {t('Submitted on')}
          </Text>
          <Text fontSize={12}>
            {bundle.submittedAt && toLocaleDateTime(new Date(bundle.submittedAt)).toString()}
          </Text>
        </View>
        {!!bundle.gasTankFee && !mined && (
          <View style={[flexboxStyles.directionRow, spacings.mbTy, flexboxStyles.alignCenter]}>
            <Text style={flexboxStyles.flex1} weight="medium" fontSize={12}>
              {t('Saved by Gas Tank')}
            </Text>
            <View style={flexboxStyles.alignEnd}>
              <Text fontSize={12}>
                ${formatFloatTokenAmount(bundle.feeInUSDPerGas * (savedGas || 0), true, 6)}
              </Text>
              <Text fontSize={10} color={colors.mustard}>
                {t('+ cashback is pending')}
              </Text>
            </View>
          </View>
        )}
        {bundle.replacesTxId ? (
          <View style={spacings.mbSm}>
            <Text>
              {t('Replaces transaction: ')} {bundle?.replacesTxId}
            </Text>
          </View>
        ) : null}
        {bundle.txId ? (
          <View style={[flexboxStyles.directionRow, spacings.mbSm, flexboxStyles.alignCenter]}>
            <Text style={flexboxStyles.flex1} weight="medium" fontSize={12}>
              {t('Block Explorer')}
            </Text>
            <Text
              onPress={() => Linking.openURL(`${network.explorerUrl}/tx/${bundle.txId}`)}
              underline
              fontSize={12}
            >
              {network.explorerUrl?.split('/')[2]}
            </Text>
          </View>
        ) : null}
      </View>
    </>
  )
}

const MemoizedBundleDetailedPreview = React.memo(BundleDetailedPreview, isEqual)

export default MemoizedBundleDetailedPreview
