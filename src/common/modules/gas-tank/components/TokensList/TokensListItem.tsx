import { formatFloatTokenAmount } from 'ambire-common/src/services/formatter'
import React, { useContext } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import usePrivateMode from '@common/hooks/usePrivateMode'
import { DepositTokenBottomSheetContext } from '@common/modules/gas-tank/contexts/depositTokenBottomSheetContext'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import styles from './styles'

type Props = {
  type?: 'deposit' | 'balance'
  token: any
  networkId: string | undefined
}

const TokensListItem = ({ type = 'deposit', token, networkId }: Props) => {
  const { openDepositToken } = useContext(DepositTokenBottomSheetContext)
  const balanceUSD = token.balanceUSD || token.balanceInUSD || 0.0
  const { hidePrivateValue } = usePrivateMode()

  return (
    <View style={styles.tokenItemContainer}>
      <View style={spacings.prTy}>
        <TokenIcon
          withContainer
          uri={token.img || token.icon || token.tokenImageUrl}
          networkId={networkId}
          address={token.address}
        />
      </View>

      {type === 'balance' && (
        <>
          <Text fontSize={14} style={[spacings.prSm]} numberOfLines={2}>
            {token.symbol.toUpperCase()}
          </Text>
          <View style={[flexboxStyles.flex1, spacings.mrSm]}>
            <Text fontSize={14} style={textStyles.right} numberOfLines={1}>
              {hidePrivateValue(
                formatFloatTokenAmount(token.balance, true, Math.min(token.decimals, 6))
              )}
            </Text>
          </View>
          <View style={{ minWidth: 70 }}>
            <Text fontSize={14} style={textStyles.right}>
              ${hidePrivateValue(balanceUSD?.toFixed(2))}
            </Text>
          </View>
        </>
      )}

      {type === 'deposit' && (
        <>
          <Text fontSize={14} style={[spacings.prSm, styles.tokenSymbol]} numberOfLines={2}>
            {token.symbol.toUpperCase()}
          </Text>
          <View style={flexboxStyles.flex1}>
            <Text fontSize={14}>${balanceUSD?.toFixed(2)}</Text>
          </View>
        </>
      )}

      {type === 'deposit' && (
        <View style={spacings.plTy}>
          <Button
            text="Top Up"
            size="small"
            type="outline"
            hasBottomSpacing={false}
            style={styles.depositButton}
            textStyle={styles.depositButtonText}
            disabled={!balanceUSD || balanceUSD === 0}
            onPress={() => openDepositToken(token)}
          />
        </View>
      )}
    </View>
  )
}

export default React.memo(TokensListItem)
