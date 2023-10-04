import { NetworkId } from 'ambire-common/src/constants/networks'
import React, { useMemo } from 'react'
import { Linking, TouchableOpacity, View } from 'react-native'

import OpenIcon from '@common/assets/svg/OpenIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import { formatUnits } from '@ethersproject/units'

import styles from './styles'

type Props = {
  txn: any
  explorerUrl: string
  feeAssetsRes: any[]
  networkId?: NetworkId
}
const HIT_SLOP = { bottom: 15, left: 12, right: 15, top: 15 }

const toLocaleDateTime = (date: any) => `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`

const TransactionHistoryItem = ({ txn, explorerUrl, feeAssetsRes, networkId }: Props) => {
  const tokenDetails = useMemo(
    () =>
      feeAssetsRes && feeAssetsRes.length
        ? feeAssetsRes.find(
            ({ address, network }) =>
              address.toLowerCase() === txn.address.toLowerCase() && network === txn.network
          )
        : null,
    [feeAssetsRes, txn.network, txn.address]
  )

  // txn to gas Tank with not eligible token
  if (!tokenDetails) return null

  return (
    <View style={styles.tokenItemContainer}>
      <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter]}>
        <View
          style={[
            flexboxStyles.directionRow,
            flexboxStyles.alignCenter,
            flexboxStyles.flex1,
            spacings.prMi
          ]}
        >
          <View style={[flexboxStyles.flex1, spacings.mrMi]}>
            <Text fontSize={12} color={colors.titan_50} numberOfLines={1}>
              {txn.submittedAt && toLocaleDateTime(new Date(txn.submittedAt)).toString()}
            </Text>
          </View>
          <View
            style={[
              flexboxStyles.flex1,
              flexboxStyles.directionRow,
              flexboxStyles.alignCenter,
              spacings.mrMi,
              { justifyContent: 'flex-end' }
            ]}
          >
            <TokenIcon
              uri={tokenDetails.icon}
              networkId={networkId}
              address={txn.address}
              width={20}
              height={20}
            />
            <Text fontSize={11} weight="medium" numberOfLines={1} style={spacings.plMi}>
              {tokenDetails.symbol.toUpperCase()}
            </Text>
            <Text fontSize={11} weight="medium" style={spacings.plMi} numberOfLines={1}>
              {tokenDetails &&
                `${formatUnits(txn.value.toString(), tokenDetails.decimals).toString()}`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => Linking.openURL(`${explorerUrl}/tx/${txn.txId}`)}
          hitSlop={HIT_SLOP}
        >
          <OpenIcon />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default React.memo(TransactionHistoryItem)
