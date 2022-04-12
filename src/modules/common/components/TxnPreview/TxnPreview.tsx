import { formatUnits } from 'ethers/lib/utils'
// TODO: add types
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, TouchableOpacity, View } from 'react-native'

import CloseIcon from '@assets/svg/CloseIcon'
import DownArrowIcon from '@assets/svg/DownArrowIcon'
import UpArrowIcon from '@assets/svg/UpArrowIcon'
import NavIconWrapper from '@modules/common/components/NavIconWrapper'
import Text from '@modules/common/components/Text'
import networks from '@modules/common/constants/networks'
import { formatFloatTokenAmount } from '@modules/common/services/formatters'
import { getName, isKnown } from '@modules/common/services/humanReadableTransactions'
import { getTransactionSummary } from '@modules/common/services/humanReadableTransactions/transactionSummary'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'

import styles from './styles'

function getNetworkSymbol(networkId: any) {
  const network = networks.find((x) => x.id === networkId)
  return network ? network.nativeAssetSymbol : 'UNKNW'
}

const zapperStorageTokenIcons = 'https://storage.googleapis.com/zapper-fi-assets/tokens'

function getTokenIcon(network: any, address: any) {
  return `${zapperStorageTokenIcons}/${network}/${address}.png`
}

function parseExtendedSummaryItem(item: any, i: any, networkDetails: any, t: any) {
  if (item === '') return null

  if (item.length === 1) return <Text fontSize={12}>{`${item} `}</Text>

  if (i === 0) return <Text key={`item-${i}`} fontSize={12}>{`${item} `}</Text>

  if (!item.type) return <Text key={`item-${i}`} fontSize={12}>{`${item} `}</Text>

  if (item.type === 'token')
    return (
      <>
        {item.amount > 0 ? (
          <Text fontSize={12}>{`${formatFloatTokenAmount(
            item.amount,
            true,
            item.decimals
          )} `}</Text>
        ) : null}
        {/* eslint-disable-next-line no-nested-ternary */}
        {item.decimals !== null && item.symbol ? (
          <>
            {item.address ? (
              <Image
                source={{ uri: getTokenIcon(networkDetails.id, item.address) }}
                style={{ width: 18, height: 18 }}
              />
            ) : null}
            <Text fontSize={12}> </Text>
            <Text fontSize={12}>{`${item.symbol || ''} `}</Text>
          </>
        ) : item.amount > 0 ? (
          <Text fontSize={12}>{t('units of unknown token')}</Text>
        ) : null}
      </>
    )

  if (item.type === 'address')
    return <Text fontSize={12}>{`${item.name ? item.name : item.address} `}</Text>

  if (item.type === 'network')
    return (
      <Text key={`item-${i}`} fontSize={12}>
        {item.icon ? <Image source={{ uri: item.icon }} style={{ width: 20, height: 20 }} /> : null}
        {` ${item.name} `}
      </Text>
    )

  if (item.type === 'erc721') {
    return <Text>{` ${item.name} `}</Text>
  }

  return null
}

const TxnPreview = ({
  txn,
  onDismiss,
  network,
  account,
  isFirstFailing,
  mined,
  disableExpand
}: any) => {
  const [isExpanded, setExpanded] = useState(false)
  const contractName = getName(txn[0], network)
  const { t } = useTranslation()

  const networkDetails = networks.find(({ id }) => id === network)

  const extendedSummary = getTransactionSummary(txn, network, account, { mined, extended: true })

  const summary = extendedSummary.map((entry: any) =>
    Array.isArray(entry) ? (
      entry.map((item, i) => parseExtendedSummaryItem(item, i, networkDetails, t))
    ) : (
      <Text fontSize={12}>{entry}</Text>
    )
  )

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => !disableExpand && setExpanded((e) => !e)}
        style={styles.listItem}
        activeOpacity={0.75}
      >
        {!disableExpand && (
          <NavIconWrapper disabled style={spacings.mrTy} onPress={() => null}>
            {isExpanded ? <UpArrowIcon /> : <DownArrowIcon />}
          </NavIconWrapper>
        )}
        <View style={[flexboxStyles.flex1, spacings.mrTy]}>
          <View style={[flexboxStyles.directionRow, flexboxStyles.wrap, flexboxStyles.alignCenter]}>
            {summary}
          </View>
          {isFirstFailing && (
            <Text appearance="danger" fontSize={10}>
              {t('This is the first failing transaction.')}
            </Text>
          )}
          {!isFirstFailing && !mined && !isKnown(txn, account) && (
            <Text appearance="danger" fontSize={10}>
              {t('Warning: interacting with an unknown contract or address.')}
            </Text>
          )}
        </View>
        {!!onDismiss && (
          <NavIconWrapper onPress={onDismiss}>
            <CloseIcon />
          </NavIconWrapper>
        )}
      </TouchableOpacity>
      {isExpanded ? (
        <View style={styles.expandedContainer}>
          <View style={spacings.mbMi}>
            <Text fontSize={10}>{t('Interacting with (to): ')}</Text>
            <Text fontSize={10}>
              {txn[0]}
              <Text fontSize={10}>{contractName ? ` (${contractName})` : ''}</Text>
            </Text>
          </View>
          <View style={spacings.mbMi}>
            <Text>
              <Text>
                <Text fontSize={10}>{`${getNetworkSymbol(network)} `}</Text>
                <Text fontSize={10}>{t('to be sent value ')}</Text>
              </Text>
              <Text fontSize={10}>{formatUnits(txn[1] || '0x0', 18)}</Text>
            </Text>
          </View>
          <View>
            <Text fontSize={10}>{t('Data: ')}</Text>
            <Text fontSize={10}>{txn[2]}</Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}

export default TxnPreview
