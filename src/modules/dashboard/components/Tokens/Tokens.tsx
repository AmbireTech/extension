import React, { useState } from 'react'
import { ActivityIndicator, Button, Image, View } from 'react-native'

import { useTranslation } from '@config/localization'
import Text from '@modules/common/components/Text'
import Title from '@modules/common/components/Title'
import usePortfolio from '@modules/common/hooks/usePortfolio'
import colors from '@modules/common/styles/colors'
import textStyles from '@modules/common/styles/utils/text'
import { useNavigation } from '@react-navigation/native'

import styles from './styles'

const Balances = () => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const { areProtocolsLoading, tokens } = usePortfolio()
  const [failedImg, setFailedImg] = useState<string[]>([])

  const sortedTokens = tokens.sort((a, b) => b.balanceUSD - a.balanceUSD)

  const handleGoToSend = (symbol) => navigation.navigate('send', { symbol: symbol.toString() })

  const tokenItem = (index, img, symbol, balance, balanceUSD, address, send = false) => (
    <View
      key={`token-${address}-${index}`}
      style={[
        styles.row,
        { backgroundColor: index % 2 ? colors.rowEvenColor : colors.rowOddColor }
      ]}
    >
      <View style={styles.rowItem}>
        {failedImg.includes(img) ? (
          <Text>{symbol}</Text>
        ) : (
          <Image
            style={styles.img}
            source={{ uri: img }}
            onError={() => setFailedImg((failed) => [...failed, img])}
          />
        )}
      </View>

      <View style={[styles.rowItem, { flex: 1 }]}>
        <Text style={styles.balance} numberOfLines={1}>
          {balance}
        </Text>
        <Text style={styles.balanceFiat}>
          <Text style={[styles.balanceFiat, textStyles.highlightSecondary]}>$</Text>{' '}
          {balanceUSD.toFixed(2)}
        </Text>
      </View>

      <View style={styles.rowItem}>
        <Text
          style={[styles.symbol, textStyles.highlightPrimary]}
          onPress={handleGoToSend.bind(symbol)}
        >
          {symbol}
        </Text>
      </View>
    </View>
  )

  return (
    <>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>{t('Tokens')}</Title>
      </View>

      {areProtocolsLoading ? (
        <ActivityIndicator />
      ) : (
        sortedTokens.map(({ address, symbol, tokenImageUrl, balance, balanceUSD }, i) =>
          tokenItem(i, tokenImageUrl, symbol, balance, balanceUSD, address, true)
        )
      )}
    </>
  )
}

export default Balances
