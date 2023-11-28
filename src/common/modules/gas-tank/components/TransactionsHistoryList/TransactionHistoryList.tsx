import { NetworkId, NetworkType } from 'ambire-common/src/constants/networks'
import React from 'react'
import { View } from 'react-native'

import InfoIcon from '@common/assets/svg/InfoIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import TransactionHistoryItem from './TransactionHistoryItem'

interface Props {
  gasTankFilledTxns: any[]
  feeAssetsRes: any[]
  explorerUrl: string
  networkId?: NetworkId
  networkName?: NetworkType['name']
}

const TransactionHistoryList = ({
  gasTankFilledTxns,
  feeAssetsRes,
  explorerUrl,
  networkId,
  networkName
}: Props) => {
  const { t } = useTranslation()
  // NOTE<Bobby>: filter all gas tank top up transaction with
  // a value of 0. ERC-20 token top ups also have value here
  // so it is safe. We do this to filter out txns to the feeCollector
  // that are not actually top ups
  const filtered = gasTankFilledTxns
    ? gasTankFilledTxns.filter((txn) => txn.value.toString() != 0)
    : []
  return (
    <View>
      <Text style={spacings.mbSm}>{t('Gas Tank top ups history')}</Text>
      <View style={[flexboxStyles.directionRow, spacings.mbTy]}>
        <InfoIcon color={colors.mustard} />
        <Text fontSize={11} style={[flexboxStyles.flex1, spacings.plTy]} color={colors.mustard}>
          {t(
            'Warning: It will take some time to fill up the Gas Tank after the filling up transaction is made.'
          )}
        </Text>
      </View>
      {!!filtered.length &&
        filtered.map((txn) => (
          <TransactionHistoryItem
            key={txn._id}
            txn={txn}
            explorerUrl={explorerUrl}
            feeAssetsRes={feeAssetsRes}
            networkId={networkId}
          />
        ))}
      {!filtered.length && (
        <View style={spacings.pvSm}>
          <Text fontSize={12} style={[spacings.phSm, textStyles.center]}>
            {t('No top ups were made via Gas Tank on {{networkName}}.', {
              networkName
            })}
          </Text>
        </View>
      )}
    </View>
  )
}

export default React.memo(TransactionHistoryList)
