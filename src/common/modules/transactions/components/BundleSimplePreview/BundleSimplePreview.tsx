import { getAddedGas } from 'ambire-common/src/helpers/sendTxnHelpers'
import { formatFloatTokenAmount } from 'ambire-common/src/services/formatter'
import { getTransactionSummary } from 'ambire-common/src/services/humanReadableTransactions/transactionSummary'
import { formatUnits } from 'ethers/lib/utils'
import React from 'react'
import isEqual from 'react-fast-compare'
import { Trans, useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'

import OpenIcon from '@common/assets/svg/OpenIcon'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import TxnPreview from '@common/components/TxnPreview'
import useConstants from '@common/hooks/useConstants'
import isGasTankCommitment from '@common/services/isGasTankCommitment'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

import styles from './styles'

const HIT_SLOP = { bottom: 15, left: 12, right: 15, top: 15 }
const TO_GAS_TANK = 'to Gas Tank'

const BundleSimplePreview = ({
  bundle,
  feeAssets,
  mined = false,
  actions,
  setOpenedBundle,
  setMined
}: any) => {
  const { constants } = useConstants()
  const { t } = useTranslation()

  if (!Array.isArray(bundle.txns)) {
    return (
      <Panel contentContainerStyle={styles.panel} type="filled">
        <Text appearance="danger" fontSize={12}>
          {t('Bundle has no transactions (should never happen)')}
        </Text>
      </Panel>
    )
  }

  const lastTxn = bundle.txns[bundle.txns.length - 1]
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

  const toLocaleDateTime = (date: any) =>
    `${date.toLocaleDateString()} (${date.toLocaleTimeString()})`

  const handleOpenDetailedBundle = () => {
    !!setOpenedBundle && setOpenedBundle(bundle)
    !!setMined && setMined(mined)
  }

  const txns =
    (hasFeeMatch && !bundle.gasTankFee) || (hasFeeMatch && !bundle.gasTankFee.value && bundle.gasTankFee.cashback) || isGasTankCommitment(lastTxn)
      ? bundle.txns.slice(0, -1)
      : bundle.txns

  const numOfDisplayedTxns = txns.length > 2 ? 2 : txns.length

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
    <Panel contentContainerStyle={styles.panel} type="filled">
      {!!mined && (
        <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter, spacings.pbTy]}>
          <Text fontSize={12} style={spacings.mrSm}>
            {t('Transactions: {{numOfDisplayedTxns}} out of {{totalNumTxns}}', {
              numOfDisplayedTxns,
              totalNumTxns: txns.length
            })}
          </Text>
          <Text style={flexboxStyles.flex1} numberOfLines={1} fontSize={10}>
            {!!bundle.submittedAt && toLocaleDateTime(new Date(bundle.submittedAt)).toString()}
          </Text>

          <TouchableOpacity onPress={handleOpenDetailedBundle} hitSlop={HIT_SLOP}>
            <OpenIcon />
          </TouchableOpacity>
        </View>
      )}
      {txns.slice(0, 2).map((txn: any, i: number) => (
        <TxnPreview
          // eslint-disable-next-line react/no-array-index-key
          key={i} // safe to do this, individual TxnPreviews won't change within a specific bundle
          txn={txn}
          network={bundle.network}
          account={bundle.identity}
          mined={mined}
          disableExpand
          hasBottomSpacing={i < numOfDisplayedTxns - 1}
          addressLabel={!!bundle.meta && bundle?.meta?.addressLabel}
          meta={!!bundle.meta && bundle.meta}
        />
      ))}
      {!!bundle.executed && !bundle.executed?.success && (
        <View style={[spacings.ptMi]}>
          <Trans>
            <Text fontSize={12}>
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
                <Text fontSize={12}>${formatFloatTokenAmount(cashback, true, 6)}</Text>
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
      </View>
      {!!actions && actions}
    </Panel>
  )
}

const MemoizedBundleSimplePreview = React.memo(BundleSimplePreview, isEqual)

export default MemoizedBundleSimplePreview
